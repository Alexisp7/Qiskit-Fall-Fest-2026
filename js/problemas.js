// Ejemplos rápidos de trayectoria mínima. Cada uno recorre las mismas cuatro
// partes (distancias · ruta · coste · resumen) con la función de coste
//   Q_C = B Σ_ij d_ij Σ_{t=1}^{T−1} x_{i,t} x_{j,t+1}
// Ejemplo 1: 3 ubicaciones (A=1, B=2, C=3), T = 3 pasos, ruta abierta.
// Ejemplo 2: 5 ubicaciones, T elegible y ruta cerrada (en t = T se vuelve al inicio).
// Modo manual: cada toque en un nodo es el siguiente paso t; se anota en la
// matriz x_{i,t} y la suma se recalcula. También se puede elegir una ruta
// completa en el desplegable.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function usd(v) { return '$' + Math.round(v * 100) / 100; }   // B es el costo en $ por unidad de movida

  var CONFIG = {
    1: { L: ['A', 'B', 'C'], D: { AB: 5, BC: 7, AC: 9 }, T: 3, cerrada: false, R: 24 },
    // ciudades de referencia: A(1,4) B(5,6) C(9,4) D(7,0) E(2,0); distancias redondeadas
    2: {
      L: ['A', 'B', 'C', 'D', 'E'], T: 6, cerrada: true, R: 19, compacto: true, ordenar: true,
      D: { AB: 4, AC: 8, AD: 7, AE: 4, BC: 4, BD: 6, BE: 7, CD: 4, CE: 8, DE: 5 },
      base: { A: [1, -4], B: [5, -6], C: [9, -4], D: [7, 0], E: [2, 0] }
    }
  };

  Array.prototype.forEach.call(document.querySelectorAll('.tm[data-ejemplo]'), function (raiz) {
    var cfg = CONFIG[raiz.getAttribute('data-ejemplo')];
    if (cfg) ejemplo(raiz, cfg, raiz.getAttribute('data-ejemplo'));
  });

  function ejemplo(raiz, cfg, id) {
    function $(n) { return raiz.querySelector('[data-tm="' + n + '"]'); }
    var svg = $('grafo');
    var L = cfg.L, N = L.length;
    var IDX = {}; L.forEach(function (k, i) { IDX[k] = i + 1; });
    var D = {}; for (var kd in cfg.D) D[kd] = cfg.D[kd];
    var T = cfg.T, R = cfg.R;
    var POS = null;                // posiciones actuales de los nodos (se animan)
    var PARES = [];                // todas las aristas del grafo completo
    for (var a1 = 0; a1 < N; a1++) for (var b1 = a1 + 1; b1 < N; b1++) PARES.push([L[a1], L[b1]]);

    function d(a, b) { return a === b ? 0 : (D[a + b] != null ? D[a + b] : D[b + a]); }
    function el(tag, attrs, padre) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      (padre || svg).appendChild(n);
      return n;
    }
    function valorB() { return Number($('b').value) || 0; }

    // ── rutas: órdenes de T ubicaciones (abierta) o de T−1 que vuelven al inicio (cerrada) ──
    var RUTAS = [];
    function coste(r) { var c = 0; for (var i = 1; i < r.length; i++) c += d(r[i - 1], r[i]); return c; }
    function generar() {
      var largo = cfg.cerrada ? T - 1 : T, out = [];
      (function rec(pref) {
        if (pref.length === largo) { out.push(cfg.cerrada ? pref.concat(pref[0]) : pref.slice()); return; }
        L.forEach(function (k) { if (pref.indexOf(k) < 0) rec(pref.concat(k)); });
      })([]);
      RUTAS = out;
      ordenar();
    }
    function ordenar() {
      if (!cfg.ordenar) return;
      RUTAS.sort(function (p, q) { return coste(p) - coste(q) || (p.join() < q.join() ? -1 : 1); });
    }
    var ruta = [];                 // la ruta actual: puede estar a medias en modo manual
    var paso = 1;                  // 1 distancias · 2 ruta · 3 coste · 4 resumen
    var nuevo = null;              // la última x_{i,t} anotada, para resaltarla
    function indiceRuta() {
      if (ruta.length < T) return -1;
      for (var n = 0; n < RUTAS.length; n++) if (RUTAS[n].join() === ruta.join()) return n;
      return -1;
    }

    // ── modo manual: tocar un nodo es avanzar un paso ──
    function tocar(k) {
      var ult = ruta[ruta.length - 1];
      if (ruta.length === T) ruta = [k];                    // ruta completa: empieza otra
      else if (k === ult) { ruta.pop(); nuevo = null; pintar(); return; }   // deshacer el último paso
      else if (cfg.cerrada && ruta.length === T - 1) {      // último paso: volver al inicio
        if (k !== ruta[0]) { aviso('En t = ' + T + ' hay que volver a ' + ruta[0] + '.'); return; }
        ruta.push(k);
      }
      else if (ruta.indexOf(k) >= 0) { aviso('Ya pasaste por ' + k + ' en t = ' + (ruta.indexOf(k) + 1) + '.'); return; }
      else ruta.push(k);
      nuevo = [IDX[k], ruta.length];
      pintar();
    }

    // ── forma del grafo según las distancias ──
    // Los lados siguen a d_ij de forma algo suavizada (potencia 0.8), así un cambio
    // estira o encoge el dibujo sin deformarlo al extremo.
    var CAJA = { w: 300, h: 200, m: R + 12 };
    function e(v) { return Math.pow(Math.max(Number(v) || 0, 0.5), 0.8); }
    // 3 ubicaciones: el triángulo exacto (si una distancia no cumple la desigualdad
    // triangular se recorta para que el dibujo exista)
    function triangulo() {
      var c = e(D.AB), a = e(D.BC), b = e(D.AC), h = 0.94;
      if (b > h * (a + c)) b = h * (a + c);
      if (a > h * (b + c)) a = h * (b + c);
      if (c > h * (a + b)) c = h * (a + b);
      var cx = (b * b + c * c - a * a) / (2 * c);
      return { A: [0, 0], B: [c, 0], C: [cx, Math.sqrt(Math.max(b * b - cx * cx, 0))] };
    }
    // más ubicaciones: escalamiento multidimensional (SMACOF), que parte de la forma
    // anterior para que el dibujo cambie con suavidad
    var previa = null;
    function plano() {
      var Z = L.map(function (k) { return (previa || cfg.base)[k].slice(); });
      var mx0 = 0, my0 = 0;
      Z.forEach(function (z) { mx0 += z[0] / N; my0 += z[1] / N; });
      Z = Z.map(function (z) { return [z[0] - mx0, z[1] - my0]; });   // centrada
      var del = L.map(function (a) { return L.map(function (b) { return a === b ? 0 : e(d(a, b)); }); });
      for (var it = 0; it < 250; it++) {
        Z = Z.map(function (zi, i) {
          var x = 0, y = 0;
          Z.forEach(function (zj, j) {
            if (i === j) return;
            var dx = zi[0] - zj[0], dy = zi[1] - zj[1], dist = Math.hypot(dx, dy) || 1e-6;
            x += del[i][j] * dx / dist; y += del[i][j] * dy / dist;   // transformada de Guttman
          });
          return [x / N, y / N];
        });
      }
      var o = {}; L.forEach(function (k, i) { o[k] = Z[i]; });
      previa = o;
      return o;
    }
    function forma() { return N === 3 ? triangulo() : plano(); }
    function girar(f, ang) {
      var co = Math.cos(ang), si = Math.sin(ang), o = {};
      L.forEach(function (k) { o[k] = [f[k][0] * co - f[k][1] * si, f[k][0] * si + f[k][1] * co]; });
      return o;
    }
    function limites(f) {
      var xs = L.map(function (k) { return f[k][0]; }), ys = L.map(function (k) { return f[k][1]; });
      return { x0: Math.min.apply(null, xs), y0: Math.min.apply(null, ys), w: Math.max.apply(null, xs) - Math.min.apply(null, xs), h: Math.max.apply(null, ys) - Math.min.apply(null, ys) };
    }
    function ajuste(f) { var b = limites(f); return Math.min((CAJA.w - 2 * CAJA.m) / Math.max(b.w, 1e-6), (CAJA.h - 2 * CAJA.m) / Math.max(b.h, 1e-6)); }
    // el giro (solo en el triángulo) y la escala de referencia salen de las distancias
    // iniciales: con valores mayores el dibujo crece hasta llenar el recuadro, con menores se encoge
    var GIRO = 0, REF = 0;
    (function () {
      var f0 = forma();
      if (N === 3) {
        for (var g = 0; g < 360; g += 2) {
          var s0 = ajuste(girar(f0, g * Math.PI / 180));
          if (s0 > REF) { REF = s0; GIRO = g * Math.PI / 180; }
        }
        REF *= 0.82;
      } else REF = ajuste(f0) * 0.94;
    })();
    function objetivo() {
      var f = girar(forma(), GIRO), b = limites(f), s = Math.min(ajuste(f), REF);
      // que los nodos nunca se toquen
      var lmin = Infinity;
      PARES.forEach(function (p) { lmin = Math.min(lmin, Math.hypot(f[p[0]][0] - f[p[1]][0], f[p[0]][1] - f[p[1]][1])); });
      s = Math.min(Math.max(s, (3.5 * R) / Math.max(lmin, 1e-6)), ajuste(f));
      var ox = (CAJA.w - b.w * s) / 2 - b.x0 * s, oy = (CAJA.h - b.h * s) / 2 - b.y0 * s, o = {};
      L.forEach(function (k) { o[k] = [f[k][0] * s + ox, f[k][1] * s + oy]; });
      return o;
    }
    // al cambiar una distancia los nodos se deslizan a su nueva posición
    var animG = 0, finG = 0;
    function moverGrafo() {
      var dest = objetivo();
      var igual = POS && L.every(function (k) { return Math.abs(POS[k][0] - dest[k][0]) < 0.5 && Math.abs(POS[k][1] - dest[k][1]) < 0.5; });
      cancelAnimationFrame(animG); clearTimeout(finG);
      if (!POS || igual || quieto) { POS = dest; grafo(); return; }
      var ini = POS, t0 = performance.now();
      function cuadro(ahora) {
        var k = Math.min(1, (ahora - t0) / 420), ez = 1 - Math.pow(1 - k, 3), o = {};
        L.forEach(function (n) { o[n] = [ini[n][0] + (dest[n][0] - ini[n][0]) * ez, ini[n][1] + (dest[n][1] - ini[n][1]) * ez]; });
        POS = o; grafo();
        if (k < 1) animG = requestAnimationFrame(cuadro);
      }
      animG = requestAnimationFrame(cuadro);
      finG = setTimeout(function () { cancelAnimationFrame(animG); POS = dest; grafo(); }, 520);   // por si la pestaña no anima
    }

    // ── grafo dirigido ──
    function grafo() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var r = paso === 1 ? [] : ruta;   // en el paso 1 solo se ven las distancias
      svg.classList.toggle('quieto', paso === 1);
      var defs = el('defs', {});
      var m = el('marker', { id: 'tm-flecha-' + id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'tm-punta' }, m);
      var tramos = [];
      for (var i = 1; i < r.length; i++) tramos.push([r[i - 1], r[i]]);
      var enRuta = {};
      var cen = [0, 0];
      L.forEach(function (k) { cen[0] += POS[k][0] / N; cen[1] += POS[k][1] / N; });
      tramos.forEach(function (tr) { enRuta[tr.slice().sort().join('')] = true; });
      PARES.forEach(function (p) {
        var a = POS[p[0]], b = POS[p[1]], k = p.join('');
        if (enRuta[k]) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
        else el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      });
      PARES.forEach(function (p) {
        var a = POS[p[0]], b = POS[p[1]];
        var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
        // cada peso por fuera: del lado opuesto al centro (con más nodos, sobre la arista)
        var nx = ey / l, ny = -ex / l, off = N === 3 ? 16 : 0;
        if ((mx - cen[0]) * nx + (my - cen[1]) * ny < 0) { nx = -nx; ny = -ny; }
        el('text', { 'class': 'tm-peso', x: mx + nx * off, y: my + ny * off + (N === 3 ? 6 : 4) }).textContent = d(p[0], p[1]);
      });
      tramos.forEach(function (tr) {
        var a = POS[tr[0]], b = POS[tr[1]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey), R0 = R + 3;
        el('line', { 'class': 'tm-dir', x1: a[0] + ex / l * R0, y1: a[1] + ey / l * R0, x2: b[0] - ex / l * (R0 + 2), y2: b[1] - ey / l * (R0 + 2), 'marker-end': 'url(#tm-flecha-' + id + ')' });
      });
      // ruta completa: un aviso gris que parpadea invita a empezar otra
      if (paso !== 1 && r.length === T) {
        // en la esquina más alejada de los nodos
        var mejor = null;
        [[2, 14, 'start'], [298, 14, 'end'], [2, 184, 'start'], [298, 184, 'end']].forEach(function (q) {
          var dmin = Math.min.apply(null, L.map(function (k) { return Math.hypot(POS[k][0] - (q[2] === 'end' ? q[0] - 40 : q[0] + 40), POS[k][1] - q[1]); }));
          if (!mejor || dmin > mejor.d) mejor = { q: q, d: dmin };
        });
        var q = mejor.q;
        el('text', { 'class': 'tm-otra', x: q[0], y: q[1], 'text-anchor': q[2] }).textContent = 'toca un nodo';
        el('text', { 'class': 'tm-otra', x: q[0], y: q[1] + 14, 'text-anchor': q[2] }).textContent = 'para empezar otra';
      }
      var aqui = r.length < T ? r[r.length - 1] : null;
      var meta = cfg.cerrada && paso !== 1 && r.length === T - 1 ? r[0] : null;   // a dónde hay que volver
      L.forEach(function (k, n) {
        var p = POS[k], pts = [];   // pasos en que se visita (vacío si aún no)
        r.forEach(function (rk, t) { if (rk === k) pts.push(t + 1); });
        var g = el('g', { 'class': 'tm-nodo-g' + (pts.length ? ' visitado' : ''), tabindex: '0', role: 'button', 'aria-label': 'Ir a ' + k });
        // "estás aquí": el último nodo de una ruta a medias lleva un anillo que late
        if (k === aqui) el('circle', { 'class': 'tm-aqui', cx: p[0], cy: p[1], r: R }, g);
        if (k === meta) el('circle', { 'class': 'tm-meta', cx: p[0], cy: p[1], r: R + 5 }, g);
        el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: R }, g);
        // dentro, la letra de la ubicación
        el('text', { 'class': 'tm-letra-dentro', x: p[0], y: p[1] + 7 }, g).textContent = k;
        // afuera, su variable x_{i,t}, del lado opuesto al centro; la t se vuelve número
        // cuando el camión pasa por ahí (en la ruta cerrada el inicio lleva t = 1 y t = T)
        var vx = p[0] - cen[0], vy = p[1] - cen[1], vl = Math.hypot(vx, vy) || 1, dist = R + 18 + (pts.length > 1 ? 8 : 0);
        var lx = Math.min(278, Math.max(22, p[0] + vx / vl * dist)), ly = Math.min(194, Math.max(14, p[1] + vy / vl * (R + 16) + 4));
        var t = el('text', { 'class': 'tm-xit tm-xit-fuera', x: lx, y: ly }, g);
        (pts.length ? pts : [0]).forEach(function (pt, z) {
          if (z) t.appendChild(document.createTextNode(' ·'));
          el('tspan', {}, t).textContent = (z ? ' ' : '') + 'x';
          var sb = el('tspan', { 'class': 'tm-xit-sub', dy: '4' }, t);
          sb.appendChild(document.createTextNode((n + 1) + ','));
          if (pt) sb.appendChild(document.createTextNode(String(pt)));
          else el('tspan', { 'class': 'tm-xit-t' }, sb).textContent = 't';
          el('tspan', { dy: '-4' }, t).textContent = '';
        });
        if (paso === 1) return;
        g.addEventListener('click', function () { tocar(k); });
        g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
      });
    }

    // ── contador de t ──
    var cont = $('contador');
    var avisoT = 0;
    function contador() {
      var n = ruta.length, puntos = '';
      for (var t = 1; t <= T; t++) puntos += '<span class="tm-c-punto' + (t <= n ? ' lleno' : '') + (t === n ? ' actual' : '') + '"></span>';
      var txt = n === 0 ? 'Toca el nodo donde empieza el camión'
        : n === T ? 'Ruta completa en t = ' + T
        : cfg.cerrada && n === T - 1 ? 'En t = ' + n + ' estás en <b>' + ruta[n - 1] + '</b> · vuelve a <b>' + ruta[0] + '</b> para cerrar'
        : 'En t = ' + n + ' estás en <b>' + ruta[n - 1] + '</b> · toca la siguiente ubicación';
      cont.innerHTML = '<span class="tm-c-t">t = ' + n + '<span class="tm-c-de"> / ' + T + '</span></span><span class="tm-c-puntos">' + puntos + '</span><span class="tm-c-txt">' + txt + '</span>';
    }
    function aviso(txt) {
      var e2 = cont.querySelector('.tm-c-txt');
      e2.textContent = txt; e2.classList.add('error');
      clearTimeout(avisoT); avisoT = setTimeout(contador, 1600);
    }

    // ── rutas: un solo desplegable con todas las opciones ──
    var lista = $('rutas');
    var selector = $('select'), selBtn = $('sel-btn');
    function rutas() {
      var min = Math.min.apply(null, RUTAS.map(coste)), elegida = indiceRuta();
      var B = valorB();
      function fila(r, n) {
        var c = coste(r);
        return '<span class="tm-r-n">Q' + sub('C') + '<sup>' + (n + 1) + '</sup></span>' +
          '<span class="tm-r-camino">' + r.join(' → ') + '</span>' +
          '<span class="tm-r-coste">' + usd(B * c) + '</span>' + (c === min ? '<span class="tm-r-min">mínima</span>' : '');
      }
      selBtn.innerHTML = (elegida >= 0 ? fila(RUTAS[elegida], elegida) : '<span class="tm-sel-vacio">Elige una ruta</span>') + '<i class="tm-sel-chev" aria-hidden="true"></i>';
      var nr = $('nrutas');
      if (nr) nr.textContent = '· ' + RUTAS.length + ' opciones';
      lista.innerHTML = '';
      RUTAS.forEach(function (r, n) {
        var li = document.createElement('li');
        li.className = 'tm-ruta' + (n === elegida ? ' elegida' : '') + (coste(r) === min ? ' minima' : '');
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', n === elegida ? 'true' : 'false');
        li.innerHTML = '<button type="button">' + fila(r, n) + '</button>';
        li.querySelector('button').addEventListener('click', function () { ruta = r.slice(); nuevo = null; abrir(false); pintar(); });
        lista.appendChild(li);
      });
    }
    function abrir(si) {
      selector.classList.toggle('abierto', si);
      selBtn.setAttribute('aria-expanded', si ? 'true' : 'false');
      if (si) { var e3 = lista.querySelector('.elegida'); if (e3) lista.scrollTop = e3.offsetTop - 40; }
    }
    selBtn.addEventListener('click', function () { abrir(!selector.classList.contains('abierto')); });
    document.addEventListener('click', function (ev) { if (!selector.contains(ev.target)) abrir(false); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') abrir(false); });

    // ── Q_C expandida y matriz x_{i,t} ──
    var outQ = $('q');
    var outT = $('terminos');
    var tabla = $('tabla');
    function detalle() {
      var r = ruta, B = valorB(), n = indiceRuta();
      function x(i, t) { return r[t - 1] === L[i - 1] ? 1 : 0; }
      function xs(i, t) { return 'x' + sub(i + ',' + t); }
      function xv(i, t) { var v = x(i, t); return '<span class="tm-x' + (v ? '' : ' cero') + '"><span class="tm-x-val' + (v ? ' uno' : '') + '">' + v + '</span><span class="tm-x-glifo">' + xs(i, t) + '</span></span>'; }
      var pares = [], vals = [];
      for (var k = 1; k < r.length; k++) { pares.push('d' + sub('' + IDX[r[k - 1]] + IDX[r[k]])); vals.push(d(r[k - 1], r[k])); }
      var total = B * vals.reduce(function (s, v) { return s + v; }, 0);
      var abre = B === 1 ? '' : usd(B) + ' (', cierra = B === 1 ? '' : ')';
      var nombre = 'Q' + sub('C') + (n >= 0 ? '<sup>' + (n + 1) + '</sup>' : '');
      outQ.innerHTML = '<span class="tm-q-nom">' + nombre + '</span> = B <span class="tm-sigma chica"><sup>' + N + '</sup>Σ<sub>i,j</sub></span> d' + sub('ij') +
        ' <span class="tm-sigma chica"><sup>' + (T - 1) + '</sup>Σ<sub>t=1</sub></span> x' + sub('i,t') + ' x' + sub('j,t+1') + '<span class="tm-q-res">' +
        (pares.length ? ' = ' + abre + pares.join(' + ') + cierra : '') +
        (pares.length > 1 || (pares.length && B !== 1) ? ' = ' + abre + vals.join(' + ') + cierra : '') +
        ' = <span class="tm-circulo">' + usd(total) + '</span>' + (r.length < T ? ' <span class="tm-parcial">parcial</span>' : '') + '</span>';
      var html = '';
      if (cfg.compacto) {
        // con muchas ubicaciones: en cada t solo la fila i con x_{i,t} = 1 sobrevive;
        // se escriben sus N términos y se tachan los que se anulan
        for (var t = 1; t < T; t++) {
          var i0 = r[t - 1] ? IDX[r[t - 1]] : 0;
          if (!i0) break;
          var terms = [];
          for (var j = 1; j <= N; j++) {
            var on = x(j, t + 1) === 1;
            terms.push('<span class="tm-term' + (on ? ' on' : '') + '" data-v="' + d(L[i0 - 1], L[j - 1]) + '"><span class="tm-d' + (on ? ' on' : '') + '">d' + sub('' + i0 + j) + '</span>(' + xv(i0, t) + xv(j, t + 1) + ')</span>');
          }
          html += '<div class="tm-par tm-fila-t"><span class="tm-t-rot">t = ' + t + '</span>' + terms.join('<span class="tm-mas">+</span>') + '</div>';
        }
        if (!html) html = '<p class="tm-t-pista">Elige la ruta para ver los términos.</p>';
        else html = '<p class="tm-t-pista">En cada t solo queda la fila <i>i</i> con x' + sub('i,t') + ' = 1; las demás valen 0.</p>' + html;
      } else {
        for (var j2 = 1; j2 <= N; j2++) for (var i2 = 1; i2 <= N; i2++) {
          var terms2 = [], vivo = false;
          for (var t2 = 1; t2 < T; t2++) {
            var on2 = x(i2, t2) === 1 && x(j2, t2 + 1) === 1;
            if (on2) vivo = true;
            terms2.push('<span class="tm-term' + (on2 ? ' on' : '') + '">' + xv(i2, t2) + xv(j2, t2 + 1) + '</span>');
          }
          html += '<div class="tm-par' + (vivo ? ' vivo' : ' nulo') + '" data-v="' + d(L[i2 - 1], L[j2 - 1]) + '"><span class="tm-d' + (vivo ? ' on' : '') + '">d' + sub('' + i2 + j2) + '</span><span class="tm-par-p">(</span>' + terms2.join('<span class="tm-mas">+</span>') + '<span class="tm-par-p">)</span></div>';
        }
      }
      outT.innerHTML = html;
      var cols = []; for (var c = 1; c <= T; c++) cols.push(c);
      var h = '<tr><th></th>' + cols.map(function (t) { return '<th class="' + (t === r.length && r.length < T ? 'ahora' : '') + '">t' + sub(t) + '</th>'; }).join('') + '</tr>';
      L.forEach(function (k, n2) {
        h += '<tr><th>' + k + ' (x' + sub(n2 + 1) + ')</th>' + cols.map(function (t) {
          var v = x(n2 + 1, t), es = nuevo && nuevo[0] === n2 + 1 && nuevo[1] === t;
          var vacio = t > r.length;
          return '<td class="' + (v ? 'uno' : '') + (es ? ' nuevo' : '') + (vacio ? ' vacio' : '') + '"><span class="tm-celda-x">x' + sub((n2 + 1) + ',' + t) + (v ? ' = 1' : '') + '</span><span class="tm-celda-v">' + (vacio ? '·' : v) + '</span></td>';
        }).join('') + '</tr>';
      });
      tabla.innerHTML = h;
    }

    // ── los x_{i,t} que valen 1 (los demás son 0) ──
    function nocero() {
      var html = ruta.length === T
        ? '<span class="tm-nc-rot">x' + sub('i,t') + ' ≠ 0</span>' + ruta.map(function (k, t) {
            return '<span class="tm-nc" style="--k:' + t + '">x' + sub(IDX[k] + ',' + (t + 1)) + ' = 1</span>';
          }).join('')
        : '<span class="tm-nc-pista">Al completar la ruta aparecen aquí los x' + sub('i,t') + ' que valen 1; todos los demás valen 0.</span>';
      var res = ruta.length === T
        ? '<span class="tm-res-impl">⇒</span><span class="tm-llave">' + ruta.map(function (k, t) {
            return '<span style="--k:' + t + '">x' + sub(IDX[k] + ',' + (t + 1)) + ' = 1</span>';
          }).join('') + '</span>'
        : '<span class="tm-res-vacio">Completa la ruta para ver los x' + sub('i,t') + ' que valen 1.</span>';
      var c = $('nocero-4');
      if (c.innerHTML !== res) c.innerHTML = res;
      var a = $('nocero-2'), b = $('nocero-3');
      if (a.innerHTML !== html) a.innerHTML = html;
      if (b.innerHTML !== html) b.innerHTML = html;
    }

    // ── navegación por pasos ──
    var cuerpo = $('cuerpo-in'), escena = $('escena');
    var atras = $('atras'), adelante = $('adelante');
    var itemsPasos = $('pasos').querySelectorAll('li');
    function nav() {
      Array.prototype.forEach.call(itemsPasos, function (li, n) {
        li.className = n + 1 < paso ? 'hecho' : n + 1 === paso ? 'actual' : '';
        if (n + 1 < paso) { li.setAttribute('tabindex', '0'); li.setAttribute('role', 'button'); }
        else { li.removeAttribute('tabindex'); li.removeAttribute('role'); }
      });
      atras.disabled = paso === 1;
      adelante.disabled = paso === 4 || (paso === 2 && ruta.length < T);
    }
    // las mismas piezas (distancias, grafo, matriz, Q_C) se mudan a la escena de cada
    // paso y vuelven a su sitio en el resumen, así nada se duplica
    var MOV = {
      dist: raiz.querySelector('.tm-distancias'), grafo: svg, contador: raiz.querySelector('.tm-contador-fila'),
      tabla: tabla, q: outQ, terminos: outT, reiniciar: $('reiniciar')
    };
    var CASA = {};
    Object.keys(MOV).forEach(function (k) { CASA[k] = document.createComment(k); MOV[k].parentNode.insertBefore(CASA[k], MOV[k]); });
    var SLOTS = { 1: { dist: 'dist', grafo: 'grafo-1' }, 2: { contador: 'contador', grafo: 'grafo-2', tabla: 'tabla', reiniciar: 'reiniciar' }, 3: { q: 'q', terminos: 'terminos' }, 4: {} };
    function colocar() {
      Object.keys(MOV).forEach(function (k) {
        var s = SLOTS[paso][k];
        if (s) escena.querySelector('[data-slot="' + s + '"]').appendChild(MOV[k]);
        else CASA[k].parentNode.insertBefore(MOV[k], CASA[k].nextSibling);
      });
    }

    // ── paso 3: Q_C término a término; tacha los ceros y suma los que quedan ──
    var animT = 0, acumEl = $('acum');
    function animar() {
      clearTimeout(animT);
      detalle();
      escena.classList.add('animando');
      var B = valorB();
      var terms = outT.querySelectorAll('.tm-term'), n = 0, vals = [];
      function suma(fin) {
        var total = Math.round(B * vals.reduce(function (s, v) { return s + v; }, 0) * 100) / 100;
        acumEl.innerHTML = '<span class="tm-acum-rot">suma</span>' + (vals.length ? (B === 1 ? '' : usd(B) + ' · (') +
          vals.map(function (v, i) { return '<span class="tm-acum-v">' + (i ? '+ ' : '') + v + '</span>'; }).join(' ') + (B === 1 ? '' : ')') : '0') +
          (fin ? ' = <span class="tm-circulo tm-acum-v">' + usd(total) + '</span>' : '');
      }
      function siguiente() {
        if (n > 0) terms[n - 1].classList.remove('ahora');
        if (n === terms.length) { escena.classList.remove('animando'); suma(true); return; }
        var tm = terms[n], par = tm.parentNode, vivo = tm.classList.contains('on');
        tm.classList.add('hecho', 'ahora');
        if (vivo) { vals.push(Number(tm.getAttribute('data-v') || par.getAttribute('data-v'))); suma(false); }
        var hermanos = par.querySelectorAll('.tm-term');
        if (hermanos[hermanos.length - 1] === tm) par.classList.add('hecho');
        n++;
        animT = setTimeout(siguiente, quieto ? 0 : vivo ? 800 : 240);
      }
      suma(false);
      animT = setTimeout(siguiente, quieto ? 0 : 700);
    }

    function irA(n) {
      clearTimeout(animT);
      escena.classList.remove('animando');
      paso = n;
      cuerpo.setAttribute('data-paso', n);
      colocar();
      pintar();
      if (n === 3) animar();
    }
    atras.addEventListener('click', function () { if (paso > 1) irA(paso - 1); });
    adelante.addEventListener('click', function () { if (!adelante.disabled) irA(paso + 1); });
    $('repetir').addEventListener('click', animar);
    // tocar el círculo de un paso ya hecho retrocede hasta él
    Array.prototype.forEach.call(itemsPasos, function (li, n) {
      function volver() { if (n + 1 < paso) irA(n + 1); }
      li.addEventListener('click', volver);
      li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); volver(); } });
    });

    function pintar() { moverGrafo(); contador(); rutas(); detalle(); nocero(); nav(); }
    Array.prototype.forEach.call(raiz.querySelectorAll('.tm-distancias input[data-par]'), function (inp) {
      inp.addEventListener('input', function () { D[inp.getAttribute('data-par')] = Math.max(0, Number(inp.value) || 0); nuevo = null; ordenar(); pintar(); });
    });
    $('b').addEventListener('input', function () { rutas(); detalle(); });
    $('reiniciar').addEventListener('click', function () { ruta = []; nuevo = null; pintar(); });
    // número de pasos T (solo en los ejemplos que lo dejan elegir)
    Array.prototype.forEach.call(raiz.querySelectorAll('[data-t]'), function (bt) {
      bt.addEventListener('click', function () {
        T = Number(bt.getAttribute('data-t'));
        Array.prototype.forEach.call(raiz.querySelectorAll('[data-t]'), function (o) { o.setAttribute('aria-pressed', o === bt ? 'true' : 'false'); });
        ruta = []; nuevo = null; generar(); pintar();
      });
    });
    // el ejemplo completo se contrae y se despliega desde su título
    var boton = $('toggle'), cuerpoCaja = $('cuerpo');
    cuerpoCaja.id = 'tm' + id + '-cuerpo';
    boton.setAttribute('aria-controls', cuerpoCaja.id);
    boton.addEventListener('click', function () {
      var cerrado = raiz.classList.toggle('cerrado');
      boton.setAttribute('aria-expanded', cerrado ? 'false' : 'true');
    });
    generar();
    irA(1);
  }
})();
