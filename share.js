/**
 * Supabase client and sync helpers for Flowers 20/10
 */
window.FlowerShare = (() => {
  'use strict';

  const SUPABASE_URL = 'https://ygdmvjzfdknrujfvjdtc.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_atwb5kuoi781q2Ze0-2vVw_FuvUAkQd';

  function generateId() {
    // Generate clean 8-character ID
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let id = '';
    const array = new Uint8Array(8);
    crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      id += chars[array[i] % chars.length];
    }
    return id;
  }

  async function uploadImageBlob(blob, cardId, photoIndex) {
    const filename = `${cardId}_p${photoIndex}_${Date.now()}.jpg`;
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/photos/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'image/jpeg',
        'x-upsert': 'true'
      },
      body: blob
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Upload failed: ${err}`);
    }

    return `${SUPABASE_URL}/storage/v1/object/public/photos/${filename}`;
  }

  async function saveCard(data) {
    const id = data.id || generateId();
    const payload = {
      id,
      recipient: data.recipient || '',
      title: data.title || '',
      message: data.message || '',
      sender: data.sender || '',
      photos: data.photos || []
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Save card failed: ${err}`);
    }

    const saved = await response.json();
    return saved[0] || payload;
  }

  async function getCard(id) {
    if (!id) return null;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/cards?id=eq.${encodeURIComponent(id)}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (!response.ok) return null;
    const rows = await response.json();
    return rows && rows.length > 0 ? rows[0] : null;
  }

  // Get active ID from URL ?id=xxx
  const urlParams = new URLSearchParams(window.location.search);
  const activeId = urlParams.get('id');

  return {
    activeId,
    getCard,
    saveCard,
    uploadImageBlob
  };
})();
