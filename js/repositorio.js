// Página del repositorio: intro dibujada y pista horizontal de las 4 etapas.
(function () {
  // ── intro: negro → trazos blancos y dorados → contenido desde la derecha ──
  var raizHtml = document.documentElement;
  if (raizHtml.classList.contains('rp-intro')) {
    var TRAZO_0 = 600, TRAZO_PASO = 250, TRAZO_DUR = 1400, MENU = 3600, FIN = 5400;
    var paneles = Array.prototype.slice.call(document.querySelectorAll('.repo-panel'));
    var ver = function (el, ms) { if (el) setTimeout(function () { el.classList.add('ver'); }, ms); };
    ver(document.querySelector('.repo-cabecera'), 200);
    paneles.forEach(function (p, i) {
      var d = TRAZO_0 + i * TRAZO_PASO;
      // pathLength=1000 deja medir el borde en unidades fijas aunque el panel
      // cambie de alto cuando llegan los datos de GitHub
      p.insertAdjacentHTML('afterbegin',
        '<svg class="rp-trazo" style="--d:' + d + 'ms" aria-hidden="true">' +
        '<rect class="blanco" x="0.5" y="0.5" width="100%" height="100%" pathLength="1000"/>' +
        '<rect class="oro" x="0.5" y="0.5" width="100%" height="100%" pathLength="1000"/></svg>');
      ver(p, d + TRAZO_DUR - 200);
    });
    ver(document.querySelector('.header'), MENU);
    // al terminar vuelven el fondo y el borde normales y el trazo se apaga
    setTimeout(function () {
      raizHtml.classList.remove('rp-intro');
      Array.prototype.forEach.call(document.querySelectorAll('.rp-trazo'), function (t) {
        t.classList.add('fuera');
        setTimeout(function () { t.remove(); }, 1300);
      });
    }, FIN);
  }

  // pista de etapas: solo se mueve en el eje x, arrastrando o con la rueda
  var pista = document.querySelector('.etapas-pista');
  var barra = document.querySelector('.pista-progreso span');
  if (pista) {
    var avance = function () {
      var max = pista.scrollWidth - pista.clientWidth;
      if (barra) barra.style.width = (max > 0 ? pista.scrollLeft / max * 100 : 100) + '%';
    };
    pista.addEventListener('scroll', avance, { passive: true });
    window.addEventListener('resize', avance);
    avance();
    // la rueda vertical se convierte en desplazamiento horizontal
    pista.addEventListener('wheel', function (e) {
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 32;
      pista.scrollLeft += d;
      e.preventDefault();
    }, { passive: false });
    // arrastrar con el mouse (en pantallas táctiles el desplazamiento es nativo)
    var ini = null;
    pista.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      ini = { x: e.clientX, s: pista.scrollLeft, movio: false };
    });
    window.addEventListener('pointermove', function (e) {
      if (!ini) return;
      var dx = e.clientX - ini.x;
      if (!ini.movio && Math.abs(dx) > 4) { ini.movio = true; pista.classList.add('arrastrando'); }
      if (ini.movio) pista.scrollLeft = ini.s - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!ini) return;
      ini = null; pista.classList.remove('arrastrando');
    });
    // con el teclado: flechas izquierda y derecha
    pista.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        pista.scrollBy({ left: e.key === 'ArrowRight' ? 240 : -240, behavior: 'smooth' });
        e.preventDefault();
      }
    });
  }

})();
