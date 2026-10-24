// Caso real: cobertura de la red minera. Ocho instalaciones unidas por nueve
// caminos con distancias reales (fijas). Se busca la ruta que pase por todos los
// lugares en T tiempos, saliendo y volviendo a x1, con el costo
//   Q = B · Σ_ij d_ij Σ_t x_{i,t} x_{j,t+1}  +  A · (suma de castigos)
// Castigos siempre activos: un lugar por tiempo, cada lugar visitado (se permite
// retroceder, repetir no se castiga) y saltos solo por caminos. Castigos que se
// eligen: empezar en s, terminar en f y visitar a antes que b.
(function () {
  var raiz = document.querySelector('[data-caso]');
  if (!raiz) return;
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(n) { return raiz.querySelector('[data-c="' + n + '"]'); }
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function usd(v) { return '$' + r2(v); }
  function km(v) { return v < 1 ? Math.round(v * 1000) + ' m' : (Math.round(v * 1000) / 1000) + ' km'; }
  function kmCorto(v) { return Math.round(v * 1000) / 1000; }

  // ── la red ──
  var L = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8'], N = L.length;
  var IDX = {}; L.forEach(function (k, i) { IDX[k] = i + 1; });
  var NOMBRE = { x1: 'Planta', x2: 'J1', x3: 'Tajo', x4: 'Botadero', x5: 'J2', x6: 'Lixiviación', x7: 'Baja ley', x8: 'Relaves' };
  var NOMBRE_LARGO = { x1: 'Planta de procesamiento', x2: 'Junta J1', x3: 'Tajo', x4: 'Botadero', x5: 'Junta J2', x6: 'Pila de lixiviación', x7: 'Stock de baja ley', x8: 'Relaves' };
  // distancias en km (72 m = 0.072 km)
  var CAMINOS = [['x1', 'x2', 1.6], ['x2', 'x3', 0.072], ['x2', 'x4', 0.035], ['x2', 'x8', 1.4], ['x2', 'x5', 1.4], ['x1', 'x5', 1.7], ['x8', 'x5', 1.0], ['x5', 'x6', 0.2], ['x5', 'x7', 0.5]];
  var DIST = {};
  CAMINOS.forEach(function (c) { DIST[c[0] + c[1]] = c[2]; DIST[c[1] + c[0]] = c[2]; });
  function d(a, b) { return DIST[a + b]; }          // undefined si no hay camino
  function camino(a, b) { return a !== b && DIST[a + b] != null; }
  var VECINOS = {}; L.forEach(function (k) { VECINOS[k] = L.filter(function (j) { return camino(k, j); }); });
  // posiciones del dibujo (horizontal) y dónde va el nombre de cada nodo
  var POS = { x1: [74, 150], x2: [262, 96], x3: [176, 38], x4: [348, 38], x5: [348, 214], x6: [250, 266], x7: [446, 266], x8: [586, 150] };
  var ETIQ = { x1: [0, 40, 'middle'], x2: [0, 37, 'middle'], x3: [-28, 6, 'end'], x4: [28, 6, 'start'], x5: [0, 37, 'middle'], x6: [-28, 6, 'end'], x7: [28, 6, 'start'], x8: [0, 40, 'middle'] };
  var R = 20;

  // ── estado ──
  var T = 13, s = 'x1', f = 'x1';
  // dos reglas "visitar a antes que b", cada una se enciende por separado
  var ANTES = [{ on: false, a: 'x6', b: 'x3' }, { on: false, a: 'x7', b: 'x4' }];
  var ruta = [], paso = 1, nuevo = null;
  function B() { return Math.max(0, Number($('b').value) || 0); }
  function A() { return Math.max(0, Number($('a').value) || 0); }

  // ── evaluación de una ruta ──
  function distancia(r) { var c = 0; for (var i = 1; i < r.length; i++) c += d(r[i - 1], r[i]) || 0; return c; }
  function castigos(r) {
    var p = { tiempo: 0, visita: 0, salto: 0, inicio: 0, fin: 0, antes: 0 };
    for (var t = 0; t < T; t++) p.tiempo += r[t] ? 0 : 1;                  // (1 − Σ_i x_{i,t})²
    L.forEach(function (k) { if (r.indexOf(k) < 0) p.visita++; });
    for (var i = 1; i < r.length; i++) if (!camino(r[i - 1], r[i])) p.salto++;
    p.inicio = r[0] === s ? 0 : 1;
    p.fin = r[T - 1] === f ? 0 : 1;
    p.antesR = ANTES.map(function (q) { var v = 0, nb = 0; if (q.on) r.forEach(function (k) { if (k === q.a) v += nb; if (k === q.b) nb++; }); return v; });
    p.antes = p.antesR[0] + p.antesR[1];
    p.total = p.tiempo + p.visita + p.salto + p.inicio + p.fin + p.antes;
    return p;
  }
  function costo(r) { return B() * distancia(r) + A() * castigos(r).total; }

  // ── la mejor ruta: programación dinámica sobre (t, lugar, visitados, veces que pasó por b) ──
  // Es exacta para el modelo: considera también saltos prohibidos y partir fuera de s,
  // cada uno con su castigo A.
  function optima(forzarSegundo) {
    // por cada regla encendida se cuenta cuántas veces ya se pasó por b (hasta 3)
    var b = B(), a = A(), C1 = ANTES[0].on ? 4 : 1, C2 = ANTES[1].on ? 4 : 1, NB = C1 * C2, M = 1 << N, tam = N * M * NB;
    var previo = [];
    var cap = new Float64Array(tam).fill(Infinity), prv = new Int32Array(tam).fill(-1);
    function id(i, m, nb) { return (i * M + m) * NB + nb; }
    function llega(nb, k) {   // castigo al llegar a k y conteos nuevos
      var n1 = Math.floor(nb / C2), n2 = nb % C2, pen = 0;
      if (ANTES[0].on) { if (k === ANTES[0].a) pen += n1; if (k === ANTES[0].b) n1 = Math.min(n1 + 1, C1 - 1); }
      if (ANTES[1].on) { if (k === ANTES[1].a) pen += n2; if (k === ANTES[1].b) n2 = Math.min(n2 + 1, C2 - 1); }
      return [pen, n1 * C2 + n2];
    }
    L.forEach(function (k, i) { var z = llega(0, k); cap[id(i, 1 << i, z[1])] = k === s ? 0 : a; });
    previo.push(prv);
    for (var t = 1; t < T; t++) {
      var sig = new Float64Array(tam).fill(Infinity), ps = new Int32Array(tam).fill(-1);
      for (var i = 0; i < N; i++) for (var m = 0; m < M; m++) {
        if (!(m & (1 << i))) continue;
        for (var nb = 0; nb < NB; nb++) {
          var v = cap[id(i, m, nb)];
          if (v === Infinity) continue;
          for (var j = 0; j < N; j++) {
            if (t === 1 && forzarSegundo && L[j] !== forzarSegundo) continue;
            var dd = d(L[i], L[j]), z = llega(nb, L[j]), c = v + (dd != null && i !== j ? b * dd : a) + a * z[0];
            var k2 = id(j, m | (1 << j), z[1]);
            if (c < sig[k2]) { sig[k2] = c; ps[k2] = id(i, m, nb); }
          }
        }
      }
      cap = sig; previo.push(ps);
    }
    // cierre: castigos de visitar todo y de terminar en f
    var mejor = Infinity, fin = -1;
    for (var i2 = 0; i2 < N; i2++) for (var m2 = 0; m2 < M; m2++) for (var n2 = 0; n2 < NB; n2++) {
      var v2 = cap[id(i2, m2, n2)];
      if (v2 === Infinity) continue;
      var faltan = 0; for (var q = 0; q < N; q++) if (!(m2 & (1 << q))) faltan++;
      v2 += a * faltan + (L[i2] === f ? 0 : a);
      if (v2 < mejor - 1e-9) { mejor = v2; fin = id(i2, m2, n2); }
    }
    if (fin < 0) return null;
    var r = [], e = fin;
    for (var t2 = T - 1; t2 >= 0; t2--) { r.unshift(L[Math.floor(e / (M * NB))]); e = previo[t2][e]; }
    return r;
  }
  // el desplegable: la óptima y las mejores según el primer movimiento, con sus inversas
  var RUTAS = [];
  function generar() {
    var vistas = {}, out = [];
    function meter(r) { if (r && !vistas[r.join()]) { vistas[r.join()] = 1; out.push(r); } }
    if (T >= 2) {
      meter(optima(null));
      L.forEach(function (j) { meter(optima(j)); });
      out.slice().forEach(function (r) { meter(r.slice().reverse()); });
    } else meter(optima(null));
    out.sort(function (p, q) { return costo(p) - costo(q); });
    RUTAS = out.slice(0, 10);
  }
  function indiceRuta() {
    if (ruta.length < T) return -1;
    for (var n = 0; n < RUTAS.length; n++) if (RUTAS[n].join() === ruta.join()) return n;
    return -1;
  }

  // ── modo manual ──
  var avisoT = 0;
  function tocar(k) {
    var ult = ruta[ruta.length - 1];
    if (ruta.length === T) ruta = [k];
    else if (k === ult) { ruta.pop(); nuevo = null; pintar(); return; }
    else ruta.push(k);
    nuevo = [IDX[k], ruta.length];
    pintar();
    var n = ruta.length;
    if (n === 1 && k !== s) aviso('Empiezas fuera de s = ' + s + ': se castiga con A.');
    else if (n > 1 && !camino(ruta[n - 2], k)) aviso('No hay camino de ' + ruta[n - 2] + ' a ' + k + ': salto prohibido, se castiga con A.');
  }

  // ── grafo ──
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    padre.appendChild(n);
    return n;
  }
  function grafo(svg, modo) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var r = modo === 1 || modo === 'ctx' ? [] : ruta, interactivo = modo === 3;
    svg.classList.toggle('quieto', !interactivo);
    var defs = el('defs', {}, svg), mid = 'caso-flecha-' + modo;
    var mk = el('marker', { id: mid, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'tm-punta' }, mk);
    var mk2 = el('marker', { id: mid + '-x', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'caso-punta-x' }, mk2);
    var mk3 = el('marker', { id: mid + '-v', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'caso-punta-v' }, mk3);
    var usados = {};
    for (var i = 1; i < r.length; i++) usados[[r[i - 1], r[i]].sort().join('')] = (usados[[r[i - 1], r[i]].sort().join('')] || 0) + 1;
    CAMINOS.forEach(function (c) {
      var a = POS[c[0]], b = POS[c[1]], u = usados[[c[0], c[1]].sort().join('')];
      if (u) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, svg);
      el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, svg);
    });
    // tramos recorridos: flechas; si se recorre ida y vuelta, cada sentido a un lado
    for (var t = 1; t < r.length; t++) {
      var a0 = POS[r[t - 1]], b0 = POS[r[t]];
      if (r[t - 1] === r[t]) continue;
      var ex = b0[0] - a0[0], ey = b0[1] - a0[1], l = Math.hypot(ex, ey), nx = -ey / l * 5, ny = ex / l * 5, R0 = R + 4;
      var ok = camino(r[t - 1], r[t]), vuelve = r.slice(0, t).indexOf(r[t]) >= 0;
      el('line', { 'class': ok ? (vuelve ? 'tm-dir caso-vuelve' : 'tm-dir') : 'caso-salto', x1: a0[0] + ex / l * R0 + nx, y1: a0[1] + ey / l * R0 + ny, x2: b0[0] - ex / l * (R0 + 2) + nx, y2: b0[1] - ey / l * (R0 + 2) + ny, 'marker-end': 'url(#' + mid + (ok ? (vuelve ? '-v' : '') : '-x') + ')' }, svg);
    }
    // distancias sobre cada camino, con halo blanco para que no se pisen con las líneas
    CAMINOS.forEach(function (c) {
      var a = POS[c[0]], b = POS[c[1]];
      el('text', { 'class': 'caso-dist', x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + 4 }, svg).textContent = km(c[2]);
    });
    var aqui = r.length && r.length < T ? r[r.length - 1] : null;
    var meta = modo === 3 && r.length === T - 1 ? f : null;
    L.forEach(function (k) {
      var p = POS[k], pts = [];
      r.forEach(function (rk, t2) { if (rk === k) pts.push(t2 + 1); });
      var g = el('g', { 'class': 'tm-nodo-g caso-nodo' + (pts.length ? ' visitado' : '') + (modo !== 1 && (k === s) ? ' es-s' : ''), tabindex: interactivo ? '0' : '-1', role: interactivo ? 'button' : 'img', 'aria-label': k + ' — ' + NOMBRE_LARGO[k] }, svg);
      if (k === aqui) el('circle', { 'class': 'tm-aqui', cx: p[0], cy: p[1], r: R }, g);
      if (k === meta) el('circle', { 'class': 'tm-meta', cx: p[0], cy: p[1], r: R + 5 }, g);
      if (modo === 'ctx') { picto(g, k, p[0], p[1]); var e0 = ETIQ[k]; el('text', { 'class': 'caso-nombre', x: p[0] + e0[0], y: p[1] + e0[1], 'text-anchor': e0[2] }, g).textContent = NOMBRE[k]; return; }
      el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: R }, g);
      var tx = el('text', { 'class': 'caso-letra', x: p[0], y: p[1] + 5 }, g);
      tx.appendChild(document.createTextNode('x'));
      el('tspan', { 'class': 'caso-letra-sub', dy: '4' }, tx).textContent = IDX[k];
      var e = ETIQ[k];
      el('text', { 'class': 'caso-nombre', x: p[0] + e[0], y: p[1] + e[1], 'text-anchor': e[2] }, g).textContent = NOMBRE[k];
      if (!interactivo) return;
      g.addEventListener('click', function () { tocar(k); });
      g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
    });
  }

  // dibujos de trazos geométricos para cada instalación (solo en el grafo del contexto)
  function picto(g, k, x, y) {
    var h = el('g', { 'class': 'picto', transform: 'translate(' + x + ' ' + y + ')' }, g);
    el('circle', { 'class': 'picto-fondo', cx: 0, cy: 0, r: 23 }, h);
    var D = {
      x1: 'M-14 10 V-4 L-7 -9 V-4 L0 -9 V-4 L7 -9 V10 Z M9 10 V-14 H13 V10 M-10 3 h4 M-2 3 h4',           // planta: naves y chimenea
      x2: 'M0 -12 L12 0 L0 12 L-12 0 Z M-5 0 H5 M0 -5 V5',                                                // junta J1
      x3: 'M-16 -6 Q0 -14 16 -6 Q0 2 -16 -6 M-11 -1 Q0 -7 11 -1 Q0 5 -11 -1 M-6 4 Q0 0 6 4 Q0 8 -6 4',   // tajo: bancos
      x4: 'M-16 10 L-4 -10 L4 -2 L16 10 Z M-9 4 h6 M-2 6 h6',                                             // botadero: pila
      x5: 'M0 -12 L12 0 L0 12 L-12 0 Z M-5 0 H5 M0 -5 V5',                                                // junta J2
      x6: 'M-16 -4 H16 L12 10 H-12 Z M-10 2 q3 -3 6 0 t6 0 t6 0',                                          // lixiviación: poza
      x7: 'M-15 10 Q-6 -12 3 2 Q9 -6 15 10 Z',                                                             // baja ley: acopio
      x8: 'M-16 -6 H16 L10 10 H-10 Z M-11 0 q3 -3 6 0 t6 0 t6 0 M-8 5 q3 -2 5 0 t5 0 t5 0'               // relaves: embalse
    };
    el('path', { 'class': 'picto-trazo', d: D[k] }, h);
    if (k === 'x7') [[-6, 4], [-1, 0], [5, 5]].forEach(function (c) { el('circle', { 'class': 'picto-punto', cx: c[0], cy: c[1], r: 1.6 }, h); });
  }

  // ── matriz x_{i,t}: 8 filas × T columnas ──
  function matriz(caja) {
    var cols = []; for (var t = 1; t <= T; t++) cols.push(t);
    var h = '<table class="caso-tabla"><tr><th></th>' + cols.map(function (t) { return '<th class="' + (t === ruta.length && ruta.length < T ? 'ahora' : '') + '">t' + sub(t) + '</th>'; }).join('') + '</tr>';
    L.forEach(function (k, n) {
      h += '<tr><th><span class="caso-tabla-x">x' + sub(n + 1) + '</span> ' + NOMBRE[k] + '</th>' + cols.map(function (t) {
        var v = ruta[t - 1] === k ? 1 : 0, vacio = t > ruta.length, es = nuevo && nuevo[0] === n + 1 && nuevo[1] === t;
        // vuelta a un lugar ya visitado: azul · salto sin camino, partida o llegada fuera de regla: rojo
        var tono = '';
        if (v) {
          var mal = (t > 1 && !camino(ruta[t - 2], k)) || (t === 1 && k !== s) || (t === T && k !== f);
          tono = mal ? ' infraccion' : ruta.slice(0, t - 1).indexOf(k) >= 0 ? ' revisita' : '';
        }
        return '<td class="' + (v ? 'uno' : '') + tono + (vacio ? ' vacio' : '') + (es ? ' nuevo' : '') + '" title="x' + (n + 1) + ',' + t + '">' + (vacio ? '·' : v) + '</td>';
      }).join('') + '</tr>';
    });
    caja.innerHTML = h + '</table>';
  }

  // ── contador y opciones de T ──
  var cont = $('contador');
  function contador() {
    var n = ruta.length, puntos = '';
    for (var t = 1; t <= T; t++) puntos += '<span class="tm-c-punto' + (t <= n ? ' lleno' : '') + (t === n ? ' actual' : '') + '"></span>';
    var txt = n === 0 ? 'Toca el nodo de partida (s = <b>' + s + '</b>)'
      : n === T ? 'Ruta completa en t = ' + T
      : n === T - 1 ? 'En t = ' + n + ' estás en <b>' + ruta[n - 1] + '</b> · cierra en f = <b>' + f + '</b>'
      : 'En t = ' + n + ' estás en <b>' + ruta[n - 1] + '</b> · ' + NOMBRE[ruta[n - 1]];
    cont.innerHTML = '<span class="tm-c-t">t = ' + n + '<span class="tm-c-de"> / ' + T + '</span></span><span class="tm-c-puntos">' + puntos + '</span><span class="tm-c-txt">' + txt + '</span>';
  }
  function aviso(txt) {
    var e = cont.querySelector('.tm-c-txt');
    e.textContent = txt; e.classList.add('error');
    clearTimeout(avisoT); avisoT = setTimeout(contador, 2200);
  }
  var tOps = $('t-ops');
  for (var tt = 2; tt <= 16; tt++) tOps.insertAdjacentHTML('beforeend', '<button type="button" data-t="' + tt + '" aria-pressed="' + (tt === T ? 'true' : 'false') + '">' + tt + '</button>');
  Array.prototype.forEach.call(tOps.querySelectorAll('button'), function (bt) {
    bt.addEventListener('click', function () {
      T = Number(bt.getAttribute('data-t'));
      Array.prototype.forEach.call(tOps.querySelectorAll('button'), function (o) { o.setAttribute('aria-pressed', o === bt ? 'true' : 'false'); });
      ruta = []; nuevo = null; generar(); pintar();
    });
  });

  // ── desplegable de rutas ──
  var lista = $('rutas'), selector = $('select'), selBtn = $('sel-btn');
  function rutas() {
    var elegida = indiceRuta(), min = RUTAS.length ? costo(RUTAS[0]) : 0;
    function fila(r, n) {
      var c = costo(r);
      return '<span class="tm-r-n">R<sup>' + (n + 1) + '</sup></span><span class="tm-r-camino caso-camino">' + r.map(function (k) { return IDX[k]; }).join('·') + '</span>' +
        '<span class="tm-r-coste">' + usd(c) + '</span>' + (Math.abs(c - min) < 1e-9 ? '<span class="tm-r-min">óptima</span>' : '');
    }
    selBtn.innerHTML = (elegida >= 0 ? fila(RUTAS[elegida], elegida) : '<span class="tm-sel-vacio">' + (ruta.length === T ? 'Ruta propia · ' + usd(costo(ruta)) : 'Elige una ruta o arma la tuya') + '</span>') + '<i class="tm-sel-chev" aria-hidden="true"></i>';
    lista.innerHTML = '';
    RUTAS.forEach(function (r, n) {
      var li = document.createElement('li');
      li.className = 'tm-ruta' + (n === elegida ? ' elegida' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', n === elegida ? 'true' : 'false');
      li.innerHTML = '<button type="button">' + fila(r, n) + '</button>';
      li.querySelector('button').addEventListener('click', function () { ruta = r.slice(); nuevo = null; abrir(false); pintar(); });
      lista.appendChild(li);
    });
  }
  function abrir(si) { selector.classList.toggle('abierto', si); selBtn.setAttribute('aria-expanded', si ? 'true' : 'false'); }
  selBtn.addEventListener('click', function () { abrir(!selector.classList.contains('abierto')); });
  document.addEventListener('click', function (ev) { if (!selector.contains(ev.target)) abrir(false); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') abrir(false); });

  // ── paso 4: distancia término a término ──
  function xv(i, t) {
    var v = ruta[t - 1] === L[i - 1] ? 1 : 0;
    return '<span class="tm-x' + (v ? '' : ' cero') + '"><span class="tm-x-val' + (v ? ' uno' : '') + '">' + v + '</span><span class="tm-x-glifo">x' + sub(i + ',' + t) + '</span></span>';
  }
  function filasDistancia() {
    var D = distancia(ruta), html = '';
    $('q-dist').innerHTML = 'D = <span class="tm-sigma chica"><sup>8</sup>Σ<sub>i,j</sub></span> d' + sub('ij') + ' <span class="tm-sigma chica"><sup>' + (T - 1) + '</sup>Σ<sub>t=1</sub></span> x' + sub('i,t') + ' x' + sub('j,t+1') +
      '<span class="tm-q-res"> = <span class="tm-circulo">' + km(D) + '</span> &nbsp;→&nbsp; B·D = ' + usd(B()) + ' · ' + kmCorto(D) + ' = <b>' + usd(B() * D) + '</b></span>';
    for (var t = 1; t < T; t++) {
      var i0 = IDX[ruta[t - 1]], destino = ruta[t];
      // solo los vecinos de i (para los demás d_ij no existe: eso lo cubre la regla de saltos)
      var js = VECINOS[ruta[t - 1]].slice();
      if (js.indexOf(destino) < 0) js.push(destino);
      js.sort(function (p, q) { return IDX[p] - IDX[q]; });
      var terms = js.map(function (k) {
        var j = IDX[k], on = destino === k, dd = d(ruta[t - 1], k);
        return '<span class="tm-term' + (on ? ' on' : '') + (dd == null ? ' salto' : '') + '" data-v="' + (dd || 0) + '"><span class="tm-d' + (on ? ' on' : '') + '">d' + sub('' + i0 + j) + '</span>(' + xv(i0, t) + xv(j, t + 1) + ')</span>';
      });
      html += '<div class="tm-par caso-fila"><span class="tm-t-rot">t = ' + t + '</span>' + terms.join('<span class="tm-mas">+</span>') + '</div>';
    }
    // dos columnas que se leen de arriba abajo: t = 1 … a la izquierda y sigue a la derecha
    var mitad = Math.ceil((T - 1) / 2);
    $('filas').style.gridTemplateRows = 'auto repeat(' + mitad + ', auto)';
    $('filas').innerHTML = '<p class="tm-t-pista">En cada t solo sobrevive la fila <i>i</i> con x' + sub('i,t') + ' = 1 y, de ella, los caminos que salen de <i>i</i>.</p>' + html;
  }
  var animT = 0, escena = $('escena');
  function animar() {
    clearTimeout(animT);
    filasDistancia();
    escena.classList.add('animando');
    var terms = $('filas').querySelectorAll('.tm-term'), n = 0, vals = [], acum = $('acum');
    function suma(fin) {
      var tot = vals.reduce(function (s2, v) { return s2 + v; }, 0);
      acum.innerHTML = '<span class="tm-acum-rot">D</span>' + (vals.length ? vals.map(function (v, i) { return '<span class="tm-acum-v">' + (i ? '+ ' : '') + kmCorto(v) + '</span>'; }).join(' ') : '0') +
        (fin ? ' = <span class="tm-circulo tm-acum-v">' + km(tot) + '</span>' : '');
    }
    function siguiente() {
      if (n > 0) terms[n - 1].classList.remove('ahora');
      if (n === terms.length) { escena.classList.remove('animando'); suma(true); return; }
      var tm = terms[n], par = tm.parentNode, vivo = tm.classList.contains('on');
      tm.classList.add('hecho', 'ahora');
      if (vivo) { vals.push(Number(tm.getAttribute('data-v'))); suma(false); }
      var hs = par.querySelectorAll('.tm-term');
      if (hs[hs.length - 1] === tm) par.classList.add('hecho');
      n++;
      animT = setTimeout(siguiente, quieto ? 0 : vivo ? 380 : 110);
    }
    suma(false);
    animT = setTimeout(siguiente, quieto ? 0 : 500);
  }

  // ── paso 5: castigos ──
  // Como en la distancia: cada regla se revisa por turno y solo se escriben las
  // cuentas de las que se rompen; las que se cumplen quedan en 0 sin desarrollo.
  var castT = 0;
  function tarjetasCastigo() {
    clearTimeout(castT);
    var p = castigos(ruta), a = A();
    var faltan = L.filter(function (k) { return ruta.indexOf(k) < 0; });
    var saltos = []; for (var i = 1; i < ruta.length; i++) if (!camino(ruta[i - 1], ruta[i])) saltos.push('x' + sub(IDX[ruta[i - 1]] + ',' + i) + 'x' + sub(IDX[ruta[i]] + ',' + (i + 1)));
    var pares = ANTES.map(function (q) { var out = [], tb = []; if (q.on) ruta.forEach(function (k, t) { if (k === q.a) tb.forEach(function (t0) { out.push('x' + sub(IDX[q.b] + ',' + t0) + 'x' + sub(IDX[q.a] + ',' + (t + 1))); }); if (k === q.b) tb.push(t + 1); }); return out; });
    function suma(terms) { return terms.join(' + ') + (terms.length > 1 ? ' = ' + terms.length : ''); }
    var REGLAS = [
      ['Temporalidad', 'P' + sub('tiempo') + ' = Σ' + sub('t') + ' (1 − Σ' + sub('i') + ' x' + sub('i,t') + ')<sup>2</sup>', p.tiempo, ''],
      ['Espacialidad', 'P' + sub('visita') + ' = Σ' + sub('i') + ' (1 − y' + sub('i') + ')<sup>2</sup>', p.visita,
        faltan.map(function (k) { return '(1 − y' + sub(IDX[k]) + ')<sup>2</sup>'; }).join(' + ') + ' = ' + faltan.map(function () { return '1'; }).join(' + ') + (faltan.length > 1 ? ' = ' + faltan.length : '') + ' <span class="caso-cast-por">sin visitar: ' + faltan.join(', ') + '</span>'],
      ['Saltos prohibidos', 'P' + sub('salto') + ' = Σ' + sub('t') + ' Σ' + sub('(i,j)∉E') + ' x' + sub('i,t') + ' x' + sub('j,t+1'), p.salto, suma(saltos)],
      ['Empezar en ' + s, 'P' + sub('inicio') + ' = 1 − x' + sub(IDX[s] + ',1'), p.inicio, '1 − x' + sub(IDX[s] + ',1') + ' = 1 − 0 = 1 <span class="caso-cast-por">parte en ' + ruta[0] + '</span>'],
      ['Terminar en ' + f, 'P' + sub('fin') + ' = 1 − x' + sub(IDX[f] + ',' + T), p.fin, '1 − x' + sub(IDX[f] + ',' + T) + ' = 1 − 0 = 1 <span class="caso-cast-por">termina en ' + ruta[T - 1] + '</span>']
    ];
    ANTES.forEach(function (q, n) { if (q.on) REGLAS.push(['Visitar ' + q.a + ' antes que ' + q.b, 'P' + sub('antes,' + (n + 1)) + ' = Σ' + sub('t') + ' Σ' + sub('t′<t') + ' x' + sub(IDX[q.b] + ',t′') + ' x' + sub(IDX[q.a] + ',t'), p.antesR[n], suma(pares[n])]); });
    $('castigos').innerHTML = REGLAS.map(function (c, n) {
      return '<div class="caso-cast pendiente" data-n="' + n + '"><span class="caso-cast-n">' + c[0] + '</span><span class="caso-f">' + c[1] + '</span>' +
        '<span class="caso-cast-v">= ' + c[2] + '</span>' + (c[2] ? '<div class="caso-cast-cuenta">= ' + c[3] + '</div>' : '') + '</div>';
    }).join('');
    var filas = $('castigos').querySelectorAll('.caso-cast'), k = 0;
    $('q-castigo').innerHTML = '';
    function siguiente() {
      if (k === filas.length) {
        var vals = REGLAS.map(function (c) { return c[2]; });
        $('q-castigo').innerHTML = 'A · P = ' + usd(a) + ' · (' + vals.join(' + ') + ') = ' + usd(a) + ' · ' + p.total + ' = <span class="tm-circulo">' + usd(a * p.total) + '</span>';
        return;
      }
      var fi = filas[k], roto = REGLAS[k][2] > 0;
      fi.classList.remove('pendiente');
      fi.classList.add(roto ? 'roto' : 'ok');
      k++;
      castT = setTimeout(siguiente, quieto ? 0 : roto ? 900 : 380);
    }
    castT = setTimeout(siguiente, quieto ? 0 : 400);
  }

  // ── paso 6: resumen ──
  function resumen() {
    var D = distancia(ruta), p = castigos(ruta), q = B() * D + A() * p.total, n = indiceRuta();
    $('q-total').innerHTML = 'Q = B·D + A·P = ' + usd(B()) + ' · ' + kmCorto(D) + ' + ' + usd(A()) + ' · ' + p.total + ' = <span class="tm-circulo">' + usd(q) + '</span>' +
      (n === 0 ? ' <span class="tm-r-min">óptima</span>' : '');
    $('res-der').innerHTML =
      '<div class="caso-res-bloque"><div class="caso-col-rot">Ruta</div><div class="caso-res-ruta">' + ruta.map(function (k) { return '<span class="caso-res-paso">' + NOMBRE[k] + ' <i>(x' + sub(IDX[k]) + ')</i></span>'; }).join(' → ') + '</div></div>' +
      '<div class="caso-res-bloque"><div class="caso-col-rot">Distancia</div><div class="caso-res-num">' + km(D) + ' <span>· ' + usd(B() * D) + '</span></div></div>' +
      '<div class="caso-res-bloque"><div class="caso-col-rot">Castigos</div><div class="caso-res-chips">' +
      [['tiempo', p.tiempo], ['visita', p.visita], ['salto', p.salto], ['inicio', p.inicio], ['fin', p.fin]].concat(ANTES[0].on ? [['antes,1', p.antesR[0]]] : []).concat(ANTES[1].on ? [['antes,2', p.antesR[1]]] : []).map(function (c) {
        return '<span class="' + (c[1] ? 'roto' : '') + '">P' + sub(c[0]) + ' = ' + c[1] + '</span>';
      }).join('') + '</div></div>';
  }

  // ── pasos ──
  var atras = $('atras'), adelante = $('adelante'), items = $('pasos').querySelectorAll('li');
  function nav() {
    Array.prototype.forEach.call(items, function (li, n) {
      li.className = n + 1 < paso ? 'hecho' : n + 1 === paso ? 'actual' : '';
      if (n + 1 < paso) { li.setAttribute('tabindex', '0'); li.setAttribute('role', 'button'); } else { li.removeAttribute('tabindex'); li.removeAttribute('role'); }
    });
    atras.disabled = paso === 1;
    adelante.disabled = paso === 6 || (paso === 3 && ruta.length < T);
  }
  function pintar() {
    if (paso === 1) grafo(raiz.querySelector('[data-grafo="1"]'), 1);
    if (paso === 3) { grafo(raiz.querySelector('[data-grafo="3"]'), 3); matriz(raiz.querySelector('[data-mat="3"]')); contador(); rutas(); }
    if (paso === 6) { grafo(raiz.querySelector('[data-grafo="6"]'), 6); matriz(raiz.querySelector('[data-mat="6"]')); resumen(); }
    nav();
  }
  function irA(n) {
    clearTimeout(animT); clearTimeout(castT); escena.classList.remove('animando');
    paso = n; escena.setAttribute('data-paso', n); raiz.setAttribute('data-en', n);
    pintar();
    if (n === 4) animar();
    if (n === 5) tarjetasCastigo();
  }
  atras.addEventListener('click', function () { if (paso > 1) irA(paso - 1); });
  adelante.addEventListener('click', function () { if (!adelante.disabled) irA(paso + 1); });
  $('repetir').addEventListener('click', animar);
  Array.prototype.forEach.call(items, function (li, n) {
    function volver() { if (n + 1 < paso) irA(n + 1); }
    li.addEventListener('click', volver);
    li.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); volver(); } });
  });
  $('reiniciar').addEventListener('click', function () { ruta = []; nuevo = null; pintar(); });

  // ── pesos y restricciones elegibles ──
  ['s', 'f', 'antes-a', 'antes-b', 'antes2-a', 'antes2-b'].forEach(function (n) {
    $(n).innerHTML = L.map(function (k) { return '<option value="' + k + '">' + k + ' · ' + NOMBRE[k] + '</option>'; }).join('');
  });
  $('s').value = s; $('f').value = f;
  $('antes-a').value = ANTES[0].a; $('antes-b').value = ANTES[0].b; $('antes2-a').value = ANTES[1].a; $('antes2-b').value = ANTES[1].b;
  function leerReglas() {
    s = $('s').value; f = $('f').value;
    ANTES[0] = { on: $('antes-on').checked, a: $('antes-a').value, b: $('antes-b').value };
    ANTES[1] = { on: $('antes2-on').checked, a: $('antes2-a').value, b: $('antes2-b').value };
    $('antes-a').disabled = $('antes-b').disabled = !ANTES[0].on;
    $('antes2-a').disabled = $('antes2-b').disabled = !ANTES[1].on;
    generar(); pintar();
  }
  ['s', 'f', 'antes-a', 'antes-b', 'antes-on', 'antes2-a', 'antes2-b', 'antes2-on'].forEach(function (n) { $(n).addEventListener('change', leerReglas); });
  ['b', 'a'].forEach(function (n) { $(n).addEventListener('input', function () { generar(); pintar(); }); });
  $('antes-a').disabled = $('antes-b').disabled = $('antes2-a').disabled = $('antes2-b').disabled = true;

  generar();
  irA(1);

  // ── antecedente: aparición al entrar en pantalla, cifras que cuentan y el marco
  // que pasa de la foto satelital a los caminos y al grafo ──
  var anims = document.querySelectorAll('.ctx-anim');
  var marco = document.querySelector('[data-ctx-marco]');
  var PIES = {
    sat: 'Vista satelital: llegada a la mina Orcopampa.',
    cam: 'Foto satelital con sus posibles caminos. Los planos son reales.',
    graf: 'Solo las distancias se reducen al grafo que tenemos: cada instalación es un nodo xᵢ.'
  };
  var grafoCtx = document.querySelector('[data-grafo="ctx"]');
  var ciclo = 0, ciclando = false;
  function vista(v, auto) {
    if (!marco) return;
    Array.prototype.forEach.call(marco.querySelectorAll('[data-vista]'), function (b) {
      b.setAttribute('aria-selected', b.getAttribute('data-vista') === v ? 'true' : 'false');
      b.classList.toggle('cargando', !!auto && b.getAttribute('data-vista') === v);
    });
    Array.prototype.forEach.call(marco.querySelectorAll('.ctx-vista'), function (f) { f.classList.toggle('activa', f.getAttribute('data-v') === v); });
    marco.querySelector('[data-ctx-pie]').textContent = PIES[v];
    var video = marco.querySelector('video');
    if (video) { if (v === 'sat') { try { video.currentTime = 0; video.playbackRate = 1; var pr = video.play(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {} } else video.pause(); }
    if (v === 'graf') {
      grafo(grafoCtx, 'ctx');
      grafoCtx.classList.remove('dibuja'); void grafoCtx.getBoundingClientRect(); grafoCtx.classList.add('dibuja');
    }
  }
  if (marco) {
    marco.querySelector('[data-ctx-pie]').textContent = PIES.sat;
    Array.prototype.forEach.call(marco.querySelectorAll('[data-vista]'), function (b) {
      b.addEventListener('click', function () { clearTimeout(ciclo); ciclando = false; vista(b.getAttribute('data-vista'), false); });
    });
    grafo(grafoCtx, 'ctx');
  }
  // recorrido automático, una sola vez: satélite → caminos → grafo
  function recorrer() {
    if (ciclando) return;
    ciclando = true;
    vista('sat', false);
    // el video manda: al terminar pasa a los caminos y luego al grafo
    var video = marco.querySelector('video'), seguir = function () { vista('cam', true); ciclo = setTimeout(function () { vista('graf', false); ciclando = false; }, 3600); };
    if (video && !quieto) video.addEventListener('ended', function fin() { video.removeEventListener('ended', fin); if (ciclando) seguir(); });
    else ciclo = setTimeout(seguir, 3200);
  }
  function contar(elm) {
    var hasta = Number(elm.getAttribute('data-hasta')), miles = elm.hasAttribute('data-miles'), t0 = null, dur = 1400;
    if (quieto) return;
    function fmt(v) { v = Math.round(v); return miles ? v.toLocaleString('en-US') : String(v); }
    function cuadro(ahora) {
      if (t0 === null) t0 = ahora;
      var k = Math.min(1, (ahora - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      elm.textContent = fmt(hasta * e);
      if (k < 1) requestAnimationFrame(cuadro); else elm.textContent = fmt(hasta);
    }
    requestAnimationFrame(cuadro);
  }
  // pasar el cursor por una instalación la resalta en el grafo
  Array.prototype.forEach.call(document.querySelectorAll('.ctx-card[data-nodo]'), function (card) {
    function foco(si) {
      var n = grafoCtx && grafoCtx.querySelector('.caso-nodo[aria-label^="' + card.getAttribute('data-nodo') + ' "]');
      if (n) n.classList.toggle('foco', si);
    }
    card.addEventListener('mouseenter', function () { foco(true); });
    card.addEventListener('mouseleave', function () { foco(false); });
  });
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('visto');
        if (en.target === marco) recorrer();
        Array.prototype.forEach.call(en.target.querySelectorAll('.ctx-num'), contar);
        obs.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    Array.prototype.forEach.call(anims, function (e) { obs.observe(e); });
  } else Array.prototype.forEach.call(anims, function (e) { e.classList.add('visto'); });
})();
