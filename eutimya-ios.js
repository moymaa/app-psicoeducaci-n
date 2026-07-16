/* ============================================================
   Eutimya · capa de experiencia iOS (compartida, 7 páginas)
   - Iconografía estilo SF Symbols (swap runtime de Material Symbols)
   - Háptica tipo Taptic Engine
   - Enmascaramiento de datos sensibles con tap-para-revelar
   - Sheets con física real: inercia (velocidad) + rubber-banding
   - Indicador de modo sin conexión
   ============================================================ */
(function () {
  'use strict';

  /* ── Háptica ── */
  var canVib = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  function vib(p) { if (canVib) { try { navigator.vibrate(p); } catch (e) {} } }

  document.addEventListener('pointerdown', function (e) {
    var t = e.target && e.target.closest &&
      e.target.closest('a,button,[role="button"],input[type="checkbox"],input[type="radio"],summary');
    if (t) vib(8);
  }, { passive: true });

  window.euHaptic = {
    tap:     function () { vib(8); },
    success: function () { vib([12, 60, 12]); },
    warning: function () { vib([28, 70, 28, 70, 28]); }
  };

  window.addEventListener('load', function () {
    ['copiarTexto', 'copiarLink', 'copiarNombre'].forEach(function (name) {
      var fn = window[name];
      if (typeof fn === 'function') {
        window[name] = function () {
          var r = fn.apply(this, arguments);
          window.euHaptic.success();
          return r;
        };
      }
    });
  });

  /* ── Enmascaramiento tipo Apple Wallet ── */
  window.euToggleMask = function (el) {
    var v = el.getAttribute('data-eu-val') || '';
    if (el.classList.toggle('eu-revealed')) {
      el.textContent = v; vib(12);
    } else {
      el.textContent = '···· ' + v.slice(-4);
    }
  };

  /* ── Iconografía estilo SF Symbols ──
     Reemplaza el glifo de fuente Material por un SVG de trazo
     (1.8px, terminales redondos) que hereda color y tamaño del span.
     La fuente Material queda como fallback si este script no corre. */
  var SF = {
    arrow_back:      '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
    arrow_forward:   '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    assignment:      '<rect x="5.5" y="4" width="13" height="17" rx="2.5"/><path d="M9.5 4V3a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1"/><path d="M9 10.5h6M9 14.5h6"/>',
    bedtime:         '<path d="M20.2 14.2A8.3 8.3 0 0 1 9.8 3.8a8.3 8.3 0 1 0 10.4 10.4Z"/>',
    calendar_add_on: '<rect x="3" y="5" width="14.5" height="15" rx="3"/><path d="M7 3v4M14 3v4M3 10h14.5"/><path d="M19.5 13.5v6M16.5 16.5h6"/>',
    calendar_month:  '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01"/>',
    chat:            '<path d="M21 11.8a8.4 8.4 0 0 1-8.5 8.3 8.9 8.9 0 0 1-3.2-.6L4 20.5l1.1-4A8 8 0 0 1 4 11.8a8.4 8.4 0 0 1 8.5-8.3A8.4 8.4 0 0 1 21 11.8Z"/>',
    clinical_notes:  '<path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8Z"/><path d="M14 2.5V8h5.5"/><path d="M8 14.5h1.8l1.1-2.6 1.6 4.4 1.2-1.8H16"/>',
    crisis_alert:    '<circle cx="12" cy="12" r="8.7"/><path d="M12 7.6v5"/><path d="M12 16.2h.01"/>',
    description:     '<path d="M14 2.5H7A2.5 2.5 0 0 0 4.5 5v14A2.5 2.5 0 0 0 7 21.5h10a2.5 2.5 0 0 0 2.5-2.5V8Z"/><path d="M14 2.5V8h5.5"/><path d="M8.5 13h7M8.5 17h5"/>',
    event_busy:      '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="m10 13.5 4 4M14 13.5l-4 4"/>',
    event_repeat:    '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/><path d="M9.5 15.8a2.8 2.8 0 0 1 4.8-1.2l.7.7M14.5 16.2a2.8 2.8 0 0 1-4.8 1.2l-.7-.7"/>',
    expand_more:     '<path d="m6 9 6 6 6-6"/>',
    folder_open:     '<path d="M3.5 18.5V6A2.5 2.5 0 0 1 6 3.5h3.2l2 2.5H18A2.5 2.5 0 0 1 20.5 8.5v1"/><path d="M3.5 18.5 5.7 12a2 2 0 0 1 1.9-1.4h12.6a1.5 1.5 0 0 1 1.4 2l-1.7 4.9a2 2 0 0 1-1.9 1.4H4.5a1 1 0 0 1-1-1.4Z"/>',
    groups:          '<circle cx="9" cy="8.5" r="3.1"/><path d="M3.5 19.5a5.6 5.6 0 0 1 11 0"/><circle cx="17.2" cy="10" r="2.4"/><path d="M15.8 14.7a4.6 4.6 0 0 1 5.7 4.4"/>',
    lock:            '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
    payments:        '<rect x="3" y="6" width="18" height="13" rx="3"/><path d="M3 10.5h18"/><path d="M7 15.2h4.5"/>',
    person_search:   '<circle cx="10" cy="8" r="3.2"/><path d="M4.5 19.5a5.8 5.8 0 0 1 9.3-4.2"/><circle cx="17" cy="16" r="3"/><path d="m19.3 18.3 2.2 2.2"/>',
    psychology:      '<path d="M12.8 3a6.7 6.7 0 0 1 6.6 7.9c-.2 1 .2 1.6.9 2.5.4.5.1 1.1-.5 1.1h-1.3v2.3a2 2 0 0 1-2 2h-1.5V21"/><path d="M12.8 3A6.7 6.7 0 0 0 6 9.7c0 2 .8 3.4 1.8 4.5.7.8 1.2 1.9 1.2 3V21"/><path d="M10.6 9.7h4.4M12.8 7.5v4.4"/>',
    receipt_long:    '<path d="M5.5 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16l-2.2-1.5L14 21l-2-1.5L10 21l-2.2-1.5L5.5 21Z"/><path d="M9 8h6M9 12h6"/>',
    refresh:         '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v4.5h-4.5"/>',
    search:          '<circle cx="11" cy="11" r="6.5"/><path d="m15.8 15.8 4.2 4.2"/>',
    send:            '<path d="m21 3-9.5 9.5"/><path d="M21 3 14 21l-2.5-7.5L4 11Z"/>',
    smart_toy:       '<rect x="5" y="8.5" width="14" height="10" rx="3"/><circle cx="12" cy="4.2" r="1.3"/><path d="M12 5.5v3"/><path d="M9 13.5h.01M15 13.5h.01"/><path d="M9.5 16h5"/>'
  };

  function swapIcon(span) {
    var name = (span.textContent || '').trim();
    var body = SF[name];
    if (!body) return;
    span.textContent = '';
    span.classList.add('sf-icon');
    span.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
  }

  function swapAll(root) {
    (root.querySelectorAll ? root.querySelectorAll('.material-symbols-outlined:not(.sf-icon)') : [])
      .forEach(swapIcon);
  }

  /* ── Sheets: inercia + rubber-banding + swipe-to-dismiss ── */
  function attachSheet(sheet) {
    var startY = 0, curY = 0, dragging = false, expanded = false;
    var lastY = 0, lastT = 0, vel = 0;

    sheet.addEventListener('touchstart', function (e) {
      if (sheet.scrollTop > 0) return;
      startY = lastY = e.touches[0].clientY;
      lastT = e.timeStamp; vel = 0; curY = 0; dragging = true;
      sheet.style.transition = 'none';
    }, { passive: true });

    sheet.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      var y = e.touches[0].clientY;
      var dt = e.timeStamp - lastT;
      if (dt > 0) vel = (y - lastY) / dt;        // px/ms, + hacia abajo
      lastY = y; lastT = e.timeStamp;
      curY = y - startY;
      if (curY > 0) {
        sheet.style.transform = 'translateY(' + curY + 'px)';
      } else {
        // Rubber-banding: resistencia elástica exponencial hacia arriba
        var over = -curY;
        var damped = 40 * (1 - Math.exp(-over / 120));
        sheet.style.transform = 'translateY(' + (-damped) + 'px)';
        if (over > 30 && !expanded) {            // detent grande
          expanded = true;
          sheet.style.maxHeight = '92vh';
          sheet.style.height = '92vh';
        }
      }
    }, { passive: true });

    sheet.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      // Inercia: un flick rápido (>0.5 px/ms) descarta aunque el
      // recorrido sea corto; si no, aplica el umbral de distancia.
      var flick = vel > 0.5 && curY > 20;
      if (flick || curY > 90) {
        vib(10);
        sheet.style.transform = '';
        var b = sheet.querySelector('.sheet-close, .ios-close-btn, [aria-label="Cerrar"]');
        if (b) b.click();
      } else {
        sheet.style.transform = '';              // snap back con spring del CSS
      }
    });
  }

  /* ── Indicador de modo sin conexión ── */
  function offlineBadge() {
    var el = document.createElement('div');
    el.id = 'eu-offline';
    el.textContent = 'Modo sin conexión';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
    function sync() { el.classList.toggle('on', !navigator.onLine); }
    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    sync();
  }

  function init() {
    swapAll(document);
    // Iconos inyectados dinámicamente (listas de citas, etc.)
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n.nodeType === 1) {
            if (n.classList && n.classList.contains('material-symbols-outlined')) swapIcon(n);
            swapAll(n);
          }
        });
      });
    }).observe(document.body, { childList: true, subtree: true });

    ['educ-sheet', 'pagos-sheet', 'ia-sheet', 'install-sheet', 'ios-sheet'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) attachSheet(s);
    });

    offlineBadge();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
