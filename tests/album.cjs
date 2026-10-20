// Run with Playwright installed: node tests/album.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const pageUrl = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const key = index => `flower.album.photo.20-10.v1.${index}`;

async function openAlbum(page) {
  await page.locator('#openCard').click();
  await page.locator('#viewAlbum').click();
  await page.locator('#editAlbum').click();
}

(async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pageUrl);
    const data = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400; canvas.height = 1600;
      const context = canvas.getContext('2d');
      context.fillStyle = '#c66388'; context.fillRect(0, 0, 2400, 1600);
      context.fillStyle = '#bbdff5'; context.fillRect(300, 300, 1800, 1000);
      return canvas.toDataURL('image/png').split(',')[1];
    });
    const file = { name: 'ky-niem.png', mimeType: 'image/png', buffer: Buffer.from(data, 'base64') };
    await openAlbum(page);
    assert.equal(await page.locator('#toggleAlbum').getAttribute('aria-expanded'), 'true', 'editing spreads the album');
    assert.equal(await page.locator('#editAlbum').getAttribute('aria-expanded'), 'true');
    const originals = await page.locator('.album-card img').evaluateAll(images => images.map(img => img.getAttribute('src')));
    const cards = page.locator('.album-card');
    for (let index = 0; index < 3; index++) {
      const card = cards.nth(index);
      const chooser = page.waitForEvent('filechooser');
      await card.locator('.change-photo').click();
      await (await chooser).setFiles(file);
      await page.waitForFunction(index => {
        const card = document.querySelectorAll('.album-card')[index];
        return card.querySelector('img').src.startsWith('data:image/jpeg;base64,') && !card.hasAttribute('aria-busy');
      }, index);
      const size = await card.locator('img').evaluate(img => [img.naturalWidth, img.naturalHeight]);
      assert.deepEqual(size, [1024, 683], 'large photo is resized while preserving its proportions');
      assert.equal(await card.locator('.reset-photo').isEnabled(), true);
      assert.ok(await page.evaluate(key => localStorage.getItem(key), key(index)));
    }
    await page.locator('#editAlbum').click();
    assert.equal(await cards.first().locator('.photo-actions').isHidden(), true);
    await page.reload();
    assert.equal(await page.locator('#memoryAlbum').isHidden(), true, 'restoring photos does not reveal the album early');
    await openAlbum(page);
    assert.equal(await page.locator('.album-card img').evaluateAll(images => images.every(img => img.naturalWidth === 1024)), true, 'all photos survive reload');

    const input = cards.first().locator('.photo-input');
    const saved = await cards.first().locator('img').getAttribute('src');
    await input.setInputFiles({ name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
    assert.ok((await page.locator('#albumStatus').textContent()).includes('tệp ảnh'));
    await input.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('broken image') });
    await page.waitForFunction(() => !document.querySelector('.album-card').hasAttribute('aria-busy'));
    assert.ok((await page.locator('#albumStatus').textContent()).includes('Chưa đọc được'));
    assert.equal(await cards.first().locator('img').getAttribute('src'), saved, 'invalid image keeps the previous photo');
    await input.setInputFiles({ name: 'large.png', mimeType: 'image/png', buffer: Buffer.alloc(20 * 1024 * 1024 + 1) });
    assert.ok((await page.locator('#albumStatus').textContent()).includes('20 MB'));
    assert.equal(await cards.first().locator('img').getAttribute('src'), saved);
    await input.setInputFiles([]);
    assert.equal(await cards.first().locator('img').getAttribute('src'), saved, 'cancel keeps the photo');

    await cards.nth(1).locator('.reset-photo').click();
    assert.equal(await cards.nth(1).locator('img').getAttribute('src'), originals[1]);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), key(1)), null);
    assert.equal(await cards.first().locator('img').getAttribute('src'), saved, 'reset affects one photo only');
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.locator('#memoryAlbum').evaluate(album => {
        const photos = [...album.querySelectorAll('.album-card')].map(card => card.getBoundingClientRect());
        return document.documentElement.scrollWidth <= innerWidth && photos.every(a => a.left >= 0 && a.right <= innerWidth)
          && !photos.some((a, i) => photos.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.left, b.left)
            && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)));
      }), true, `editable photo cards fit and stay separate at ${width}px`);
    }
    await page.locator('#toggleAlbum').click();
    assert.equal(await page.locator('#editAlbum').getAttribute('aria-expanded'), 'false', 'folding exits editing');
    await page.locator('#editAlbum').click();
    assert.equal(await page.locator('#toggleAlbum').getAttribute('aria-expanded'), 'true', 'editing spreads the album again');
    await page.evaluate(() => {
      Storage.prototype.setItem = () => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); };
    });
    await cards.nth(1).locator('.photo-input').setInputFiles(file);
    await page.waitForFunction(() => !document.querySelectorAll('.album-card')[1].hasAttribute('aria-busy'));
    assert.ok((await page.locator('#albumStatus').textContent()).includes('chưa lưu được'));
    assert.ok((await cards.nth(1).locator('img').getAttribute('src')).startsWith('data:image/jpeg;base64,'), 'photo remains usable if storage is full');
    await page.reload();
    await openAlbum(page);
    assert.equal(await cards.nth(1).locator('img').getAttribute('src'), originals[1], 'reset survives reload');
    await page.evaluate(key => localStorage.setItem(key, 'data:image/jpeg;base64,broken'), key(0));
    await page.reload();
    await openAlbum(page);
    assert.equal(await cards.first().locator('img').getAttribute('src'), originals[0], 'malformed saved photo falls back to original');

    const blocked = await browser.newPage({ reducedMotion: 'reduce' });
    blocked.on('pageerror', error => errors.push(error.message));
    await blocked.addInitScript(() => {
      for (const method of ['getItem', 'setItem', 'removeItem']) {
        Storage.prototype[method] = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
      }
    });
    await blocked.goto(pageUrl);
    await openAlbum(blocked);
    const blockedCard = blocked.locator('.album-card').first();
    await blockedCard.locator('.photo-input').setInputFiles(file);
    await blocked.waitForFunction(() => !document.querySelector('.album-card').hasAttribute('aria-busy'));
    assert.ok((await blocked.locator('#albumStatus').textContent()).includes('chưa lưu được'));
    await blockedCard.locator('.reset-photo').click();
    assert.equal(await blockedCard.locator('img').getAttribute('src'), originals[0]);
    assert.deepEqual(errors, []);
    console.log('PASS: image chooser, resizing, independent save/restore/reset, reload, invalid/oversized/cancelled files, storage quota/blocked/corrupt data, editing/folding and responsive album; no page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
