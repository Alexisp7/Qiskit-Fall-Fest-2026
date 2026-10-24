// Ejemplo en estilo cuaderno: 5 puntos numerados, sus distancias d_ij en una
// matriz editable (simétrica, con la diagonal en 0) y la función de coste
//   f_C = B Σ_ij d_ij Σ_t x_{i,t} x_{j,t+1}
// Se arma una vuelta tocando los puntos y se ve la suma expandida. Una casilla
// vacía significa que no hay conexión directa entre esos dos puntos.
(function () {
  var svg = document.getElementById('cuaderno-grafo');
  if (!svg) return;
  var NS = 'http://www.w3.org/2000/svg';
  var N = 5;
  var POS = { 1: [40, 150], 2: [140, 48], 3: [245, 140], 4: [150, 252], 5: [420, 140] };
  // distancias iniciales (null = sin conexión directa)
  var D = [
    [0, 4, 5, 3, null],
    [4, 0, 3, 6, 8],
    [5, 3, 0, 4, 5],
    [3, 6, 4, 0, 7],
    [null, 8, 5, 7, 0]
  ];
  function d(i, j) { return D[i - 1][j - 1]; }
  function sub(t) { return '<sub>' + t + '</sub>'; }

  // ── grafo ──
  function el(tag, attrs, padre) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    (padre || svg).appendChild(n);
    return n;
  }
  var gAristas = el('g', {}), gRuta = el('g', {}), gEtq = el('g', {}), gNodos = el('g', {});
  var circulos = {};
  for (var k = 1; k <= N; k++) (function (k) {
    var p = POS[k];
    var g = el('g', { 'class': 'c-nodo-g', tabindex: '0', role: 'button', 'aria-label': 'Punto ' + k }, gNodos);
    circulos[k] = el('circle', { 'class': 'c-nodo', cx: p[0], cy: p[1], r: 7 }, g);
    var dx = p[0] < 100 ? -18 : p[0] > 380 ? 20 : 0, dy = p[1] < 80 ? -14 : p[1] > 220 ? 30 : -14;
    el('text', { 'class': 'c-num', x: p[0] + dx, y: p[1] + dy }, g).textContent = k;
    g.addEventListener('click', function () { tocar(k); });
    g.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); tocar(k); } });
  })(k);

  function dibujarAristas() {
    [gAristas, gEtq].forEach(function (g) { while (g.firstChild) g.removeChild(g.firstChild); });
    for (var i = 1; i <= N; i++) for (var j = i + 1; j <= N; j++) {
      if (d(i, j) == null) continue;
      var a = POS[i], b = POS[j];
      el('line', { 'class': 'c-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gAristas);
      // etiqueta d_ij = valor, a un lado del centro de la arista
      // las aristas que se cruzan (1–3 y 2–4) llevan su etiqueta lejos del cruce
      var f = { '13': 0.28, '24': 0.72 }['' + i + j] || 0.5;
      var mx = a[0] + (b[0] - a[0]) * f, my = a[1] + (b[1] - a[1]) * f, ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1;
      var t = el('text', { 'class': 'c-dij', x: mx - ey / l * 14, y: my + ex / l * 14 + 5 }, gEtq);
      t.appendChild(document.createTextNode('d'));
      var s = el('tspan', { 'class': 'c-sub', dy: '4' }, t); s.textContent = '' + i + j;
      var v = el('tspan', { dy: '-4' }, t); v.textContent = '=' + d(i, j);
    }
  }

  // ── matriz editable ──
  var matriz = document.getElementById('matriz');
  var celdas = {};
  // encabezados: columnas j arriba y filas i a la izquierda
  function cabecera(txt, clase) {
    var h = document.createElement('div');
    h.className = 'm-cab ' + clase;
    h.textContent = txt;
    matriz.appendChild(h);
  }
  cabecera('', 'esquina');
  for (var c = 1; c <= N; c++) cabecera(c, 'col');
  for (var i = 1; i <= N; i++) for (var j = 1; j <= N; j++) (function (i, j) {
    if (j === 1) cabecera(i, 'fila');
    var celda = document.createElement('div');
    celda.className = 'm-celda' + (i === j ? ' diag' : j < i ? ' espejo' : '');
    var rot = document.createElement('span');
    rot.className = 'm-rot';
    rot.innerHTML = 'd' + sub('' + i + j) + '=';
    celda.appendChild(rot);
    var inp = document.createElement('input');
    inp.type = 'number'; inp.min = '0'; inp.step = '1'; inp.inputMode = 'numeric';
    inp.setAttribute('aria-label', 'Distancia d' + i + j);
    inp.placeholder = '∞';
    if (i === j) { inp.value = '0'; inp.disabled = true; }
    else if (j < i) { inp.readOnly = true; inp.tabIndex = -1; }
    inp.value = d(i, j) == null ? '' : d(i, j);
    // al escribir d_ij se copia en d_ji: la matriz se mantiene simétrica
    inp.addEventListener('input', function () {
      var v = inp.value === '' ? null : Math.max(0, Number(inp.value));
      D[i - 1][j - 1] = D[j - 1][i - 1] = v;
      celdas[j + '-' + i].value = v == null ? '' : v;
      dibujarAristas(); pintar();
    });
    celda.appendChild(inp);
    matriz.appendChild(celda);
    celdas[i + '-' + j] = inp;
  })(i, j);

  // ── la vuelta más corta (fuerza bruta, empezando en el primer punto elegido) ──
  function permutaciones(a) {
    if (a.length <= 1) return [a];
    var out = [];
    a.forEach(function (v, i) { permutaciones(a.slice(0, i).concat(a.slice(i + 1))).forEach(function (p) { out.push([v].concat(p)); }); });
    return out;
  }
  function costeVuelta(r) {
    var c = 0;
    for (var i = 0; i < r.length; i++) { var v = d(r[i], r[(i + 1) % r.length]); if (v == null) return Infinity; c += v; }
    return c;
  }
  function mejorDesde(ini) {
    var resto = [1, 2, 3, 4, 5].filter(function (k) { return k !== ini; }), best = null;
    permutaciones(resto).forEach(function (p) {
      var r = [ini].concat(p), c = costeVuelta(r);
      if (!best || c < best.c) best = { r: r, c: c };
    });
    return best;
  }

  // ── la vuelta que arma la persona ──
  var ruta = [];
  var outSuma = document.getElementById('c-suma');
  var outNum = document.getElementById('c-num');
  var outTotal = document.getElementById('c-total');
  var outEstado = document.getElementById('c-estado');
  var inpB = document.getElementById('c-b');

  function tocar(k) {
    var ult = ruta[ruta.length - 1];
    if (k === ult) ruta.pop();
    else if (ruta.indexOf(k) >= 0) ruta = ruta.slice(0, ruta.indexOf(k) + 1);
    else ruta.push(k);
    pintar();
  }
  function tramos() {
    var t = [];
    for (var i = 1; i < ruta.length; i++) t.push([ruta[i - 1], ruta[i]]);
    if (ruta.length === N) t.push([ruta[N - 1], ruta[0]]); // la vuelta se cierra sola
    return t;
  }
  function num(v) { return Math.round(v * 100) / 100; }
  function pintar() {
    var t = tramos(), B = Number(inpB.value) || 0;
    while (gRuta.firstChild) gRuta.removeChild(gRuta.firstChild);
    t.forEach(function (tr) {
      var a = POS[tr[0]], b = POS[tr[1]];
      el('line', { 'class': 'c-tramo' + (d(tr[0], tr[1]) == null ? ' roto' : ''), x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, gRuta);
    });
    for (var k = 1; k <= N; k++) { circulos[k].classList.toggle('en-ruta', ruta.indexOf(k) >= 0); circulos[k].classList.toggle('inicio', ruta[0] === k); }
    Object.keys(celdas).forEach(function (c) { celdas[c].parentNode.classList.remove('usada'); });
    t.forEach(function (tr) {
      celdas[tr[0] + '-' + tr[1]].parentNode.classList.add('usada');
      celdas[tr[1] + '-' + tr[0]].parentNode.classList.add('usada');
    });

    // f_C = B ( d_ab + d_bc + … ) = B ( valores ) = total
    var faltante = t.some(function (tr) { return d(tr[0], tr[1]) == null; });
    var suma = t.reduce(function (s, tr) { return s + (d(tr[0], tr[1]) || 0); }, 0);
    outSuma.innerHTML = t.length ? 'f<sub>C</sub> = B ( ' + t.map(function (tr) { return 'd' + sub('' + tr[0] + tr[1]); }).join(' + ') + ' )' : 'f<sub>C</sub> = 0';
    outNum.innerHTML = t.length ? '= ' + B + ' ( ' + t.map(function (tr) { var v = d(tr[0], tr[1]); return v == null ? '∞' : v; }).join(' + ') + ' )' : '';
    outTotal.textContent = faltante ? '∞' : num(B * suma);

    explicito(t, B);
    if (!ruta.length) return estado('Toca los puntos en el orden de la vuelta. Al tocar el quinto, la vuelta se cierra sola.');
    if (faltante) return estado('Esa vuelta usa una conexión que no existe (casilla vacía en la matriz).', true);
    if (ruta.length < N) return estado('Faltan ' + [1, 2, 3, 4, 5].filter(function (k) { return ruta.indexOf(k) < 0; }).join(', ') + '.');
    var m = mejorDesde(ruta[0]);
    if (m.c === Infinity) return estado('Con estas distancias no hay ninguna vuelta posible.', true);
    if (suma === m.c) estado('Es la vuelta de menor coste: de las 24 posibles desde el punto ' + ruta[0] + ', ninguna baja de ' + num(B * m.c) + '.', false, true);
    else estado('Vuelta completa. La de menor coste da ' + num(B * m.c) + ': esta suma ' + num(B * (suma - m.c)) + ' de más.');
  }
  // ── cálculo explícito de f_C con cada x_{i,t} ──
  // x_{i,t} = 1 si el punto i se visita en el turno t. Con la vuelta completa,
  // el turno siguiente al 5 es el 1 (la vuelta regresa al inicio).
  var tablaX = document.getElementById('xit');
  var gridEx = document.getElementById('ex-grid');
  var finalEx = document.getElementById('ex-final');
  function xs(i, t) { return '<span class="xv">x' + sub(i + ',' + t) + '</span>'; }
  function explicito(t, B) {
    var completa = ruta.length === N;
    function x(i, tt) { return ruta[tt - 1] === i ? 1 : 0; }
    function sig(tt) { return tt === N ? (completa ? 1 : null) : tt + 1; }
    // tabla de x_{i,t}
    var h = '<tr><th></th>' + [1, 2, 3, 4, 5].map(function (tt) { return '<th>t=' + tt + '</th>'; }).join('') + '</tr>';
    for (var i = 1; i <= N; i++) {
      h += '<tr><th>i=' + i + '</th>';
      for (var tt = 1; tt <= N; tt++) h += '<td class="' + (x(i, tt) ? 'uno' : '') + '">' + x(i, tt) + '</td>';
      h += '</tr>';
    }
    tablaX.innerHTML = h;
    // d_ij ( x_{i,1} x_{j,2} + … + x_{i,5} x_{j,1} ), para cada par i, j
    var html = '';
    for (var i2 = 1; i2 <= N; i2++) for (var j = 1; j <= N; j++) {
      if (j === 1) html += '<div class="ex-grupo">i = ' + i2 + ' · sale del punto ' + i2 + '</div>';
      var terminos = [], activo = false;
      for (var t2 = 1; t2 <= N; t2++) {
        var s2 = sig(t2);
        var on = s2 != null && x(i2, t2) === 1 && x(j, s2) === 1;
        if (on) activo = true;
        terminos.push('<span class="term' + (on ? ' on' : '') + '">' + xs(i2, t2) + xs(j, s2 == null ? 6 : s2) + '</span>');
      }
      var v = d(i2, j);
      html += '<div class="ex-celda' + (activo ? ' activa' : ' nula') + '">' +
        '<span class="ex-d' + (activo ? ' on' : '') + '">d' + sub('' + i2 + j) + '</span>' +
        '<span class="ex-paren">(</span>' + terminos.join('<span class="ex-mas">+</span>') + '<span class="ex-paren">)</span>' +
        '<span class="ex-valor">' + (activo ? '= ' + (v == null ? '∞' : v) : '= 0') + '</span></div>';
    }
    gridEx.innerHTML = html;
    // resultado: solo sobreviven los d_ij de los tramos recorridos
    var vivos = t.map(function (tr) { return tr; });
    if (!vivos.length) { finalEx.innerHTML = 'f<sub>C</sub> = 0'; return; }
    var falta = vivos.some(function (tr) { return d(tr[0], tr[1]) == null; });
    var suma = vivos.reduce(function (s, tr) { return s + (d(tr[0], tr[1]) || 0); }, 0);
    finalEx.innerHTML = 'f<sub>C</sub> = B ( ' + vivos.map(function (tr) { return 'd' + sub('' + tr[0] + tr[1]); }).join(' + ') + ' ) = ' + B + ' ( ' +
      vivos.map(function (tr) { var vv = d(tr[0], tr[1]); return vv == null ? '∞' : vv; }).join(' + ') + ' ) = <span class="ex-circulo">' + (falta ? '∞' : num(B * suma)) + '</span>';
  }
  function estado(txt, error, bien) {
    outEstado.textContent = txt;
    outEstado.className = 'c-estado' + (error ? ' error' : '') + (bien ? ' bien' : '');
  }

  inpB.addEventListener('input', pintar);
  document.getElementById('c-optima').addEventListener('click', function () {
    var m = mejorDesde(ruta[0] || 1);
    if (m.c === Infinity) return estado('Con estas distancias no hay ninguna vuelta posible.', true);
    ruta = m.r; pintar();
  });
  document.getElementById('c-reiniciar').addEventListener('click', function () { ruta = []; pintar(); });
  dibujarAristas();
  pintar();
})();
