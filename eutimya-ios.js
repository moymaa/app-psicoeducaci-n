/* ============================================================
   Eutimya · capa de experiencia iOS (compartida, 7 páginas)
   - Háptica tipo Taptic Engine (navigator.vibrate; iOS Safari la
     ignora silenciosamente, Android la ejecuta)
   - Enmascaramiento de datos sensibles con tap-para-revelar
   - Sheets con gesto: swipe-down descarta, drag-up expande (detent)
   ============================================================ */
(function () {
  'use strict';

  /* ── Háptica ── */
  var canVib = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  function vib(p) { if (canVib) { try { navigator.vibrate(p); } catch (e) {} } }

  // Toque ligero en cualquier control interactivo (Taptic "light")
  document.addEventListener('pointerdown', function (e) {
    var t = e.target && e.target.closest &&
      e.target.closest('a,button,[role="button"],input[type="checkbox"],input[type="radio"],summary');
    if (t) vib(8);
  }, { passive: true });

  window.euHaptic = {
    tap:     function () { vib(8); },
    success: function () { vib([12, 60, 12]); },          // doble golpe suave de éxito
    warning: function () { vib([28, 70, 28, 70, 28]); }   // vibración triple de advertencia
  };

  // Envolver funciones de éxito conocidas si la página las define
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

  /* ── Sheets: swipe-to-dismiss + detent expandido ── */
  function attachSheet(sheet) {
    var startY = 0, curY = 0, dragging = false, expanded = false;
    sheet.addEventListener('touchstart', function (e) {
      if (sheet.scrollTop > 0) return;           // respeta el scroll interno
      startY = e.touches[0].clientY; dragging = true; curY = 0;
      sheet.style.transition = 'none';
    }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (!dragging) return;
      curY = e.touches[0].clientY - startY;
      if (curY > 0) {
        sheet.style.transform = 'translateY(' + curY + 'px)';
      } else if (curY < -30 && !expanded) {      // drag hacia arriba → detent grande
        expanded = true;
        sheet.style.maxHeight = '92vh';
        sheet.style.height = '92vh';
      }
    }, { passive: true });
    sheet.addEventListener('touchend', function () {
      if (!dragging) return;
      dragging = false;
      sheet.style.transition = '';
      if (curY > 90) {                           // umbral de descarte iOS
        vib(10);
        sheet.style.transform = '';
        var b = sheet.querySelector('.sheet-close, .ios-close-btn, [aria-label="Cerrar"]');
        if (b) b.click();
      } else {
        sheet.style.transform = '';              // snap back al detent
      }
    });
  }

  function init() {
    ['educ-sheet', 'pagos-sheet', 'ia-sheet', 'install-sheet', 'ios-sheet'].forEach(function (id) {
      var s = document.getElementById(id);
      if (s) attachSheet(s);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
