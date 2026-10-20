(() => {
  'use strict';

  const STORAGE_KEY = 'flower.garden.greeting.20-10.v1';
  const card = document.getElementById('wishCard');
  const reading = document.getElementById('cardReading');
  const editor = document.getElementById('cardEditor');
  const editButton = document.getElementById('editCard');
  const status = document.getElementById('cardStatus');
  const recipient = document.getElementById('cardRecipient');
  const title = document.getElementById('cardTitle');
  const message = document.getElementById('cardMessage');
  const signature = document.getElementById('cardSignature');
  const inputs = {
    recipient: document.getElementById('recipientInput'),
    title: document.getElementById('titleInput'),
    message: document.getElementById('messageInput'),
    signature: document.getElementById('signatureInput')
  };
  function readText(element) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    return copy.textContent.trim();
  }
  let greeting = {
    recipient: readText(recipient),
    title: readText(title),
    message: [...message.querySelectorAll('p')].map(readText).join('\n\n'),
    signature: readText(signature)
  };

  function renderGreeting() {
    recipient.textContent = greeting.recipient;
    title.textContent = greeting.title;
    signature.textContent = greeting.signature;
    message.replaceChildren(...greeting.message.split(/\n\s*\n/).map(text => {
      const paragraph = document.createElement('p');
      paragraph.className = 'message';
      paragraph.textContent = text;
      return paragraph;
    }));
  }

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Object.entries(inputs).every(([key, input]) =>
      typeof saved[key] === 'string' && saved[key].trim() && saved[key].length <= input.maxLength)) {
      greeting = Object.fromEntries(Object.keys(inputs).map(key => [key, saved[key].trim()]));
      renderGreeting();
    }
  } catch {
    // Keep the original letter when storage is unavailable or malformed.
  }

  function showReading() {
    editor.hidden = true;
    reading.hidden = false;
    card.setAttribute('aria-labelledby', 'cardTitle');
    card.scrollTop = 0;
  }

  editButton.addEventListener('click', () => {
    Object.entries(inputs).forEach(([key, input]) => {
      input.value = greeting[key];
      input.setCustomValidity('');
    });
    reading.hidden = true;
    editor.hidden = false;
    status.textContent = '';
    card.setAttribute('aria-labelledby', 'editorTitle');
    card.scrollTop = 0;
    inputs.recipient.focus({ preventScroll: true });
  });
  document.getElementById('cancelEdit').addEventListener('click', () => {
    showReading();
    editButton.focus({ preventScroll: true });
  });
  card.addEventListener('close', () => {
    showReading();
    status.textContent = '';
  });
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });
  editor.addEventListener('submit', event => {
    event.preventDefault();
    Object.values(inputs).forEach(input => {
      input.setCustomValidity(input.value.trim() ? '' : 'Bạn viết vài chữ vào đây nhé.');
    });
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
  });
})();
