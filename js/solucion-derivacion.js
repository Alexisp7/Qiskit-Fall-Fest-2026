// Del QUBO al Ising, paso a paso: la derivación completa para el ejemplo de 3
// nodos con 2 restricciones (temporal y espacial). Cada paso escribe sus
// ecuaciones una tras otra, como en una pizarra, hasta llegar al Hamiltoniano
// como operador y a lo que busca el VQE. Las ecuaciones se dibujan con KaTeX.
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // el ejemplo: triángulo d12 = 5, d23 = 7, d13 = 9, con A = 100 y B = 1
  var N = 3, T = 3, A = 100, B = 1, D = [[0, 5, 9], [5, 0, 7], [9, 7, 0]];
  function k(i, t) { return (i - 1) * T + t; }          // k = (i − 1)T + t
  function matrices() {
    var M = N * T, J = [], h = [];
    for (var a = 0; a < M; a++) { J.push(new Array(M).fill(0)); h.push(0); }
    for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) {
      var hc = 0;
      for (var j = 1; j <= N; j++) {
        if (t === 1) hc += D[i - 1][j - 1];
        else if (t === T) hc += D[j - 1][i - 1];
        else hc += D[i - 1][j - 1] + D[j - 1][i - 1];
      }
      h[k(i, t) - 1] = B * (-hc / 4) + A * (1 - N / 2) + A * (1 - T / 2);
    }
    function pon(a, b, v) { J[a - 1][b - 1] += v; J[b - 1][a - 1] += v; }
    for (var t2 = 1; t2 < T; t2++) for (var i2 = 1; i2 <= N; i2++) for (var j2 = 1; j2 <= N; j2++) if (i2 !== j2) pon(k(i2, t2), k(j2, t2 + 1), B * D[i2 - 1][j2 - 1] / 4);
    for (var t3 = 1; t3 <= T; t3++) for (var i3 = 1; i3 <= N; i3++) for (var j3 = i3 + 1; j3 <= N; j3++) pon(k(i3, t3), k(j3, t3), A / 2);
    for (var i4 = 1; i4 <= N; i4++) for (var t4 = 1; t4 <= T; t4++) for (var u = t4 + 1; u <= T; u++) pon(k(i4, t4), k(i4, u), A / 2);
    return { J: J, h: h };
  }
  function n3(v) { return (Math.abs(v) < 1e-12 ? 0 : v).toFixed(2).replace(/\.00$/, '').replace('.', '{,}'); }
  function texMatrices() {
    var m = matrices(), M = N * T;
    var filas = m.J.map(function (f, a) {
      return f.map(function (v, b) {
        var s = n3(v);
        if ((a === 0 && b === 1) || (a === 1 && b === 0)) return '\\colorbox{#5b4a26}{$' + s + '$}';
        if ((a === 0 && b === 4) || (a === 4 && b === 0)) return '\\colorbox{#24406b}{$' + s + '$}';
        return v ? s : '\\color{#6f7891}{0}';
      }).join(' & ');
    }).join(' \\\\ ');
    var zs = []; for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) zs.push('z_{' + i + t + '}');
    return 'z=\\begin{pmatrix}' + zs.join('\\\\') + '\\end{pmatrix}\\quad J_{kl}=\\begin{pmatrix}' + filas + '\\end{pmatrix}\\quad h_k=\\begin{pmatrix}' + m.h.map(n3).join('\\\\') + '\\end{pmatrix}';
  }

  var C = '\\color{#C8A96E}';
  var PASOS = [
    { t: 'La función de coste en x', l: [
      ['Q(x) = B\\sum_{i,j}^{N} d_{ij}\\sum_{t=1}^{T-1} x_{i,t}\\,x_{j,t+1} \\;+\\; \\underbrace{A\\sum_{t=1}^{T}\\Big(1-\\sum_{i=1}^{N}x_{i,t}\\Big)^{2}}_{Q_{\\text{temporal}}} \\;+\\; \\underbrace{A\\sum_{i=1}^{N}\\Big(1-\\sum_{t=1}^{T}x_{i,t}\\Big)^{2}}_{Q_{\\text{espacial}}}', 'Distancia más las dos restricciones, cada una con su peso A.'],
      ['N = 3 \\text{ nodos},\\qquad T = 3 \\text{ tiempos},\\qquad x_{i,t}\\in\\{0,1\\}'],
      ['x_{i,t}:\\ \\{x_{11},x_{12},x_{13},x_{21},x_{22},x_{23},x_{31},x_{32},x_{33}\\}', 'Nueve variables binarias: una por lugar y tiempo.']
    ] },
    { t: 'Un qubit no sabe qué es 0 y 1', l: [
      ['Z\\,|0\\rangle = +1\\,|0\\rangle \\qquad Z\\,|1\\rangle = -1\\,|1\\rangle', 'Lo que un qubit entrega al medir Z son los valores +1 y −1.'],
      [C + '{x_{i,t} = \\dfrac{1 - z_{i,t}}{2}}, \\qquad z_{i,t}\\in\\{-1,+1\\}', 'Mapeo estándar: x = 0 → z = +1 · x = 1 → z = −1.']
    ] },
    { t: 'Productos y cuadrados en z', l: [
      ['x_{i,t}\\,x_{j,t+1} = \\tfrac14\\big(1 - z_{i,t} - z_{j,t+1} + z_{i,t}z_{j,t+1}\\big)'],
      ['x_{i,t}\\,x_{i,t\'} = \\tfrac14\\big(1 - z_{i,t} - z_{i,t\'} + z_{i,t}z_{i,t\'}\\big)'],
      ['\\Big(1-\\sum_{i} x_{i,t}\\Big)^{2} = 1 - 2\\sum_{i} x_{i,t} + \\sum_{i,j} x_{i,t}\\,x_{j,t}', 'Las tres piezas con las que se reescribe todo Q.']
    ] },
    { t: 'Q_C: la distancia', l: [
      ['B\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1}x_{i,t}x_{j,t+1} = \\tfrac{B}{4}\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1}\\big(1 - z_{i,t} - z_{j,t+1} + z_{i,t}z_{j,t+1}\\big)'],
      ['= B\\Big\\{\\tfrac{T-1}{4}\\sum_{i,j}d_{ij} \\;-\\; \\tfrac14\\sum_{i}\\sum_{t=1}^{T-1}' + C + '{a_i}\\,z_{i,t} \\;-\\; \\tfrac14\\sum_{j}\\sum_{t=1}^{T-1}' + C + '{b_j}\\,z_{j,t+1} \\;+\\; \\tfrac14\\sum_{t=1}^{T-1}\\sum_{i,j}d_{ij}\\,z_{i,t}z_{j,t+1}\\Big\\}'],
      [C + '{a_i = \\sum_j d_{ij}}, \\qquad ' + C + '{b_j = \\sum_i d_{ij}}', 'Lo que sale de cada lugar y lo que llega a él.'],
      ['\\sum_{j}\\sum_{t=1}^{T-1} b_j\\,z_{j,t+1} = \\sum_{i}\\sum_{t=2}^{T} b_i\\,z_{i,t}', 'Se corre el índice (t + 1 → t) y se renombra j → i.'],
      ['Q_C = B\\Big\\{\\tfrac{T-1}{4}\\sum_{i,j}d_{ij} - \\tfrac14\\sum_{i=1}^{N}\\Big[a_i z_{i,1} + b_i z_{i,T} + \\sum_{t=2}^{T-1}(a_i+b_i)\\,z_{i,t}\\Big] + \\tfrac14\\sum_{t=1}^{T-1}\\sum_{i,j}d_{ij}\\,z_{i,t}z_{j,t+1}\\Big\\}']
    ] },
    { t: 'Q espacial: cada lugar una vez', l: [
      ['\\sum_{i}\\Big(1-\\sum_{t}x_{i,t}\\Big)^{2} = \\sum_{i}\\Big(1 - 2\\sum_{t}x_{i,t} + \\sum_{t,t\'}x_{i,t}x_{i,t\'}\\Big)'],
      ['-2\\sum_{t}x_{i,t} = -\\sum_{t}(1 - z_{i,t}) = ' + C + '{-T + \\sum_{t} z_{i,t}}'],
      ['\\sum_{t,t\'}x_{i,t}x_{i,t\'} = \\Big(\\sum_t x_{i,t}\\Big)^{2} = \\tfrac14\\Big(T - \\sum_t z_{i,t}\\Big)^{2} = \\tfrac14\\Big(T^{2} - 2T\\sum_t z_{i,t} + \\big(\\textstyle\\sum_t z_{i,t}\\big)^{2}\\Big)'],
      ['\\Big(\\sum_t z_{i,t}\\Big)^{2} = ' + C + '{T + 2\\sum_{t<t\'} z_{i,t}z_{i,t\'}}', 'Porque z² = 1: los términos con t = t′ suman T.'],
      ['Q_{\\text{esp}} = A\\Big[\\tfrac{N}{4}\\big(4 - 3T + T^{2}\\big) + \\big(1 - \\tfrac{T}{2}\\big)\\sum_{i}\\sum_{t} z_{i,t} + \\tfrac12\\sum_{i}\\sum_{t<t\'} z_{i,t}z_{i,t\'}\\Big]', 'Se juntan las constantes: N(1 − ¾T + ¼T²).']
    ] },
    { t: 'Q temporal: un lugar por tiempo', l: [
      ['\\sum_{t}\\Big(1-\\sum_{i}x_{i,t}\\Big)^{2} \\quad\\Longrightarrow\\quad \\text{lo mismo con } N \\leftrightarrow T', 'La cuenta es idéntica: ahora la suma interna recorre los lugares.'],
      ['Q_{\\text{tem}} = A\\Big[\\tfrac{T}{4}\\big(4 - 3N + N^{2}\\big) + \\big(1 - \\tfrac{N}{2}\\big)\\sum_{i}\\sum_{t} z_{i,t} + \\tfrac12\\sum_{t}\\sum_{i<j} z_{i,t}z_{j,t}\\Big]']
    ] },
    { t: 'La función de coste en Ising', l: [
      ['\\boxed{\\begin{aligned} H(z) = {}& B\\Big\\{\\tfrac{T-1}{4}\\sum_{i,j}d_{ij} - \\tfrac14\\sum_{i=1}^{N}\\Big[a_i z_{i,1} + b_i z_{i,T} + \\sum_{t=2}^{T-1}(a_i+b_i)z_{i,t}\\Big] + \\tfrac14\\sum_{t=1}^{T-1}\\sum_{i,j}d_{ij}z_{i,t}z_{j,t+1}\\Big\\} \\\\ &+ A\\Big\\{\\tfrac{T}{4}(4-3N+N^{2}) + \\big(1-\\tfrac N2\\big)\\sum_{i}\\sum_{t}z_{i,t} + \\tfrac12\\sum_{t}\\sum_{i<j}z_{i,t}z_{j,t}\\Big\\} \\\\ &+ A\\Big\\{\\tfrac{N}{4}(4-3T+T^{2}) + \\big(1-\\tfrac T2\\big)\\sum_{i}\\sum_{t}z_{i,t} + \\tfrac12\\sum_{i}\\sum_{t<t\'}z_{i,t}z_{i,t\'}\\Big\\}\\end{aligned}}', 'La misma función, ahora en espines: lista para leerse como Hamiltoniano.']
    ] },
    { t: 'La constante, que se ignora', l: [
      ['\\text{cte} = B\\,\\frac{T-1}{4}\\sum_{i,j}d_{ij} + A\\,\\frac{T(N^{2}-3N+4)}{4} + A\\,\\frac{N(T^{2}-3T+4)}{4}', 'No depende de z: mueve toda la energía por igual y no cambia cuál es la mínima.'],
      ['B = 1,\\; A = 100,\\; \\sum_{i,j}d_{ij} = 2(5+7+9) = 42 \\;\\Rightarrow\\; \\text{cte} = 21 + 300 + 300 = ' + C + '{621}']
    ] },
    { t: 'Campos locales', l: [
      ['h_{i,t} = \\underbrace{B\\,h^{(c)}_{i,t}}_{\\text{costo}} + \\underbrace{A\\big(1-\\tfrac N2\\big)}_{\\text{temporal}} + \\underbrace{A\\big(1-\\tfrac T2\\big)}_{\\text{espacial}}'],
      ['h^{(c)}_{i,t} = -\\tfrac14\\begin{cases} \\sum_j d_{ij}, & t = 1 \\\\ \\sum_j (d_{ij} + d_{ji}), & 2\\le t\\le T-1 \\\\ \\sum_j d_{ji}, & t = T \\end{cases}'],
      ['h > 0:\\ z\\to +1\\ (x = 0) \\qquad h < 0:\\ z \\to -1\\ (x = 1)', 'El campo alinea al espín: un h negativo empuja a visitar.'],
      ['h_{1,1} = 1\\cdot\\Big(-\\tfrac{5+9}{4}\\Big) + 100\\big(1-\\tfrac32\\big) + 100\\big(1-\\tfrac32\\big) = -3{,}5 - 50 - 50 = ' + C + '{-103{,}5}']
    ] },
    { t: 'Acoplamientos', l: [
      ['J_{(i,t)(j,t+1)} = \\tfrac{B}{4}\\,d_{ij}', 'Costo de transición, para t = 1, …, T − 1.'],
      ['J_{(i,t)(j,t)} = \\tfrac{A}{2} \\quad (i<j,\\ \\text{mismo } t)', 'Se activa si dos lugares están en el mismo tiempo.'],
      ['J_{(i,t)(i,t\')} = \\tfrac{A}{2} \\quad (t<t\',\\ \\text{mismo } i)', 'Se activa si un lugar aparece en dos tiempos.'],
      ['J_{(1,1)(2,2)} = \\tfrac{5}{4} = ' + C + '{1{,}25} \\qquad J_{(1,1)(1,2)} = \\tfrac{100}{2} = ' + C + '{50}']
    ] },
    { t: 'De pares a una matriz', l: [
      ['H = \\text{cte} + \\sum_{i=1}^{N}\\sum_{t=1}^{T} h_{i,t}\\,z_{i,t} + \\sum_{\\text{pares únicos}} J_{(i,t)(j,t\')}\\,z_{i,t}\\,z_{j,t\'}'],
      ['M = N\\times T \\text{ variables}, \\qquad ' + C + '{k = (i-1)\\,T + t},\\quad k = 1,\\dots,M', 'Cada par (i, t) recibe un índice k distinto: para t entre 1 y T, cada i ocupa un bloque de T índices seguidos.'],
      ['H_{\\text{matriz}} = \\sum_{k=1}^{M} h_k z_k + \\sum_{k=1}^{M}\\sum_{l=k+1}^{M} J_{kl}\\,z_k z_l \\;=\\; z^{\\mathsf T} J\\, z + h^{\\mathsf T} z \\;(+\\,\\text{cte})', 'En zᵀJz, J lleva cada par una sola vez (k < l); si se escribe simétrica, cada lado vale la mitad.']
    ] },
    { t: 'Para nuestro ejemplo: N = 3, T = 3, M = 9', l: [
      ['z_{11}\\to 1,\\ z_{12}\\to 2,\\ z_{13}\\to 3,\\ z_{21}\\to 4,\\ z_{22}\\to 5,\\ z_{23}\\to 6,\\ z_{31}\\to 7,\\ z_{32}\\to 8,\\ z_{33}\\to 9', 'Por ejemplo z₂₃: (2 − 1)·3 + 3 = 6.'],
      ['J_{12}:\\ k = 1\\ (i=1,t=1),\\ l = 2\\ (i=1,t\'=2) \\Rightarrow \\text{restricción espacial} = \\tfrac A2 = 50 \\qquad J_{15}:\\ z_{11}, z_{22} \\Rightarrow \\tfrac B4 d_{12} = 1{,}25'],
      [function () { return texMatrices(); }, 'Las matrices completas (J simétrica, como en la foto). En dorado J₁₂, en azul J₁₅.']
    ] },
    { t: 'El Hamiltoniano como operador', l: [
      ['z_k \\;\\to\\; \\hat Z_k, \\qquad \\hat Z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}'],
      ['\\hat H = \\sum_{1\\le k<l\\le M} J_{kl}\\,\\hat Z_k\\otimes\\hat Z_l + \\sum_{k=1}^{M} h_k\\,\\hat Z_k', 'J y h ya los conocemos.'],
      ['\\hat Z_k\\otimes\\hat Z_l = \\begin{pmatrix} 1&0&0&0\\\\0&-1&0&0\\\\0&0&-1&0\\\\0&0&0&1\\end{pmatrix} \\;\\Rightarrow\\; ' + C + '{\\hat H \\text{ es diagonal en la base computacional}}', 'Solo aparecen Z y Z ⊗ Z.']
    ] },
    { t: 'Lo que busca el VQE', l: [
      ['\\min_{\\theta} E(\\theta) = \\min_{\\theta}\\,\\langle\\psi(\\theta)|\\,\\hat H\\,|\\psi(\\theta)\\rangle'],
      ['E(\\theta) = \\sum_{k<l} J_{kl}\\,\\langle\\psi(\\theta)|\\hat Z_k\\otimes\\hat Z_l|\\psi(\\theta)\\rangle + \\sum_{k=1}^{M} h_k\\,\\langle\\psi(\\theta)|\\hat Z_k|\\psi(\\theta)\\rangle'],
      ['\\text{¿Qué } |\\psi(\\theta)\\rangle \\text{ usamos?} \\quad \\Longrightarrow \\quad \\text{ansatz}', 'Es arbitrario: de hardware eficiente (HEA) o universales como TwoLocal o EfficientSU2. Eso es la etapa siguiente.']
    ] }
  ];

  function tex(s) {
    var src = typeof s === 'function' ? s() : s;
    if (window.katex) { try { return katex.renderToString(src, { displayMode: true, throwOnError: false }); } catch (e) {} }
    return '<code>' + src.replace(/</g, '&lt;') + '</code>';
  }

  window.montarDerivacion = function (caja) {
    caja.innerHTML = '<div class="dv-cab"><div class="mx-kicker">Del QUBO al Ising · paso a paso</div><h3 class="dv-tit">Demostración para 3 nodos y 2 restricciones</h3></div>' +
      '<div class="dv-pizarra"><div class="dv-paso-tit"></div><div class="dv-lineas" aria-live="polite"></div></div>' +
      '<div class="dv-controles"><button type="button" class="dv-btn" data-dv="atras" aria-label="Paso anterior">‹</button>' +
      '<button type="button" class="dv-btn dv-play" data-dv="play">▶ reproducir</button>' +
      '<button type="button" class="dv-btn" data-dv="sig" aria-label="Paso siguiente">›</button>' +
      '<ol class="dv-puntos"></ol><span class="dv-cuenta"></span></div>';
    var tit = caja.querySelector('.dv-paso-tit'), lin = caja.querySelector('.dv-lineas'), puntos = caja.querySelector('.dv-puntos');
    var play = caja.querySelector('[data-dv="play"]'), cuenta = caja.querySelector('.dv-cuenta');
    PASOS.forEach(function (p, n) {
      var li = document.createElement('li'), b = document.createElement('button');
      b.type = 'button'; b.title = p.t; b.setAttribute('aria-label', 'Paso ' + (n + 1) + ': ' + p.t);
      b.addEventListener('click', function () { parar(); ir(n, true); });
      li.appendChild(b); puntos.appendChild(li);
    });
    var actual = 0, tim = 0, sonando = false;
    function ir(n, escribir) {
      clearTimeout(tim);
      actual = Math.max(0, Math.min(PASOS.length - 1, n));
      var p = PASOS[actual];
      tit.innerHTML = '<span class="dv-num">' + String(actual + 1).padStart(2, '0') + '</span>' + p.t;
      lin.innerHTML = p.l.map(function (l, m) {
        return '<div class="dv-linea' + (escribir && !quieto ? ' oculta' : '') + '" data-m="' + m + '">' + tex(l[0]) + (l[1] ? '<p class="dv-nota">' + l[1] + '</p>' : '') + '</div>';
      }).join('');
      Array.prototype.forEach.call(puntos.querySelectorAll('button'), function (b, i) { b.className = i === actual ? 'actual' : i < actual ? 'hecho' : ''; });
      cuenta.textContent = (actual + 1) + ' / ' + PASOS.length;
      if (escribir && !quieto) escribirLineas(0);
      else if (sonando) tim = setTimeout(siguiente, 2600);
    }
    // cada línea aparece cuando la anterior ya se leyó
    function escribirLineas(m) {
      var l = lin.querySelector('[data-m="' + m + '"]');
      if (!l) { if (sonando) tim = setTimeout(siguiente, 2600); return; }
      Array.prototype.forEach.call(lin.querySelectorAll('.dv-linea'), function (x) { x.classList.remove('ultima'); });
      l.classList.remove('oculta'); l.classList.add('ultima');
      tim = setTimeout(function () { escribirLineas(m + 1); }, 1500 + Math.min(1600, l.textContent.length * 9));
    }
    function siguiente() {
      if (actual < PASOS.length - 1) ir(actual + 1, true);
      else parar();
    }
    function parar() { sonando = false; play.textContent = '▶ reproducir'; clearTimeout(tim); Array.prototype.forEach.call(lin.querySelectorAll('.dv-linea.oculta'), function (x) { x.classList.remove('oculta'); }); }
    play.addEventListener('click', function () {
      if (sonando) { parar(); return; }
      sonando = true; play.textContent = '❚❚ pausa';
      if (actual === PASOS.length - 1) ir(0, true); else ir(actual, true);
    });
    caja.querySelector('[data-dv="atras"]').addEventListener('click', function () { parar(); ir(actual - 1, true); });
    caja.querySelector('[data-dv="sig"]').addEventListener('click', function () { parar(); ir(actual + 1, true); });
    // KaTeX puede llegar después: se vuelve a dibujar el paso
    function listo() { if (window.katex) ir(actual, false); else setTimeout(listo, 300); }
    ir(0, false); listo();
  };
})();
