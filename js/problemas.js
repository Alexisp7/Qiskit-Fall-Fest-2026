// Grafo interactivo del reto: se arma una ruta tocando puntos conectados y la
// calculadora suma el gasto. Se compara con la ruta de menor costo (Dijkstra)
// entre el mismo inicio y el mismo final.
(function () {
  var svg = document.getElementById('grafo');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';

  // ── datos del grafo: posición de cada punto y peso de cada conexión ──
  var NODOS = {
    A: [60, 80], B: [175, 48], C: [295, 92], D: [420, 58], E: [112, 192], F: [232, 168],
    G: [360, 200], H: [70, 300], I: [205, 302], J: [330, 312], K: [438, 282]
  };
  var ARISTAS = [
    ['A', 'B', 4], ['B', 'C', 5], ['C', 'D', 3], ['A', 'E', 3], ['B', 'F', 6], ['C', 'F', 4],
    ['C', 'G', 5], ['D', 'G', 6], ['E', 'F', 2], ['F', 'G', 4], ['E', 'H', 4], ['F', 'I', 5],
    ['G', 'J', 3], ['G', 'K', 1], ['D', 'K', 7], ['H', 'I', 3], ['I', 'J', 4], ['J', 'K', 5],
    ['E', 'I', 6], ['F', 'J', 6]
  ];
  var peso = {}, vecinos = {};
  Object.keys(NODOS).forEach(function (k) { vecinos[k] = []; });
  ARISTAS.forEach(function (e) {
    peso[e[0] + e[1]] = peso[e[1] + e[0]] = e[2];
    vecinos[e[0]].push(e[1]); vecinos[e[1]].push(e[0]);
  });
  function clave(a, b) { return a < b ? a + b : b + a; }

  // ── dibujo ──
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (padre || svg).appendChild(n);
    return n;
  }
  var gAristas = el('g', {}), gPesos = el('g', {}), gNodos = el('g', {});
  var lineas = {}, pesos = {}, circulos = {};
  ARISTAS.forEach(function (e) {
    var a = NODOS[e[0]], b = NODOS[e[1]], k = clave(e[0], e[1]);
    lineas[k] = el('line', { 'class': 'arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gAristas);
    // el peso va a un lado del centro de la conexión, para no tapar la línea
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
    var px = mx - dy / l * 11, py = my + dx / l * 11;
    var t = el('text', { 'class': 'peso', x: px, y: py + 4 }, gPesos);
    t.textContent = e[2];
    pesos[k] = t;
  });
  Object.keys(NODOS).forEach(function (k) {
    var p = NODOS[k];
    var g = el('g', { 'class': 'nodo-g', tabindex: '0', role: 'button', 'aria-label': 'Punto ' + k }, gNodos);
    circulos[k] = el('circle', { 'class': 'nodo', cx: p[0], cy: p[1], r: 9 }, g);
    var t = el('text', { 'class': 'etq', x: p[0], y: p[1] - 15 }, g);
    t.textContent = k;
    g.addEventListener('click', function () { tocar(k); });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
  });

  // ── ruta de menor costo (Dijkstra) ──
  function optima(ini, fin) {
    var dist = {}, prev = {}, pend = Object.keys(NODOS);
    pend.forEach(function (k) { dist[k] = Infinity; });
    dist[ini] = 0;
    while (pend.length) {
      pend.sort(function (a, b) { return dist[a] - dist[b]; });
      var u = pend.shift();
      if (u === fin || dist[u] === Infinity) break;
      vecinos[u].forEach(function (v) {
        var d = dist[u] + peso[u + v];
        if (d < dist[v]) { dist[v] = d; prev[v] = u; }
      });
    }
    var camino = [fin];
    while (camino[0] !== ini) camino.unshift(prev[camino[0]]);
    return { costo: dist[fin], camino: camino };
  }

  // ── estado y calculadora ──
  var ruta = [];
  var outRuta = document.getElementById('calc-ruta');
  var outSuma = document.getElementById('calc-suma');
  var outTotal = document.getElementById('calc-total');
  var outEstado = document.getElementById('calc-estado');
  var aviso = 0;

  function costo(r) {
    var c = 0;
    for (var i = 1; i < r.length; i++) c += peso[r[i - 1] + r[i]];
    return c;
  }
  function tocar(k) {
    var ult = ruta[ruta.length - 1];
    if (!ruta.length) ruta = [k];
    else if (k === ult) ruta.pop();                                  // deshacer el último paso
    else if (ruta.indexOf(k) >= 0) ruta = ruta.slice(0, ruta.indexOf(k) + 1); // volver a ese punto
    else if (vecinos[ult].indexOf(k) >= 0) ruta.push(k);
    else return mensaje('No hay conexión directa entre ' + ult + ' y ' + k + '.', true);
    pintar();
  }
  function mensaje(txt, error) {
    outEstado.textContent = txt;
    outEstado.className = 'calc-estado' + (error ? ' error' : '');
    clearTimeout(aviso);
    if (error) aviso = setTimeout(pintar, 1800);
  }
  function pintar() {
    var enRuta = {};
    for (var i = 1; i < ruta.length; i++) enRuta[clave(ruta[i - 1], ruta[i])] = true;
    Object.keys(lineas).forEach(function (k) {
      lineas[k].classList.toggle('elegida', !!enRuta[k]);
      pesos[k].classList.toggle('elegido', !!enRuta[k]);
    });
    var ult = ruta[ruta.length - 1];
    Object.keys(circulos).forEach(function (k) {
      var c = circulos[k];
      c.classList.toggle('en-ruta', ruta.indexOf(k) >= 0);
      c.classList.toggle('inicio', ruta[0] === k);
      // los puntos a los que se puede seguir quedan resaltados
      c.classList.toggle('siguiente', !!ult && ruta.indexOf(k) < 0 && vecinos[ult].indexOf(k) >= 0);
    });
    outRuta.textContent = ruta.length ? ruta.join(' → ') : '—';
    var partes = [];
    for (var j = 1; j < ruta.length; j++) partes.push(peso[ruta[j - 1] + ruta[j]]);
    outSuma.textContent = partes.length ? partes.join(' + ') + ' =' : '';
    outTotal.textContent = costo(ruta);
    if (ruta.length < 2) {
      mensaje(ruta.length ? 'Sigue tocando puntos conectados (resaltados) para armar la ruta.' : 'Toca un punto para empezar la ruta.');
      return;
    }
    var o = optima(ruta[0], ult), c2 = costo(ruta);
    if (c2 === o.costo) mensaje('Es la ruta de menor costo entre ' + ruta[0] + ' y ' + ult + '.');
    else mensaje('Hay una ruta más barata entre ' + ruta[0] + ' y ' + ult + ': cuesta ' + o.costo + ' (' + (c2 - o.costo) + ' menos).');
  }

  document.getElementById('calc-optima').addEventListener('click', function () {
    var ini = ruta[0] || 'A', fin = ruta.length > 1 ? ruta[ruta.length - 1] : 'K';
    ruta = optima(ini, fin).camino;
    pintar();
  });
  document.getElementById('calc-reiniciar').addEventListener('click', function () { ruta = []; pintar(); });
  pintar();
})();
