// Página del repositorio: intro dibujada y pista horizontal de las 4 etapas.
(function () {
  // ── intro: negro → el circuito se dibuja (blanco y dorado) → textos ──
  var raizHtml = document.documentElement;
  if (raizHtml.classList.contains('rp-intro')) {
    var INICIO = 500, DUR = 2800, MENU = 3400, FIN = 4600;
    var ver = function (el, ms) { if (el) setTimeout(function () { el.classList.add('ver'); }, ms); };
    ver(document.querySelector('.repo-cabecera'), 200);
    var tarjetas = Array.prototype.slice.call(document.querySelectorAll('.etapa'));
    var circuito = document.querySelector('.circuito-completo');
    var pistaIntro = document.querySelector('.etapas-pista');
    if (circuito && tarjetas.length) {
      var total = circuito.viewBox.baseVal.width;
      // el trazo avanza a velocidad constante a lo largo de todo el circuito
      var cuando = function (x) { return INICIO + Math.max(0, x) / total * DUR; };
      var cuanto = function (ancho) { return Math.max(120, ancho / total * DUR); };
      Array.prototype.forEach.call(circuito.querySelectorAll('*'), function (el) {
        if (el.tagName === 'tspan') return;
        var b;
        try { b = el.getBBox(); } catch (e) { return; }
        var guion = getComputedStyle(el).strokeDasharray;
        if (el.tagName === 'text' || (guion && guion !== 'none')) {
          // textos y trazos ya punteados (ansatz, realimentación) aparecen al paso
          el.classList.add('fad');
        } else {
          el.setAttribute('pathLength', '1');
          el.classList.add('dib');
          // los cables largos van al ritmo del trazo; las figuras, a su ritmo
          el.style.setProperty('--dur', (b.width > 60 && b.height < 6 ? cuanto(b.width) : 450) + 'ms');
        }
        el.style.setProperty('--del', cuando(b.x) + 'ms');
      });
      // número, título y pregunta, cuando el trazo va por la mitad de su etapa
      tarjetas.forEach(function (t) { ver(t, cuando(t.offsetLeft - tarjetas[0].offsetLeft + t.offsetWidth * 0.5)); });

      // la pista acompaña al trazo hasta el final del circuito (si la persona
      // la mueve a mano, deja de seguirlo)
      var sigue = true;
      ['wheel', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
        pistaIntro.addEventListener(ev, function () { sigue = false; }, { passive: true });
      });
      var t0 = performance.now();
      (function acompana(now) {
        if (!sigue) return;
        var p = Math.min(1, Math.max(0, (now - t0 - INICIO) / DUR));
        var max = pistaIntro.scrollWidth - pistaIntro.clientWidth;
        pistaIntro.scrollLeft = Math.max(0, Math.min(max, p * total - pistaIntro.clientWidth * 0.62));
        if (p < 1) requestAnimationFrame(acompana);
      })(t0);
    }
    ver(document.querySelector('.header'), MENU);
    setTimeout(function () { raizHtml.classList.remove('rp-intro'); }, FIN);
  }

  // franjas que solo se mueven en el eje x: arrastrando, con la rueda o con
  // las flechas del teclado. Devuelve una función que dice si el último
  // gesto fue un arrastre (para no tomarlo como clic)
  function soloEnX(el, barra) {
    var avance = function () {
      if (!barra) return;
      var max = el.scrollWidth - el.clientWidth;
      barra.style.width = (max > 0 ? el.scrollLeft / max * 100 : 100) + '%';
    };
    el.addEventListener('scroll', avance, { passive: true });
    window.addEventListener('resize', avance);
    avance();
    // la rueda vertical se convierte en desplazamiento horizontal; si la franja
    // no tiene a dónde moverse, la rueda sigue bajando la página
    el.addEventListener('wheel', function (e) {
      var d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (e.deltaMode === 1) d *= 32;
      var max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || (d < 0 && el.scrollLeft <= 0 && !e.deltaX) || (d > 0 && el.scrollLeft >= max - 1 && !e.deltaX)) return;
      el.scrollLeft += d;
      e.preventDefault();
    }, { passive: false });
    // arrastrar con el mouse (en pantallas táctiles el desplazamiento es nativo)
    var ini = null, recien = false;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      ini = { x: e.clientX, s: el.scrollLeft, movio: false };
    });
    window.addEventListener('pointermove', function (e) {
      if (!ini) return;
      var dx = e.clientX - ini.x;
      if (!ini.movio && Math.abs(dx) > 4) { ini.movio = true; el.classList.add('arrastrando'); }
      if (ini.movio) el.scrollLeft = ini.s - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!ini) return;
      // el clic que sigue a un arrastre no cuenta
      if (ini.movio) { recien = true; setTimeout(function () { recien = false; }, 0); }
      ini = null; el.classList.remove('arrastrando');
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        el.scrollBy({ left: e.key === 'ArrowRight' ? 240 : -240, behavior: 'smooth' });
        e.preventDefault();
      }
    });
    return function () { return recien; };
  }

  var pista = document.querySelector('.etapas-pista');
  if (pista) {
    var arrastro = soloEnX(pista, document.querySelector('.pista-progreso span'));

    // clic en una etapa: su detalle (guardado en <template id="etapa-N-detalle">)
    // se abre en la sección de abajo; otro clic en la misma etapa la cierra
    var seccion = document.querySelector('.etapa-abierta');
    var cab = seccion.querySelector('.ea-cab');
    var columnas = seccion.querySelector('.ea-columnas');
    soloEnX(columnas, null);
    var etapas = Array.prototype.slice.call(pista.querySelectorAll('.etapa'));
    var actual = null, version = 0;

    function cerrar() {
      var v = ++version;
      if (actual) { actual.classList.remove('activa'); actual.setAttribute('aria-expanded', 'false'); }
      actual = null;
      seccion.classList.remove('abierta');
      setTimeout(function () { if (v === version) { columnas.innerHTML = ''; cab.innerHTML = ''; } }, 500);
    }
    function abrir(et) {
      ++version;
      if (actual) { actual.classList.remove('activa'); actual.setAttribute('aria-expanded', 'false'); }
      actual = et;
      et.classList.add('activa'); et.setAttribute('aria-expanded', 'true');
      var n = et.getAttribute('data-etapa');
      var t = document.getElementById('etapa-' + n + '-detalle');
      cab.innerHTML = '';
      cab.appendChild(et.querySelector('.etapa-cab').cloneNode(true));
      var titulo = document.createElement('div');
      titulo.className = 'ea-titulo';
      // el título completo de la etapa solo aparece en el detalle desplegado
      titulo.textContent = et.getAttribute('data-titulo');
      cab.appendChild(titulo);
      columnas.innerHTML = '';
      if (t) columnas.appendChild(t.content.cloneNode(true));
      columnas.scrollLeft = 0;
      // reinicia la entrada del contenido aunque ya estuviera abierta
      seccion.classList.remove('cambia'); void seccion.offsetWidth; seccion.classList.add('cambia');
      seccion.classList.add('abierta');
      // la página baja suave hasta que el detalle quede a la vista
      setTimeout(function () {
        var r = seccion.getBoundingClientRect();
        if (r.bottom > window.innerHeight) window.scrollBy({ top: r.bottom - window.innerHeight + 24, behavior: 'smooth' });
      }, 420);
    }
    etapas.forEach(function (et) {
      function alternar() {
        if (arrastro()) return;
        if (actual === et) cerrar(); else abrir(et);
      }
      et.addEventListener('click', alternar);
      et.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(); }
      });
    });
    var x = seccion.querySelector('.ea-cerrar');
    if (x) x.addEventListener('click', cerrar);
  }
})();
