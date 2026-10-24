// Del QUBO al Ising, de corrido: la derivación completa para el ejemplo de 3
// nodos con 2 restricciones (temporal y espacial), sin saltar pasos, hasta las
// matrices J y h. Al final se comprueba con números que H(z) da lo mismo que
// Q(x) y que las restricciones castigan lo que deben. Ecuaciones con KaTeX.
(function () {
  // el ejemplo: triángulo d12 = 5, d23 = 7, d13 = 9, con A = 100 y B = 1
  var N = 3, T = 3, A = 100, B = 1, D = [[0, 5, 9], [5, 0, 7], [9, 7, 0]];
  function k(i, t) { return (i - 1) * T + t; }          // k = (i − 1)T + t
  function sumaD() { var s = 0; for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) s += D[i][j]; return s; }
  var CTE = B * (T - 1) / 4 * sumaD() + A * T * (N * N - 3 * N + 4) / 4 + A * N * (T * T - 3 * T + 4) / 4;

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
  var MAT = matrices();
  // el mismo Hamiltoniano del triángulo, para la demostración del ansatz
  window.HAM_TRI = { J: MAT.J, h: MAT.h, cte: CTE, N: N, T: T };
  // Q(x) directo y H(z) con las matrices, para comprobar
  function Qx(x) {   // x[i][t], 1-indexado
    var c = 0, tem = 0, esp = 0;
    for (var t = 1; t < T; t++) for (var i = 1; i <= N; i++) for (var j = 1; j <= N; j++) c += D[i - 1][j - 1] * x[i][t] * x[j][t + 1];
    for (var t2 = 1; t2 <= T; t2++) { var s = 0; for (var i2 = 1; i2 <= N; i2++) s += x[i2][t2]; tem += (1 - s) * (1 - s); }
    for (var i3 = 1; i3 <= N; i3++) { var s2 = 0; for (var t3 = 1; t3 <= T; t3++) s2 += x[i3][t3]; esp += (1 - s2) * (1 - s2); }
    return { c: B * c, tem: tem, esp: esp, total: B * c + A * tem + A * esp };
  }
  function Hz(x) {
    var z = []; for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) z.push(1 - 2 * x[i][t]);
    var hz = 0, jz = 0;
    for (var a = 0; a < z.length; a++) { hz += MAT.h[a] * z[a]; for (var b = a + 1; b < z.length; b++) jz += MAT.J[a][b] * z[a] * z[b]; }
    return { z: z, hz: hz, jz: jz, total: CTE + hz + jz };
  }
  function unos(pares) {   // pares [i, t] con x = 1; el resto 0
    var x = {}; for (var i = 1; i <= N; i++) { x[i] = {}; for (var t = 1; t <= T; t++) x[i][t] = 0; }
    pares.forEach(function (p) { x[p[0]][p[1]] = 1; });
    return x;
  }
  function n(v) { var r = Math.round(v * 100) / 100; return (Math.abs(r) < 1e-12 ? 0 : r).toString().replace('.', '{,}'); }

  function texMatrices() {
    var M = N * T;
    var filas = MAT.J.map(function (f, a) {
      return f.map(function (v, b) {
        var s = n(v);
        if ((a === 0 && b === 1) || (a === 1 && b === 0)) return '\\colorbox{#F1E4C6}{$' + s + '$}';
        if ((a === 0 && b === 4) || (a === 4 && b === 0)) return '\\colorbox{#DCE7F5}{$' + s + '$}';
        return v ? s : '\\color{#B0AAA0}{0}';
      }).join(' & ');
    }).join(' \\\\ ');
    var zs = []; for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) zs.push('z_{' + i + t + '}');
    return 'z=\\begin{pmatrix}' + zs.join('\\\\') + '\\end{pmatrix}\\quad J_{kl}=\\begin{pmatrix}' + filas + '\\end{pmatrix}\\quad h_k=\\begin{pmatrix}' + MAT.h.map(n).join('\\\\') + '\\end{pmatrix}';
  }
  function texCaso(nombre, pares, txt) {
    var x = unos(pares), q = Qx(x), hz = Hz(x);
    var xs = []; for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) if (x[i][t]) xs.push('x_{' + i + t + '}');
    return [nombre,
      xs.join(' = ') + ' = 1,\\ \\text{el resto } 0 \\qquad z = (' + hz.z.join(',\\,') + ')',
      'Q(x) = \\underbrace{' + n(q.c) + '}_{Q_C} + 100\\cdot\\underbrace{' + q.tem + '}_{Q_{\\text{tem}}} + 100\\cdot\\underbrace{' + q.esp + '}_{Q_{\\text{esp}}} = ' + C + '{' + n(q.total) + '}',
      'H(z) = \\underbrace{' + n(CTE) + '}_{\\text{cte}} + \\underbrace{(' + n(hz.hz) + ')}_{\\sum h_k z_k} + \\underbrace{(' + n(hz.jz) + ')}_{\\sum_{k<l} J_{kl} z_k z_l} = ' + C + '{' + n(hz.total) + '} \\quad ' + (Math.abs(q.total - hz.total) < 1e-9 ? '\\checkmark' : '\\times'),
      txt
    ];
  }

  var C = '\\color{#8C6D33}';
  var S = [
    { t: 'La función de coste en x', l: [
      ['Q(x) = B\\sum_{i,j}^{N} d_{ij}\\sum_{t=1}^{T-1} x_{i,t}\\,x_{j,t+1} \\;+\\; \\underbrace{A\\sum_{t=1}^{T}\\Big(1-\\sum_{i=1}^{N}x_{i,t}\\Big)^{2}}_{Q_{\\text{temporal}}} \\;+\\; \\underbrace{A\\sum_{i=1}^{N}\\Big(1-\\sum_{t=1}^{T}x_{i,t}\\Big)^{2}}_{Q_{\\text{espacial}}}', 'Distancia más dos restricciones: un lugar por tiempo (temporal) y cada lugar una vez (espacial).'],
      ['N = 3 \\text{ nodos},\\qquad T = 3 \\text{ tiempos},\\qquad x_{i,t}\\in\\{0,1\\},\\qquad B = 1,\\quad A = 100 \\gg B\\,d_{\\max}'],
      ['x_{i,t}:\\ \\{x_{11},x_{12},x_{13},x_{21},x_{22},x_{23},x_{31},x_{32},x_{33}\\}', 'Nueve variables binarias: una por lugar y tiempo.']
    ] },
    { t: 'Un qubit no sabe qué es 0 y 1: mapeo Ising', l: [
      ['Z\\,|0\\rangle = +1\\,|0\\rangle \\qquad Z\\,|1\\rangle = -1\\,|1\\rangle', 'Al medir Z, un qubit entrega +1 o −1.'],
      ['x_{i,t} = \\dfrac{1 - z_{i,t}}{2}, \\qquad z_{i,t}\\in\\{-1,+1\\}', 'Mapeo estándar.'],
      ['z = +1 \\Rightarrow x = \\tfrac{1-1}{2} = 0 \\qquad z = -1 \\Rightarrow x = \\tfrac{1+1}{2} = 1 \\qquad z^{2} = 1,\\quad x^{2} = x']
    ] },
    { t: 'Productos de dos variables', l: [
      ['x_{i,t}\\,x_{j,t+1} = \\frac{1-z_{i,t}}{2}\\cdot\\frac{1-z_{j,t+1}}{2} = \\tfrac14\\big(1 - z_{i,t} - z_{j,t+1} + z_{i,t}z_{j,t+1}\\big)'],
      ['x_{i,t}\\,x_{j,t} = \\tfrac14\\big(1 - z_{i,t} - z_{j,t} + z_{i,t}z_{j,t}\\big) \\qquad x_{i,t}\\,x_{i,t\'} = \\tfrac14\\big(1 - z_{i,t} - z_{i,t\'} + z_{i,t}z_{i,t\'}\\big)', 'La misma cuenta para dos lugares en un tiempo o un lugar en dos tiempos.']
    ] },
    { t: 'El cuadrado de cada restricción', l: [
      ['\\Big(1-\\sum_{i} x_{i,t}\\Big)^{2} = 1 - 2\\sum_{i} x_{i,t} + \\Big(\\sum_{i} x_{i,t}\\Big)^{2} = 1 - 2\\sum_{i} x_{i,t} + \\sum_{i}\\sum_{j} x_{i,t}\\,x_{j,t}'],
      ['\\Big(1-\\sum_{t} x_{i,t}\\Big)^{2} = 1 - 2\\sum_{t} x_{i,t} + \\sum_{t}\\sum_{t\'} x_{i,t}\\,x_{i,t\'}']
    ] },
    { t: 'Q_C: la distancia, término a término', qed: true, l: [
      ['B\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1}x_{i,t}x_{j,t+1} = \\tfrac{B}{4}\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1}\\big(1 - z_{i,t} - z_{j,t+1} + z_{i,t}z_{j,t+1}\\big)', 'Se reemplaza el producto por su forma en z.'],
      ['\\tfrac{B}{4}\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1} 1 = B\\,\\tfrac{T-1}{4}\\sum_{i,j}d_{ij}', 'El 1: la suma en t tiene T − 1 términos.'],
      ['-\\tfrac{B}{4}\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1} z_{i,t} = -\\tfrac{B}{4}\\sum_{i}\\sum_{t=1}^{T-1}\\Big(\\sum_{j}d_{ij}\\Big) z_{i,t} = -\\tfrac{B}{4}\\sum_{i}\\sum_{t=1}^{T-1} ' + C + '{a_i}\\,z_{i,t}, \\qquad ' + C + '{a_i = \\sum_j d_{ij}}', 'El −z del lugar de salida.'],
      ['-\\tfrac{B}{4}\\sum_{i,j}d_{ij}\\sum_{t=1}^{T-1} z_{j,t+1} = -\\tfrac{B}{4}\\sum_{j}\\sum_{t=1}^{T-1} ' + C + '{b_j}\\,z_{j,t+1} = -\\tfrac{B}{4}\\sum_{i}\\sum_{t=2}^{T} b_i\\,z_{i,t}, \\qquad ' + C + '{b_j = \\sum_i d_{ij}}', 'El −z del lugar de llegada; se corre t + 1 → t y se renombra j → i.'],
      ['\\sum_{t=1}^{T-1} a_i z_{i,t} + \\sum_{t=2}^{T} b_i z_{i,t} = a_i\\,z_{i,1} + b_i\\,z_{i,T} + \\sum_{t=2}^{T-1}(a_i + b_i)\\,z_{i,t}', 'Se separan t = 1 (solo sale), t = T (solo llega) y los tiempos del medio.'],
      ['Q_C = B\\Big\\{\\tfrac{T-1}{4}\\sum_{i,j}d_{ij} - \\tfrac14\\sum_{i=1}^{N}\\Big[a_i z_{i,1} + b_i z_{i,T} + \\sum_{t=2}^{T-1}(a_i+b_i)\\,z_{i,t}\\Big] + \\tfrac14\\sum_{t=1}^{T-1}\\sum_{i,j}d_{ij}\\,z_{i,t}z_{j,t+1}\\Big\\}', 'El último término es el + zz que no cambió.']
    ] },
    { t: 'Q temporal: un lugar por tiempo', qed: true, l: [
      ['\\sum_{t}\\Big(1-\\sum_{i}x_{i,t}\\Big)^{2} = \\sum_{t}\\Big(1 - 2\\sum_{i}x_{i,t} + \\sum_{i,j}x_{i,t}x_{j,t}\\Big)'],
      ['-2\\sum_{i}x_{i,t} = -\\sum_{i}(1 - z_{i,t}) = -N + \\sum_{i} z_{i,t}'],
      ['\\sum_{i,j}x_{i,t}x_{j,t} = \\Big(\\sum_i x_{i,t}\\Big)^{2} = \\tfrac14\\Big(N - \\sum_i z_{i,t}\\Big)^{2} = \\tfrac14\\Big(N^{2} - 2N\\sum_i z_{i,t} + \\big(\\textstyle\\sum_i z_{i,t}\\big)^{2}\\Big)'],
      ['\\Big(\\sum_i z_{i,t}\\Big)^{2} = \\sum_i z_{i,t}^{2} + 2\\sum_{i<j} z_{i,t}z_{j,t} = N + 2\\sum_{i<j} z_{i,t}z_{j,t}', 'Porque z² = 1.'],
      ['1 - N + \\sum_i z_{i,t} + \\tfrac{N^{2}}{4} - \\tfrac{N}{2}\\sum_i z_{i,t} + \\tfrac{N}{4} + \\tfrac12\\sum_{i<j} z_{i,t}z_{j,t} = \\tfrac{4 - 3N + N^{2}}{4} + \\big(1 - \\tfrac N2\\big)\\sum_i z_{i,t} + \\tfrac12\\sum_{i<j} z_{i,t}z_{j,t}', 'Se juntan los términos de un mismo t.'],
      ['Q_{\\text{tem}} = A\\Big[\\tfrac{T}{4}\\big(4 - 3N + N^{2}\\big) + \\big(1 - \\tfrac{N}{2}\\big)\\sum_{i}\\sum_{t} z_{i,t} + \\tfrac12\\sum_{t}\\sum_{i<j} z_{i,t}z_{j,t}\\Big]', 'Y se suma sobre los T tiempos.']
    ] },
    { t: 'Q espacial: cada lugar una vez', qed: true, l: [
      ['\\sum_{i}\\Big(1-\\sum_{t}x_{i,t}\\Big)^{2} = \\sum_{i}\\Big(1 - 2\\sum_{t}x_{i,t} + \\sum_{t,t\'}x_{i,t}x_{i,t\'}\\Big)'],
      ['-2\\sum_{t}x_{i,t} = -\\sum_{t}(1 - z_{i,t}) = -T + \\sum_{t} z_{i,t}'],
      ['\\sum_{t,t\'}x_{i,t}x_{i,t\'} = \\tfrac14\\Big(T - \\sum_t z_{i,t}\\Big)^{2} = \\tfrac14\\Big(T^{2} - 2T\\sum_t z_{i,t} + T + 2\\sum_{t<t\'} z_{i,t}z_{i,t\'}\\Big)', 'Con (Σₜ z)² = T + 2 Σ_{t<t′} z z.'],
      ['1 - T + \\sum_t z_{i,t} + \\tfrac{T^{2}}{4} - \\tfrac{T}{2}\\sum_t z_{i,t} + \\tfrac{T}{4} + \\tfrac12\\sum_{t<t\'} z_{i,t}z_{i,t\'} = \\tfrac{4 - 3T + T^{2}}{4} + \\big(1 - \\tfrac T2\\big)\\sum_t z_{i,t} + \\tfrac12\\sum_{t<t\'} z_{i,t}z_{i,t\'}'],
      ['Q_{\\text{esp}} = A\\Big[\\tfrac{N}{4}\\big(4 - 3T + T^{2}\\big) + \\big(1 - \\tfrac{T}{2}\\big)\\sum_{i}\\sum_{t} z_{i,t} + \\tfrac12\\sum_{i}\\sum_{t<t\'} z_{i,t}z_{i,t\'}\\Big]']
    ] },
    { t: 'La función de coste en Ising', l: [
      ['\\boxed{\\begin{aligned} H(z) = {}& B\\Big\\{\\tfrac{T-1}{4}\\sum_{i,j}d_{ij} - \\tfrac14\\sum_{i=1}^{N}\\Big[a_i z_{i,1} + b_i z_{i,T} + \\sum_{t=2}^{T-1}(a_i+b_i)z_{i,t}\\Big] + \\tfrac14\\sum_{t=1}^{T-1}\\sum_{i,j}d_{ij}z_{i,t}z_{j,t+1}\\Big\\} \\\\ &+ A\\Big\\{\\tfrac{T}{4}(4-3N+N^{2}) + \\big(1-\\tfrac N2\\big)\\sum_{i}\\sum_{t}z_{i,t} + \\tfrac12\\sum_{t}\\sum_{i<j}z_{i,t}z_{j,t}\\Big\\} \\\\ &+ A\\Big\\{\\tfrac{N}{4}(4-3T+T^{2}) + \\big(1-\\tfrac T2\\big)\\sum_{i}\\sum_{t}z_{i,t} + \\tfrac12\\sum_{i}\\sum_{t<t\'}z_{i,t}z_{i,t\'}\\Big\\}\\end{aligned}}', 'Es la misma función que Q(x), escrita en espines.']
    ] },
    { t: 'Constante, campos locales y acoplamientos', l: [
      ['\\text{cte} = B\\,\\frac{T-1}{4}\\sum_{i,j}d_{ij} + A\\,\\frac{T(N^{2}-3N+4)}{4} + A\\,\\frac{N(T^{2}-3T+4)}{4}', 'Todo lo que no lleva z. No cambia cuál es el mínimo.'],
      ['h_{i,t} = B\\,h^{(c)}_{i,t} + A\\big(1-\\tfrac N2\\big) + A\\big(1-\\tfrac T2\\big), \\qquad h^{(c)}_{i,t} = -\\tfrac14\\begin{cases} \\sum_j d_{ij}, & t = 1 \\\\ \\sum_j (d_{ij} + d_{ji}), & 2\\le t\\le T-1 \\\\ \\sum_j d_{ji}, & t = T \\end{cases}', 'Todo lo que multiplica a un solo z: de la distancia, de la regla temporal y de la espacial.'],
      ['J_{(i,t)(j,t+1)} = \\tfrac{B}{4}\\,d_{ij} \\qquad J_{(i,t)(j,t)} = \\tfrac{A}{2}\\ (i<j) \\qquad J_{(i,t)(i,t\')} = \\tfrac{A}{2}\\ (t<t\')', 'Todo lo que multiplica a un par z z: transición, mismo tiempo y mismo lugar.'],
      ['h > 0:\\ z\\to +1\\ (x = 0) \\qquad h < 0:\\ z \\to -1\\ (x = 1)', 'El campo alinea al espín.']
    ] },
    { t: 'De pares a una matriz', l: [
      ['H = \\text{cte} + \\sum_{i=1}^{N}\\sum_{t=1}^{T} h_{i,t}\\,z_{i,t} + \\sum_{\\text{pares únicos}} J_{(i,t)(j,t\')}\\,z_{i,t}\\,z_{j,t\'}'],
      ['M = N\\times T, \\qquad k = (i-1)\\,T + t \\in \\{1,\\dots,M\\}', 'Para cada i, los T tiempos ocupan k = (i − 1)T + 1, …, iT: bloques que no se pisan, así que cada (i, t) tiene un k propio.'],
      ['H_{\\text{matriz}} = \\sum_{k=1}^{M} h_k z_k + \\sum_{k=1}^{M}\\sum_{l=k+1}^{M} J_{kl}\\,z_k z_l \\;(+\\,\\text{cte}) \\;=\\; z^{\\mathsf T} J_{\\text{sup}}\\, z + h^{\\mathsf T} z', 'Con J simétrica, J_sim = J_sup + J_supᵀ y zᵀ J_sup z = ½ zᵀ J_sim z.']
    ] },
    { t: 'El Hamiltoniano como operador y lo que busca el VQE', l: [
      ['z_k \\to \\hat Z_k = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}, \\qquad \\hat H = \\sum_{k<l} J_{kl}\\,\\hat Z_k\\otimes\\hat Z_l + \\sum_{k=1}^{M} h_k\\,\\hat Z_k'],
      ['\\hat Z_k\\otimes\\hat Z_l = \\mathrm{diag}(1,-1,-1,1) \\;\\Rightarrow\\; \\hat H \\text{ es diagonal en la base computacional}', 'Solo aparecen Z y Z ⊗ Z.'],
      ['\\min_{\\theta} E(\\theta) = \\min_{\\theta}\\langle\\psi(\\theta)|\\hat H|\\psi(\\theta)\\rangle = \\min_\\theta \\Big[\\sum_{k<l} J_{kl}\\langle\\hat Z_k\\otimes\\hat Z_l\\rangle_\\theta + \\sum_k h_k\\langle\\hat Z_k\\rangle_\\theta\\Big]', 'El estado |ψ(θ)⟩ lo da el ansatz: la etapa siguiente.']
    ] },
    { t: 'Para nuestro ejemplo: N = 3, T = 3, M = 9', l: [
      ['z_{11}\\to 1,\\ z_{12}\\to 2,\\ z_{13}\\to 3,\\ z_{21}\\to 4,\\ z_{22}\\to 5,\\ z_{23}\\to 6,\\ z_{31}\\to 7,\\ z_{32}\\to 8,\\ z_{33}\\to 9', 'Por ejemplo z₂₃: (2 − 1)·3 + 3 = 6.'],
      ['a = b = (5+9,\\ 5+7,\\ 9+7) = (14,\\ 12,\\ 16) \\qquad \\textstyle\\sum_{i,j}d_{ij} = 2(5+7+9) = 42', 'Las distancias son simétricas: lo que sale de cada lugar es lo que llega.'],
      ['\\text{cte} = 1\\cdot\\tfrac{2}{4}\\cdot 42 + 100\\cdot\\tfrac{3\\cdot 4}{4} + 100\\cdot\\tfrac{3\\cdot 4}{4} = 21 + 300 + 300 = ' + C + '{' + CTE + '}'],
      ['h_{1,1} = -\\tfrac{14}{4} + 100(1-\\tfrac32) + 100(1-\\tfrac32) = -3{,}5 - 50 - 50 = ' + C + '{-103{,}5} \\qquad h_{1,2} = -\\tfrac{14+14}{4} - 100 = ' + C + '{-107}'],
      ['J_{12}:\\ (z_{11}, z_{12}) \\text{ mismo lugar} \\Rightarrow \\tfrac{A}{2} = ' + C + '{50} \\qquad J_{15}:\\ (z_{11}, z_{22}) \\text{ transición } 1\\to 2 \\Rightarrow \\tfrac{B}{4}d_{12} = ' + C + '{1{,}25}'],
      [function () { return texMatrices(); }, 'Las matrices completas (J simétrica). En dorado J₁₂, en azul J₁₅.']
    ] },
    { t: 'Comprobación: H(z) da lo mismo que Q(x)', casos: true }
  ];

  var numero = 0;
  function tex(s, sinNumero) {
    var src = typeof s === 'function' ? s() : s;
    if (!sinNumero) src += ' \\tag{' + (++numero) + '}';
    if (window.katex) { try { return katex.renderToString(src, { displayMode: true, throwOnError: false }); } catch (e) {} }
    return '<code>' + src.replace(/</g, '&lt;') + '</code>';
  }
  function lineas(p) {
    if (p.casos) {
      var casos = [
        texCaso('Ruta válida 1 → 2 → 3', [[1, 1], [2, 2], [3, 3]], 'Cada tiempo tiene un lugar y cada lugar aparece una vez: las dos restricciones valen 0 y solo queda la distancia 5 + 7.'),
        texCaso('Rompe la regla espacial: el lugar 1 se repite', [[1, 1], [1, 2], [3, 3]], 'El lugar 1 aparece dos veces y el 2 ninguna: (1 − 2)² + (1 − 0)² = 2, que suma 2A. En z se ve en J₁₂ = 50, que ahora multiplica a (−1)(−1) = +1.'),
        texCaso('Rompe la regla temporal: dos lugares en t = 1', [[1, 1], [2, 1], [3, 2]], 'En t = 1 hay dos lugares y en t = 3 ninguno: (1 − 2)² + (1 − 0)² = 2 en la regla temporal. La distancia cuenta 1 → 3 y 2 → 3 (9 + 7). En z se activa J₁₄ = 50, el par (z₁₁, z₂₁) del mismo tiempo.')
      ];
      var out = '';
      casos.forEach(function (c) { out += '<div class="dv-caso"><div class="dv-caso-tit">' + c[0] + '</div>' + c.slice(1, 4).map(function (l) { return '<div class="dv-linea">' + tex(l, true) + '</div>'; }).join('') + '<p class="dv-nota">' + c[4] + '</p></div>'; });
      return out + '<p class="dv-nota dv-cierre">Las tres coinciden: las matrices J y h son la misma función de coste. Abajo, la misma construcción para la red minera.</p>';
    }
    return p.l.map(function (l) { return '<div class="dv-linea">' + tex(l[0]) + (l[1] ? '<p class="dv-nota">' + l[1] + '</p>' : '') + '</div>'; }).join('') + (p.qed ? '<p class="dv-qed">∎</p>' : '');
  }

  window.montarComprobador = function (caja) {
    var x = unos([[1, 1], [2, 2], [3, 3]]);
    var RUTAS = [['1 → 2 → 3', [1, 2, 3]], ['1 → 3 → 2', [1, 3, 2]], ['2 → 1 → 3', [2, 1, 3]], ['2 → 3 → 1', [2, 3, 1]], ['3 → 1 → 2', [3, 1, 2]], ['3 → 2 → 1', [3, 2, 1]]];
    caja.innerHTML = '<div class="dv-cab"><div class="mx-kicker">Comprobación con la matriz</div><h3 class="dv-tit">Tu trayectoria en z</h3>' +
      '<p class="dv-resumen">Elige los x<sub>i,t</sub> (o una ruta). El estado se convierte en z = 1 − 2x y se evalúa con las matrices de arriba: H(z) = cte + h<sup>T</sup>z + ½ z<sup>T</sup>J z, con J simétrica. Abajo, la misma cuenta escrita con las matrices.</p></div>' +
      '<div class="cp-cuerpo"><div class="cp-izq">' +
      '<div class="cp-rutas">' + RUTAS.map(function (r, n) { return '<button type="button" class="nb-copiar" data-r="' + n + '">' + r[0] + '</button>'; }).join('') + '<button type="button" class="nb-copiar" data-r="vacia">vacía</button></div>' +
      '<table class="cp-malla"><tr><th></th><th>t<sub>1</sub></th><th>t<sub>2</sub></th><th>t<sub>3</sub></th></tr>' +
      [1, 2, 3].map(function (i) { return '<tr><th>lugar ' + i + '</th>' + [1, 2, 3].map(function (t) { return '<td><button type="button" class="cp-x" data-i="' + i + '" data-t="' + t + '" aria-label="x' + i + ',' + t + '"></button></td>'; }).join('') + '</tr>'; }).join('') + '</table>' +
      '<svg class="cp-tri" viewBox="0 0 220 150" aria-hidden="true"></svg></div>' +
      '<div class="cp-der" aria-live="polite"></div></div><div class="cp-mult"></div>';
    var der = caja.querySelector('.cp-der'), tri = caja.querySelector('.cp-tri'), mult = caja.querySelector('.cp-mult');
    var P = { 1: [40, 36], 2: [180, 36], 3: [110, 124] }, NS = 'http://www.w3.org/2000/svg';
    function e(tag, at, padre) { var nn = document.createElementNS(NS, tag); for (var kk in at) nn.setAttribute(kk, at[kk]); padre.appendChild(nn); return nn; }
    function dibujarTri() {
      while (tri.firstChild) tri.removeChild(tri.firstChild);
      var defs = e('defs', {}, tri), mk = e('marker', { id: 'cp-fl', viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse' }, defs);
      e('path', { d: 'M0 0 L10 5 L0 10 z', fill: '#8C6D33' }, mk);
      [[1, 2, 5], [2, 3, 7], [1, 3, 9]].forEach(function (a) {
        e('line', { x1: P[a[0]][0], y1: P[a[0]][1], x2: P[a[1]][0], y2: P[a[1]][1], 'class': 'cp-arista' }, tri);
        e('text', { x: (P[a[0]][0] + P[a[1]][0]) / 2 + (a[2] === 9 ? -12 : a[2] === 7 ? 12 : 0), y: (P[a[0]][1] + P[a[1]][1]) / 2 + (a[2] === 5 ? -6 : 4), 'class': 'cp-peso' }, tri).textContent = a[2];
      });
      // flechas t → t+1 cuando cada tiempo tiene un solo lugar
      var lugar = [1, 2, 3].map(function (t) { var en = [1, 2, 3].filter(function (i) { return x[i][t]; }); return en.length === 1 ? en[0] : 0; });
      for (var t = 0; t < 2; t++) if (lugar[t] && lugar[t + 1] && lugar[t] !== lugar[t + 1]) {
        var a = P[lugar[t]], b = P[lugar[t + 1]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey);
        e('line', { x1: a[0] + ex / l * 15 - ey / l * 5, y1: a[1] + ey / l * 15 + ex / l * 5, x2: b[0] - ex / l * 17 - ey / l * 5, y2: b[1] - ey / l * 17 + ex / l * 5, 'class': 'cp-ruta', 'marker-end': 'url(#cp-fl)' }, tri);
      }
      [1, 2, 3].forEach(function (i) {
        var veces = [1, 2, 3].filter(function (t) { return x[i][t]; }).length;
        e('circle', { cx: P[i][0], cy: P[i][1], r: 13, 'class': 'cp-nodo' + (veces ? ' on' : '') }, tri);
        e('text', { x: P[i][0], y: P[i][1] + 5, 'class': 'cp-nodo-t' }, tri).textContent = i;
      });
    }
    function calcular() {
      Array.prototype.forEach.call(caja.querySelectorAll('.cp-x'), function (b) { var v = x[+b.getAttribute('data-i')][+b.getAttribute('data-t')]; b.classList.toggle('on', !!v); b.textContent = v; });
      dibujarTri();
      var q = Qx(x), z = [], M = N * T;
      for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) z.push(1 - 2 * x[i][t]);
      var hz = 0, Jz = [], zJz = 0;
      for (var a = 0; a < M; a++) { hz += MAT.h[a] * z[a]; var s2 = 0; for (var b2 = 0; b2 < M; b2++) s2 += MAT.J[a][b2] * z[b2]; Jz.push(s2); zJz += z[a] * s2; }
      var H = CTE + hz + zJz / 2;
      // vectores en fila (transpuestos) para que todo quepa a lo ancho
      var col = function (v) { return '(' + v.join(',\\;') + ')^{\\mathsf T}'; };
      var fila = function (v) { return '\\begin{pmatrix}' + v.join(' & ') + '\\end{pmatrix}'; };
      var columna = function (v) { return '\\begin{pmatrix}' + v.join(' \\\\ ') + '\\end{pmatrix}'; };
      // J con el aporte de cada par: dorado si z_k z_l = +1 (suma), azul si = −1 (resta)
      var Jtex = '\\begin{pmatrix}' + MAT.J.map(function (f, a) {
        return f.map(function (v, b) {
          if (!v) return '\\color{#C9C4BB}{0}';
          return '\\colorbox{' + (z[a] * z[b] > 0 ? '#F1E4C6' : '#DCE7F5') + '}{$' + n(v) + '$}';
        }).join(' & ');
      }).join(' \\\\ ') + '\\end{pmatrix}';
      var zs = z.map(String);
      var terminos = function (u, v) { return u.map(function (a, k) { return n(a) + '\\cdot(' + v[k] + ')'; }).join(' + ').replace(/\+ -/g, '- '); };
      der.innerHTML =
        tex('z = 1 - 2x = ' + col(zs), true) +
        tex('h^{\\mathsf T}z = \\sum_{k=1}^{9} h_k z_k = ' + C + '{' + n(hz) + '}', true) +
        tex('J z = ' + col(Jz.map(n)) + ' \\qquad \\tfrac12\\, z^{\\mathsf T}(Jz) = \\tfrac12(' + n(zJz) + ') = ' + C + '{' + n(zJz / 2) + '}', true) +
        tex('H(z) = \\underbrace{' + n(CTE) + '}_{\\text{cte}} + \\underbrace{(' + n(hz) + ')}_{h^{\\mathsf T}z} + \\underbrace{(' + n(zJz / 2) + ')}_{\\frac12 z^{\\mathsf T}Jz} = ' + C + '{\\mathbf{' + n(H) + '}}', true) +
        '<p class="dv-nota">' + (Qx(x).tem || Qx(x).esp ? 'Rompe ' + [Qx(x).tem ? 'la regla temporal' : '', Qx(x).esp ? 'la espacial' : ''].filter(Boolean).join(' y ') + ': los acoplamientos A/2 que se activan suben la energía.' : 'Cumple las dos restricciones: la energía es solo la distancia recorrida.') + '</p>';
      // debajo: la multiplicación escrita con las matrices
      mult.innerHTML = '<div class="cp-mult-tit">La multiplicación, con las matrices</div>' +
        tex('z^{\\mathsf T} J\\, z = ' + fila(zs) + Jtex + columna(zs), true) +
        tex('= (Jz)^{\\mathsf T} z = ' + terminos(Jz, zs) + ' = ' + C + '{' + n(zJz) + '}', true) +
        tex('h^{\\mathsf T} z = ' + fila(MAT.h.map(n)) + columna(zs) + ' = ' + C + '{' + n(hz) + '}', true) +
        tex('H(z) = \\text{cte} + h^{\\mathsf T}z + \\tfrac12\\, z^{\\mathsf T}Jz = ' + n(CTE) + ' + (' + n(hz) + ') + \\tfrac12(' + n(zJz) + ') = ' + C + '{\\mathbf{' + n(H) + '}}', true) +
        '<p class="dv-nota">En J, dorado: pares con z<sub>k</sub>z<sub>l</sub> = +1, que suman J<sub>kl</sub>; azul: pares con z<sub>k</sub>z<sub>l</sub> = −1, que lo restan.</p>';
    }
    Array.prototype.forEach.call(caja.querySelectorAll('.cp-x'), function (b) {
      b.addEventListener('click', function () { var i = +b.getAttribute('data-i'), t = +b.getAttribute('data-t'); x[i][t] = 1 - x[i][t]; calcular(); });
    });
    Array.prototype.forEach.call(caja.querySelectorAll('[data-r]'), function (b) {
      b.addEventListener('click', function () { var r = b.getAttribute('data-r'); x = r === 'vacia' ? unos([]) : unos(RUTAS[+r][1].map(function (i, t) { return [i, t + 1]; })); calcular(); });
    });
    calcular();
    (function listo() { if (window.katex) calcular(); else setTimeout(listo, 300); })();
  };

  window.montarDerivacion = function (caja) {
    function pintar() {
      numero = 0;
      caja.innerHTML = '<div class="dv-cab"><div class="mx-kicker">Del QUBO al Hamiltoniano de Ising</div><h3 class="dv-tit">La función de coste como un Hamiltoniano</h3>' +
        '<p class="dv-resumen"><b>Resumen.</b> Para el caso de tres lugares y dos restricciones (un lugar por tiempo y cada lugar una vez) se muestra que la función de coste Q(x), escrita en variables binarias, coincide término a término con un Hamiltoniano de Ising H(z) = cte + Σ h<sub>k</sub> z<sub>k</sub> + Σ<sub>k&lt;l</sub> J<sub>kl</sub> z<sub>k</sub> z<sub>l</sub>. Se obtienen en forma cerrada la constante, los campos locales h y los acoplamientos J, y se comprueba el resultado con números.</p></div>' +
        '<div class="dv-pizarra">' + S.map(function (p, i) {
          return '<section class="dv-seccion"><div class="dv-paso-tit"><span class="dv-num">' + (i + 1) + '.</span>' + p.t + '</div>' + lineas(p) + '</section>';
        }).join('') + '</div>';
    }
    pintar();
    // KaTeX puede llegar después: se vuelve a dibujar
    (function listo() { if (window.katex) pintar(); else setTimeout(listo, 300); })();
  };
})();
