/*
 * Healthi boot-error overlay.
 * A classic (non-module) script loaded before the app bundle, so it still runs
 * when the module graph fails to load (bad import, network error) and the
 * screen would otherwise stay black. Uses textContent only (no innerHTML, no eval).
 */
(function () {
  function show(title, detail) {
    var el = document.getElementById('error-display');
    if (!el) return;
    el.style.display = 'block';
    el.textContent += '\n[' + title + '] ' + detail + '\n---';
  }

  window.addEventListener('error', function (e) {
    // Resource errors (img/script) have no message; ignore browser-extension noise.
    var src = (e && e.filename) || '';
    if (src.indexOf('-extension://') !== -1) return;
    if (!e.message) return;
    show('HATA', e.message + '\n' + src + ':' + e.lineno + ':' + e.colno + '\n' + (e.error && e.error.stack ? e.error.stack : ''));
  });

  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    var msg = r && r.message ? r.message : String(r);
    // Firebase/network rejections are handled in-app; only surface load failures here.
    if (msg.indexOf('Failed to fetch dynamically imported module') === -1 &&
        msg.indexOf('Importing a module script failed') === -1) {
      console.error('[Healthi] Unhandled rejection:', r);
      return;
    }
    show('MODÜL YÜKLENEMEDİ', msg + '\nSayfayı yenilemeyi dene.');
  });

  // If React never mounts (e.g. the entry bundle failed), explain instead of a black screen.
  window.setTimeout(function () {
    var root = document.getElementById('root');
    if (root && root.getAttribute('data-booting') === 'true' && root.childElementCount <= 1) {
      show('BAŞLATILAMADI', 'Uygulama 15 saniyede açılmadı. Konsoldaki (F12) ilk hatayı kontrol et.');
    }
  }, 15000);
})();
