/* Cài ứng dụng lên điện thoại (PWA) */
(function () {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) return;
  let hidden = false; try { hidden = localStorage.getItem('pwaHide') === '1'; } catch (e) {}
  const ua = navigator.userAgent; const ios = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const mobile = ios || /Android|Mobile/i.test(ua);
  let deferred = null;
  const css = document.createElement('style');
  css.textContent = '#pwabar{position:fixed;left:12px;right:12px;bottom:12px;z-index:60;display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:14px;background:#fff;color:#1b2420;box-shadow:0 6px 24px rgba(0,0,0,.18);border:1px solid #e3e7e5;font:14px/1.35 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto}#pwabar img{width:40px;height:40px;border-radius:9px;flex:none}#pwabar .t{flex:1}#pwabar b{display:block}#pwabar small{color:#5f6b66}#pwabar button{font:inherit;border-radius:9px;padding:8px 12px;cursor:pointer;border:1px solid #d6dcd9;background:#fff}#pwabar .go{background:#0f6b4f;border-color:#0f6b4f;color:#fff;font-weight:600}@media (prefers-color-scheme:dark){#pwabar{background:#1d2422;color:#e8eeeb;border-color:#2c3532}#pwabar small{color:#a3b0ab}#pwabar button{background:#1d2422;color:#e8eeeb;border-color:#3a4441}}';
  document.head.appendChild(css);
  function show(kind) {
    if (hidden || document.getElementById('pwabar')) return;
    const d = document.createElement('div'); d.id = 'pwabar'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cài ứng dụng');
    d.innerHTML = '<img src="icon-192.png" alt=""><div class="t"><b>Cài ứng dụng Trực lễ EPS</b><small>' + (kind === 'ios' ? 'Bấm nút Chia sẻ <span aria-hidden="true">⬆︎</span> của Safari, chọn <b style="display:inline">Thêm vào MH chính</b>.' : 'Mở nhanh từ màn hình chính như một ứng dụng.') + '</small></div>' + (kind === 'ios' ? '' : '<button class="go" type="button">Cài đặt</button>') + '<button class="no" type="button" aria-label="Để sau">Để sau</button>';
    document.body.appendChild(d);
    const go = d.querySelector('.go'); if (go) go.onclick = async () => { if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch (e) {} deferred = null; d.remove(); };
    d.querySelector('.no').onclick = () => { d.remove(); try { localStorage.setItem('pwaHide', '1'); } catch (e) {} };
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; window.PWA_CAN_INSTALL = true; if (mobile) show('android'); });
  window.addEventListener('appinstalled', () => { const d = document.getElementById('pwabar'); if (d) d.remove(); });
  if (ios && !/CriOS|FxiOS|EdgiOS/.test(ua)) setTimeout(() => show('ios'), 1500);
  window.pwaInstall = () => { hidden = false; if (deferred) show('android'); else show(ios ? 'ios' : 'android'); };
})();
