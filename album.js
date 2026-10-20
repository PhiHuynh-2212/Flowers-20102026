(() => {
  'use strict';

  const album = document.getElementById('memoryAlbum');
  const toggle = document.getElementById('toggleAlbum');
  const edit = document.getElementById('editAlbum');
  const hint = document.getElementById('albumEditHint');
  const status = document.getElementById('albumStatus');
  const cards = [...album.querySelectorAll('.album-card')];
  const photosContainer = document.getElementById('albumPhotos');

  function toggleSpread() {
    const expanded = album.classList.toggle('is-spread');
    if (toggle) {
      toggle.setAttribute('aria-expanded', String(expanded));
      toggle.innerHTML = expanded ? 'Gấp album <span aria-hidden="true">♡</span>' : 'Xòe album <span aria-hidden="true">♡</span>';
    }
  }

  // Click directly on album photos to spread / fold
  if (photosContainer) {
    photosContainer.addEventListener('click', (e) => {
      // Don't toggle if user clicked on a button or input inside
      if (e.target.closest('button') || e.target.closest('input')) return;
      toggleSpread();
    });
  }

  if (toggle) {
    toggle.addEventListener('click', () => {
      toggleSpread();
      if (editing && !album.classList.contains('is-spread')) setEditing(false);
    });
  }

  function setEditing(open) {
    editing = open;
    if (open && !album.classList.contains('is-spread')) toggleSpread();
    cards.forEach(card => { card.querySelector('.photo-actions').hidden = !open; });
    if (hint) hint.hidden = !open;
    if (edit) {
      edit.setAttribute('aria-expanded', String(open));
      edit.textContent = open ? 'Xong' : 'Thay ảnh ✎';
    }
  }
  if (edit) edit.addEventListener('click', () => setEditing(!editing));

  async function preparePhoto(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, 1024 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fffdfb';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', .85);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  window.albumPhotosReady = Promise.allSettled(cards.map(async (card, index) => {
    const photo = card.querySelector('img');
    const input = card.querySelector('.photo-input');
    const change = card.querySelector('.change-photo');
    const reset = card.querySelector('.reset-photo');
    const original = photo.getAttribute('src');
    const key = `flower.album.photo.20-10.v1.${index}`;
    let busy = false;

    change.addEventListener('click', (e) => {
      e.stopPropagation();
      input.value = '';
      input.click();
    });
    input.addEventListener('change', async () => {
      const file = input.files[0];
      if (!file || busy) return;
      if (!file.type.startsWith('image/')) {
        status.textContent = 'Bạn chọn một tệp ảnh nhé (JPG, PNG hoặc WebP).';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        status.textContent = 'Ảnh quá lớn. Bạn chọn ảnh nhỏ hơn hoặc bằng 20 MB nhé.';
        return;
      }
      busy = true;
      change.disabled = true;
      reset.disabled = true;
      card.setAttribute('aria-busy', 'true');
      status.textContent = `Đang xử lý ảnh thứ ${index + 1}…`;
      const previous = photo.getAttribute('src');
      try {
        const data = await preparePhoto(file);
        photo.src = data;
        await photo.decode();
        try {
          localStorage.setItem(key, data);
          status.textContent = `Đã lưu ảnh thứ ${index + 1}.`;
        } catch {
          status.textContent = 'Đã thay ảnh. Trình duyệt chưa lưu được ảnh để dùng lần sau; bạn có thể giải phóng bộ nhớ rồi chọn lại ảnh.';
        }
      } catch {
        photo.src = previous;
        status.textContent = 'Chưa đọc được ảnh này. Bạn thử ảnh JPG, PNG hoặc WebP khác nhé.';
      } finally {
        busy = false;
        change.disabled = false;
        reset.disabled = photo.getAttribute('src') === original;
        card.removeAttribute('aria-busy');
      }
    });
    reset.addEventListener('click', (e) => {
      e.stopPropagation();
      photo.src = original;
      input.value = '';
      reset.disabled = true;
      try {
        localStorage.removeItem(key);
        status.textContent = `Đã khôi phục ảnh thứ ${index + 1}.`;
      } catch {
        status.textContent = 'Đã khôi phục ảnh. Trình duyệt chưa lưu được thay đổi để dùng lần sau.';
      }
      change.focus({ preventScroll: true });
    });

    try {
      const saved = localStorage.getItem(key);
      if (saved && saved.startsWith('data:image/jpeg;base64,')) {
        const image = new Image();
        image.src = saved;
        await image.decode();
        photo.src = saved;
        reset.disabled = false;
      }
    } catch {
      // Leave the original photo in place when storage is blocked or the saved image is invalid.
    }

    // Check if card was loaded from Supabase with photos
    if (window.FlowerShare && window.FlowerShare.activeId) {
      window.FlowerShare.getCard(window.FlowerShare.activeId).then(cardData => {
        if (cardData && cardData.photos && cardData.photos[index]) {
          photo.src = cardData.photos[index];
          reset.disabled = false;
        }
      });
    }
  }));

  // Helper to get current images as blobs for uploading to Supabase
  window.getAlbumImagesForShare = async () => {
    return Promise.all(cards.map(async (card, idx) => {
      const photo = card.querySelector('img');
      const src = photo.getAttribute('src');
      // If already a remote URL (http/https), keep it
      if (src.startsWith('http://') || src.startsWith('https://')) {
        return { type: 'url', url: src };
      }
      // If data URL, convert to Blob
      if (src.startsWith('data:image/')) {
        const res = await fetch(src);
        const blob = await res.blob();
        return { type: 'blob', blob, index: idx };
      }
      // Original asset placeholder
      return { type: 'default', url: src };
    }));
  };
})();
