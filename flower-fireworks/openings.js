(() => {
  'use strict';

  // Local previews never add entries to the real database.
  if (location.hostname !== 'salahghedda.github.io') return;

  const endpoint = 'https://ytiemfqyfaglsvibizvs.supabase.co/rest/v1/rpc/record_fireworks_opening';
  // This publishable key is intended for browsers. Database permissions keep
  // the history private; no secret/service_role key belongs in this file.
  const publishableKey = 'sb_publishable_wVd-jhCRI8uQAx_I8Jkgpw_RrGgJJ09';
  let recorded = false;

  function recordOpening() {
    if (recorded || document.visibilityState !== 'visible' || document.prerendering) return;
    recorded = true;
    // Only the server's timestamp is stored. The request contains no visitor
    // identity, location, device details, referrer, or client timestamp.
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
      // Tracking never interrupts the fireworks or shows a message on the page.
    });
  }

  document.addEventListener('visibilitychange', recordOpening);
  document.addEventListener('prerenderingchange', recordOpening);
  addEventListener('pageshow', event => {
    // A Back-button return is a new opening; switching tabs is not.
    if (event.persisted) recorded = false;
    recordOpening();
  });
  recordOpening();
})();
