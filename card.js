(() => {
  'use strict';

  const STORAGE_KEY = 'flower.greeting.20-10.v1';
  const defaultGreeting = {
    recipient: 'bạn',
    message: 'Nhân ngày Phụ nữ Việt Nam 20/10, chúc bạn luôn khỏe mạnh, bình an và có thật nhiều niềm vui.\n\nMong bạn được yêu thương từ những điều nhỏ nhất, có thời gian cho bản thân và tự tin theo đuổi những điều mình mong muốn.\n\nHôm nay và cả những ngày sau, hãy luôn mỉm cười theo cách của riêng bạn nhé.',
    sender: 'Một người quý mến bạn'
  };
  const dialog = document.getElementById('greetingCard');
  const openButton = document.getElementById('openCard');
  const reading = document.getElementById('cardReading');
  const editor = document.getElementById('cardEditor');
  const editButton = document.getElementById('editCard');
  const status = document.getElementById('cardStatus');
  const closeButton = document.getElementById('closeCard');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopLayout = window.matchMedia('(min-width: 1100px)');
  const sceneElements = [...document.querySelectorAll('.bouquet-composition, .scene-footer')];
  const layoutAnimations = new Set();
  const album = document.getElementById('memoryAlbum');
  const albumToggle = document.getElementById('toggleAlbum');
  const albumObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      album.classList.add('is-revealed');
      albumObserver.unobserve(album);
    }
  }, { threshold: 0.08 });

  let albumRevealPromise;
  function revealAlbum() {
    if (albumRevealPromise) return albumRevealPromise;
    // Restore saved photos and decode them before revealing the paper frames.
    const photos = [...album.querySelectorAll('img')];
    photos.forEach(photo => { photo.loading = 'eager'; });
    albumRevealPromise = Promise.resolve(window.albumPhotosReady)
      .then(() => Promise.allSettled(photos.map(photo => photo.decode())))
      .then(() => {
        album.hidden = false;
        albumObserver.observe(album);
      });
    return albumRevealPromise;
  }

  albumToggle.addEventListener('click', () => {
    const expanded = album.classList.toggle('is-spread');
    albumToggle.setAttribute('aria-expanded', String(expanded));
    albumToggle.innerHTML = expanded ? 'Gấp album <span aria-hidden="true">♡</span>' : 'Xòe album <span aria-hidden="true">♡</span>';
  });
  document.getElementById('viewAlbum').addEventListener('click', async () => {
    await revealAlbum();
    album.classList.add('is-revealed');
    album.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    albumToggle.focus({ preventScroll: true });
  });

  function reflowScene(changeLayout) {
    layoutAnimations.forEach(animation => animation.cancel());
    layoutAnimations.clear();
    const before = sceneElements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    });
    changeLayout();
    if (motion.matches) return;
    sceneElements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      if (!after.width || !after.height) return;
      const dx = before[index].left - after.left - window.scrollX;
      const dy = before[index].top - after.top - window.scrollY;
      const scale = element.matches('.bouquet-composition')
        ? ` scale(${before[index].width / after.width}, ${before[index].height / after.height})` : '';
      const animation = element.animate([
        { transform: `translate(${dx}px, ${dy}px)${scale}` },
        { transform: 'none' }
      ], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
      layoutAnimations.add(animation);
      animation.onfinish = () => layoutAnimations.delete(animation);
    });
  }

  function revealCard() {
    const rect = dialog.getBoundingClientRect();
    if (!desktopLayout.matches || rect.top < 16 || rect.top > window.innerHeight * 0.35 || rect.bottom > window.innerHeight - 16) {
      dialog.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function setCardOpen(open) {
    if (dialog.open === open) return;
    reflowScene(() => {
      if (open) {
        showReading();
        status.textContent = '';
        // A non-modal dialog participates in the page grid and reserves its own space.
        document.body.classList.add('card-open');
        dialog.show();
      } else {
        dialog.close();
        document.body.classList.remove('card-open');
        showReading();
      }
      openButton.setAttribute('aria-expanded', String(open));
      openButton.querySelector('.envelope-action').textContent = open ? 'Gấp thiệp' : 'Mở thiệp';
    });
    if (open) {
      closeButton.focus({ preventScroll: true });
      revealAlbum();
      revealCard();
      document.dispatchEvent(new Event('bouquet:celebrate'));
    } else {
      openButton.focus({ preventScroll: true });
      const rect = openButton.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openButton.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
      }
    }
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations.clear();
    }
  });
  const inputs = {
    recipient: document.getElementById('recipientInput'),
    message: document.getElementById('messageInput'),
    sender: document.getElementById('senderInput')
  };
  let greeting = { ...defaultGreeting };

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Object.keys(inputs).every(key => typeof saved[key] === 'string'
      && saved[key].trim().length > 0 && saved[key].length <= inputs[key].maxLength)) {
      greeting = Object.fromEntries(Object.keys(inputs).map(key => [key, saved[key].trim()]));
    }
  } catch {
    // The default letter stays usable when storage is unavailable or malformed.
  }

  // Load from Supabase if ?id=xxx is present in URL
  if (window.FlowerShare && window.FlowerShare.activeId) {
    window.FlowerShare.getCard(window.FlowerShare.activeId).then(data => {
      if (data) {
        if (data.recipient) greeting.recipient = data.recipient;
        if (data.message) greeting.message = data.message;
        if (data.sender) greeting.sender = data.sender;
        renderGreeting();
      }
    });
  }

  function renderGreeting() {
    document.getElementById('cardRecipient').textContent = greeting.recipient;
    const paragraphs = greeting.message.split(/\n\s*\n/).map(text => {
      const paragraph = document.createElement('span');
      paragraph.className = 'message-paragraph';
      paragraph.textContent = text;
      return paragraph;
    });
    document.getElementById('cardMessage').replaceChildren(...paragraphs);
    document.getElementById('cardSender').textContent = greeting.sender;
  }

  function showReading() {
    reading.hidden = false;
    editor.hidden = true;
    dialog.setAttribute('aria-labelledby', 'cardTitle');
    dialog.scrollTop = 0;
  }

  document.addEventListener('bouquet:ready', () => { openButton.hidden = false; });
  document.addEventListener('bouquet:rose', event => {
    const wish = document.getElementById('roseWish');
    wish.classList.remove('is-new');
    wish.textContent = event.detail.message;
    // Restart the brief reveal even when two flowers share the same wish.
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });
  document.getElementById('replayBloom').addEventListener('click', () => {
    document.dispatchEvent(new Event('bouquet:replay'));
    document.getElementById('roseWish').textContent = '';
  });

  openButton.addEventListener('click', () => setCardOpen(!dialog.open));
  closeButton.addEventListener('click', () => setCardOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !event.defaultPrevented) {
      event.preventDefault();
      setCardOpen(false);
    }
  });
  dialog.addEventListener('close', () => {
    if (dialog.open || !document.body.classList.contains('card-open')) return;
    document.body.classList.remove('card-open');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.querySelector('.envelope-action').textContent = 'Mở thiệp';
    showReading();
  });

  editButton.addEventListener('click', () => {
    Object.keys(inputs).forEach(key => {
      inputs[key].value = greeting[key];
      inputs[key].setCustomValidity('');
    });
    reading.hidden = true;
    editor.hidden = false;
    status.textContent = '';
    dialog.setAttribute('aria-labelledby', 'editorTitle');
    dialog.scrollTop = 0;
    inputs.recipient.focus({ preventScroll: true });
    revealCard();
  });
  document.getElementById('cancelEdit').addEventListener('click', () => {
    showReading();
    editButton.focus({ preventScroll: true });
    revealCard();
  });
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });
  editor.addEventListener('submit', event => {
    event.preventDefault();
    for (const input of Object.values(inputs)) {
      input.setCustomValidity(input.value.trim() ? '' : 'Bạn viết vài chữ vào đây nhé.');
    }
    if (!editor.reportValidity()) return;
    greeting = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()]));
    renderGreeting();
    showReading();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(greeting));
      status.textContent = 'Đã lưu lời chúc của bạn.';
    } catch {
      status.textContent = 'Đã cập nhật thiệp. Trình duyệt chưa cho phép lưu để dùng lần sau.';
    }
    editButton.focus({ preventScroll: true });
    revealCard();
  });

  // Handle Share Link generation
  const shareLinkBtn = document.getElementById('shareLinkBtn');
  const shareModal = document.getElementById('shareResultModal');
  const shareUrlInput = document.getElementById('shareUrlInput');
  const copyShareBtn = document.getElementById('copyShareBtn');
  const shareCopyMsg = document.getElementById('shareCopyMsg');

  if (shareLinkBtn) {
    shareLinkBtn.addEventListener('click', async () => {
      shareLinkBtn.disabled = true;
      status.textContent = 'Đang tải ảnh và tạo liên kết chia sẻ…';
      try {
        let uploadedPhotoUrls = [];
        if (typeof window.getAlbumImagesForShare === 'function') {
          const cardIdForUpload = window.FlowerShare.activeId || ('c_' + Math.random().toString(36).substring(2, 9));
          const photosData = await window.getAlbumImagesForShare();
          for (let i = 0; i < photosData.length; i++) {
            const item = photosData[i];
            if (item.type === 'blob') {
              status.textContent = `Đang tải ảnh ${i + 1}/3 lên đám mây…`;
              const uploadedUrl = await window.FlowerShare.uploadImageBlob(item.blob, cardIdForUpload, i + 1);
              uploadedPhotoUrls.push(uploadedUrl);
            } else if (item.type === 'url') {
              uploadedPhotoUrls.push(item.url);
            } else {
              uploadedPhotoUrls.push('./assets/portrait-placeholder.webp');
            }
          }
        }

        status.textContent = 'Đang lưu thiệp…';
        const cardRecord = await window.FlowerShare.saveCard({
          recipient: greeting.recipient,
          title: 'Chúc bạn một ngày thật nhiều yêu thương.',
          message: greeting.message,
          sender: greeting.sender,
          photos: uploadedPhotoUrls
        });

        const shareUrl = new URL(window.location.href);
        shareUrl.searchParams.set('id', cardRecord.id);
        shareUrlInput.value = shareUrl.toString();
        shareModal.hidden = false;
        shareCopyMsg.hidden = true;
        status.textContent = 'Đã tạo link chia sẻ thành công!';
        shareUrlInput.focus();
        shareUrlInput.select();
      } catch (err) {
        console.error(err);
        status.textContent = 'Có lỗi khi tạo link chia sẻ. Bạn vui lòng thử lại nhé.';
      } finally {
        shareLinkBtn.disabled = false;
      }
    });
  }

  if (copyShareBtn) {
    copyShareBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(shareUrlInput.value);
        shareCopyMsg.hidden = false;
        copyShareBtn.textContent = 'Đã chép ✓';
        setTimeout(() => {
          copyShareBtn.textContent = 'Sao chép';
          shareCopyMsg.hidden = true;
        }, 3000);
      } catch {
        shareUrlInput.select();
        document.execCommand('copy');
        shareCopyMsg.hidden = false;
      }
    });
  }

  renderGreeting();
})();
