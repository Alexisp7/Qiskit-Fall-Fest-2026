// Ejemplo de 5 puntos: un repartidor sale del almacén A, visita B, C, D y E
// una vez y vuelve a A. Se elige el orden tocando los puntos; la función de
// coste se muestra expandida con cada distancia d_ij calculada a mano.
(function () {
  var svg = document.getElementById('plano');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';

  // ── datos: coordenadas en km ──
  var P = { A: [1, 1], B: [4, 5], C: [9, 5], D: [9, 1], E: [5, -2] };
  var NOMBRES = Object.keys(P);
  var INICIO = 'A';

  // d_ij = √((x_i − x_j)² + (y_i − y_j)²)
  function dist(i, j) {
    var dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1];
    return Math.sqrt(dx * dx + dy * dy);
  }
  function r2(v) { return Math.round(v * 100) / 100; }
  function num(v) { return Number.isInteger(r2(v)) ? String(r2(v)) : r2(v).toFixed(2); }
  function par(i, j) { return i < j ? i + j : j + i; }
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function d(i, j) { return 'd' + sub(par(i, j)); }

  // ── plano cartesiano ──
  var X0 = -1, X1 = 11, Y0 = -3, Y1 = 7, W = 480, H = 400, M = 34;
  function sx(x) { return M + (x - X0) / (X1 - X0) * (W - 2 * M); }
  function sy(y) { return H - M - (y - Y0) / (Y1 - Y0) * (H - 2 * M); }
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (padre || svg).appendChild(n);
    return n;
  }
  var gRejilla = el('g', {});
  for (var x = X0; x <= X1; x++) {
    el('line', { 'class': x === 0 ? 'eje' : 'rejilla', x1: sx(x), y1: sy(Y0), x2: sx(x), y2: sy(Y1) }, gRejilla);
    if (x % 2 === 1 || x === 0) el('text', { 'class': 'marca', x: sx(x), y: sy(0) + 13 }, gRejilla).textContent = x;
  }
  for (var y = Y0; y <= Y1; y++) {
    el('line', { 'class': y === 0 ? 'eje' : 'rejilla', x1: sx(X0), y1: sy(y), x2: sx(X1), y2: sy(y) }, gRejilla);
    if (y !== 0 && y % 2 !== 0) el('text', { 'class': 'marca', x: sx(0) - 9, y: sy(y) + 3 }, gRejilla).textContent = y;
  }
  el('text', { 'class': 'marca eje-nombre', x: sx(X1) - 4, y: sy(0) - 6 }, gRejilla).textContent = 'x (km)';
  el('text', { 'class': 'marca eje-nombre', x: sx(0) + 6, y: sy(Y1) + 10 }, gRejilla).textContent = 'y';

  var gTodas = el('g', {}), gRuta = el('g', {}), gNodos = el('g', {});
  // todas las conexiones posibles, tenues (grafo completo: 10 distancias)
  NOMBRES.forEach(function (i, a) {
    NOMBRES.slice(a + 1).forEach(function (j) {
      el('line', { 'class': 'posible', x1: sx(P[i][0]), y1: sy(P[i][1]), x2: sx(P[j][0]), y2: sy(P[j][1]) }, gTodas);
    });
  });
  var nodos = {};
  NOMBRES.forEach(function (k) {
    var g = el('g', { 'class': 'punto-g', tabindex: '0', role: 'button', 'aria-label': 'Punto ' + k }, gNodos);
    nodos[k] = el('circle', { 'class': 'punto' + (k === INICIO ? ' almacen' : ''), cx: sx(P[k][0]), cy: sy(P[k][1]), r: 11 }, g);
    el('text', { 'class': 'punto-etq', x: sx(P[k][0]), y: sy(P[k][1]) + 4 }, g).textContent = k;
    el('text', { 'class': 'punto-coord', x: sx(P[k][0]), y: sy(P[k][1]) - 17 }, g).textContent = '(' + P[k][0] + ', ' + P[k][1] + ')';
    g.addEventListener('click', function () { tocar(k); });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
  });

  // ── la mejor vuelta, por fuerza bruta (4! = 24 órdenes) ──
  function permutaciones(arr) {
    if (arr.length <= 1) return [arr];
    var out = [];
    arr.forEach(function (v, i) {
      permutaciones(arr.slice(0, i).concat(arr.slice(i + 1))).forEach(function (p) { out.push([v].concat(p)); });
    });
    return out;
  }
  function costeVuelta(r) {
    var c = 0;
    for (var i = 0; i < r.length; i++) c += dist(r[i], r[(i + 1) % r.length]);
    return c;
  }
  var mejor = null;
  permutaciones(NOMBRES.filter(function (k) { return k !== INICIO; })).forEach(function (p) {
    var r = [INICIO].concat(p), c = costeVuelta(r);
    if (!mejor || c < mejor.c - 1e-9) mejor = { r: r, c: c };
  });
  var TOTAL_ORDENES = 24;

  // ── tarjetas con cada d_ij calculada a mano ──
  var lista = document.getElementById('distancias');
  var tarjetas = {};
  NOMBRES.forEach(function (i, a) {
    NOMBRES.slice(a + 1).forEach(function (j) {
      var dx = P[i][0] - P[j][0], dy = P[i][1] - P[j][1], s = dx * dx + dy * dy, v = Math.sqrt(s);
      var exacta = Number.isInteger(v);
      var li = document.createElement('li');
      li.className = 'dij';
      li.innerHTML =
        '<div class="dij-cab"><span class="dij-nombre">' + d(i, j) + '</span><span class="dij-orden"></span></div>' +
        '<div class="dij-linea">= √((x' + sub(i) + ' − x' + sub(j) + ')² + (y' + sub(i) + ' − y' + sub(j) + ')²)</div>' +
        '<div class="dij-linea">= √((' + P[i][0] + ' − ' + P[j][0] + ')² + (' + P[i][1] + ' − ' + par2(P[j][1]) + ')²)</div>' +
        '<div class="dij-linea">= √(' + par2(dx) + '² + ' + par2(dy) + '²) = √(' + dx * dx + ' + ' + dy * dy + ') = √' + s + '</div>' +
        '<div class="dij-valor">' + (exacta ? '= ' + v : '≈ ' + num(v)) + ' km</div>';
      lista.appendChild(li);
      tarjetas[par(i, j)] = li;
    });
  });
  function par2(n) { return n < 0 ? '(' + n + ')' : String(n); }

  // ── estado: la ruta que arma la persona ──
  var ruta = [INICIO];
  var outSuma = document.getElementById('coste-suma');
  var outNum = document.getElementById('coste-num');
  var outTotal = document.getElementById('coste-total');
  var outEstado = document.getElementById('coste-estado');

  function tocar(k) {
    var ult = ruta[ruta.length - 1];
    if (k === INICIO && ruta.length === 1) return;
    if (k === ult && ruta.length > 1) ruta.pop();                          // deshacer
    else if (ruta.indexOf(k) >= 0) ruta = ruta.slice(0, Math.max(1, ruta.indexOf(k) + 1));
    else ruta.push(k);
    pintar();
  }
  function tramos() {
    var t = [];
    for (var i = 1; i < ruta.length; i++) t.push([ruta[i - 1], ruta[i]]);
    if (ruta.length === NOMBRES.length) t.push([ruta[ruta.length - 1], INICIO]); // vuelve al almacén
    return t;
  }
  function pintar() {
    var t = tramos(), completa = ruta.length === NOMBRES.length;
    while (gRuta.firstChild) gRuta.removeChild(gRuta.firstChild);
    t.forEach(function (tr, n) {
      var a = P[tr[0]], b = P[tr[1]];
      el('line', { 'class': 'tramo', x1: sx(a[0]), y1: sy(a[1]), x2: sx(b[0]), y2: sy(b[1]) }, gRuta);
      var mx = (sx(a[0]) + sx(b[0])) / 2, my = (sy(a[1]) + sy(b[1])) / 2;
      el('circle', { 'class': 'tramo-n', cx: mx, cy: my, r: 9 }, gRuta);
      el('text', { 'class': 'tramo-n-txt', x: mx, y: my + 3.5 }, gRuta).textContent = n + 1;
    });
    NOMBRES.forEach(function (k) { nodos[k].classList.toggle('visitado', ruta.indexOf(k) >= 0); });
    Object.keys(tarjetas).forEach(function (k) { tarjetas[k].classList.remove('usada'); tarjetas[k].querySelector('.dij-orden').textContent = ''; });
    t.forEach(function (tr, n) {
      var li = tarjetas[par(tr[0], tr[1])];
      li.classList.add('usada');
      li.querySelector('.dij-orden').textContent = 'tramo ' + (n + 1);
    });

    // suma expandida: C = d_AB + d_BC + … = 5 + 5 + … = total
    var total = t.reduce(function (s, tr) { return s + dist(tr[0], tr[1]); }, 0);
    // cada término en el orden en que se recorre (d_ij = d_ji)
    outSuma.innerHTML = t.length ? 'C = ' + t.map(function (tr) { return 'd' + sub(tr[0] + tr[1]); }).join(' + ') : 'C = 0';
    outNum.innerHTML = t.length ? '= ' + t.map(function (tr) { return num(dist(tr[0], tr[1])); }).join(' + ') : '';
    outTotal.textContent = num(total);
    if (!completa) {
      var faltan = NOMBRES.filter(function (k) { return ruta.indexOf(k) < 0; });
      outEstado.className = 'coste-estado';
      outEstado.textContent = ruta.length === 1 ? 'Toca los puntos en el orden en que el repartidor los visitaría.' : 'Faltan ' + faltan.join(', ') + '. Al visitar el último, la ruta vuelve sola al almacén A.';
    } else if (Math.abs(total - mejor.c) < 1e-9) {
      outEstado.className = 'coste-estado bien';
      outEstado.textContent = 'Es la vuelta más corta: ninguno de los ' + TOTAL_ORDENES + ' órdenes posibles da menos de ' + num(mejor.c) + ' km.';
    } else {
      outEstado.className = 'coste-estado';
      outEstado.textContent = 'Vuelta completa. La más corta mide ' + num(mejor.c) + ' km: esta recorre ' + num(total - mejor.c) + ' km de más.';
    }
  }

  document.getElementById('coste-optima').addEventListener('click', function () { ruta = mejor.r.slice(); pintar(); });
  document.getElementById('coste-reiniciar').addEventListener('click', function () { ruta = [INICIO]; pintar(); });
  pintar();
})();
