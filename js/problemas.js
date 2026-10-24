// Ejemplo rápido: trayectoria mínima con 3 ubicaciones (A=1, B=2, C=3).
// Un camión recorre las tres en T = 3 pasos (sin volver al inicio):
//   Q_C = B Σ_ij d_ij Σ_{t=1}^{T−1} x_{i,t} x_{j,t+1}
// Modo manual: cada toque en un nodo es el siguiente paso t; se anota en la
// matriz x_{i,t} y la suma se recalcula. También se puede elegir una ruta
// completa en la lista del costado.
(function () {
  var svg = document.getElementById('tm-grafo');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var L = ['A', 'B', 'C'];                       // ubicación i = 1, 2, 3
  var IDX = { A: 1, B: 2, C: 3 };
  var POS = null;                // posiciones actuales de los nodos (se animan)
  var D = { AB: 5, BC: 7, AC: 9 };
  var T = 3;

  function d(a, b) { return a === b ? 0 : (D[a + b] != null ? D[a + b] : D[b + a]); }
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function usd(v) { return '$' + Math.round(v * 100) / 100; }   // B es el costo en $ por unidad de movida
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (padre || svg).appendChild(n);
    return n;
  }

  // ── rutas ──
  var RUTAS = [['A', 'B', 'C'], ['A', 'C', 'B'], ['B', 'A', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['C', 'B', 'A']];
  function coste(r) { var c = 0; for (var i = 1; i < r.length; i++) c += d(r[i - 1], r[i]); return c; }
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
    if (ruta.length === T) { ruta = [k]; }                 // ruta completa: empieza otra
    else if (k === ult) { ruta.pop(); nuevo = null; pintar(); return; }   // deshacer el último paso
    else if (ruta.indexOf(k) >= 0) { aviso('Ya pasaste por ' + k + ' en t = ' + (ruta.indexOf(k) + 1) + '.'); return; }
    else ruta.push(k);
    nuevo = [IDX[k], ruta.length];
    pintar();
  }

  // ── grafo dirigido ──
  // ── forma del triángulo según las distancias ──
  // Los lados siguen a d_ij de forma algo suavizada (potencia 0.8), así un cambio
  // estira o encoge el triángulo sin deformarlo al extremo. Si una distancia no
  // cumple la desigualdad triangular se recorta para que el dibujo exista.
  var CAJA = { w: 300, h: 200, m: 36 };
  function forma(dd) {
    var e = function (v) { return Math.pow(Math.max(Number(v) || 0, 0.5), 0.8); };
    var c = e(dd.AB), a = e(dd.BC), b = e(dd.AC), h = 0.94;
    if (b > h * (a + c)) b = h * (a + c);
    if (a > h * (b + c)) a = h * (b + c);
    if (c > h * (a + b)) c = h * (a + b);
    var cx = (b * b + c * c - a * a) / (2 * c);
    return { A: [0, 0], B: [c, 0], C: [cx, Math.sqrt(Math.max(b * b - cx * cx, 0))] };
  }
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
  // el giro y la escala de referencia salen de las distancias iniciales (5, 7, 9):
  // con valores mayores el triángulo crece hasta llenar el recuadro, con menores se encoge
  var GIRO = 0, REF = 0;
  (function () {
    var f0 = forma(D);
    for (var g = 0; g < 360; g += 2) {
      var s0 = ajuste(girar(f0, g * Math.PI / 180));
      if (s0 > REF) { REF = s0; GIRO = g * Math.PI / 180; }
    }
    REF *= 0.82;
  })();
  function objetivo() {
    var f = girar(forma(D), GIRO), b = limites(f), s = Math.min(ajuste(f), REF);
    // que los nodos nunca se toquen
    var lmin = Math.min(Math.hypot(f.A[0] - f.B[0], f.A[1] - f.B[1]), Math.hypot(f.B[0] - f.C[0], f.B[1] - f.C[1]), Math.hypot(f.A[0] - f.C[0], f.A[1] - f.C[1]));
    s = Math.min(Math.max(s, 84 / Math.max(lmin, 1e-6)), ajuste(f));
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
      var k = Math.min(1, (ahora - t0) / 420), e = 1 - Math.pow(1 - k, 3), o = {};
      L.forEach(function (n) { o[n] = [ini[n][0] + (dest[n][0] - ini[n][0]) * e, ini[n][1] + (dest[n][1] - ini[n][1]) * e]; });
      POS = o; grafo();
      if (k < 1) animG = requestAnimationFrame(cuadro);
    }
    animG = requestAnimationFrame(cuadro);
    finG = setTimeout(function () { cancelAnimationFrame(animG); POS = dest; grafo(); }, 520);   // por si la pestaña no anima
  }

  function grafo() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var r = paso === 1 ? [] : ruta;   // en el paso 1 solo se ven las distancias
    svg.classList.toggle('quieto', paso === 1);
    var defs = el('defs', {});
    var m = el('marker', { id: 'tm-flecha', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'tm-punta' }, m);
    var tramos = [];
    for (var i = 1; i < r.length; i++) tramos.push([r[i - 1], r[i]]);
    var enRuta = {};
    var cen = [(POS.A[0] + POS.B[0] + POS.C[0]) / 3, (POS.A[1] + POS.B[1] + POS.C[1]) / 3];
    tramos.forEach(function (tr) { enRuta[tr.slice().sort().join('')] = true; });
    [['A', 'B'], ['B', 'C'], ['A', 'C']].forEach(function (p) {
      var a = POS[p[0]], b = POS[p[1]], k = p.join('');
      if (enRuta[k]) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      else el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
      // cada peso por fuera del triángulo: del lado opuesto al centro
      var nx = ey / l, ny = -ex / l;
      if ((mx - cen[0]) * nx + (my - cen[1]) * ny < 0) { nx = -nx; ny = -ny; }
      el('text', { 'class': 'tm-peso', x: mx + nx * 16, y: my + ny * 16 + 6 }).textContent = d(p[0], p[1]);
    });
    tramos.forEach(function (tr) {
      var a = POS[tr[0]], b = POS[tr[1]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey), R0 = 27;
      el('line', { 'class': 'tm-dir', x1: a[0] + ex / l * R0, y1: a[1] + ey / l * R0, x2: b[0] - ex / l * (R0 + 2), y2: b[1] - ey / l * (R0 + 2), 'marker-end': 'url(#tm-flecha)' });
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
    L.forEach(function (k, n) {
      var p = POS[k], pt = r.indexOf(k) + 1;   // pt: paso en que se visita (0 si aún no)
      var g = el('g', { 'class': 'tm-nodo-g' + (pt ? ' visitado' : ''), tabindex: '0', role: 'button', 'aria-label': 'Ir a ' + k });
      // "estás aquí": el último nodo de una ruta a medias lleva un anillo que late
      if (k === aqui) el('circle', { 'class': 'tm-aqui', cx: p[0], cy: p[1], r: 24 }, g);
      el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: 24 }, g);
      // dentro, la variable x_{i,t}: la t se vuelve número cuando el camión pasa por ahí
      var t = el('text', { 'class': 'tm-xit', x: p[0] - 2, y: p[1] + 5 }, g);
      t.appendChild(document.createTextNode('x'));
      var sb = el('tspan', { 'class': 'tm-xit-sub', dy: '4' }, t);
      sb.appendChild(document.createTextNode((n + 1) + ','));
      if (pt) sb.appendChild(document.createTextNode(String(pt)));
      else el('tspan', { 'class': 'tm-xit-t' }, sb).textContent = 't';
      // afuera, la letra de la ubicación, del lado opuesto al centro del triángulo
      var vx = p[0] - cen[0], vy = p[1] - cen[1], vl = Math.hypot(vx, vy) || 1;
      var lx = Math.min(290, Math.max(10, p[0] + vx / vl * 37)), ly = Math.min(194, Math.max(14, p[1] + vy / vl * 37 + 7));
      el('text', { 'class': 'tm-letra-fuera', x: lx, y: ly }, g).textContent = k;
      if (paso === 1) return;
      g.addEventListener('click', function () { tocar(k); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
    });
  }

  // ── contador de t ──
  var cont = document.getElementById('tm-contador');
  var avisoT = 0;
  function contador() {
    var n = ruta.length, puntos = '';
    for (var t = 1; t <= T; t++) puntos += '<span class="tm-c-punto' + (t <= n ? ' lleno' : '') + (t === n ? ' actual' : '') + '"></span>';
    var txt = n === 0 ? 'Toca el nodo donde empieza el camión'
      : n < T ? 'En t = ' + n + ' estás en <b>' + ruta[n - 1] + '</b> · toca la siguiente ubicación'
      : 'Ruta completa en t = ' + T;
    cont.innerHTML = '<span class="tm-c-t">t = ' + Math.max(n, 0) + '<span class="tm-c-de"> / ' + T + '</span></span><span class="tm-c-puntos">' + puntos + '</span><span class="tm-c-txt">' + txt + '</span>';
  }
  function aviso(txt) {
    var e = cont.querySelector('.tm-c-txt');
    e.textContent = txt; e.classList.add('error');
    clearTimeout(avisoT); avisoT = setTimeout(contador, 1600);
  }

  // ── rutas: un solo desplegable con las 3! = 6 opciones ──
  var lista = document.getElementById('tm-rutas');
  var selector = document.getElementById('tm-select'), selBtn = document.getElementById('tm-sel-btn');
  function rutas() {
    var min = Math.min.apply(null, RUTAS.map(coste)), elegida = indiceRuta();
    var B = Number(document.getElementById('tm-b').value) || 0;
    function fila(r, n) {
      var c = coste(r);
      return '<span class="tm-r-n">Q' + sub('C') + '<sup>' + (n + 1) + '</sup></span>' +
        '<span class="tm-r-camino">' + r.join(' → ') + '</span>' +
        '<span class="tm-r-coste">' + usd(B * c) + '</span>' + (c === min ? '<span class="tm-r-min">mínima</span>' : '');
    }
    selBtn.innerHTML = (elegida >= 0 ? fila(RUTAS[elegida], elegida) : '<span class="tm-sel-vacio">Elige una ruta</span>') + '<i class="tm-sel-chev" aria-hidden="true"></i>';
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
  }
  selBtn.addEventListener('click', function () { abrir(!selector.classList.contains('abierto')); });
  document.addEventListener('click', function (ev) { if (!selector.contains(ev.target)) abrir(false); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') abrir(false); });

  // ── Q_C expandida y matriz x_{i,t} ──
  var outQ = document.getElementById('tm-q');
  var outT = document.getElementById('tm-terminos');
  var tabla = document.getElementById('tm-tabla');
  function detalle() {
    var r = ruta, B = Number(document.getElementById('tm-b').value) || 0, n = indiceRuta();
    function x(i, t) { return r[t - 1] === L[i - 1] ? 1 : 0; }
    function xs(i, t) { return 'x' + sub(i + ',' + t); }
    function xv(i, t) { var v = x(i, t); return '<span class="tm-x' + (v ? '' : ' cero') + '"><span class="tm-x-val' + (v ? ' uno' : '') + '">' + v + '</span><span class="tm-x-glifo">' + xs(i, t) + '</span></span>'; }
    var pares = [], vals = [];
    for (var k = 1; k < r.length; k++) { pares.push('d' + sub('' + IDX[r[k - 1]] + IDX[r[k]])); vals.push(d(r[k - 1], r[k])); }
    var total = B * vals.reduce(function (s, v) { return s + v; }, 0);
    var abre = B === 1 ? '' : usd(B) + ' (', cierra = B === 1 ? '' : ')';
    var nombre = 'Q' + sub('C') + (n >= 0 ? '<sup>' + (n + 1) + '</sup>' : '');
    outQ.innerHTML = '<span class="tm-q-nom">' + nombre + '</span> = B <span class="tm-sigma chica"><sup>3</sup>Σ<sub>i,j</sub></span> d' + sub('ij') +
      ' <span class="tm-sigma chica"><sup>2</sup>Σ<sub>t=1</sub></span> x' + sub('i,t') + ' x' + sub('j,t+1') + '<span class="tm-q-res">' +
      (pares.length ? ' = ' + abre + pares.join(' + ') + cierra : '') +
      (pares.length > 1 || (pares.length && B !== 1) ? ' = ' + abre + vals.join(' + ') + cierra : '') +
      ' = <span class="tm-circulo">' + usd(total) + '</span>' + (r.length < T ? ' <span class="tm-parcial">parcial</span>' : '') + '</span>';
    var html = '';
    for (var j = 1; j <= 3; j++) for (var i = 1; i <= 3; i++) {
      var terms = [], vivo = false;
      for (var t = 1; t < T; t++) {
        var on = x(i, t) === 1 && x(j, t + 1) === 1;
        if (on) vivo = true;
        terms.push('<span class="tm-term' + (on ? ' on' : '') + '">' + xv(i, t) + xv(j, t + 1) + '</span>');
      }
      html += '<div class="tm-par' + (vivo ? ' vivo' : ' nulo') + '" data-v="' + d(L[i - 1], L[j - 1]) + '"><span class="tm-d' + (vivo ? ' on' : '') + '">d' + sub('' + i + j) + '</span><span class="tm-par-p">(</span>' + terms.join('<span class="tm-mas">+</span>') + '<span class="tm-par-p">)</span></div>';
    }
    outT.innerHTML = html;
    var h = '<tr><th></th>' + [1, 2, 3].map(function (t) { return '<th class="' + (t === r.length && r.length < T ? 'ahora' : '') + '">t' + sub(t) + '</th>'; }).join('') + '</tr>';
    L.forEach(function (k, n2) {
      h += '<tr><th>' + k + ' (x' + sub(n2 + 1) + ')</th>' + [1, 2, 3].map(function (t) {
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
    var c = document.getElementById('tm-nocero-4');
    if (c.innerHTML !== res) c.innerHTML = res;
    var a = document.getElementById('tm-nocero-2'), b = document.getElementById('tm-nocero-3');
    if (a.innerHTML !== html) a.innerHTML = html;
    if (b.innerHTML !== html) b.innerHTML = html;
  }

  // ── navegación por pasos ──
  var cuerpo = document.getElementById('tm-cuerpo-in'), escena = document.getElementById('tm-escena');
  var atras = document.getElementById('tm-atras'), adelante = document.getElementById('tm-adelante');
  function nav() {
    Array.prototype.forEach.call(document.querySelectorAll('#tm-pasos li'), function (li, n) {
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
    dist: document.querySelector('.tm-distancias'), grafo: svg, contador: document.querySelector('.tm-contador-fila'),
    tabla: tabla, q: outQ, terminos: outT, reiniciar: document.getElementById('tm-reiniciar')
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
  var animT = 0, acumEl = document.getElementById('tm-acum');
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animar() {
    clearTimeout(animT);
    detalle();
    escena.classList.add('animando');
    var B = Number(document.getElementById('tm-b').value) || 0;
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
      if (vivo) { vals.push(Number(par.getAttribute('data-v'))); suma(false); }
      var hermanos = par.querySelectorAll('.tm-term');
      if (hermanos[hermanos.length - 1] === tm) par.classList.add('hecho');
      n++;
      animT = setTimeout(siguiente, quieto ? 0 : vivo ? 800 : 260);
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
  document.getElementById('tm-repetir').addEventListener('click', animar);
  // tocar el círculo de un paso ya hecho retrocede hasta él
  Array.prototype.forEach.call(document.querySelectorAll('#tm-pasos li'), function (li, n) {
    function volver() { if (n + 1 < paso) irA(n + 1); }
    li.addEventListener('click', volver);
    li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); volver(); } });
  });

  function pintar() { moverGrafo(); contador(); rutas(); detalle(); nocero(); nav(); }
  Array.prototype.forEach.call(document.querySelectorAll('.tm-distancias input[data-par]'), function (inp) {
    inp.addEventListener('input', function () { D[inp.getAttribute('data-par')] = Math.max(0, Number(inp.value) || 0); nuevo = null; pintar(); });
  });
  document.getElementById('tm-b').addEventListener('input', function () { rutas(); detalle(); });
  document.getElementById('tm-reiniciar').addEventListener('click', function () { ruta = []; nuevo = null; pintar(); });
  // el ejemplo completo se contrae y se despliega desde su título
  var caja = svg.closest('.tm'), boton = document.getElementById('tm-toggle');
  boton.addEventListener('click', function () {
    var cerrado = caja.classList.toggle('cerrado');
    boton.setAttribute('aria-expanded', cerrado ? 'false' : 'true');
  });
  irA(1);
})();
