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
  var T = 13, s = 'x1', f = 'x1', antesOn = false, aA = 'x6', bB = 'x3';
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
    if (antesOn) { var nb = 0; r.forEach(function (k) { if (k === aA) p.antes += nb; if (k === bB) nb++; }); }
    p.total = p.tiempo + p.visita + p.salto + p.inicio + p.fin + p.antes;
    return p;
  }
  function costo(r) { return B() * distancia(r) + A() * castigos(r).total; }

  // ── la mejor ruta: programación dinámica sobre (t, lugar, visitados, veces que pasó por b) ──
  // Es exacta para el modelo: considera también saltos prohibidos y partir fuera de s,
  // cada uno con su castigo A.
  function optima(forzarSegundo) {
    var b = B(), a = A(), NB = antesOn ? T + 1 : 1, M = 1 << N, tam = N * M * NB;
    var capas = [], previo = [];
    var cap = new Float64Array(tam).fill(Infinity), prv = new Int32Array(tam).fill(-1);
    function id(i, m, nb) { return (i * M + m) * NB + nb; }
    L.forEach(function (k, i) {
      var nb = antesOn && k === bB ? 1 : 0;
      cap[id(i, 1 << i, nb)] = k === s ? 0 : a;
    });
    capas.push(cap); previo.push(prv);
    for (var t = 1; t < T; t++) {
      var sig = new Float64Array(tam).fill(Infinity), ps = new Int32Array(tam).fill(-1);
      for (var i = 0; i < N; i++) for (var m = 0; m < M; m++) {
        if (!(m & (1 << i))) continue;
        for (var nb = 0; nb < NB; nb++) {
          var v = cap[id(i, m, nb)];
          if (v === Infinity) continue;
          for (var j = 0; j < N; j++) {
            if (t === 1 && forzarSegundo && L[j] !== forzarSegundo) continue;
            var dd = d(L[i], L[j]), c = v + (dd != null && i !== j ? b * dd : a);
            if (antesOn && L[j] === aA) c += a * nb;
            var nb2 = antesOn && L[j] === bB ? Math.min(nb + 1, NB - 1) : nb;
            var k2 = id(j, m | (1 << j), nb2);
            if (c < sig[k2]) { sig[k2] = c; ps[k2] = id(i, m, nb); }
          }
        }
      }
      cap = sig; capas.push(sig); previo.push(ps);
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
    var r = modo === 1 ? [] : ruta, interactivo = modo === 3;
    svg.classList.toggle('quieto', !interactivo);
    var defs = el('defs', {}, svg), mid = 'caso-flecha-' + modo;
    var mk = el('marker', { id: mid, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'tm-punta' }, mk);
    var mk2 = el('marker', { id: mid + '-x', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
    el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': 'caso-punta-x' }, mk2);
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
      var ok = camino(r[t - 1], r[t]);
      el('line', { 'class': ok ? 'tm-dir' : 'caso-salto', x1: a0[0] + ex / l * R0 + nx, y1: a0[1] + ey / l * R0 + ny, x2: b0[0] - ex / l * (R0 + 2) + nx, y2: b0[1] - ey / l * (R0 + 2) + ny, 'marker-end': 'url(#' + mid + (ok ? '' : '-x') + ')' }, svg);
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

  // ── matriz x_{i,t}: 8 filas × T columnas ──
  function matriz(caja) {
    var cols = []; for (var t = 1; t <= T; t++) cols.push(t);
    var h = '<table class="caso-tabla"><tr><th></th>' + cols.map(function (t) { return '<th class="' + (t === ruta.length && ruta.length < T ? 'ahora' : '') + '">t' + sub(t) + '</th>'; }).join('') + '</tr>';
    L.forEach(function (k, n) {
      h += '<tr><th><span class="caso-tabla-x">x' + sub(n + 1) + '</span> ' + NOMBRE[k] + '</th>' + cols.map(function (t) {
        var v = ruta[t - 1] === k ? 1 : 0, vacio = t > ruta.length, es = nuevo && nuevo[0] === n + 1 && nuevo[1] === t;
        return '<td class="' + (v ? 'uno' : '') + (vacio ? ' vacio' : '') + (es ? ' nuevo' : '') + '" title="x' + (n + 1) + ',' + t + '">' + (vacio ? '·' : v) + '</td>';
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
  for (var tt = 2; tt <= 14; tt++) tOps.insertAdjacentHTML('beforeend', '<button type="button" data-t="' + tt + '" aria-pressed="' + (tt === T ? 'true' : 'false') + '">' + tt + '</button>');
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
  function tarjetasCastigo() {
    var p = castigos(ruta), a = A();
    var cnt = {}; ruta.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    var faltan = L.filter(function (k) { return !cnt[k]; });
    var saltos = []; for (var i = 1; i < ruta.length; i++) if (!camino(ruta[i - 1], ruta[i])) saltos.push(ruta[i - 1] + '→' + ruta[i] + ' (t=' + i + ')');
    var pares = []; if (antesOn) { var tb = []; ruta.forEach(function (k, t) { if (k === aA) tb.forEach(function (t0) { pares.push('x' + sub(IDX[bB] + ',' + t0) + 'x' + sub(IDX[aA] + ',' + (t + 1))); }); if (k === bB) tb.push(t + 1); }); }
    var T_ = [
      ['Temporalidad', 'Σ<sub>t</sub> (1 − Σ<sub>i</sub> x<sub>i,t</sub>)<sup>2</sup>', p.tiempo, p.tiempo ? p.tiempo + ' tiempos sin lugar' : 'cada t tiene exactamente un lugar'],
      ['Espacialidad', 'Σ<sub>i</sub> (1 − y<sub>i</sub>)<sup>2</sup>', p.visita, faltan.length ? 'sin visitar: ' + faltan.join(', ') : 'los 8 lugares aparecen' + (ruta.length > N ? ' (con retrocesos)' : '')],
      ['Saltos prohibidos', 'Σ<sub>t</sub> Σ<sub>(i,j)∉E</sub> x<sub>i,t</sub> x<sub>j,t+1</sub>', p.salto, saltos.length ? saltos.join(' · ') : 'todos los tramos usan caminos'],
      ['Empezar en ' + s, '1 − x<sub>' + IDX[s] + ',1</sub>', p.inicio, 'parte en ' + ruta[0]],
      ['Terminar en ' + f, '1 − x<sub>' + IDX[f] + ',' + T + '</sub>', p.fin, 'termina en ' + ruta[T - 1]],
      ['Visitar ' + aA + ' antes que ' + bB, 'Σ<sub>t</sub> Σ<sub>t′&lt;t</sub> x<sub>' + IDX[bB] + ',t′</sub> x<sub>' + IDX[aA] + ',t</sub>', antesOn ? p.antes : null, antesOn ? (pares.length ? pares.join(' + ') : 'nunca pasa por ' + bB + ' antes de ' + aA) : 'desactivada']
    ];
    $('castigos').innerHTML = T_.map(function (c, n) {
      var off = c[2] === null;
      return '<div class="caso-cast' + (off ? ' off' : c[2] ? ' roto' : ' ok') + '" style="--k:' + n + '"><div class="caso-cast-n">' + c[0] + '</div><div class="caso-f">' + c[1] + '</div><div class="caso-cast-d">' + c[3] + '</div><div class="caso-cast-v">' + (off ? '—' : '= ' + c[2]) + '</div></div>';
    }).join('');
    $('q-castigo').innerHTML = 'A · P = ' + usd(a) + ' · (' + [p.tiempo, p.visita, p.salto, p.inicio, p.fin].concat(antesOn ? [p.antes] : []).join(' + ') + ') = ' + usd(a) + ' · ' + p.total + ' = <span class="tm-circulo">' + usd(a * p.total) + '</span>';
  }

  // ── paso 6: resumen ──
  function resumen() {
    var D = distancia(ruta), p = castigos(ruta), q = B() * D + A() * p.total, n = indiceRuta();
    $('q-total').innerHTML = 'Q = B·D + A·P = ' + usd(B()) + ' · ' + kmCorto(D) + ' + ' + usd(A()) + ' · ' + p.total + ' = <span class="tm-circulo">' + usd(q) + '</span>' +
      (n === 0 ? ' <span class="tm-r-min">óptima</span>' : '');
    $('res-der').innerHTML =
      '<div class="caso-res-bloque"><div class="caso-col-rot">Ruta</div><div class="caso-res-ruta">' + ruta.map(function (k) { return 'x' + sub(IDX[k]); }).join(' → ') + '</div></div>' +
      '<div class="caso-res-bloque"><div class="caso-col-rot">Distancia</div><div class="caso-res-num">' + km(D) + ' <span>· ' + usd(B() * D) + '</span></div></div>' +
      '<div class="caso-res-bloque"><div class="caso-col-rot">Castigos</div><div class="caso-res-chips">' +
      [['tiempo', p.tiempo], ['visita', p.visita], ['salto', p.salto], ['inicio', p.inicio], ['fin', p.fin]].concat(antesOn ? [['antes', p.antes]] : []).map(function (c) {
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
    if (paso === 5) tarjetasCastigo();
    if (paso === 6) { grafo(raiz.querySelector('[data-grafo="6"]'), 6); matriz(raiz.querySelector('[data-mat="6"]')); resumen(); }
    nav();
  }
  function irA(n) {
    clearTimeout(animT); escena.classList.remove('animando');
    paso = n; escena.setAttribute('data-paso', n); raiz.setAttribute('data-en', n);
    pintar();
    if (n === 4) animar();
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
  ['s', 'f', 'antes-a', 'antes-b'].forEach(function (n) {
    $(n).innerHTML = L.map(function (k) { return '<option value="' + k + '">' + k + ' · ' + NOMBRE[k] + '</option>'; }).join('');
  });
  $('s').value = s; $('f').value = f; $('antes-a').value = aA; $('antes-b').value = bB;
  function leerReglas() {
    s = $('s').value; f = $('f').value; aA = $('antes-a').value; bB = $('antes-b').value; antesOn = $('antes-on').checked;
    $('antes-a').disabled = $('antes-b').disabled = !antesOn;
    generar(); pintar();
  }
  ['s', 'f', 'antes-a', 'antes-b', 'antes-on'].forEach(function (n) { $(n).addEventListener('change', leerReglas); });
  ['b', 'a'].forEach(function (n) { $(n).addEventListener('input', function () { generar(); pintar(); }); });
  $('antes-a').disabled = $('antes-b').disabled = true;

  generar();
  irA(1);
})();
