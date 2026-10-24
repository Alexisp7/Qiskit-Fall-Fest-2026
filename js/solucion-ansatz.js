// El ansatz en matemáticas: por qué, partiendo de ángulos θ al azar, la capa de
// R_Y, la cascada de CZ y la capa final pueden llegar a la ruta de mínima
// energía. Para el triángulo (9 qubits) se simula el estado exacto en el
// navegador y se optimiza parámetro por parámetro.
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var C = '\\color{#8C6D33}';
  var numero = 0;
  function tex(s, sinNumero) {
    var src = s + (sinNumero ? '' : ' \\tag{' + (++numero) + '}');
    if (window.katex) { try { return katex.renderToString(src, { displayMode: true, throwOnError: false }); } catch (e) {} }
    return '<code>' + s.replace(/</g, '&lt;') + '</code>';
  }
  function n2(v) { var r = Math.round(v * 100) / 100; return (Math.abs(r) < 1e-12 ? 0 : r).toString().replace('.', ','); }

  var S = [
    { t: 'Punto de partida', l: [
      ['|\\psi_0\\rangle = |0\\rangle^{\\otimes n} = |00\\cdots 0\\rangle, \\qquad n = N\\cdot T = 9', 'Todos los qubits empiezan en |0⟩: en x, ningún lugar visitado.']
    ] },
    { t: 'Una rotación R<sub>Y</sub>', l: [
      ['R_Y(\\theta) = \\begin{pmatrix} \\cos\\frac{\\theta}{2} & -\\sin\\frac{\\theta}{2} \\\\ \\sin\\frac{\\theta}{2} & \\cos\\frac{\\theta}{2} \\end{pmatrix}, \\qquad R_Y(\\theta)\\,|0\\rangle = \\cos\\tfrac{\\theta}{2}\\,|0\\rangle + \\sin\\tfrac{\\theta}{2}\\,|1\\rangle'],
      ['P(1) = \\sin^{2}\\tfrac{\\theta}{2}, \\qquad \\langle Z\\rangle = \\cos^{2}\\tfrac{\\theta}{2} - \\sin^{2}\\tfrac{\\theta}{2} = \\cos\\theta', 'El ángulo decide cuánto se inclina cada qubit hacia 1; las amplitudes son reales.']
    ] },
    { t: 'Primera capa, con θ al azar', l: [
      ['|\\psi_1\\rangle = \\bigotimes_{k=1}^{n} R_Y(\\theta_k)|0\\rangle = \\sum_{b\\in\\{0,1\\}^n}\\ \\prod_{k=1}^{n} a_k(b_k)\\,|b\\rangle, \\qquad a_k(0) = \\cos\\tfrac{\\theta_k}{2},\\ a_k(1) = \\sin\\tfrac{\\theta_k}{2}', 'Con θ al azar, cada una de las 2ⁿ cadenas recibe algo de amplitud: el circuito empieza mirando todas las rutas a la vez.'],
      ['P(b) = \\prod_{k=1}^{n} |a_k(b_k)|^{2}', 'Pero es un estado producto: la probabilidad de un qubit no depende de los demás.']
    ] },
    { t: 'La cascada de CZ', l: [
      ['\\mathrm{CZ}\\,|b_k b_{k+1}\\rangle = (-1)^{b_k b_{k+1}}\\,|b_k b_{k+1}\\rangle, \\qquad U_{\\mathrm{CZ}} = \\prod_{k=1}^{n-1}\\mathrm{CZ}_{k,k+1}'],
      ['U_{\\mathrm{CZ}}\\,|b\\rangle = (-1)^{\\sum_{k=1}^{n-1} b_k b_{k+1}}\\,|b\\rangle \\quad\\Longrightarrow\\quad |\\psi_2\\rangle = \\sum_{b} (-1)^{\\sum_k b_k b_{k+1}} \\prod_{k} a_k(b_k)\\,|b\\rangle', 'La cascada no cambia qué cadenas aparecen: marca cada una con un signo según cuántos pares vecinos están en 1.'],
      ['\\big|(-1)^{\\sum_k b_k b_{k+1}}\\big| = 1 \\;\\Rightarrow\\; P(b) \\text{ no cambia}', 'Si se midiera aquí, todo sería igual que antes: por eso hace falta otra capa.']
    ] },
    { t: 'La capa final hace interferir los signos', l: [
      ['|\\psi(\\theta)\\rangle = \\bigotimes_{k} R_Y(\\varphi_k)\\,|\\psi_2\\rangle \\;\\Rightarrow\\; \\psi(b) = \\sum_{b\'}\\Big[\\prod_{k} r_k(b_k, b\'_k)\\Big]\\,(-1)^{\\sum_k b\'_k b\'_{k+1}} \\prod_{k} a_k(b\'_k)', 'r_k(b, b′) son las entradas de R_Y(φ_k). Ahora cada amplitud final es una suma con signos: unas cadenas se refuerzan y otras se cancelan.'],
      ['\\psi(b)\\in\\mathbb{R}, \\qquad \\sum_b \\psi(b)^{2} = 1', 'Los signos de la cascada dependen de pares vecinos, así que la interferencia crea correlaciones entre qubits vecinos.']
    ] },
    { t: 'La energía es un promedio de las rutas', l: [
      ['E(\\theta) = \\langle\\psi(\\theta)|\\hat H|\\psi(\\theta)\\rangle = \\sum_{b} |\\psi(b)|^{2}\\, H(b)', 'Como Ĥ es diagonal, E(θ) es el promedio de las energías H(b) de todas las cadenas, pesado por su probabilidad.'],
      ['E(\\theta) \\;\\ge\\; \\min_{b} H(b), \\qquad \\text{con igualdad} \\iff P(b) > 0 \\text{ solo en los mínimos}', 'Minimizar E obliga a mover toda la probabilidad hacia las rutas de menor costo.']
    ] },
    { t: 'Sin la cascada: campo medio', l: [
      ['\\text{sin CZ:}\\quad E(\\theta) = \\text{cte} + \\sum_k h_k \\cos\\theta_k + \\sum_{k<l} J_{kl}\\cos\\theta_k\\cos\\theta_l', 'Con un estado producto, ⟨z_k z_l⟩ = ⟨z_k⟩⟨z_l⟩: cada qubit solo ve el promedio de los demás. Sin CZ, las dos capas se juntan: R_Y(φ_k)R_Y(θ_k) = R_Y(θ_k + φ_k).'],
      ['c_k = \\cos\\theta_k \\in [-1, 1]:\\quad \\min_{c\\,\\in\\,[-1,1]^n} E(c) \\;=\\; \\min_{c\\,\\in\\,\\{\\pm 1\\}^n} E(c) \\;=\\; \\min_b H(b)', 'E es multilineal: fijados los demás, es lineal en cada c_k, así que el mínimo cae en un extremo, c_k = ±1. Repitiendo qubit por qubit se llega a una esquina, que es una cadena de bits. El campo medio también puede alcanzar la ruta óptima.']
    ] },
    { t: 'La ruta es alcanzable, con o sin cascada', l: [
      ['\\theta_k = 0 \\Rightarrow |\\psi_1\\rangle = |0\\cdots 0\\rangle, \\qquad U_{\\mathrm{CZ}}|0\\cdots0\\rangle = |0\\cdots0\\rangle'],
      ['\\varphi_k = \\pi\\, b^{*}_k \\;\\Rightarrow\\; R_Y(\\pi)|0\\rangle = |1\\rangle \\;\\Rightarrow\\; |\\psi(\\theta)\\rangle = |b^{*}\\rangle,\\quad E = H(b^{*}) = \\min_b H(b)', 'Basta la capa de R_Y(π): la cascada no interviene. La ruta óptima ya está en la familia del campo medio; el entrelazamiento no hace falta para alcanzarla.'],
      ['b^{*}_{1\\to2\\to3}:\\ x_{11} = x_{22} = x_{33} = 1 \\;\\Rightarrow\\; H(b^{*}) = ' + C + '{12}', 'En el triángulo: d₁₂ + d₂₃ = 5 + 7.']
    ] },
    { t: 'Para qué sirve la cascada: el paisaje', l: [
      ['b \\text{ ruta válida}\\;\\Rightarrow\\; H(b \\oplus e_k) - H(b) \\;\\ge\\; A - 2B\\,d_{\\max} > 0', 'Cambiar un solo bit de una ruta válida rompe al menos una regla (cuesta A) y ahorra a lo más dos distancias. Cada ruta válida es un mínimo local: pasar de 1 → 3 → 2 a 1 → 2 → 3 exige cambiar cuatro bits a la vez.'],
      ['\\text{con CZ:}\\quad \\langle z_k z_l\\rangle_\\theta \\ne \\langle z_k\\rangle_\\theta\\langle z_l\\rangle_\\theta', 'La cascada agrega direcciones correlacionadas, por ejemplo «x₂₂ y x₃₃ suben mientras x₃₂ y x₂₃ bajan», que pueden ayudar a salir de esos mínimos.'],
      ['\\text{triángulo, 300 arranques:}\\quad P(\\text{llegar a } E = 12) \\approx ' + C + '{38\\,\\%} \\text{ con CZ}, \\quad 31\\,\\% \\text{ sin CZ}', 'Medido con la misma regla de abajo. Los demás arranques terminan en H = 14 o 16, que son otras rutas válidas. La cascada ayuda, pero no lo garantiza: por eso el VQE usa varios arranques.']
    ] },
    { t: 'De θ al azar a la ruta: cada ángulo es un seno', l: [
      ['E(\\theta_j) = \\alpha_j \\cos(\\theta_j - \\beta_j) + \\gamma_j', 'Cada θ_j aparece en una sola R_Y, así que la energía, como función de ese ángulo, es una sinusoide.'],
      ['\\theta_j^{*} = \\theta_j - \\tfrac{\\pi}{2} - \\operatorname{atan2}\\big(2E(\\theta_j) - E(\\theta_j + \\tfrac{\\pi}{2}) - E(\\theta_j - \\tfrac{\\pi}{2}),\\ E(\\theta_j + \\tfrac{\\pi}{2}) - E(\\theta_j - \\tfrac{\\pi}{2})\\big)', 'Con tres evaluaciones se conoce la sinusoide entera y se salta a su mínimo. El cuaderno usa COBYLA, que busca lo mismo sin derivadas; la demostración de abajo usa esta regla, ángulo por ángulo.']
    ] }
  ];

  // ── simulación exacta del ansatz para el triángulo ──
  function prepararSim() {
    var H0 = window.HAM_TRI; if (!H0) return null;
    var N = H0.N, T = H0.T, n = N * T, dim = 1 << n;
    // qubit q en el orden del cuaderno: q = (t − 1)N + (i − 1); las matrices usan k = (i − 1)T + (t − 1)
    var kDe = []; for (var q = 0; q < n; q++) { var t = Math.floor(q / N), i = q % N; kDe.push(i * T + t); }
    var E = new Float64Array(dim), min = Infinity;
    for (var s = 0; s < dim; s++) {
      var z = []; for (var q2 = 0; q2 < n; q2++) z[kDe[q2]] = ((s >> q2) & 1) ? -1 : 1;
      var e = H0.cte; for (var a = 0; a < n; a++) { e += H0.h[a] * z[a]; for (var b = a + 1; b < n; b++) e += H0.J[a][b] * z[a] * z[b]; }
      E[s] = e; if (e < min) min = e;
    }
    return { N: N, T: T, n: n, dim: dim, E: E, min: min };
  }
  function estado(sim, th) {   // th: 2n ángulos (primera capa y capa final)
    var psi = new Float64Array(sim.dim); psi[0] = 1;
    function ry(q, ang) {
      var c = Math.cos(ang / 2), s = Math.sin(ang / 2), m = 1 << q;
      for (var i = 0; i < sim.dim; i++) if (!(i & m)) { var a = psi[i], b = psi[i | m]; psi[i] = c * a - s * b; psi[i | m] = s * a + c * b; }
    }
    for (var q = 0; q < sim.n; q++) ry(q, th[q]);
    for (var k = 0; k < sim.n - 1; k++) { var mm = (1 << k) | (1 << (k + 1)); for (var i = 0; i < sim.dim; i++) if ((i & mm) === mm) psi[i] = -psi[i]; }
    for (var q2 = 0; q2 < sim.n; q2++) ry(q2, th[sim.n + q2]);
    return psi;
  }
  function energia(sim, th) { var psi = estado(sim, th), e = 0; for (var i = 0; i < sim.dim; i++) e += psi[i] * psi[i] * sim.E[i]; return e; }
  function rutaDe(sim, s) {   // celdas x(i,t) de un estado
    var x = []; for (var i = 0; i < sim.N; i++) { x.push([]); for (var t = 0; t < sim.T; t++) x[i].push((s >> (t * sim.N + i)) & 1); }
    return x;
  }

  // el circuito del ansatz para el triángulo: 9 qubits, una capa (como ansatz(9, capas=1) del cuaderno)
  function circuitoSVG() {
    var N = 3, n = 9, dy = 34, y0 = 44, x = [];
    var o = '<svg class="az-circ" viewBox="0 0 900 ' + (y0 + (n - 1) * dy + 40) + '" role="img" aria-label="Circuito del ansatz para el triángulo">';
    o += '<text class="azc-col" x="168" y="18">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(θ)</tspan></text>';
    o += '<text class="azc-col" x="420" y="18">cascada de CZ</text>';
    o += '<text class="azc-col" x="668" y="18">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(φ)</tspan></text>';
    o += '<text class="azc-col" x="790" y="18">medir</text>';
    for (var k = 0; k < n; k++) {
      var y = y0 + k * dy, i = k % N + 1, t = Math.floor(k / N) + 1;
      o += '<text class="azc-q" x="8" y="' + (y + 5) + '">q<tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3"> · x</tspan><tspan class="azc-sub" dy="3">' + i + t + '</tspan></text>';
      o += '<text class="azc-ket" x="92" y="' + (y + 5) + '">|0⟩</text>';
      o += '<line class="azc-cable" x1="118" y1="' + y + '" x2="812" y2="' + y + '"/>';
      o += '<rect class="azc-ry" x="138" y="' + (y - 12) + '" width="62" height="24"/><text class="azc-g" x="169" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(θ</tspan><tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3">)</tspan></text>';
      o += '<rect class="azc-ry" x="638" y="' + (y - 12) + '" width="62" height="24"/><text class="azc-g" x="669" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(φ</tspan><tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3">)</tspan></text>';
      o += '<rect class="azc-ry" x="776" y="' + (y - 12) + '" width="28" height="24"/><path class="azc-aguja" d="M781 ' + (y + 6) + ' A9 9 0 0 1 799 ' + (y + 6) + ' M790 ' + (y + 6) + ' L797 ' + (y - 6) + '"/>';
    }
    // separación entre tiempos
    [3, 6].forEach(function (m) { var yy = y0 + (m - .5) * dy; o += '<line class="azc-t" x1="118" y1="' + yy + '" x2="812" y2="' + yy + '"/>'; });
    for (var c = 0; c < n - 1; c++) {
      var xc = 250 + c * 44, ya = y0 + c * dy, yb = ya + dy, cruza = (c + 1) % N === 0;
      o += '<line class="azc-cz' + (cruza ? ' cruza' : '') + '" x1="' + xc + '" y1="' + ya + '" x2="' + xc + '" y2="' + yb + '"/>';
      o += '<circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + ya + '" r="4.5"/><circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + yb + '" r="4.5"/>';
      if (cruza) o += '<text class="azc-cruza" x="' + (xc + 9) + '" y="' + (ya + dy / 2 + 4) + '">t' + ((c + 1) / N) + ' → t' + ((c + 1) / N + 1) + '</text>';
    }
    return o + '</svg>';
  }
  function circuitoTexto() {
    return '<section class="dv-seccion az-circuito"><div class="dv-paso-tit">El circuito del ansatz para el triángulo</div>' +
      '<p class="dv-nota">Es el ansatz del cuaderno con n = 9 qubits y una capa: ansatz(9, capas=1). Cada qubit es una variable x<sub>i,t</sub> en el orden k = (t − 1)N + i, así que la cascada recorre los tres lugares de un tiempo y salta al siguiente tiempo (en dorado). Ojo: las matrices de Inicializar numeran por lugar, k = (i − 1)T + t (x<sub>12</sub> es el 2.º); aquí x<sub>12</sub> es q<sub>4</sub>. Es la misma H con los índices permutados, pero esta cascada solo sigue la estructura del Hamiltoniano con el orden por tiempo.</p>' +
      circuitoSVG() +
      tex(String.raw`|\psi(\boldsymbol\theta,\boldsymbol\varphi)\rangle = \Big[\bigotimes_{k=1}^{9} R_Y(\varphi_k)\Big]\;\Big[\prod_{k=1}^{8}\mathrm{CZ}_{k,k+1}\Big]\;\Big[\bigotimes_{k=1}^{9} R_Y(\theta_k)\Big]\;|0\rangle^{\otimes 9}`) +
      tex(String.raw`(q_1,\dots,q_9) = (x_{11},\,x_{21},\,x_{31},\,x_{12},\,x_{22},\,x_{32},\,x_{13},\,x_{23},\,x_{33}), \qquad q_k \leftrightarrow x_{i,t},\ k = (t-1)N + i`) +
      tex(String.raw`\boldsymbol\theta = (\theta_1,\dots,\theta_9),\ \boldsymbol\varphi = (\varphi_1,\dots,\varphi_9):\ 18 \text{ parámetros}, \quad 8 \text{ compuertas CZ}, \quad \mathrm{CZ}_{3,4}:\ x_{31}\!-\!x_{12}, \quad \mathrm{CZ}_{6,7}:\ x_{32}\!-\!x_{13}`) +
      '</section>';
  }

  window.montarAnsatzMat = function (caja) {
    function pintarTexto() {
      numero = 0;
      return '<div class="dv-cab"><div class="mx-kicker">El ansatz en matemáticas</div><h3 class="dv-tit">De un θ al azar a la ruta, a través de la cascada</h3>' +
        '<p class="dv-resumen"><b>Resumen.</b> Se sigue el estado del circuito desde |0⟩<sup>⊗n</sup>: la primera capa de R<sub>Y</sub>(θ) con ángulos al azar reparte amplitud entre todas las rutas, la cascada de CZ las marca con signos que dependen de pares vecinos y la capa final hace interferir esos signos. Se muestra que la energía es un promedio de las rutas y que la ruta óptima está dentro de la familia del ansatz, incluso sin la cascada: lo que aportan las CZ no es alcanzar la ruta sino un mejor paisaje para el optimizador. Al final, cómo se llega ajustando un ángulo a la vez.</p></div>' +
        '<div class="dv-pizarra">' + circuitoTexto() + S.map(function (p, i) {
          return '<section class="dv-seccion"><div class="dv-paso-tit"><span class="dv-num">' + (i + 1) + '.</span>' + p.t + '</div>' +
            p.l.map(function (l) { return '<div class="dv-linea">' + tex(l[0]) + (l[1] ? '<p class="dv-nota">' + l[1] + '</p>' : '') + '</div>'; }).join('') + '</section>';
        }).join('') + '</div>';
    }
    caja.innerHTML = '<div class="az-texto">' + pintarTexto() + '</div>' +
      '<div class="az-demo"><div class="cp-mult-tit">Demostración en vivo: triángulo, 9 qubits, 18 ángulos</div>' +
      '<div class="az-controles"><button type="button" class="dv-btn" data-az="azar">θ al azar</button><button type="button" class="dv-btn dv-play" data-az="opt">optimizar</button><button type="button" class="dv-btn" data-az="construido">θ construido para 1 → 2 → 3</button>' +
      '<span class="az-estado" data-az="estado"></span></div>' +
      '<div class="az-cuerpo"><svg class="az-curva" viewBox="0 0 420 220" aria-label="Energía en cada barrido"></svg><div class="az-top" data-az="top"></div></div>' +
      '<p class="dv-nota">La energía se calcula con el estado exacto del circuito: E(θ) = Σ<sub>b</sub> |ψ(b)|² H(b). Cada barrido ajusta los 18 ángulos uno por uno con la regla de la ecuación de la sinusoide. Desde distintos θ al azar puede quedar en un mínimo local: vuelve a sortear y a optimizar.</p></div>';
    var sim = prepararSim();
    var th = [], hist = [], tim = 0, corriendo = false;
    function sortear() { th = []; for (var j = 0; j < 18; j++) th.push(Math.random() * 2 * Math.PI); hist = [energia(sim, th)]; }
    function construido() { th = []; var b = [1, 0, 0, 0, 1, 0, 0, 0, 1]; for (var j = 0; j < 9; j++) th.push(0); for (var q = 0; q < 9; q++) th.push(Math.PI * b[q]); hist = [energia(sim, th)]; }
    function barrido() {
      for (var j = 0; j < 18; j++) {
        var e0 = energia(sim, th), t0 = th[j];
        th[j] = t0 + Math.PI / 2; var ep = energia(sim, th);
        th[j] = t0 - Math.PI / 2; var em = energia(sim, th);
        th[j] = t0 - Math.PI / 2 - Math.atan2(2 * e0 - ep - em, ep - em);
      }
      hist.push(energia(sim, th));
    }
    function pintar() {
      if (!sim) return;
      var svg = caja.querySelector('.az-curva'), NS = 'http://www.w3.org/2000/svg';
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      function e(tag, at) { var nn = document.createElementNS(NS, tag); for (var k in at) nn.setAttribute(k, at[k]); svg.appendChild(nn); return nn; }
      var maxE = Math.max.apply(null, hist.concat([sim.min + 10])), minE = sim.min, X = function (i) { return 40 + i * (360 / Math.max(10, hist.length - 1)); }, Y = function (v) { return 190 - (v - minE) / (maxE - minE || 1) * 160; };
      e('line', { x1: 40, y1: 20, x2: 40, y2: 190, 'class': 'az-eje' }); e('line', { x1: 40, y1: 190, x2: 410, y2: 190, 'class': 'az-eje' });
      e('line', { x1: 40, y1: Y(sim.min), x2: 410, y2: Y(sim.min), 'class': 'az-min' });
      e('text', { x: 408, y: Y(sim.min) - 5, 'class': 'az-txt', 'text-anchor': 'end' }).textContent = 'mínimo = ' + n2(sim.min);
      e('text', { x: 40, y: 212, 'class': 'az-txt' }).textContent = 'barridos →';
      e('text', { x: 36, y: 16, 'class': 'az-txt', 'text-anchor': 'start' }).textContent = 'E(θ)';
      if (hist.length > 1) e('path', { d: hist.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join(' '), 'class': 'az-linea' });
      hist.forEach(function (v, i) { e('circle', { cx: X(i), cy: Y(v), r: 3, 'class': 'az-pto' }); });
      // los estados más probables
      var psi = estado(sim, th), orden = [];
      for (var s = 0; s < sim.dim; s++) orden.push(s);
      orden.sort(function (a, b) { return psi[b] * psi[b] - psi[a] * psi[a]; });
      caja.querySelector('[data-az="top"]').innerHTML = orden.slice(0, 6).map(function (s) {
        var p = psi[s] * psi[s], x = rutaDe(sim, s);
        var malla = '<span class="az-malla">' + x.map(function (f) { return f.map(function (v) { return '<i class="' + (v ? 'on' : '') + '"></i>'; }).join(''); }).join('') + '</span>';
        return '<div class="az-fila">' + malla + '<span class="az-barra"><span style="width:' + (p * 100).toFixed(1) + '%"></span></span><span class="az-p">' + (p * 100).toFixed(1) + '%</span><span class="az-h">H = ' + n2(sim.E[s]) + '</span></div>';
      }).join('') + '<p class="az-ley">Cada cuadrito es la matriz x: filas = lugares, columnas = tiempos.</p>';
      caja.querySelector('[data-az="estado"]').textContent = 'barrido ' + (hist.length - 1) + ' · E(θ) = ' + n2(hist[hist.length - 1]);
    }
    function correr() {
      if (corriendo) return; corriendo = true;
      var k = 0;
      (function paso() {
        barrido(); pintar(); k++;
        var listo = hist.length > 2 && Math.abs(hist[hist.length - 1] - hist[hist.length - 2]) < 1e-6;
        if (k < 25 && !listo) tim = setTimeout(paso, quieto ? 0 : 260); else corriendo = false;
      })();
    }
    if (!sim) return;
    caja.querySelector('[data-az="azar"]').addEventListener('click', function () { clearTimeout(tim); corriendo = false; sortear(); pintar(); });
    caja.querySelector('[data-az="opt"]').addEventListener('click', correr);
    caja.querySelector('[data-az="construido"]').addEventListener('click', function () { clearTimeout(tim); corriendo = false; construido(); pintar(); });
    sortear(); pintar();
    (function listo() { if (window.katex) caja.querySelector('.az-texto').innerHTML = pintarTexto(); else setTimeout(listo, 300); })();
  };
})();
