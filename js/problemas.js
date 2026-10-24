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
  var POS = { A: [52, 52], B: [168, 52], C: [248, 160] };
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
    tramos.forEach(function (tr) { enRuta[tr.slice().sort().join('')] = true; });
    [['A', 'B'], ['B', 'C'], ['A', 'C']].forEach(function (p) {
      var a = POS[p[0]], b = POS[p[1]], k = p.join('');
      if (enRuta[k]) el('line', { 'class': 'tm-resalte', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      else el('line', { 'class': 'tm-arista', x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
      var lado = k === 'AC' ? -1 : 1; // cada peso por fuera del triángulo
      el('text', { 'class': 'tm-peso', x: mx + lado * ey / l * 16, y: my - lado * ex / l * 16 + 6 }).textContent = d(p[0], p[1]);
    });
    tramos.forEach(function (tr) {
      var a = POS[tr[0]], b = POS[tr[1]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey), R0 = 27;
      el('line', { 'class': 'tm-dir', x1: a[0] + ex / l * R0, y1: a[1] + ey / l * R0, x2: b[0] - ex / l * (R0 + 2), y2: b[1] - ey / l * (R0 + 2), 'marker-end': 'url(#tm-flecha)' });
    });
    var aqui = r.length < T ? r[r.length - 1] : null;
    L.forEach(function (k, n) {
      var p = POS[k], paso = r.indexOf(k) + 1;
      var g = el('g', { 'class': 'tm-nodo-g' + (paso ? ' visitado' : ''), tabindex: '0', role: 'button', 'aria-label': 'Ir a ' + k });
      // "estás aquí": el último nodo de una ruta a medias lleva un anillo que late
      if (k === aqui) el('circle', { 'class': 'tm-aqui', cx: p[0], cy: p[1], r: 24 }, g);
      el('circle', { 'class': 'tm-nodo', cx: p[0], cy: p[1], r: 24 }, g);
      el('text', { 'class': 'tm-letra-fondo', x: p[0], y: p[1] + 15 }, g).textContent = k;
      if (paso) {
        var t = el('text', { 'class': 'tm-xit', x: p[0] - 2, y: p[1] + 5 }, g);
        t.appendChild(document.createTextNode('x'));
        el('tspan', { 'class': 'tm-xit-sub', dy: '4' }, t).textContent = (n + 1) + ',' + paso;
      }
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
      : 'Ruta completa en t = ' + T + ' · toca un nodo para empezar otra';
    cont.innerHTML = '<span class="tm-c-t">t = ' + Math.max(n, 0) + '<span class="tm-c-de"> / ' + T + '</span></span><span class="tm-c-puntos">' + puntos + '</span><span class="tm-c-txt">' + txt + '</span>';
  }
  function aviso(txt) {
    var e = cont.querySelector('.tm-c-txt');
    e.textContent = txt; e.classList.add('error');
    clearTimeout(avisoT); avisoT = setTimeout(contador, 1600);
  }

  // ── tarjetas de rutas ──
  var lista = document.getElementById('tm-rutas');
  function rutas() {
    var min = Math.min.apply(null, RUTAS.map(coste)), elegida = indiceRuta();
    var B = Number(document.getElementById('tm-b').value) || 0;
    lista.innerHTML = '';
    RUTAS.forEach(function (r, n) {
      var li = document.createElement('li');
      var c = coste(r);
      li.className = 'tm-ruta' + (n === elegida ? ' elegida' : '') + (c === min ? ' minima' : '');
      li.innerHTML = '<button type="button"><span class="tm-r-n">Q' + sub('C') + '<sup>' + (n + 1) + '</sup></span>' +
        '<span class="tm-r-camino">' + r.join(' → ') + '</span>' +
        '<span class="tm-r-coste">' + usd(B * c) + '</span>' + (c === min ? '<span class="tm-r-min">mínima</span>' : '') + '</button>';
      li.querySelector('button').addEventListener('click', function () { ruta = r.slice(); nuevo = null; pintar(); });
      lista.appendChild(li);
    });
  }

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
    tabla: tabla, q: outQ, terminos: outT
  };
  var CASA = {};
  Object.keys(MOV).forEach(function (k) { CASA[k] = document.createComment(k); MOV[k].parentNode.insertBefore(CASA[k], MOV[k]); });
  var SLOTS = { 1: { dist: 'dist', grafo: 'grafo-1' }, 2: { contador: 'contador', grafo: 'grafo-2', tabla: 'tabla' }, 3: { q: 'q', terminos: 'terminos' }, 4: {} };
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

  function pintar() { grafo(); contador(); rutas(); detalle(); nocero(); nav(); }
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
