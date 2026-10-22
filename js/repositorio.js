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
    var recienArrastrado = false;
    window.addEventListener('pointerup', function () {
      if (!ini) return;
      // el clic que sigue a un arrastre no abre ni cierra tarjetas
      if (ini.movio) { recienArrastrado = true; setTimeout(function () { recienArrastrado = false; }, 0); }
      ini = null; pista.classList.remove('arrastrando');
    });

    // clic en una etapa: se despliega a lo ancho con su detalle (guardado en
    // <template id="etapa-N-detalle">); otro clic en el resumen la cierra.
    // Solo una abierta a la vez
    var etapas = Array.prototype.slice.call(pista.querySelectorAll('.etapa'));
    // cada apertura o cierre cambia la versión de la tarjeta: los temporizadores
    // de una acción anterior ya no la tocan si se vuelve a hacer clic rápido
    function cerrar(et) {
      var v = et._v = (et._v || 0) + 1;
      et._abierta = false;
      var det = et.querySelector('.etapa-detalle');
      det.style.width = det.offsetWidth + 'px';
      det.classList.remove('ver');
      void det.offsetWidth;
      det.style.width = '0px';
      setTimeout(function () {
        if (et._v !== v) return;
        et.classList.remove('abierta'); et.setAttribute('aria-expanded', 'false');
        det.style.width = ''; avance();
      }, 450);
    }
    function abrir(et) {
      var v = et._v = (et._v || 0) + 1;
      et._abierta = true;
      var det = et.querySelector('.etapa-detalle');
      if (!det.childElementCount) {
        var t = document.getElementById('etapa-' + et.getAttribute('data-etapa') + '-detalle');
        if (t) det.appendChild(t.content.cloneNode(true));
      }
      et.classList.add('abierta'); et.setAttribute('aria-expanded', 'true');
      // de 0 al ancho natural del detalle
      det.style.width = 'auto';
      var ancho = det.scrollWidth;
      det.style.width = '0px';
      void det.offsetWidth;
      det.style.width = ancho + 'px';
      det.classList.add('ver');
      // acompaña el crecimiento para que la tarjeta quede a la vista
      // (se repite al terminar de crecer: antes la pista aún no tiene ese largo)
      var objetivo = Math.max(0, pista.scrollLeft + et.getBoundingClientRect().left - pista.getBoundingClientRect().left - 8);
      pista.scrollTo({ left: objetivo, behavior: 'smooth' });
      setTimeout(function () {
        if (et._v !== v) return;
        det.style.width = 'auto'; avance();
        pista.scrollTo({ left: objetivo, behavior: 'smooth' });
      }, 750);
    }
    etapas.forEach(function (et) {
      function alternar(e) {
        if (recienArrastrado) return;
        // con la tarjeta abierta, solo el resumen la cierra
        if (et._abierta) {
          if (e && e.target.closest('.etapa-detalle')) return;
          return cerrar(et);
        }
        etapas.forEach(function (o) { if (o !== et && o._abierta) cerrar(o); });
        abrir(et);
      }
      et.addEventListener('click', alternar);
      et.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(null); }
      });
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
