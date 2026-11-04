(() => {
  'use strict';

  // Local previews never add entries to the real database.
  if (location.hostname !== 'salahghedda.github.io') return;

  const endpoint = 'https://ytiemfqyfaglsvibizvs.supabase.co/rest/v1/rpc/record_note_opening';
  // This publishable key is intended for browsers. Database permissions keep
  // the history private; no secret/service_role key belongs in this file.
  const publishableKey = 'sb_publishable_wVd-jhCRI8uQAx_I8Jkgpw_RrGgJJ09';
  let recorded = false;

  function recordOpening() {
    if (recorded || document.visibilityState !== 'visible' || document.prerendering) return;
    recorded = true;
    // The server supplies the timestamp. No location, device details, identity,
    // cookies, or client timestamp are included in the request payload.
    fetch(endpoint, {
      method: 'POST',
      headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
      body: '{}',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      keepalive: true
    }).then(response => {
      if (!response.ok) console.warn('Opening could not be saved. Check the Supabase setup.');
    }).catch(() => {
      // A connection failure must never interrupt the page or display a message.
    });
  }

  document.addEventListener('visibilitychange', recordOpening);
  document.addEventListener('prerenderingchange', recordOpening);
  addEventListener('pageshow', event => {
    // Returning with the browser Back button is a new opening. Switching tabs is not.
    if (event.persisted) recorded = false;
    recordOpening();
  });
  recordOpening();
})();
