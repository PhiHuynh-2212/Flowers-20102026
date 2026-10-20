// Run with Playwright installed: node tests/layout.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const pageUrl = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

async function assertClearLayout(page, label) {
  const layout = await page.evaluate(() => {
    const card = document.getElementById('greetingCard').getBoundingClientRect();
    const covered = ['.greeting', '.scene-footer', '.portrait-card', '#bouquetStageWrapper', '#openCard'].filter(selector => {
      const text = document.querySelector(selector).getBoundingClientRect();
      return Math.min(text.right, card.right) - Math.max(text.left, card.left) > 1
        && Math.min(text.bottom, card.bottom) - Math.max(text.top, card.top) > 1;
    });
    const envelope = document.getElementById('openCard').getBoundingClientRect();
    return {
      covered,
      overflow: document.documentElement.scrollWidth > innerWidth,
      envelopeFits: envelope.left >= 0 && envelope.right <= innerWidth,
      cardFits: card.left >= 0 && card.right <= innerWidth,
      modal: document.getElementById('greetingCard').matches(':modal'),
      expanded: document.getElementById('openCard').getAttribute('aria-expanded')
    };
  });
  assert.deepEqual(layout.covered, [], `${label}: card must reserve space instead of covering existing content`);
  assert.equal(layout.overflow, false, `${label}: no horizontal overflow`);
  assert.equal(layout.envelopeFits, true, `${label}: envelope stays visible`);
  assert.equal(layout.cardFits, true, `${label}: card stays inside the page`);
  assert.equal(layout.modal, false, `${label}: page remains interactive`);
  assert.equal(layout.expanded, 'true');
}

(async () => {
  const browser = await chromium.launch();
  try {
    const errors = [];
    const page = await browser.newPage({ viewport: { width: 1024, height: 860 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pageUrl);
    await page.locator('.portrait-photo img').first().evaluate(img => img.decode());
    assert.equal(await page.locator('#memoryAlbum').isHidden(), true, 'photos wait until the letter opens');
    assert.equal(await page.locator('#bouquetStageWrapper').evaluate(e => {
      const r = e.getBoundingClientRect(); return Math.abs((r.left + r.right) / 2 - innerWidth / 2) < 2;
    }), true, 'bouquet is centered on arrival');
    await page.locator('#openCard').click();
    await assertClearLayout(page, '1024px original regression');

    for (const viewport of [
      { width: 1440, height: 1000 }, { width: 1367, height: 860 },
      { width: 1280, height: 720 }, { width: 1100, height: 768 },
      { width: 1099, height: 768 }, { width: 768, height: 1024 },
      { width: 600, height: 800 }, { width: 390, height: 844 },
      { width: 320, height: 568 }, { width: 844, height: 390 }
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(50);
      await assertClearLayout(page, `${viewport.width} × ${viewport.height}`);
    }
    await page.setViewportSize({ width: 1222, height: 709 });
    await page.locator('#closeCard').click();
    await page.locator('#openCard').click();
    const compactCard = await page.locator('#greetingCard').evaluate(e => {
      const rect = e.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, viewport: innerHeight };
    });
    assert.ok(compactCard.top >= 0 && compactCard.bottom <= compactCard.viewport,
      'opened default letter fits vertically on a short desktop viewport');
    await page.setViewportSize({ width: 1367, height: 860 });
    await page.locator('#editCard').click();
    await page.locator('#recipientInput').fill('Mẹ yêu');
    await page.locator('#messageInput').fill('Chúc mẹ luôn khỏe mạnh và bình an.\n'.repeat(30));
    await page.locator('#senderInput').fill('Con của mẹ');
    await page.getByRole('button', { name: 'Lưu lời chúc', exact: true }).click();
    assert.equal(await page.locator('#cardRecipient').textContent(), 'Mẹ yêu');
    await assertClearLayout(page, 'long personalized letter');
    await page.locator('#viewAlbum').click();
    await page.waitForFunction(() => document.getElementById('memoryAlbum').classList.contains('is-revealed'));
    assert.equal(await page.locator('.album-card img').evaluateAll(images => images.every(img => img.complete && img.naturalWidth > 0)), true, 'album photos load before reveal');
    await page.locator('#toggleAlbum').click();
    assert.equal(await page.locator('#toggleAlbum').getAttribute('aria-expanded'), 'true');
    for (const width of [1440, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      const albumLayout = await page.evaluate(() => {
        const photos = [...document.querySelectorAll('.album-card')].map(e => e.getBoundingClientRect());
        return {
          overflow: document.documentElement.scrollWidth > innerWidth,
          overlap: photos.some((a, i) => photos.slice(i + 1).some(b => Math.min(a.right, b.right) > Math.max(a.left, b.left)
            && Math.min(a.bottom, b.bottom) > Math.max(a.top, b.top)))
        };
      });
      assert.equal(albumLayout.overflow, false, `album fits at ${width}px`);
      assert.equal(albumLayout.overlap, false, `album photos separate at ${width}px`);
    }
    await page.locator('#toggleAlbum').click();
    assert.equal(await page.locator('#toggleAlbum').getAttribute('aria-expanded'), 'false');
    await page.setViewportSize({ width: 1367, height: 860 });
    assert.equal(await page.locator('#greetingCard').evaluate(d => d.scrollHeight <= d.clientHeight + 1), true,
      'Long letter grows with the document instead of clipping into a fixed overlay');
    await page.locator('#bouquetStageWrapper').focus();
    await page.keyboard.press('Enter');
    assert.ok((await page.locator('#roseWish').textContent()).length, 'roses remain interactive with the card open');
    await assertClearLayout(page, 'flower wish with open letter');
    await page.locator('#openCard').click();
    assert.equal(await page.locator('#greetingCard').isVisible(), false, 'envelope folds the letter');
    assert.equal(await page.locator('#openCard').getAttribute('aria-expanded'), 'false');
    await page.locator('#openCard').click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#greetingCard').isVisible(), false);
    assert.equal(await page.locator('#openCard').evaluate(e => e === document.activeElement), true);
    await page.locator('#openCard').click();
    await page.locator('#closeCard').click();
    assert.equal(await page.locator('#greetingCard').isVisible(), false);

    // Exercise the layout movement with animations enabled and while changing orientation.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#openCard').click();
    await page.waitForTimeout(900);
    await assertClearLayout(page, 'animated open');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(100);
    await assertClearLayout(page, 'resize open letter to mobile');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(650);
    assert.equal(await page.locator('#openCard').evaluate(e => {
      const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight;
    }), true, 'closing returns the opener into view');
    assert.deepEqual(errors, []);
    console.log('PASS: centered bouquet, deferred album with loaded photos, album spread/fold; no card/text/photo/bouquet overlap across 11 viewport sizes, resize while open, long letters, editable greeting, flower interaction, keyboard/toggle close and offline portrait. No page errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
