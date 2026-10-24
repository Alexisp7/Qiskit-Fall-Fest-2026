// Página de la solución: intro dibujada y pista horizontal de las 3 etapas
// (ansatz, solver y validación); cada etapa abre su cuaderno.
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
      if (el.classList.contains('enfoque')) { e.preventDefault(); return; }
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
      if (e.pointerType !== 'mouse' || e.button !== 0 || el.classList.contains('enfoque')) return;
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

    // clic en una etapa: la pista la lleva al inicio, se queda quieta y un
    // panel blanco cubre el resto del circuito con su explicación (guardada en
    // <template id="etapa-N-detalle">). Se cierra con ×, con Esc o con otro clic
    // en la misma etapa
    var etapasCaja = document.querySelector('.etapas');
    var panel = document.querySelector('.etapa-panel');
    var pCab = panel.querySelector('.ep-cab');
    var pCuerpo = panel.querySelector('.ep-cuerpo');
    var abajo = document.querySelector('.etapa-abajo');
    var bCuerpo = abajo.querySelector('.eb-cuerpo');
    var etapas = Array.prototype.slice.call(pista.querySelectorAll('.etapa'));
    var actual = null, version = 0;

    function cerrar() {
      var v = ++version;
      if (actual) { actual.classList.remove('activa'); actual.setAttribute('aria-expanded', 'false'); }
      actual = null;
      panel.classList.remove('ver'); panel.setAttribute('aria-hidden', 'true');
      abajo.classList.remove('ver');
      setTimeout(function () {
        if (v !== version) return;
        pista.classList.remove('enfoque'); etapasCaja.classList.remove('enfocada');
        pCab.innerHTML = ''; pCuerpo.innerHTML = ''; bCuerpo.innerHTML = '';
      }, 600);
    }
    function abrir(et) {
      var v = ++version;
      if (actual) { actual.classList.remove('activa'); actual.setAttribute('aria-expanded', 'false'); }
      actual = et;
      et.classList.add('activa'); et.setAttribute('aria-expanded', 'true');
      // 1. la etapa elegida viaja al inicio y la pista deja de moverse
      pista.classList.add('enfoque'); etapasCaja.classList.add('enfocada');
      panel.classList.remove('ver');
      pista.scrollTo({ left: et.offsetLeft - 2, behavior: still ? 'auto' : 'smooth' });
      // 2. el panel blanco entra justo antes de la etapa y la explica
      panel.style.left = (et.offsetWidth + 24) + 'px';
      pCab.innerHTML = '';
      pCab.appendChild(et.querySelector('.etapa-cab').cloneNode(true));
      var titulo = document.createElement('div');
      titulo.className = 'ep-titulo';
      titulo.textContent = et.getAttribute('data-titulo');
      pCab.appendChild(titulo);
      // la primera parte va al costado; el resto, debajo (sin barras de scroll)
      pCuerpo.innerHTML = ''; bCuerpo.innerHTML = '';
      abajo.classList.remove('ver');
      var t = document.getElementById('etapa-' + et.getAttribute('data-etapa') + '-detalle');
      if (t) {
        var partes = Array.prototype.slice.call(t.content.cloneNode(true).children);
        partes.forEach(function (el, i) { (i === 0 ? pCuerpo : bCuerpo).appendChild(el); });
        var nbEl = bCuerpo.querySelector('.nb');
        if (nbEl && window.montarCuaderno) window.montarCuaderno(bCuerpo, nbEl.getAttribute('data-nb'));
      }
      setTimeout(function () {
        if (v !== version) return;
        panel.classList.add('ver'); panel.setAttribute('aria-hidden', 'false');
        if (bCuerpo.childElementCount) {
          abajo.classList.add('ver');
          // la página baja lo justo para mostrar el comienzo de lo de abajo
          setTimeout(function () {
            var r = abajo.getBoundingClientRect();
            var falta = Math.min(r.bottom, r.top + 260) - window.innerHeight + 24;
            if (falta > 0) window.scrollBy({ top: falta, behavior: still ? 'auto' : 'smooth' });
          }, 450);
        }
      }, still ? 0 : 520);
    }
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    panel.querySelector('.ep-cerrar').addEventListener('click', cerrar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && actual) cerrar(); });
  }
})();

// ── Jupyter 2.0: cada etapa abre su cuaderno. A la izquierda los bloques de
// código del cuaderno (sin cambios); a la derecha, fijo, un mismo ejemplo que va
// cambiando según el bloque en el que estemos, y lo que hace ese bloque ──
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var EXPLICA = {
    datos: { t: 'Todo el problema vive aquí: las aristas (lugar, lugar, distancia), el número de tiempos T, la penalización A y la lista de piezas activas del Hamiltoniano. Cada pieza se enciende o se apaga comentando su línea.' },
    libs: { t: 'NumPy y NetworkX para los datos, SciPy para el optimizador COBYLA y Qiskit para el circuito, el Hamiltoniano (SparsePauliOp) y el estado (Statevector).' },
    problema: { t: 'La variable x<sub>i,t</sub> vale 1 si el camión está en el lugar i en el tiempo t. Cada variable es un qubit; q() da su índice y var() hace el camino inverso.', f: ['x<sub>i,t</sub> ↦ q<sub>k</sub>, &nbsp;k = (t − 1)N + i'] },
    qubo: { t: 'Un polinomio cuadrático en variables binarias: constante, términos lineales y cuadráticos. Se puede sumar y multiplicar por números, así cada restricción es un QUBO y el total es su suma. agregar_cuadrado expande (c<sub>0</sub> + Σ a<sub>k</sub>x<sub>k</sub>)², la forma de casi todas las restricciones.', f: ['E(x) = c + Σ<sub>k</sub> a<sub>k</sub> x<sub>k</sub> + Σ<sub>k&lt;l</sub> b<sub>kl</sub> x<sub>k</sub> x<sub>l</sub>'] },
    coste: { t: 'La función de coste suma la distancia de cada salto entre tiempos seguidos. Solo entran los pares de lugares unidos por un camino; ir de i a j y de j a i cuestan lo mismo.', f: ['Q<sub>C</sub> = Σ<sub>t=1</sub><sup>T−1</sup> Σ<sub>i≠j</sub> d<sub>ij</sub> x<sub>i,t</sub> x<sub>j,t+1</sub>'] },
    basicas: { t: 'Cada pieza vale 0 cuando la regla se cumple y algo positivo cuando se rompe. exactamente_uno escribe (1 − Σx)². Un lugar en cada tiempo, cada lugar una vez y ningún salto entre lugares sin camino.', f: ['Σ<sub>t</sub> (1 − Σ<sub>i</sub> x<sub>i,t</sub>)²', 'Σ<sub>i</sub> (1 − Σ<sub>t</sub> x<sub>i,t</sub>)²', 'Σ<sub>t</sub> Σ<sub>(i,j)∉E</sub> x<sub>i,t</sub> x<sub>j,t+1</sub>'] },
    elegibles: { t: 'Piezas que se agregan según el caso: partir en s, terminar en f, cerrar una arista o visitar a antes que b. sugerir_penalizacion da un A mayor que cualquier ahorro que se consiga rompiendo una regla.', f: ['1 − x<sub>s,1</sub> &nbsp;·&nbsp; 1 − x<sub>f,T</sub>', 'Σ<sub>t</sub> x<sub>i,t</sub>x<sub>j,t+1</sub> + x<sub>j,t</sub>x<sub>i,t+1</sub> &nbsp;·&nbsp; Σ<sub>t′&lt;t</sub> x<sub>b,t′</sub>x<sub>a,t</sub>', 'A = (T − 1) · máx d + 1'] },
    armar: { t: 'Las piezas se guardan en un diccionario {nombre: (peso, QUBO)} y el Hamiltoniano es su suma ponderada: la distancia con peso 1 y cada restricción con peso A.', f: ['Q = Q<sub>C</sub> + A·Q<sub>A</sub> + A·Q<sub>B</sub> + …'] },
    ising: { t: 'Para el circuito se cambia x<sub>k</sub> = (1 − Z<sub>k</sub>)/2. Cada término lineal da un Z, cada producto un ZZ y lo constante queda como offset. Se usan índices explícitos de qubit para no confundirse con el orden de Qiskit.', f: ['x<sub>k</sub> = (1 − Z<sub>k</sub>)/2', 'H = Σ h<sub>k</sub> Z<sub>k</sub> + Σ J<sub>kl</sub> Z<sub>k</sub>Z<sub>l</sub> + offset'] },
    ansatzc: { t: 'El circuito que propone las soluciones: capas de rotaciones R<sub>Y</sub>(θ) en cada qubit, entrelazadas con compuertas CZ en cadena, y una capa final de R<sub>Y</sub>. Tiene N·T·(capas + 1) parámetros θ.', f: ['|ψ(θ)⟩ = R<sub>Y</sub>(θ) · [CZ<sub>cadena</sub> · R<sub>Y</sub>(θ)]<sup>capas</sup> |0⟩'] },
    vqe1: { t: 'El QUBO se traduce a Ising y se normaliza por su coeficiente más grande, porque eso ayuda al optimizador. Se arma el ansatz y un generador aleatorio con semilla para los puntos de partida.', f: ['Ĥ = H / máx |coef|'] },
    vqe2: { t: 'La energía que se minimiza: se asignan los θ al circuito, se simula el estado y se calcula el valor esperado del Hamiltoniano.', f: ['E(θ) = ⟨ψ(θ)| Ĥ |ψ(θ)⟩'] },
    vqe3: { t: 'COBYLA minimiza E(θ) desde varios θ iniciales al azar. Se guarda el historial de cada intento, en la escala original, y se queda con el mejor.', f: ['θ* = argmin<sub>θ</sub> E(θ)'] },
    vqe4: { t: 'Con los mejores θ se calculan las probabilidades de cada estado. Entre los más probables se elige el de menor costo QUBO y se devuelven sus bits, su energía y su probabilidad.' },
    correr: { t: 'Se corre el VQE con el Hamiltoniano armado y se muestran la ruta, la matriz x(i,t), el desglose, la convergencia y si coincide con el exacto.' },
    exacto: { t: 'Revisa los 2<sup>n</sup> estados con energias_todas y los ordena por energía. Es la referencia para saber si el VQE acertó; sirve mientras n sea pequeño.', f: ['x* = argmin<sub>x ∈ {0,1}<sup>n</sup></sub> E(x)'] },
    lectura: { t: 'Traduce los bits a la ruta: en cada tiempo, el lugar cuyo qubit vale 1. matriz_x ordena los mismos bits como lugares × tiempos.' },
    desglose: { t: 'Evalúa cada pieza con la solución: su valor, su peso y su aporte. En una ruta válida las restricciones dan 0 y todo el costo es distancia.' },
    compara: { t: 'Lista las mejores soluciones exactas y su desglose. La celda del VQE termina comparando su energía con la del exacto.' }
  };

  // ── resaltado de Python, sencillo ──
  var KW = /^(def|class|return|for|in|if|elif|else|not|and|or|None|True|False|import|from|as|lambda|while|with|is|raise|pass|yield)$/;
  var BI = /^(print|range|len|sum|min|max|abs|float|int|list|sorted|enumerate|zip|isinstance|super|self|dict|set)$/;
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function resaltar(linea, enCadena) {
    var out = '', i = 0, n = linea.length, previo = '';
    if (enCadena) {
      var fin = linea.indexOf('"""');
      if (fin < 0) return { html: '<span class="py-s">' + esc(linea) + '</span>', abierta: true };
      out += '<span class="py-s">' + esc(linea.slice(0, fin + 3)) + '</span>'; i = fin + 3;
    }
    while (i < n) {
      var c = linea[i], resto = linea.slice(i), m;
      if (c === '#') { out += '<span class="py-c">' + esc(resto) + '</span>'; break; }
      if (resto.indexOf('"""') === 0) {
        var f2 = linea.indexOf('"""', i + 3);
        if (f2 < 0) { out += '<span class="py-s">' + esc(resto) + '</span>'; return { html: out, abierta: true }; }
        out += '<span class="py-s">' + esc(linea.slice(i, f2 + 3)) + '</span>'; i = f2 + 3; continue;
      }
      if (c === '"' || c === "'") {
        var j = i + 1; while (j < n && linea[j] !== c) { if (linea[j] === '\\') j++; j++; }
        var pre = /[fr]$/.test(out.replace(/<[^>]+>/g, '')) ? '' : '';
        out += pre + '<span class="py-s">' + esc(linea.slice(i, j + 1)) + '</span>'; i = j + 1; continue;
      }
      if ((m = /^\d+(\.\d+)?(e-?\d+)?/.exec(resto)) && !/[\w]/.test(linea[i - 1] || '')) { out += '<span class="py-n">' + m[0] + '</span>'; i += m[0].length; continue; }
      if ((m = /^[A-Za-z_θ][\w]*/.exec(resto))) {
        var w = m[0];
        if (KW.test(w)) out += '<span class="py-k">' + w + '</span>';
        else if (previo === 'def' || previo === 'class') out += '<span class="py-f">' + w + '</span>';
        else if (BI.test(w)) out += '<span class="py-b">' + w + '</span>';
        else out += esc(w);
        previo = w; i += w.length; continue;
      }
      out += esc(c); if (c !== ' ') previo = ''; i++;
    }
    return { html: out, abierta: false };
  }
  function codigoHtml(src) {
    var abierta = false;
    return src.replace(/\n$/, '').split('\n').map(function (l) {
      var r = resaltar(l, abierta); abierta = r.abierta;
      return '<span class="nb-linea">' + (r.html || ' ') + '</span>';
    }).join('');
  }

  // ── el ejemplo que se arrastra: cuatro lugares, cuatro tiempos ──
  var G = { 1: [52, 58], 2: [156, 58], 3: [156, 162], 4: [52, 162] };
  var E = [[1, 2], [2, 3], [3, 4], [4, 1], [1, 3]], FALTA = [[2, 4], [4, 2]];
  var RUTA = [1, 2, 3, 4];
  var GX = 246, GY = 40, C = 42;
  function celda(i, t) { return [GX + (t - 1) * C, GY + (i - 1) * C]; }
  function centro(i, t) { var c = celda(i, t); return [c[0] + 19, c[1] + 19]; }
  function kq(i, t) { return (t - 1) * 4 + (i - 1); }
  var semilla = 7;
  function azar() { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; }

  var CAPAS = {
    datos: ['grafo'], libs: ['grafo', 'herramientas'], problema: ['grafo', 'malla', 'mapa'],
    qubo: ['grafo', 'malla', 'lin', 'matriz'], coste: ['grafo', 'malla', 'lin', 'cupC', 'matriz', 'mC'],
    basicas: ['grafo', 'malla', 'lin', 'cupC', 'llaves', 'cupR', 'matriz', 'mC', 'mB', 'mR'],
    elegibles: ['grafo', 'malla', 'lin', 'cupC', 'llaves', 'cupR', 'marcas', 'matriz', 'mC', 'mB', 'mR', 'mE'],
    armar: ['grafo', 'malla', 'matriz', 'mQ'], ising: ['grafo', 'malla', 'spins', 'matriz', 'mZ'],
    ansatzc: ['grafo', 'malla', 'spins', 'circuito'], vqe1: ['grafo', 'malla', 'spins', 'circuito', 'hchip'],
    vqe2: ['grafo', 'malla', 'circuito', 'thetas', 'medidor'], vqe3: ['grafo', 'malla', 'curvas'],
    vqe4: ['grafo', 'malla', 'histo'], correr: ['grafo', 'ruta', 'malla', 'llenas', 'histo', 'histoSel'],
    exacto: ['grafo', 'malla', 'puntos'], lectura: ['grafo', 'ruta', 'malla', 'llenas', 'bits'],
    desglose: ['grafo', 'ruta', 'malla', 'llenas', 'piezas'], compara: ['grafo', 'ruta', 'malla', 'llenas', 'comparar']
  };

  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); padre.appendChild(n); return n; }
  function tx(padre, cls, x, y, s) { var n = el('text', { 'class': cls, x: x, y: y }, padre); n.textContent = s; return n; }
  function linea(g, cls, x1, y1, x2, y2, trazo, d) {
    var at = { 'class': cls, x1: x1, y1: y1, x2: x2, y2: y2 };
    if (trazo) { at.pathLength = 1; at['class'] += ' ent-trazo'; at.style = '--d:' + (d || 0) + 's'; }
    return el('line', at, g);
  }

  var DIBUJA = {
    grafo: function (g, nuevo) {
      E.forEach(function (e, n) { linea(g, 'ej-arista', G[e[0]][0], G[e[0]][1], G[e[1]][0], G[e[1]][1], nuevo, n * .08); });
      [1, 2, 3, 4].forEach(function (k) {
        var h = el('g', nuevo ? { 'class': 'ent', style: '--d:' + (.3 + k * .06) + 's' } : {}, g);
        el('circle', { 'class': 'ej-nodo', cx: G[k][0], cy: G[k][1], r: 15 }, h);
        tx(h, 'ej-nodo-t', G[k][0], G[k][1] + 5, String(k));
      });
    },
    herramientas: function (g) {
      ['numpy', 'networkx', 'scipy', 'qiskit'].forEach(function (s, n) {
        var h = el('g', { 'class': 'ent', style: '--d:' + n * .1 + 's' }, g);
        el('rect', { 'class': 'ej-chip', x: 40 + n * 100, y: 270, width: 86, height: 26, rx: 3 }, h);
        tx(h, 'ej-chip-t', 83 + n * 100, 288, s);
      });
    },
    malla: function (g, nuevo) {
      for (var t = 1; t <= 4; t++) tx(g, 'ej-rot', GX + (t - 1) * C + 19, GY - 8, 't' + t);
      for (var i = 1; i <= 4; i++) {
        tx(g, 'ej-rot', GX - 12, GY + (i - 1) * C + 23, String(i));
        for (var t2 = 1; t2 <= 4; t2++) {
          var c = celda(i, t2), h = el('g', nuevo ? { 'class': 'ent', style: '--d:' + ((i + t2) * .04) + 's' } : {}, g);
          el('rect', { 'class': 'ej-celda', 'data-c': i + ',' + t2, x: c[0], y: c[1], width: 38, height: 38, rx: 3 }, h);
        }
      }
    },
    mapa: function (g) {
      [1, 2, 3, 4].forEach(function (k, n) {
        var p = el('path', { 'class': 'ej-mapa ent-trazo', pathLength: 1, style: '--d:' + n * .12 + 's', d: 'M' + (G[k][0] + 16) + ' ' + G[k][1] + ' C 205 ' + G[k][1] + ', 205 ' + (GY + (k - 1) * C + 19) + ', ' + (GX - 20) + ' ' + (GY + (k - 1) * C + 19) }, g);
      });
    },
    lin: function (g, nuevo) {
      semilla = 11;
      for (var i = 1; i <= 4; i++) for (var t = 1; t <= 4; t++) if (azar() < .7) {
        var c = centro(i, t); el('circle', { 'class': 'ej-lin' + (nuevo ? ' ent' : ''), cx: c[0] + 10, cy: c[1] - 10, r: 2.2, style: '--d:' + azar() * .5 + 's' }, g);
      }
    },
    cupC: function (g, nuevo) {
      var n = 0;
      for (var t = 1; t < 4; t++) E.forEach(function (e) {
        [[e[0], e[1]], [e[1], e[0]]].forEach(function (p) {
          var a = centro(p[0], t), b = centro(p[1], t + 1);
          linea(g, 'ej-cup-c', a[0] + 8, a[1], b[0] - 8, b[1], nuevo, (n++ % 10) * .05);
        });
      });
    },
    cupR: function (g, nuevo) {
      for (var t = 1; t < 4; t++) FALTA.forEach(function (p, n) {
        var a = centro(p[0], t), b = centro(p[1], t + 1);
        linea(g, 'ej-cup-r', a[0] + 8, a[1], b[0] - 8, b[1], nuevo, t * .1 + n * .05);
      });
    },
    llaves: function (g, nuevo) {
      for (var t = 1; t <= 4; t++) {
        var x = GX + (t - 1) * C, y = GY + 4 * C + 2;
        el('path', { 'class': 'ej-brk' + (nuevo ? ' ent' : ''), style: '--d:' + t * .08 + 's', d: 'M' + (x + 2) + ' ' + y + ' v5 h34 v-5' }, g);
      }
      for (var i = 1; i <= 4; i++) {
        var x2 = GX + 4 * C + 2, y2 = GY + (i - 1) * C;
        el('path', { 'class': 'ej-brk' + (nuevo ? ' ent' : ''), style: '--d:' + (.3 + i * .08) + 's', d: 'M' + x2 + ' ' + (y2 + 2) + ' h5 v34 h-5' }, g);
      }
      tx(g, 'ej-rot', GX + 2 * C, GY + 4 * C + 20, 'un lugar por tiempo');
      var r = tx(g, 'ej-rot', GX + 4 * C + 22, GY + 2 * C, 'una vez');
      r.setAttribute('transform', 'rotate(90 ' + (GX + 4 * C + 22) + ' ' + (GY + 2 * C) + ')');
    },
    marcas: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      var s = celda(1, 1), f = celda(3, 4);
      el('rect', { 'class': 'ej-marca', x: s[0] - 3, y: s[1] - 3, width: 44, height: 44, rx: 5 }, h); tx(h, 'ej-marca-t', s[0] + 19, s[1] + 23, 's');
      el('rect', { 'class': 'ej-marca', x: f[0] - 3, y: f[1] - 3, width: 44, height: 44, rx: 5 }, h); tx(h, 'ej-marca-t', f[0] + 19, f[1] + 23, 'f');
      var mx = (G[1][0] + G[3][0]) / 2, my = (G[1][1] + G[3][1]) / 2;
      el('path', { 'class': 'ej-marca', d: 'M' + (mx - 6) + ' ' + (my - 6) + ' l12 12 m0 -12 l-12 12' }, h);
      el('path', { 'class': 'ej-marca', d: 'M' + (G[2][0] + 14) + ' ' + (G[2][1] + 8) + ' Q 205 110 ' + (G[3][0] + 14) + ' ' + (G[3][1] - 8), 'marker-end': 'url(#ej-flecha-e)' }, h);
      tx(h, 'ej-marca-t', 196, 108, 'antes');
    },
    matriz: function (g, nuevo) {
      el('rect', { 'class': 'ej-m-borde' + (nuevo ? ' ent' : ''), x: 30, y: 236, width: 128, height: 128 }, g);
      tx(g, 'ej-rot', 94, 378, 'matriz Q');
    },
    mC: function (g, nuevo) { pares('c').forEach(function (p, n) { tile(g, 'ej-m-c', p[0], p[1], nuevo, n); }); },
    mB: function (g, nuevo) { pares('b').forEach(function (p, n) { tile(g, 'ej-m-b', p[0], p[1], nuevo, n); }); },
    mR: function (g, nuevo) { pares('r').forEach(function (p, n) { tile(g, 'ej-m-r', p[0], p[1], nuevo, n); }); },
    mE: function (g, nuevo) { pares('e').forEach(function (p, n) { tile(g, 'ej-m-e', p[0], p[1], nuevo, n); }); },
    mQ: function (g) {
      var todo = {}; ['b', 'c', 'r', 'e'].forEach(function (k, z) { pares(k).forEach(function (p) { todo[p[0] + ',' + p[1]] = Math.max(todo[p[0] + ',' + p[1]] || 0, [.85, .45, .7, .6][z]); }); });
      Object.keys(todo).forEach(function (s, n) {
        var p = s.split(',').map(Number), r = tile(g, 'ej-m-q', p[0], p[1], true, n % 30);
        r.setAttribute('opacity', todo[s]);
      });
    },
    mZ: function (g) {
      for (var k = 0; k < 16; k++) el('circle', { 'class': 'ej-m-q ent', cx: 30 + k * 8 + 4, cy: 236 + k * 8 + 4, r: 3.4, style: '--d:' + k * .03 + 's' }, g);
      var vistos = {}; ['b', 'c', 'r'].forEach(function (k) { pares(k).forEach(function (p) { if (p[0] !== p[1]) vistos[p[0] + ',' + p[1]] = 1; }); });
      Object.keys(vistos).forEach(function (s, n) { var p = s.split(',').map(Number); var r = el('rect', { 'class': 'ej-m-q ent', x: 30 + p[1] * 8 + 2, y: 236 + p[0] * 8 + 2, width: 4, height: 4, opacity: .55, style: '--d:' + (.3 + (n % 20) * .02) + 's' }, g); });
      tx(g, 'ej-rot', 94, 378, 'Z · ZZ');
    },
    spins: function (g, nuevo) {
      semilla = 23;
      for (var i = 1; i <= 4; i++) for (var t = 1; t <= 4; t++) {
        var c = centro(i, t), up = azar() < .5;
        el('path', { 'class': 'ej-spin' + (nuevo ? ' ent' : ''), style: '--d:' + ((i * 4 + t) * .02) + 's', d: up ? 'M' + c[0] + ' ' + (c[1] + 9) + ' V' + (c[1] - 9) + ' M' + (c[0] - 4) + ' ' + (c[1] - 4) + ' L' + c[0] + ' ' + (c[1] - 9) + ' L' + (c[0] + 4) + ' ' + (c[1] - 4) : 'M' + c[0] + ' ' + (c[1] - 9) + ' V' + (c[1] + 9) + ' M' + (c[0] - 4) + ' ' + (c[1] + 4) + ' L' + c[0] + ' ' + (c[1] + 9) + ' L' + (c[0] + 4) + ' ' + (c[1] + 4) }, g);
      }
    },
    circuito: function (g, nuevo) {
      var y0 = 238, dy = 8.2;
      for (var k = 0; k < 16; k++) linea(g, 'ej-cable', 26, y0 + k * dy, 300, y0 + k * dy, nuevo, k * .02);
      var h = el('g', nuevo ? { 'class': 'ent', style: '--d:.35s' } : {}, g);
      el('rect', { 'class': 'ej-capas', x: 44, y: y0 - 6, width: 186, height: 15 * dy + 12, rx: 3 }, h);
      for (var k2 = 0; k2 < 16; k2++) {
        el('rect', { 'class': 'ej-ry', x: 54, y: y0 + k2 * dy - 3, width: 22, height: 6 }, h);
        el('rect', { 'class': 'ej-ry', x: 250, y: y0 + k2 * dy - 3, width: 22, height: 6 }, h);
      }
      for (var k3 = 0; k3 < 15; k3++) {
        var x = 96 + k3 * 8.6;
        el('line', { 'class': 'ej-cz', x1: x, y1: y0 + k3 * dy, x2: x, y2: y0 + (k3 + 1) * dy }, h);
        el('circle', { 'class': 'ej-czp', cx: x, cy: y0 + k3 * dy, r: 1.8 }, h);
        el('circle', { 'class': 'ej-czp', cx: x, cy: y0 + (k3 + 1) * dy, r: 1.8 }, h);
      }
      tx(h, 'ej-rot', 65, y0 - 10, 'RY(θ)'); tx(h, 'ej-rot', 160, y0 - 10, 'CZ'); tx(h, 'ej-rot', 261, y0 - 10, 'RY(θ)');
    },
    hchip: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      el('rect', { 'class': 'ej-chip', x: 322, y: 268, width: 120, height: 56, rx: 4 }, h);
      tx(h, 'ej-chip-t', 382, 292, 'Ĥ = H / máx');
      tx(h, 'ej-rot', 382, 312, 'semilla · arranques');
    },
    thetas: function (g) {
      var y0 = 238, dy = 8.2;
      for (var k = 0; k < 16; k += 3) el('path', { 'class': 'ej-theta', d: 'M60 ' + (y0 + k * dy) + ' a6 6 0 0 1 10 0', style: 'animation-delay:-' + (k * .1) + 's' }, g);
    },
    medidor: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      el('path', { 'class': 'ej-medidor', d: 'M352 330 A48 48 0 0 1 448 330' }, h);
      el('line', { 'class': 'ej-aguja', x1: 400, y1: 330, x2: 400, y2: 292 }, h);
      tx(h, 'ej-chip-t', 400, 352, '⟨Ĥ⟩');
    },
    curvas: function (g) {
      el('line', { 'class': 'ej-eje', x1: 40, y1: 236, x2: 40, y2: 366 }, g);
      el('line', { 'class': 'ej-eje', x1: 40, y1: 366, x2: 430, y2: 366 }, g);
      tx(g, 'ej-rot', 235, 380, 'iteraciones');
      semilla = 5;
      var finales = [], cur = [];
      for (var c = 0; c < 6; c++) {
        var y = 246 + azar() * 30, fin = 300 + azar() * 56, d = 'M42 ' + y.toFixed(1);
        for (var x = 50; x <= 428; x += 9) { y += (fin - y) * .11 + (azar() - .5) * 8; d += ' L' + x + ' ' + y.toFixed(1); }
        finales.push(fin); cur.push(d);
      }
      var mejor = finales.indexOf(Math.max.apply(null, finales));
      cur.forEach(function (d, c) { el('path', { 'class': 'ej-curva ent-trazo' + (c === mejor ? ' mejor' : ''), pathLength: 1, d: d, style: '--d:' + c * .35 + 's' }, g); });
    },
    histo: function (g, nuevo) {
      semilla = 17;
      el('line', { 'class': 'ej-eje', x1: 36, y1: 366, x2: 434, y2: 366 }, g);
      for (var b = 0; b < 32; b++) {
        var hgt = b === 21 ? 112 : b === 9 ? 70 : 4 + azar() * azar() * 40;
        el('rect', { 'class': 'ej-barra' + (nuevo ? ' ent' : ''), 'data-b': b, x: 40 + b * 12.3, y: 366 - hgt, width: 9, height: hgt, style: '--d:' + b * .02 + 's' }, g);
      }
      tx(g, 'ej-rot', 235, 380, 'probabilidad de cada estado');
    },
    histoSel: function (g) {
      var r = g.ownerSVGElement.querySelector('[data-b="21"]'); if (r) r.setAttribute('class', 'ej-barra sel');
      var h = el('g', { 'class': 'ent' }, g);
      el('circle', { 'class': 'ej-anillo', cx: 40 + 21 * 12.3 + 4.5, cy: 246, r: 9 }, h);
    },
    puntos: function (g) {
      semilla = 31;
      var es = []; for (var p = 0; p < 64; p++) es.push(azar()); es.sort();
      el('line', { 'class': 'ej-eje', x1: 36, y1: 366, x2: 434, y2: 366 }, g);
      es.forEach(function (v, p) { el('circle', { 'class': 'ej-punto ent' + (p === 0 ? ' min' : ''), cx: 44 + p * 6.1, cy: 360 - v * 110, r: p === 0 ? 4 : 2.4, style: '--d:' + p * .015 + 's' }, g); });
      el('circle', { 'class': 'ej-anillo ent', cx: 44, cy: 360 - es[0] * 110, r: 10, style: '--d:1.1s' }, g);
      tx(g, 'ej-rot', 235, 380, 'los 2ⁿ estados, ordenados por energía');
    },
    ruta: function (g) {
      for (var n = 1; n < RUTA.length; n++) {
        var a = G[RUTA[n - 1]], b = G[RUTA[n]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
        el('line', { 'class': 'ej-ruta ent-trazo', pathLength: 1, x1: a[0] + ex / l * 18, y1: a[1] + ey / l * 18, x2: b[0] - ex / l * 20, y2: b[1] - ey / l * 20, style: '--d:' + n * .25 + 's' }, g);
      }
    },
    llenas: function (g) {
      RUTA.forEach(function (i, n) {
        var c = celda(i, n + 1), r = g.ownerSVGElement.querySelector('[data-c="' + i + ',' + (n + 1) + '"]');
        if (r) r.setAttribute('class', 'ej-celda uno');
      });
    },
    bits: function (g) {
      for (var k = 0; k < 16; k++) {
        var on = RUTA.some(function (i, n) { return kq(i, n + 1) === k; });
        el('rect', { 'class': 'ej-bit ent' + (on ? ' uno' : ''), x: 38 + k * 24, y: 290, width: 18, height: 18, style: '--d:' + k * .04 + 's' }, g);
      }
      tx(g, 'ej-rot', 235, 330, 'bits del estado → x(i,t) → ruta');
    },
    piezas: function (g) {
      [['coste', 290], ['un lugar por tiempo', 0], ['visitar una vez', 0], ['saltos prohibidos', 0]].forEach(function (p, n) {
        var y = 250 + n * 30, h = el('g', { 'class': 'ent', style: '--d:' + n * .12 + 's' }, g);
        tx(h, 'ej-rot', 90, y + 13, p[0]);
        el('rect', { 'class': 'ej-pieza' + (p[1] ? ' coste' : ''), x: 150, y: y, width: Math.max(p[1], 3), height: 16 }, h);
        if (!p[1]) el('path', { 'class': 'ej-ok', d: 'M160 ' + (y + 8) + ' l5 5 l10 -11' }, h);
      });
    },
    comparar: function (g) {
      [[60, 'exacto'], [290, 'VQE']].forEach(function (z, n) {
        var h = el('g', { 'class': 'ent', style: '--d:' + n * .2 + 's' }, g), s = .55, ox = z[0], oy = 238;
        E.forEach(function (e) { el('line', { 'class': 'ej-arista', x1: ox + G[e[0]][0] * s, y1: oy + G[e[0]][1] * s, x2: ox + G[e[1]][0] * s, y2: oy + G[e[1]][1] * s }, h); });
        for (var m = 1; m < RUTA.length; m++) el('line', { 'class': 'ej-ruta', x1: ox + G[RUTA[m - 1]][0] * s, y1: oy + G[RUTA[m - 1]][1] * s, x2: ox + G[RUTA[m]][0] * s, y2: oy + G[RUTA[m]][1] * s, 'marker-end': '' }, h);
        [1, 2, 3, 4].forEach(function (k) { el('circle', { 'class': 'ej-nodo', cx: ox + G[k][0] * s, cy: oy + G[k][1] * s, r: 8 }, h); });
        tx(h, 'ej-rot', ox + 57, 352, z[1]);
      });
      var h2 = el('g', { 'class': 'ent', style: '--d:.5s' }, g);
      tx(h2, 'ej-igual', 235, 300, '=');
      el('path', { 'class': 'ej-ok', d: 'M222 322 l8 8 l16 -18' }, h2);
    }
  };
  function pares(tipo) {
    var out = [];
    if (tipo === 'c') for (var t = 1; t < 4; t++) E.forEach(function (e) { out.push([kq(e[0], t), kq(e[1], t + 1)], [kq(e[1], t), kq(e[0], t + 1)]); });
    if (tipo === 'r') for (var t2 = 1; t2 < 4; t2++) FALTA.forEach(function (p) { out.push([kq(p[0], t2), kq(p[1], t2 + 1)]); });
    if (tipo === 'b') {
      for (var t3 = 1; t3 <= 4; t3++) for (var i = 1; i <= 4; i++) { out.push([kq(i, t3), kq(i, t3)]); for (var j = i + 1; j <= 4; j++) out.push([kq(i, t3), kq(j, t3)]); }
      for (var i2 = 1; i2 <= 4; i2++) for (var a = 1; a <= 4; a++) for (var b = a + 1; b <= 4; b++) out.push([kq(i2, a), kq(i2, b)]);
    }
    if (tipo === 'e') { out.push([kq(1, 1), kq(1, 1)], [kq(3, 4), kq(3, 4)]); for (var t4 = 1; t4 < 4; t4++) out.push([kq(1, t4), kq(3, t4 + 1)]); out.push([kq(2, 1), kq(3, 3)], [kq(2, 2), kq(3, 4)]); }
    // cada par en los dos lados de la diagonal
    var sim = []; out.forEach(function (p) { sim.push(p); if (p[0] !== p[1]) sim.push([p[1], p[0]]); });
    return sim;
  }
  function tile(g, cls, k, l, nuevo, n) {
    return el('rect', { 'class': cls + (nuevo ? ' ent' : ''), x: 30 + l * 8 + .5, y: 236 + k * 8 + .5, width: 7, height: 7, style: '--d:' + ((n || 0) % 40) * .012 + 's' }, g);
  }

  function dibujarEjemplo(svg, clave, previas) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    [['ej-flecha', 'ej-punta'], ['ej-flecha-e', 'ej-marca-t']].forEach(function (m) {
      var mk = el('marker', { id: m[0], viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': m[1] }, mk);
    });
    var capas = CAPAS[clave] || ['grafo'];
    capas.forEach(function (c) {
      var g = el('g', { 'data-capa': c }, svg);
      DIBUJA[c](g, previas.indexOf(c) < 0 && !quieto);
    });
    if (quieto) Array.prototype.forEach.call(svg.querySelectorAll('.ent, .ent-trazo'), function (n) { n.classList.remove('ent'); n.classList.remove('ent-trazo'); });
    return capas;
  }

  // ── montar el cuaderno de una etapa ──
  window.montarCuaderno = function (raiz, etapa) {
    var nb = raiz.querySelector('.nb[data-nb="' + etapa + '"]') || document.querySelector('.nb[data-nb="' + etapa + '"]');
    var celdas = (window.CELDAS || {})[etapa];
    if (!nb || !celdas || nb.childElementCount) return;
    var orden = ['ansatz', 'solver', 'validacion'], base = 0;
    for (var o = 0; o < orden.indexOf(etapa); o++) base += (window.CELDAS[orden[o]] || []).length;
    var col = document.createElement('div'); col.className = 'nb-celdas';
    celdas.forEach(function (c, n) {
      var ex = EXPLICA[c.id] || { t: '' };
      var art = document.createElement('article');
      art.className = 'nb-celda' + (c.clave ? ' clave' : '');
      art.setAttribute('data-celda', c.id);
      art.id = 'celda-' + c.id;
      art.innerHTML = '<div class="nb-cab"><span class="nb-in">In [' + (base + n + 1) + ']:</span><span class="nb-tit">' + c.titulo + '</span>' +
        (c.clave ? '<span class="nb-clave">clave</span>' : '') + '<button type="button" class="nb-copiar">copiar</button></div>' +
        '<pre class="nb-codigo"><code>' + codigoHtml(c.codigo) + '</code></pre>' +
        '<div class="nb-texto-movil">' + ex.t + '</div>';
      art.querySelector('.nb-copiar').addEventListener('click', function (ev) {
        ev.stopPropagation();
        var b = ev.currentTarget;
        (navigator.clipboard ? navigator.clipboard.writeText(c.codigo) : Promise.reject()).then(function () { b.textContent = 'copiado'; }, function () { b.textContent = 'no se pudo'; });
        setTimeout(function () { b.textContent = 'copiar'; }, 1400);
      });
      art.querySelector('.nb-cab').addEventListener('click', function () { activar(c.id, true); });
      col.appendChild(art);
    });
    var lado = document.createElement('aside'); lado.className = 'nb-lado';
    lado.innerHTML = '<div class="nb-ej-cab"><span class="nb-ej-rot">El mismo ejemplo, en este bloque</span><span class="nb-ej-paso"></span></div>' +
      '<svg class="nb-ej" viewBox="0 0 460 390" role="img" aria-label="Ejemplo que evoluciona con cada bloque del código"></svg>' +
      '<div class="nb-exp"></div>';
    nb.appendChild(col); nb.appendChild(lado);
    var svg = lado.querySelector('.nb-ej'), exp = lado.querySelector('.nb-exp'), paso = lado.querySelector('.nb-ej-paso');
    var previas = [], actual = null, fijo = 0;   // fijo: mientras se viaja a una celda elegida
    // el índice del costado lleva a cada bloque
    var indice = document.querySelector('.sol-indice[data-indice="' + etapa + '"]');
    if (indice) {
      indice.innerHTML = '';
      celdas.forEach(function (c) {
        var li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.textContent = c.titulo; b.setAttribute('data-ir', c.id); if (c.clave) b.className = 'clave';
        b.addEventListener('click', function () { activar(c.id, true); });
        li.appendChild(b); indice.appendChild(li);
      });
    }
    function activar(id, ir) {
      if (id === actual && !ir) return;
      var c = celdas.filter(function (x) { return x.id === id; })[0]; if (!c) return;
      if (id !== actual) {
        actual = id;
        Array.prototype.forEach.call(col.children, function (a) { a.classList.toggle('activa', a.getAttribute('data-celda') === id); });
        if (indice) Array.prototype.forEach.call(indice.querySelectorAll('button'), function (b) { b.classList.toggle('activa', b.getAttribute('data-ir') === id); });
        previas = dibujarEjemplo(svg, id, previas);
        var ex = EXPLICA[id] || { t: '' };
        exp.classList.remove('cambia'); void exp.offsetWidth; exp.classList.add('cambia');
        exp.innerHTML = '<h4 class="nb-exp-tit">' + c.titulo + '</h4><p class="nb-exp-txt">' + ex.t + '</p>' + (ex.f || []).map(function (f) { return '<div class="nb-exp-f">' + f + '</div>'; }).join('');
        paso.textContent = (celdas.indexOf(c) + 1) + ' / ' + celdas.length;
      }
      if (ir) {
        fijo = Date.now() + 1100;
        var art = document.getElementById('celda-' + id);
        if (art) art.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' });
      }
    }
    // al recorrer las celdas, la del centro de la pantalla es la activa
    function revisar() {
      if (Date.now() < fijo) return;
      var mejor = null, dist = Infinity, medio = window.innerHeight * .45;
      Array.prototype.forEach.call(col.children, function (a) {
        var r = a.getBoundingClientRect();
        if (r.bottom < 80 || r.top > window.innerHeight) return;
        var d = Math.abs((r.top + Math.min(r.height, 260) / 2) - medio);
        if (d < dist) { dist = d; mejor = a; }
      });
      if (mejor) activar(mejor.getAttribute('data-celda'), false);
    }
    var pend = false;
    window.addEventListener('scroll', function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; if (nb.isConnected) revisar(); }); }, { passive: true });
    activar(celdas[0].id, false);
  };
})();
