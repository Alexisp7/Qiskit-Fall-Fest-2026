// Ejemplo rápido: trayectoria mínima con 3 ubicaciones (A=1, B=2, C=3).
// Un camión recorre las tres en T = 3 pasos (sin volver al inicio). Para cada
// orden posible se calcula
//   Q_C = B Σ_ij d_ij Σ_{t=1}^{T−1} x_{i,t} x_{j,t+1}
// con la expansión completa de los 9 pares y sus 2 términos, y la tabla x_{i,t}.
(function () {
  var svg = document.getElementById('tm-grafo');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var L = ['A', 'B', 'C'];                       // ubicación i = 1, 2, 3
  var IDX = { A: 1, B: 2, C: 3 };
  var POS = { A: [52, 52], B: [168, 52], C: [248, 160] };
  var D = { AB: 5, BC: 7, AC: 9 };
  var T = 3;

  function d(a, b) { return a === b ? 0 : (D[a + b] != null ? D[a + b] : D[b + a]); }
  function sub(t) { return '<sub>' + t + '</sub>'; }
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (padre || svg).appendChild(n);
    return n;
  }

  // ── las 6 rutas posibles ──
  var RUTAS = [['A', 'B', 'C'], ['A', 'C', 'B'], ['B', 'A', 'C'], ['B', 'C', 'A'], ['C', 'A', 'B'], ['C', 'B', 'A']];
  function coste(r) { return d(r[0], r[1]) + d(r[1], r[2]); }
  var elegida = 0;

  // ── triángulo con la ruta elegida resaltada ──
  function grafo() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var r = RUTAS[elegida];
    var enRuta = {};
    enRuta[[r[0], r[1]].sort().join('')] = 1; enRuta[[r[1], r[2]].sort().join('')] = 2;
    [['A', 'B'], ['B', 'C'], ['A', 'C']].forEach(function (p) {
      var a = POS[p[0]], b = POS[p[1]], k = p.join('');
      if (enRuta[k]) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
      var lado = k === 'AC' ? -1 : 1; // cada peso por fuera del triángulo
      el('text', { 'class': 'tm-peso', x: mx + lado * ey / l * 16, y: my - lado * ex / l * 16 + 6 }).textContent = d(p[0], p[1]);
    });
    L.forEach(function (k) {
      var p = POS[k], paso = r.indexOf(k) + 1;
      el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: 18 });
      el('text', { 'class': 'tm-letra', x: p[0], y: p[1] + 6 }).textContent = k;
      el('text', { 'class': 'tm-paso', x: p[0], y: p[1] + 34 }).textContent = 't=' + paso;
    });
  }

  // ── tarjetas de rutas ──
  var lista = document.getElementById('tm-rutas');
  function rutas() {
    var min = Math.min.apply(null, RUTAS.map(coste));
    lista.innerHTML = '';
    RUTAS.forEach(function (r, n) {
      var li = document.createElement('li');
      var c = coste(r);
      li.className = 'tm-ruta' + (n === elegida ? ' elegida' : '') + (c === min ? ' minima' : '');
      li.innerHTML = '<button type="button"><span class="tm-r-n">Q' + sub('C') + '<sup>' + (n + 1) + '</sup></span>' +
        '<span class="tm-r-camino">' + r.join(' → ') + '</span>' +
        '<span class="tm-r-coste">' + c + '</span>' + (c === min ? '<span class="tm-r-min">mínima</span>' : '') + '</button>';
      li.querySelector('button').addEventListener('click', function () { elegida = n; pintar(); });
      lista.appendChild(li);
    });
  }

  // ── Q_C expandida, término a término ──
  var outQ = document.getElementById('tm-q');
  var outT = document.getElementById('tm-terminos');
  var tabla = document.getElementById('tm-tabla');
  function detalle() {
    var r = RUTAS[elegida], B = Number(document.getElementById('tm-b').value) || 0;
    function x(i, t) { return r[t - 1] === L[i - 1] ? 1 : 0; }
    function xs(i, t) { return 'x' + sub(i + ',' + t); }
    var a = IDX[r[0]], b = IDX[r[1]], c = IDX[r[2]];
    var v1 = d(r[0], r[1]), v2 = d(r[1], r[2]), total = B * (v1 + v2);
    var abre = B === 1 ? '' : B + ' (', cierra = B === 1 ? '' : ')';
    outQ.innerHTML = '<span class="tm-q-nom">Q' + sub('C') + '<sup>' + (elegida + 1) + '</sup></span> = B <span class="tm-sigma chica"><sup>3</sup>Σ<sub>i,j</sub></span> d' + sub('ij') +
      ' <span class="tm-sigma chica"><sup>2</sup>Σ<sub>t=1</sub></span> x' + sub('i,t') + ' x' + sub('j,t+1') +
      ' = ' + abre + 'd' + sub('' + a + b) + ' + d' + sub('' + b + c) + cierra +
      ' = ' + abre + v1 + ' + ' + v2 + cierra + ' = <span class="tm-circulo">' + Math.round(total * 100) / 100 + '</span>';
    // los 9 pares d_ij, cada uno con sus dos términos (t = 1 y t = 2)
    var html = '';
    for (var j = 1; j <= 3; j++) for (var i = 1; i <= 3; i++) {
      var terms = [], vivo = false;
      for (var t = 1; t < T; t++) {
        var on = x(i, t) === 1 && x(j, t + 1) === 1;
        if (on) vivo = true;
        terms.push('<span class="tm-term' + (on ? ' on' : '') + '">' + xs(i, t) + xs(j, t + 1) + '</span>');
      }
      html += '<div class="tm-par' + (vivo ? ' vivo' : ' nulo') + '"><span class="tm-d' + (vivo ? ' on' : '') + '">d' + sub('' + i + j) + '</span>(' + terms.join(' + ') + ')</div>';
    }
    outT.innerHTML = html;
    // tabla sol: x_{i,t}
    var h = '<tr><th></th>' + [1, 2, 3].map(function (t) { return '<th>t' + sub(t) + '</th>'; }).join('') + '</tr>';
    L.forEach(function (k, n) {
      h += '<tr><th>' + k + ' (x' + sub(n + 1) + ')</th>' + [1, 2, 3].map(function (t) { var v = x(n + 1, t); return '<td class="' + (v ? 'uno' : '') + '">' + v + '</td>'; }).join('') + '</tr>';
    });
    tabla.innerHTML = h;
  }

  function pintar() { grafo(); rutas(); detalle(); }
  Array.prototype.forEach.call(document.querySelectorAll('.tm-distancias input[data-par]'), function (inp) {
    inp.addEventListener('input', function () { D[inp.getAttribute('data-par')] = Math.max(0, Number(inp.value) || 0); pintar(); });
  });
  document.getElementById('tm-b').addEventListener('input', detalle);
  pintar();
})();
