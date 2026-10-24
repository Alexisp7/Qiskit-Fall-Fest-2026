// El ansatz en matemáticas: por qué, partiendo de ángulos θ al azar, la capa de
// R_Y, la cascada de CZ y la capa final pueden llegar a la ruta de mínima
// energía. El VQE en matemáticas (etapa Solver): la energía E(θ, φ), la regla de la
// sinusoide y, para el triángulo (9 qubits), el estado exacto simulado en el
// navegador y optimizado parámetro por parámetro.
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
      ['|\\psi(\\theta,\\varphi)\\rangle = \\bigotimes_{k} R_Y(\\varphi_k)\\,|\\psi_2\\rangle \\;\\Rightarrow\\; \\psi(b) = \\sum_{b\'}\\Big[\\prod_{k} r_k(b_k, b\'_k)\\Big]\\,(-1)^{\\sum_k b\'_k b\'_{k+1}} \\prod_{k} a_k(b\'_k)', 'r_k(b, b′) son las entradas de R_Y(φ_k). Ahora cada amplitud final es una suma con signos: unas cadenas se refuerzan y otras se cancelan.'],
      ['\\psi(b)\\in\\mathbb{R}, \\qquad \\sum_b \\psi(b)^{2} = 1', 'Los signos de la cascada dependen de pares vecinos, así que la interferencia crea correlaciones entre qubits vecinos.']
    ] },
    { t: 'La energía es un promedio de las rutas', l: [
      ['E(\\theta,\\varphi) = \\langle\\psi(\\theta,\\varphi)|\\hat H|\\psi(\\theta,\\varphi)\\rangle = \\sum_{b} |\\psi(b)|^{2}\\, H(b)', 'Como Ĥ es diagonal, E(θ, φ) es el promedio de las energías H(b) de todas las cadenas, pesado por su probabilidad.'],
      ['E(\\theta,\\varphi) \\;\\ge\\; \\min_{b} H(b), \\qquad \\text{con igualdad} \\iff P(b) > 0 \\text{ solo en los mínimos}', 'Minimizar E obliga a mover toda la probabilidad hacia las rutas de menor costo.']
    ] },
    { t: 'Sin la cascada: campo medio', l: [
      ['\\text{sin CZ:}\\quad E(\\theta) = \\text{cte} + \\sum_k h_k \\cos\\theta_k + \\sum_{k<l} J_{kl}\\cos\\theta_k\\cos\\theta_l', 'Con un estado producto, ⟨z_k z_l⟩ = ⟨z_k⟩⟨z_l⟩: cada qubit solo ve el promedio de los demás. Sin CZ, las dos capas se juntan: R_Y(φ_k)R_Y(θ_k) = R_Y(θ_k + φ_k).'],
      ['c_k = \\cos\\theta_k \\in [-1, 1]:\\quad \\min_{c\\,\\in\\,[-1,1]^n} E(c) \\;=\\; \\min_{c\\,\\in\\,\\{\\pm 1\\}^n} E(c) \\;=\\; \\min_b H(b)', 'E es multilineal: fijados los demás, es lineal en cada c_k, así que el mínimo cae en un extremo, c_k = ±1. Repitiendo qubit por qubit se llega a una esquina, que es una cadena de bits. El campo medio también puede alcanzar la ruta óptima.']
    ] },
    { t: 'La ruta es alcanzable, con o sin cascada', l: [
      ['\\theta_k = 0 \\Rightarrow |\\psi_1\\rangle = |0\\cdots 0\\rangle, \\qquad U_{\\mathrm{CZ}}|0\\cdots0\\rangle = |0\\cdots0\\rangle'],
      ['\\varphi_k = \\pi\\, b^{*}_k \\;\\Rightarrow\\; R_Y(\\pi)|0\\rangle = |1\\rangle \\;\\Rightarrow\\; |\\psi(\\theta,\\varphi)\\rangle = |b^{*}\\rangle,\\quad E = H(b^{*}) = \\min_b H(b)', 'Basta la capa de R_Y(π): la cascada no interviene. La ruta óptima ya está en la familia del campo medio; el entrelazamiento no hace falta para alcanzarla.'],
      ['b^{*}_{1\\to2\\to3}:\\ x_{11} = x_{22} = x_{33} = 1 \\;\\Rightarrow\\; H(b^{*}) = ' + C + '{12}', 'En el triángulo: d₁₂ + d₂₃ = 5 + 7.']
    ] },
    { t: 'Para qué sirve la cascada: el paisaje', l: [
      ['b \\text{ ruta válida}\\;\\Rightarrow\\; H(b \\oplus e_k) - H(b) \\;\\ge\\; A - 2B\\,d_{\\max} > 0', 'Cambiar un solo bit de una ruta válida rompe al menos una regla (cuesta A) y ahorra a lo más dos distancias. Cada ruta válida es un mínimo local: pasar de 1 → 3 → 2 a 1 → 2 → 3 exige cambiar cuatro bits a la vez.'],
      ['\\text{con CZ:}\\quad \\langle z_k z_l\\rangle_\\theta \\ne \\langle z_k\\rangle_\\theta\\langle z_l\\rangle_\\theta', 'La cascada agrega direcciones correlacionadas, por ejemplo «x₂₂ y x₃₃ suben mientras x₃₂ y x₂₃ bajan», que pueden ayudar a salir de esos mínimos.'],
      ['\\text{triángulo, 2000 arranques:}\\quad P(\\text{llegar a } E = 12) \\approx ' + C + '{35\\,\\%} \\text{ con CZ}, \\quad 32\\,\\% \\text{ sin CZ}', 'Medido con la regla de la sinusoide de la etapa Solver. Los demás arranques terminan en H = 14 o 16, que son otras rutas válidas. La cascada ayuda, pero no lo garantiza: por eso el VQE usa varios arranques.']
    ] },
    { t: 'De θ al azar a la ruta: cada ángulo es un seno', l: [
      ['E(\\theta_j) = \\alpha_j \\cos(\\theta_j - \\beta_j) + \\gamma_j', 'Cada ángulo (un θ_j o un φ_j) aparece en una sola R_Y, así que la energía, como función de ese ángulo, es una sinusoide.'],
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
    return { N: N, T: T, n: n, dim: dim, E: E, min: min, kDe: kDe };
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

  // ── ejemplo resuelto (desplegable): el ansatz con 2 qubits paso a paso, y cómo crece a n ──
  var K0 = String.raw`|0\rangle`, K1 = String.raw`|1\rangle`;
  function th(k) { return String.raw`\theta_${k}`; }
  function ph(k) { return String.raw`\varphi_${k}`; }
  function cs(f, x) { return '\\' + f + String.raw`\tfrac{${x}}{2}`; }                         // \cos\tfrac{x}{2}
  function giro0(x) { return String.raw`\big(` + cs('cos', x) + K0 + '+' + cs('sin', x) + K1 + String.raw`\big)`; }   // R_Y(x)|0⟩
  function giro1(x) { return String.raw`\big(-` + cs('sin', x) + K0 + '+' + cs('cos', x) + K1 + String.raw`\big)`; }  // R_Y(x)|1⟩
  function q2(sg) { return String.raw`\big(` + cs('cos', th(2)) + K0 + sg + cs('sin', th(2)) + K1 + String.raw`\big)`; }
  // [título, fórmula, nota]
  function pasosDos() {
    return [
      ['Se parte de |00⟩', String.raw`|\psi_0\rangle = |0\rangle\otimes|0\rangle = |00\rangle`, 'Cada término se lee |qubit 1⟩ ⊗ |qubit 2⟩.'],
      ['Primera capa: cada qubit gira por su cuenta', String.raw`|\psi_1\rangle = ` + giro0(th(1)) + String.raw`\otimes` + giro0(th(2)), 'Todavía es un producto: lo que haga un qubit no depende del otro.'],
      ['La CZ solo cambia el signo de |11⟩', String.raw`\mathrm{CZ}\,|0\,b\rangle = |0\,b\rangle, \qquad \mathrm{CZ}\,|1\,b\rangle = |1\rangle\otimes Z|b\rangle, \qquad Z|0\rangle = |0\rangle,\ Z|1\rangle = -|1\rangle`, 'Conviene agrupar por el qubit 1: si vale |0⟩ no pasa nada; si vale |1⟩, el qubit 2 recibe una Z.'],
      ['', String.raw`|\psi_2\rangle = ` + cs('cos', th(1)) + K0 + String.raw`\otimes` + q2('+') + String.raw`\;+\;` + cs('sin', th(1)) + K1 + String.raw`\otimes` + q2('-'), 'El único cambio es el signo menos del segundo paréntesis. Con él, en general, el estado ya no se puede escribir como un producto: los qubits quedan entrelazados.'],
      ['Capa final, qubit 1', String.raw`R_Y(\varphi)|0\rangle = ` + giro0('\\varphi') + String.raw`, \qquad R_Y(\varphi)|1\rangle = ` + giro1('\\varphi'), 'Las dos columnas de la matriz de R_Y.'],
      ['', String.raw`|\psi\rangle = \begin{aligned}[t] &` + cs('cos', th(1)) + giro0(ph(1)) + String.raw`\otimes R_Y(\varphi_2)` + q2('+') + String.raw` \\ +\;&` + cs('sin', th(1)) + giro1(ph(1)) + String.raw`\otimes R_Y(\varphi_2)` + q2('-') + String.raw` \end{aligned}`, 'Ojo con el segundo término: R_Y(φ₁) lleva |1⟩ a −sin(φ₁/2)|0⟩ + cos(φ₁/2)|1⟩, con |1⟩ al final.'],
      ['Capa final, qubit 2: los dos paréntesis a la vez', String.raw`\begin{aligned} R_Y(\varphi_2)\big(\cos\tfrac{\theta_2}{2}|0\rangle \pm \sin\tfrac{\theta_2}{2}|1\rangle\big) &= \cos\tfrac{\theta_2}{2}\big(\cos\tfrac{\varphi_2}{2}|0\rangle + \sin\tfrac{\varphi_2}{2}|1\rangle\big) \pm \sin\tfrac{\theta_2}{2}\big(-\sin\tfrac{\varphi_2}{2}|0\rangle + \cos\tfrac{\varphi_2}{2}|1\rangle\big) \\ &= \big(\cos\tfrac{\varphi_2}{2}\cos\tfrac{\theta_2}{2} \mp \sin\tfrac{\varphi_2}{2}\sin\tfrac{\theta_2}{2}\big)|0\rangle + \big(\sin\tfrac{\varphi_2}{2}\cos\tfrac{\theta_2}{2} \pm \cos\tfrac{\varphi_2}{2}\sin\tfrac{\theta_2}{2}\big)|1\rangle \\ &= \cos\tfrac{\varphi_2 \pm \theta_2}{2}\,|0\rangle + \sin\tfrac{\varphi_2 \pm \theta_2}{2}\,|1\rangle \;=\; R_Y(\varphi_2 \pm \theta_2)\,|0\rangle \end{aligned}`, 'Con cos(a ± b) = cos a cos b ∓ sin a sin b y sin(a ± b) = sin a cos b ± cos a sin b. Dos giros R_Y seguidos se suman; el signo de la CZ convierte θ₂ en −θ₂.'],
      ['Resultado', String.raw`\boxed{\begin{aligned} |\psi(\theta_1,\theta_2,\varphi_1,\varphi_2)\rangle \;=\; &\cos\tfrac{\theta_1}{2}\,\underbrace{\big(\cos\tfrac{\varphi_1}{2}|0\rangle + \sin\tfrac{\varphi_1}{2}|1\rangle\big)}_{\text{qubit 1}} \otimes \underbrace{\big(\cos\tfrac{\varphi_2+\theta_2}{2}|0\rangle + \sin\tfrac{\varphi_2+\theta_2}{2}|1\rangle\big)}_{\text{qubit 2}} \\ +\; &\sin\tfrac{\theta_1}{2}\,\underbrace{\big(-\sin\tfrac{\varphi_1}{2}|0\rangle + \cos\tfrac{\varphi_1}{2}|1\rangle\big)}_{\text{qubit 1}} \otimes \underbrace{\big(\cos\tfrac{\varphi_2-\theta_2}{2}|0\rangle + \sin\tfrac{\varphi_2-\theta_2}{2}|1\rangle\big)}_{\text{qubit 2}} \end{aligned}}`, 'Dos términos, cada uno un producto; la suma de los dos es lo que entrelaza.'],
      ['La amplitud de cada resultado', String.raw`\alpha = \tfrac{\varphi_2+\theta_2}{2},\quad \beta = \tfrac{\varphi_2-\theta_2}{2}: \qquad \begin{aligned} \psi(00) &= \cos\tfrac{\theta_1}{2}\cos\tfrac{\varphi_1}{2}\cos\alpha - \sin\tfrac{\theta_1}{2}\sin\tfrac{\varphi_1}{2}\cos\beta \\ \psi(01) &= \cos\tfrac{\theta_1}{2}\cos\tfrac{\varphi_1}{2}\sin\alpha - \sin\tfrac{\theta_1}{2}\sin\tfrac{\varphi_1}{2}\sin\beta \\ \psi(10) &= \cos\tfrac{\theta_1}{2}\sin\tfrac{\varphi_1}{2}\cos\alpha + \sin\tfrac{\theta_1}{2}\cos\tfrac{\varphi_1}{2}\cos\beta \\ \psi(11) &= \cos\tfrac{\theta_1}{2}\sin\tfrac{\varphi_1}{2}\sin\alpha + \sin\tfrac{\theta_1}{2}\cos\tfrac{\varphi_1}{2}\sin\beta \end{aligned} \qquad P(b) = \psi(b)^2`, 'Se reparte el resultado en |0⟩ y |1⟩ de cada qubit. Arriba, en las probabilidades, se calcula con tus ángulos.']
    ];
  }
  // n qubits: la última CZ solo pone una Z en el último qubit, y Z R_Y(θ)|0⟩ = R_Y(−θ)|0⟩
  function terminosN(n) {
    var terminos = [];
    for (var m = 0; m < 1 << (n - 1); m++) {
      var b = []; for (var k = 0; k < n - 1; k++) b.push((m >> (n - 2 - k)) & 1);
      var par = 0; for (var k2 = 0; k2 < n - 2; k2++) par += b[k2] * b[k2 + 1];
      var coef = b.map(function (v, k) { return (v ? 's' : 'c') + '_{' + (k + 1) + '}'; }).join('\\,');
      var fac = b.map(function (v, k) { return String.raw`|\varphi_{${k + 1}}^{${v}}\rangle`; }).join('') + String.raw`|\varphi_{${n}}{${b[n - 2] ? '-' : '+'}}\theta_{${n}}\rangle`;
      terminos.push((par % 2 ? '-' : (m ? '+' : '')) + coef + '\\,' + fac);
    }
    var lineas = [];   // dos términos por renglón
    for (var i = 0; i < terminos.length; i += 2) lineas.push((i ? '&\\;' : '&') + terminos[i] + (terminos[i + 1] ? '\\;' + terminos[i + 1] : ''));
    return String.raw`|\psi\rangle = \begin{aligned}[t] ` + lineas.join(' \\\\ ') + String.raw` \end{aligned}`;
  }
  function pasosN(n) {
    return [
      ['Primera capa', String.raw`\bigotimes_{k=1}^{${n}}\big(\cos\tfrac{\theta_k}{2}|0\rangle + \sin\tfrac{\theta_k}{2}|1\rangle\big) = \sum_{b\,\in\,\{0,1\}^{${n}}} \Big[\prod_{k=1}^{${n}} a_k(b_k)\Big]|b\rangle, \qquad a_k(0) = \cos\tfrac{\theta_k}{2},\ a_k(1) = \sin\tfrac{\theta_k}{2}`, 'Igual que con 2 qubits: un producto que reparte amplitud entre las 2ⁿ cadenas.'],
      ['La cascada de CZ', String.raw`\prod_{k=1}^{${n - 1}}\mathrm{CZ}_{k,k+1}\,|b\rangle = (-1)^{\,b_1b_2 + \cdots + b_{${n - 1}}b_{${n}}}\,|b\rangle`, 'Cada par vecino en 11 aporta un signo menos.'],
      ['El truco del último qubit', String.raw`\cos\tfrac{\theta_{${n}}}{2}|0\rangle + (-1)^{b_{${n - 1}}}\sin\tfrac{\theta_{${n}}}{2}|1\rangle = R_Y\big((-1)^{b_{${n - 1}}}\theta_{${n}}\big)|0\rangle \;\Rightarrow\; R_Y(\varphi_{${n}})\,R_Y(\pm\theta_{${n}})|0\rangle = R_Y(\varphi_{${n}} \pm \theta_{${n}})|0\rangle`, 'La última CZ es la del paso 3 de 2 qubits: una Z en el último qubit cuando el anterior vale 1. Se suma igual que antes.'],
      ['Forma general', String.raw`|\psi\rangle = \sum_{b_1\cdots b_{${n - 1}}} (-1)^{\sum_{k=1}^{${n - 2}} b_k b_{k+1}} \Big[\prod_{k=1}^{${n - 1}} a_k(b_k)\Big] \Big[\bigotimes_{k=1}^{${n - 1}} R_Y(\varphi_k)|b_k\rangle\Big] \otimes R_Y\big(\varphi_{${n}} + (-1)^{b_{${n - 1}}}\theta_{${n}}\big)|0\rangle`, '2ⁿ⁻¹ términos, cada uno un producto. Con n = 2 la suma de signos está vacía y queda exactamente el recuadro de 2 qubits.'],
      ['Escrito término a término (n = ' + n + ')', String.raw`c_k = \cos\tfrac{\theta_k}{2},\ \ s_k = \sin\tfrac{\theta_k}{2},\ \ |\varphi_k^{0}\rangle = R_Y(\varphi_k)|0\rangle,\ \ |\varphi_k^{1}\rangle = R_Y(\varphi_k)|1\rangle,\ \ |\varphi_{${n}}{\pm}\theta_{${n}}\rangle = R_Y(\varphi_{${n}} \pm \theta_{${n}})|0\rangle`, null],
      ['', terminosN(n), 'Los signos menos salen de los pares vecinos en 1 entre los primeros n − 1 qubits; el último qubit lleva +θ o −θ según su vecino.']
    ];
  }
  // el mismo ejemplo sin la cascada: un solo producto
  function pasosSin(n) {
    if (n === 2) return [
      ['Se parte de |00⟩', String.raw`|\psi_0\rangle = |0\rangle\otimes|0\rangle = |00\rangle`, null],
      ['Primera capa: igual que con la cascada', String.raw`|\psi_1\rangle = ` + giro0(th(1)) + String.raw`\otimes` + giro0(th(2)), 'Hasta aquí no cambia nada.'],
      ['Sin CZ, cada qubit sigue por su cuenta', String.raw`|\psi\rangle = R_Y(\varphi_1)` + giro0(th(1)) + String.raw`\;\otimes\; R_Y(\varphi_2)` + giro0(th(2)), 'Ningún paso mezcla los qubits: el estado sigue siendo un producto.'],
      ['Dos giros seguidos se suman', String.raw`\begin{aligned} R_Y(\varphi)\big(\cos\tfrac{\theta}{2}|0\rangle + \sin\tfrac{\theta}{2}|1\rangle\big) &= \cos\tfrac{\theta}{2}\big(\cos\tfrac{\varphi}{2}|0\rangle + \sin\tfrac{\varphi}{2}|1\rangle\big) + \sin\tfrac{\theta}{2}\big(-\sin\tfrac{\varphi}{2}|0\rangle + \cos\tfrac{\varphi}{2}|1\rangle\big) \\ &= \big(\cos\tfrac{\varphi}{2}\cos\tfrac{\theta}{2} - \sin\tfrac{\varphi}{2}\sin\tfrac{\theta}{2}\big)|0\rangle + \big(\sin\tfrac{\varphi}{2}\cos\tfrac{\theta}{2} + \cos\tfrac{\varphi}{2}\sin\tfrac{\theta}{2}\big)|1\rangle \\ &= \cos\tfrac{\varphi + \theta}{2}\,|0\rangle + \sin\tfrac{\varphi + \theta}{2}\,|1\rangle \;=\; R_Y(\varphi + \theta)\,|0\rangle \end{aligned}`, 'Es la misma cuenta del paso 5 con cascada, pero siempre con +θ: sin la Z de la CZ nunca aparece −θ.'],
      ['Resultado', String.raw`\boxed{|\psi\rangle = \underbrace{\big(\cos\tfrac{\theta_1+\varphi_1}{2}|0\rangle + \sin\tfrac{\theta_1+\varphi_1}{2}|1\rangle\big)}_{\text{qubit 1}} \otimes \underbrace{\big(\cos\tfrac{\theta_2+\varphi_2}{2}|0\rangle + \sin\tfrac{\theta_2+\varphi_2}{2}|1\rangle\big)}_{\text{qubit 2}}}`, 'Un solo término, frente a los dos de la cascada. Los cuatro ángulos actúan como dos: solo importan las sumas γₖ = θₖ + φₖ.'],
      ['Las amplitudes se factorizan', String.raw`\gamma_k = \theta_k + \varphi_k: \qquad \psi(b_1 b_2) = u_1(b_1)\,u_2(b_2), \quad u_k(0) = \cos\tfrac{\gamma_k}{2},\ u_k(1) = \sin\tfrac{\gamma_k}{2} \qquad P(b_1 b_2) = P_1(b_1)\,P_2(b_2)`, 'Lo que se mida en un qubit no depende del otro.'],
      ['Por qué |01⟩ + |10⟩ es imposible', String.raw`\psi(00)\,\psi(11) = u_1(0)\,u_2(0)\,u_1(1)\,u_2(1) = \psi(01)\,\psi(10) \;\Rightarrow\; C = 2\,\big|\psi(00)\,\psi(11) - \psi(01)\,\psi(10)\big| = 0`, '|01⟩ + |10⟩ pide ψ(00) = ψ(11) = 0 con ψ(01) y ψ(10) distintos de 0, y eso rompe la igualdad. Pruébalo: no hay ángulos que lo logren.']
    ];
    return [
      ['Primera capa', String.raw`\bigotimes_{k=1}^{${n}}\big(\cos\tfrac{\theta_k}{2}|0\rangle + \sin\tfrac{\theta_k}{2}|1\rangle\big)`, 'Igual que con la cascada.'],
      ['Sin cascada, cada qubit por su cuenta', String.raw`|\psi\rangle = \bigotimes_{k=1}^{${n}} R_Y(\varphi_k)\,R_Y(\theta_k)|0\rangle = \bigotimes_{k=1}^{${n}}\big(\cos\tfrac{\gamma_k}{2}|0\rangle + \sin\tfrac{\gamma_k}{2}|1\rangle\big), \qquad \gamma_k = \theta_k + \varphi_k`, 'Un solo producto, sin suma de términos: ' + (2 * n) + ' ángulos que funcionan como ' + n + '.'],
      ['Amplitudes y probabilidades', String.raw`\psi(b) = \prod_{k=1}^{${n}} u_k(b_k), \qquad P(b) = \prod_{k=1}^{${n}} P_k(b_k)`, 'Con la cascada había 2ⁿ⁻¹ términos con signos; aquí, uno.'],
      ['La energía del campo medio', String.raw`E = \text{cte} + \sum_{k} h_k \cos\gamma_k + \sum_{k<l} J_{kl}\cos\gamma_k\cos\gamma_l`, 'Es la ecuación de la sección 6, «Sin la cascada»: multilineal, con el mínimo en una cadena de bits. Llega a la ruta, pero cada ruta válida es un mínimo local.']
    ];
  }
  function circuitoN(n, sinCZ) {
    var dy = 38, y0 = 34, xcz = 196, xf = xcz + (n - 1) * 26 + 34, W = xf + 150, H = y0 + (n - 1) * dy + (sinCZ ? 40 : 26);
    var o = '<svg class="az-circ az-2q-circ" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Circuito del ansatz con ' + n + ' qubits' + (sinCZ ? ', sin la cascada de CZ' : '') + '">';
    for (var k = 0; k < n; k++) {
      var y = y0 + k * dy;
      o += '<text class="azc-q" x="4" y="' + (y + 5) + '">q<tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan></text><text class="azc-ket" x="34" y="' + (y + 5) + '">|0⟩</text>';
      o += '<line class="azc-cable" x1="60" y1="' + y + '" x2="' + (W - 14) + '" y2="' + y + '"/>';
      o += '<rect class="azc-ry" x="78" y="' + (y - 12) + '" width="70" height="24"/><text class="azc-g" x="113" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(θ</tspan><tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3">)</tspan></text>';
      o += '<rect class="azc-ry" x="' + xf + '" y="' + (y - 12) + '" width="70" height="24"/><text class="azc-g" x="' + (xf + 35) + '" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(φ</tspan><tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3">)</tspan></text>';
      o += '<rect class="azc-ry" x="' + (xf + 92) + '" y="' + (y - 12) + '" width="28" height="24"/><path class="azc-aguja" d="M' + (xf + 97) + ' ' + (y + 6) + ' A9 9 0 0 1 ' + (xf + 115) + ' ' + (y + 6) + ' M' + (xf + 106) + ' ' + (y + 6) + ' L' + (xf + 113) + ' ' + (y - 6) + '"/>';
    }
    if (sinCZ) o += '<rect class="azc-hueco" x="' + (xcz - 16) + '" y="' + (y0 - 18) + '" width="' + ((n - 2) * 26 + 32) + '" height="' + ((n - 1) * dy + 36) + '"/><text class="azc-col" x="' + (xcz + (n - 2) * 13) + '" y="' + (H - 4) + '">sin CZ</text>';
    else for (var c = 0; c < n - 1; c++) {
      var x = xcz + c * 26, ya = y0 + c * dy, yb = ya + dy;
      o += '<line class="azc-cz" x1="' + x + '" y1="' + ya + '" x2="' + x + '" y2="' + yb + '"/><circle class="azc-p" cx="' + x + '" cy="' + ya + '" r="4.5"/><circle class="azc-p" cx="' + x + '" cy="' + yb + '" r="4.5"/>';
    }
    return o + '</svg>';
  }
  // estado exacto de n qubits; el qubit k es el bit k del índice
  function estadoN(n, t, f, sinCZ) {
    var dim = 1 << n, psi = new Float64Array(dim); psi[0] = 1;
    function ry(q, ang) { var c = Math.cos(ang / 2), s = Math.sin(ang / 2), m = 1 << q; for (var i = 0; i < dim; i++) if (!(i & m)) { var a = psi[i], b = psi[i | m]; psi[i] = c * a - s * b; psi[i | m] = s * a + c * b; } }
    for (var q = 0; q < n; q++) ry(q, t[q]);
    if (!sinCZ) for (var k = 0; k < n - 1; k++) { var mm = (1 << k) | (1 << (k + 1)); for (var i = 0; i < dim; i++) if ((i & mm) === mm) psi[i] = -psi[i]; }
    for (var q2 = 0; q2 < n; q2++) ry(q2, f[q2]);
    return psi;
  }
  // un estado por desplegable: con la cascada y sin ella
  var EST = { con: { abierto: false, n: 2, t: [90, 90], f: [0, 90] }, sin: { abierto: false, n: 2, t: [90, 90], f: [0, 90] } };
  var TXT = {
    con: { kicker: 'Ejemplo resuelto · para mirar y jugar', tit: function (n) { return n === 2 ? 'El ansatz con 2 qubits, paso a paso' : 'De 2 a ' + n + ' qubits: la misma cuenta'; }, ayuda: 'Con 2 está todo el álgebra; con 3 o 4, cómo se generaliza.' },
    sin: { kicker: 'Supuesto · sin la cascada', tit: function (n) { return n === 2 ? 'El mismo ejemplo de 2 qubits, sin CZ' : 'Sin CZ con ' + n + ' qubits: un solo producto'; }, ayuda: 'Los mismos ángulos que el ejemplo con cascada; la marca dorada en cada barra es lo que daría con ella.' }
  };
  function montarDos(slot) {
    if (!slot) return;
    var modo = slot.getAttribute('data-modo') || 'con', sin = modo === 'sin', dos = EST[modo], tx = TXT[modo];
    var R = Math.PI / 180;
    function f3(v) { var r = Math.round(v * 1000) / 1000; return (Math.abs(r) < 5e-4 ? 0 : r).toFixed(3).replace('.', ','); }
    slot.innerHTML = '<details class="az-2q' + (sin ? ' sin' : '') + '"' + (dos.abierto ? ' open' : '') + '><summary><span class="az-2q-kicker">' + tx.kicker + '</span><span class="az-2q-tit"></span><span class="az-2q-mas" aria-hidden="true"></span></summary>' +
      '<div class="az-2q-cuerpo"><div class="az-2q-cab"><span class="az-2q-lbl">Qubits</span>' + [2, 3, 4].map(function (k) { return '<button type="button" class="az-2q-nb" data-n="' + k + '">' + k + '</button>'; }).join('') + '<span class="az-2q-ayuda">' + tx.ayuda + '</span></div>' +
      '<div data-dos="circ"></div><div class="az-2q-grid"><div class="az-2q-alg" data-dos="alg"></div><div class="az-2q-juego">' +
      '<div class="cp-mult-tit">Probabilidades de los <span data-dos="nq"></span> qubits' + (sin ? ', sin CZ' : '') + '</div><div class="az-2q-pre" data-dos="pre"></div><div class="az-2q-sl" data-dos="sl"></div><div data-dos="barras"></div><div class="az-2q-num" data-dos="num"></div></div></div></div></details>';
    var det = slot.querySelector('details');
    det.addEventListener('toggle', function () { dos.abierto = det.open; });
    function $(k) { return slot.querySelector('[data-dos="' + k + '"]'); }
    function presets() {
      var p = [['todo en 0', function () { dos.t = dos.t.map(function () { return 0; }); dos.f = dos.f.map(function () { return 0; }); }],
               ['al azar', function () { dos.t = dos.t.map(function () { return Math.round(Math.random() * 72) * 5; }); dos.f = dos.f.map(function () { return Math.round(Math.random() * 72) * 5; }); }]];
      if (dos.n === 2 && !sin) p.unshift(['entrelazado: |01⟩ + |10⟩', function () { dos.t = [90, 90]; dos.f = [0, 90]; }], ['sin entrelazar: θ₁ = 0', function () { dos.t = [0, 60]; dos.f = [40, 30]; }]);
      if (dos.n === 2 && sin) p.unshift(['los ángulos de |01⟩ + |10⟩', function () { dos.t = [90, 90]; dos.f = [0, 90]; }]);
      $('pre').innerHTML = ''; p.forEach(function (x) { var b = document.createElement('button'); b.type = 'button'; b.className = 'dv-btn'; b.textContent = x[0]; b.addEventListener('click', function () { x[1](); deslizadores(); calcular(); }); $('pre').appendChild(b); });
    }
    function deslizadores() {
      var h = '';
      for (var k = 0; k < dos.n; k++) [['t', 'θ'], ['f', 'φ']].forEach(function (z) {
        h += '<label class="az-2q-d"><span>' + z[1] + '<sub>' + (k + 1) + '</sub></span><b data-v="' + z[0] + k + '">' + dos[z[0]][k] + '°</b><input type="range" min="0" max="360" step="5" value="' + dos[z[0]][k] + '" data-a="' + z[0] + '" data-k="' + k + '"></label>';
      });
      $('sl').innerHTML = h;
      Array.prototype.forEach.call($('sl').querySelectorAll('input'), function (inp) {
        inp.addEventListener('input', function () { var a = inp.getAttribute('data-a'), k = +inp.getAttribute('data-k'); dos[a][k] = +inp.value; $('sl').querySelector('[data-v="' + a + k + '"]').textContent = inp.value + '°'; calcular(); });
      });
    }
    function calcular() {
      var n = dos.n, tr = dos.t.map(function (v) { return v * R; }), fr = dos.f.map(function (v) { return v * R; });
      var psi = estadoN(n, tr, fr, sin), otro = sin ? estadoN(n, tr, fr, false) : null, filas = '', suma = 0;
      for (var m = 0; m < 1 << n; m++) {
        var s = 0, et = ''; for (var k = 0; k < n; k++) { var b = (m >> (n - 1 - k)) & 1; s |= b << k; et += b; }
        var p = psi[s] * psi[s]; suma += p;
        var marca = otro ? '<i class="az-2q-marca" style="left:' + (otro[s] * otro[s] * 100).toFixed(1) + '%" title="con la cascada: ' + (otro[s] * otro[s] * 100).toFixed(1).replace('.', ',') + ' %"></i>' : '';
        filas += '<div class="az-2q-fila"><span class="az-2q-ket">|' + et + '⟩</span><span class="az-barra az-2q-barra"><span style="width:' + (p * 100).toFixed(1) + '%"></span>' + marca + '</span><span class="az-2q-p">' + (p * 100).toFixed(1).replace('.', ',') + ' %</span><span class="az-2q-amp">ψ = ' + f3(psi[s]) + '</span></div>';
      }
      $('barras').innerHTML = filas + '<p class="az-ley">Suma: ' + (suma * 100).toFixed(1).replace('.', ',') + ' % · orden: qubit de arriba a la izquierda · ' + (sin ? 'marca dorada: con la cascada, mismos ángulos.' : 'el signo de ψ no se mide, pero decide la interferencia.') + '</p>';
      if (n !== 2) { $('num').innerHTML = ''; return; }
      var h, amp = {};
      if (sin) {
        var g1 = (dos.t[0] + dos.f[0]) * R, g2 = (dos.t[1] + dos.f[1]) * R, u1 = [Math.cos(g1 / 2), Math.sin(g1 / 2)], u2 = [Math.cos(g2 / 2), Math.sin(g2 / 2)];
        h = '<div class="az-2q-num-tit">Con tus ángulos: γ₁ = ' + (dos.t[0] + dos.f[0]) + '°, γ₂ = ' + (dos.t[1] + dos.f[1]) + '°</div>';
        ['00', '01', '10', '11'].forEach(function (b) { var v = u1[+b[0]] * u2[+b[1]]; amp[b] = v; h += '<div>ψ(' + b + ') = u₁(' + b[0] + ') · u₂(' + b[1] + ') = ' + f3(u1[+b[0]]) + ' · ' + f3(u2[+b[1]]) + ' = <b>' + f3(v) + '</b></div>'; });
      } else {
        var c1 = Math.cos(dos.t[0] * R / 2), s1 = Math.sin(dos.t[0] * R / 2), C1 = Math.cos(dos.f[0] * R / 2), S1 = Math.sin(dos.f[0] * R / 2);
        var al = (dos.f[1] + dos.t[1]) * R / 2, be = (dos.f[1] - dos.t[1]) * R / 2;
        var A = [['00', c1 * C1, Math.cos(al), -s1 * S1, Math.cos(be)], ['01', c1 * C1, Math.sin(al), -s1 * S1, Math.sin(be)], ['10', c1 * S1, Math.cos(al), s1 * C1, Math.cos(be)], ['11', c1 * S1, Math.sin(al), s1 * C1, Math.sin(be)]];
        h = '<div class="az-2q-num-tit">Con tus ángulos (fórmulas del paso 7)</div>';
        A.forEach(function (r) { var v = r[1] * r[2] + r[3] * r[4]; amp[r[0]] = v; h += '<div>ψ(' + r[0] + ') = ' + f3(r[1]) + ' · ' + f3(r[2]) + ' ' + (r[3] < 0 ? '−' : '+') + ' ' + f3(Math.abs(r[3])) + ' · ' + f3(r[4]) + ' = <b>' + f3(v) + '</b></div>'; });
      }
      var conc = 2 * Math.abs(amp['00'] * amp['11'] - amp['01'] * amp['10']);
      h += '<div class="az-2q-conc">Entrelazamiento (concurrencia) C = 2|ψ(00)ψ(11) − ψ(01)ψ(10)| = <b>' + f3(conc) + '</b><span>' + (sin ? 'sin la cascada siempre vale 0' : '0: producto · 1: máximo') + '</span></div>';
      $('num').innerHTML = h;
    }
    function pintarN() {
      var n = dos.n;
      while (dos.t.length < n) { dos.t.push(0); dos.f.push(0); }
      dos.t.length = n; dos.f.length = n;
      Array.prototype.forEach.call(slot.querySelectorAll('.az-2q-nb'), function (b) { b.classList.toggle('activo', +b.getAttribute('data-n') === n); });
      slot.querySelector('.az-2q-tit').textContent = tx.tit(n);
      $('nq').textContent = n;
      $('circ').innerHTML = circuitoN(n, sin);
      var paso = 0;
      $('alg').innerHTML = (sin ? pasosSin(n) : n === 2 ? pasosDos() : pasosN(n)).map(function (p) {
        return (p[0] ? '<div class="az-2q-paso"><span>' + (++paso) + '</span>' + p[0] + '</div>' : '') + '<div class="dv-linea">' + tex(p[1], true) + (p[2] ? '<p class="dv-nota">' + p[2] + '</p>' : '') + '</div>';
      }).join('');
      presets(); deslizadores(); calcular();
    }
    Array.prototype.forEach.call(slot.querySelectorAll('.az-2q-nb'), function (b) { b.addEventListener('click', function () { dos.n = +b.getAttribute('data-n'); pintarN(); }); });
    pintarN();
  }
  // comparación de variantes del ansatz en el triángulo (2000 arranques al azar, regla de la sinusoide)
  function comparacion() {
    var F = [
      ['Solo R<sub>Y</sub> (campo medio)', '9', '0', 'sí', 'no', '32 %', '76', ''],
      ['R<sub>Y</sub> + CZ, sin capa final', '9', '8', 'sí', 'no: la CZ antes de medir no cambia ninguna probabilidad', '32 %', '76', ''],
      ['R<sub>Y</sub> + CZ + R<sub>Y</sub> (el propuesto)', '18', '8', 'sí', 'sí', '35 %', '1 337', ' class="az-cmp-yo"'],
      ['Dos capas: R<sub>Y</sub> CZ R<sub>Y</sub> CZ R<sub>Y</sub>', '27', '16', 'sí', 'sí', '33 %', '2 815', '']
    ];
    return '<section class="dv-seccion az-cmp"><div class="dv-paso-tit">Comparación: por qué dos capas de R<sub>Y</sub> con la cascada</div>' +
      '<div class="az-cmp-caja"><table><thead><tr><th>Ansatz</th><th>Parámetros</th><th>CZ</th><th>¿Contiene la ruta óptima?</th><th>¿Entrelaza?</th><th>Llega al óptimo*</th><th>Evaluaciones*</th></tr></thead><tbody>' +
      F.map(function (f) { return '<tr' + f[7] + '><td>' + f[0] + '</td><td>' + f[1] + '</td><td>' + f[2] + '</td><td>' + f[3] + '</td><td>' + f[4] + '</td><td><b>' + f[5] + '</b></td><td>' + f[6] + '</td></tr>'; }).join('') +
      '</tbody></table></div>' +
      '<p class="az-cmp-pie">* Triángulo, 9 qubits: 2000 arranques al azar con la regla de la sinusoide de la etapa Solver (± 1 punto). «Llega al óptimo» = termina en E = 12; «evaluaciones» = promedio de energías calculadas por arranque.</p>' +
      '<p class="dv-nota">Es la versión más chica que entrelaza de verdad. Sin la capa final, la CZ no hace nada medible y el circuito equivale al campo medio. Sin la CZ, el estado es un producto y el optimizador se queda antes en otra ruta válida (32 % contra 35 %). Una segunda capa duplica parámetros y compuertas CZ y no mejora en el triángulo (33 %); en un chip real suma ruido y riesgo de <i>barren plateaus</i>. Además usa solo R<sub>Y</sub>, que da amplitudes reales (todo lo que necesita un Hamiltoniano diagonal; R<sub>Z</sub> sobre |0⟩ no cambia probabilidades), y CZ solo entre vecinos. La ventaja es modesta y no garantiza el óptimo: por eso el VQE usa varios arranques.</p></section>';
  }

  // el ansatz se queda con el circuito; la energía y la regla de la sinusoide pasan al VQE
  var SV = [S[5], S[9]], SA = S.filter(function (p, i) { return i !== 5 && i !== 9; });
  function seccion(p, i) {
    return '<section class="dv-seccion"><div class="dv-paso-tit"><span class="dv-num">' + (i + 1) + '.</span>' + p.t + '</div>' +
      p.l.map(function (l) { return '<div class="dv-linea">' + tex(l[0]) + (l[1] ? '<p class="dv-nota">' + l[1] + '</p>' : '') + '</div>'; }).join('') + '</section>';
  }

  window.montarAnsatzMat = function (caja) {
    function pintarTexto() {
      numero = 0;
      return '<div class="dv-cab"><div class="mx-kicker">El ansatz en matemáticas</div><h3 class="dv-tit">De un θ al azar a la ruta, a través de la cascada</h3>' +
        '<p class="dv-resumen"><b>Resumen.</b> Se sigue el estado del circuito desde |0⟩<sup>⊗n</sup>: la primera capa de R<sub>Y</sub>(θ) con ángulos al azar reparte amplitud entre todas las rutas, la cascada de CZ las marca con signos que dependen de pares vecinos y la capa final hace interferir esos signos. Se muestra que la ruta óptima está dentro de la familia del ansatz, incluso sin la cascada: lo que aportan las CZ no es alcanzar la ruta sino un mejor paisaje para el optimizador. Cómo se calcula la energía y cómo se ajustan los ángulos está en la etapa Solver.</p></div>' +
        '<div class="dv-pizarra">' + circuitoTexto() + SA.map(function (p, i) {
          return seccion(p, i) +
            (i === 4 ? '<div class="az-2q-slot" data-modo="con"></div>' : '') +   // tras la capa final: el ejemplo de 2 qubits
            (i === 5 ? '<div class="az-2q-slot" data-modo="sin"></div>' : '') +   // tras el campo medio: el mismo sin CZ
            (i === 7 ? comparacion() : '');
        }).join('') + '</div>';
    }
    caja.innerHTML = '<div class="az-texto">' + pintarTexto() + '</div>';
    function montarSlots() { Array.prototype.forEach.call(caja.querySelectorAll('.az-2q-slot'), montarDos); }
    montarSlots();
    (function listo() { if (window.katex) { caja.querySelector('.az-texto').innerHTML = pintarTexto(); montarSlots(); } else setTimeout(listo, 300); })();
  };

  // ── el VQE en matemáticas: la energía E(θ, φ), la regla de la sinusoide y la demostración en vivo ──
  // ── demostración en vivo del VQE: el ansatz real de 9 qubits, la energía con J y h, y el optimizador ──
  function grados(a) { return Math.round((((a * 180 / Math.PI) % 360) + 360) % 360); }
  function nomParam(j) { return (j < 9 ? 'θ' : 'φ') + '<sub>' + (j % 9 + 1) + '</sub>'; }
  // el circuito del triángulo con los ángulos actuales; 'activo' = el parámetro que se está ajustando
  function circuitoValores(th, activos) {   // activos: los parámetros que se acaban de mover
    var N = 3, n = 9, dy = 30, y0 = 40, W = 900;
    var o = '<svg class="az-circ vq-circ" viewBox="0 0 ' + W + ' ' + (y0 + (n - 1) * dy + 28) + '" role="img" aria-label="Ansatz de 9 qubits con sus ángulos actuales, la medida, el Hamiltoniano y la energía">';
    o += '<text class="azc-col" x="170" y="16">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(θ)</tspan></text><text class="azc-col" x="420" y="16">cascada de CZ</text><text class="azc-col" x="670" y="16">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(φ)</tspan></text><text class="azc-col" x="795" y="16">medir Ĥ</text>';
    for (var k = 0; k < n; k++) {
      var y = y0 + k * dy, i = k % N + 1, t = Math.floor(k / N) + 1;
      o += '<text class="azc-q" x="6" y="' + (y + 5) + '">q<tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3"> · x</tspan><tspan class="azc-sub" dy="3">' + i + t + '</tspan></text>';
      o += '<text class="azc-ket" x="90" y="' + (y + 5) + '">|0⟩</text><line class="azc-cable" x1="114" y1="' + y + '" x2="750" y2="' + y + '"/>';
      [[k, 132, th[k]], [n + k, 632, th[n + k]]].forEach(function (g) {
        o += '<rect class="azc-ry' + (activos.indexOf(g[0]) >= 0 ? ' vq-activo' : '') + '" x="' + g[1] + '" y="' + (y - 11) + '" width="76" height="22"/><text class="azc-g vq-g" x="' + (g[1] + 38) + '" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(' + grados(g[2]) + '°)</tspan></text>';
      });
    }
    [3, 6].forEach(function (m) { var yy = y0 + (m - .5) * dy; o += '<line class="azc-t" x1="114" y1="' + yy + '" x2="750" y2="' + yy + '"/>'; });
    for (var c = 0; c < n - 1; c++) {
      var xc = 250 + c * 44, ya = y0 + c * dy, yb = ya + dy, cruza = (c + 1) % N === 0;
      o += '<line class="azc-cz' + (cruza ? ' cruza' : '') + '" x1="' + xc + '" y1="' + ya + '" x2="' + xc + '" y2="' + yb + '"/><circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + ya + '" r="4"/><circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + yb + '" r="4"/>';
    }
    // el Hamiltoniano es lo que se mide: un observable sobre los 9 qubits, no una compuerta
    var yt = y0 - 14, yf = y0 + (n - 1) * dy + 14, ym = (yt + yf) / 2;
    o += '<rect class="vq-obs" x="750" y="' + yt + '" width="90" height="' + (yf - yt) + '"/>';
    o += '<path class="vq-obs-aguja" d="M778 ' + (yt + 34) + ' A17 17 0 0 1 812 ' + (yt + 34) + ' M795 ' + (yt + 34) + ' L807 ' + (yt + 14) + '"/>';
    o += '<text class="vq-obs-h" x="795" y="' + (ym + 14) + '">Ĥ</text>';
    o += '<text class="vq-obs-f" x="795" y="' + (ym + 40) + '">Σ h<tspan class="azc-sub" dy="2">k</tspan><tspan dy="-2">Z</tspan><tspan class="azc-sub" dy="2">k</tspan></text><text class="vq-obs-f" x="795" y="' + (ym + 54) + '">+ Σ J<tspan class="azc-sub" dy="2">kl</tspan><tspan dy="-2">Z</tspan><tspan class="azc-sub" dy="2">k</tspan><tspan dy="-2">Z</tspan><tspan class="azc-sub" dy="2">l</tspan></text>';
    // sale un número por disparo: H(b) (cable doble = información clásica)
    o += '<line class="vq-clasico" x1="840" y1="' + (ym - 1.5) + '" x2="862" y2="' + (ym - 1.5) + '"/><line class="vq-clasico" x1="840" y1="' + (ym + 1.5) + '" x2="862" y2="' + (ym + 1.5) + '"/><text class="vq-bit-q" x="866" y="' + (ym + 5) + '">H(b)</text>';
    return o + '</svg>';
  }
  // la trayectoria de una configuración x (filas = lugares, columnas = tiempos) sobre el triángulo
  var POS3 = [[16, 56], [50, 12], [84, 56]], DTRI = [[0, 5, 9], [5, 0, 7], [9, 7, 0]];
  function lugaresPorTiempo(x) { var r = []; for (var t = 0; t < 3; t++) { var l = []; for (var i = 0; i < 3; i++) if (x[i][t]) l.push(i); r.push(l); } return r; }
  function motivos(x) {
    var lt = lugaresPorTiempo(x), m = [];
    lt.forEach(function (l, t) { if (!l.length) m.push('nadie en t' + (t + 1)); if (l.length > 1) m.push(l.length + ' lugares en t' + (t + 1)); });
    for (var i = 0; i < 3; i++) { var c = x[i][0] + x[i][1] + x[i][2]; if (!c) m.push('x' + (i + 1) + ' no se visita'); if (c > 1) m.push('x' + (i + 1) + ' ' + c + ' veces'); }
    return m;
  }
  function trayectoriaSVG(x, grande) {
    var lt = lugaresPorTiempo(x), ok = !motivos(x).length, w = grande ? 200 : 100, o = '<svg class="vq-tray' + (grande ? ' grande' : '') + '" viewBox="0 0 100 70" width="' + w + '" height="' + (w * .7) + '" aria-hidden="true">';
    [[0, 1], [1, 2], [0, 2]].forEach(function (e) {
      var a = POS3[e[0]], b = POS3[e[1]];
      o += '<line class="vq-tr-arista" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + b[0] + '" y2="' + b[1] + '"/><text class="vq-tr-d" x="' + ((a[0] + b[0]) / 2 + (e[0] === 0 && e[1] === 2 ? 0 : (e[0] === 0 ? -7 : 7))) + '" y="' + ((a[1] + b[1]) / 2 + (e[0] === 0 && e[1] === 2 ? 9 : 0)) + '">' + DTRI[e[0]][e[1]] + '</text>';
    });
    for (var t = 0; t < 2; t++) lt[t].forEach(function (a) { lt[t + 1].forEach(function (b) {
      if (a === b) return;
      var p = POS3[a], q = POS3[b], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
      var x1 = p[0] + ux * 9, y1 = p[1] + uy * 9, x2 = q[0] - ux * 10, y2 = q[1] - uy * 10;
      o += '<line class="vq-tr-tramo' + (ok ? '' : ' mal') + '" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
      o += '<path class="vq-tr-punta' + (ok ? '' : ' mal') + '" d="M' + x2 + ' ' + y2 + ' L' + (x2 - ux * 5 - uy * 3) + ' ' + (y2 - uy * 5 + ux * 3) + ' L' + (x2 - ux * 5 + uy * 3) + ' ' + (y2 - uy * 5 - ux * 3) + 'Z"/>';
    }); });
    for (var i = 0; i < 3; i++) {
      var ts = []; for (var t2 = 0; t2 < 3; t2++) if (x[i][t2]) ts.push(t2 + 1);
      o += '<circle class="vq-tr-nodo' + (ts.length ? ' visitado' : '') + (ts.length > 1 ? ' mal' : '') + '" cx="' + POS3[i][0] + '" cy="' + POS3[i][1] + '" r="8"/><text class="vq-tr-t" x="' + POS3[i][0] + '" y="' + (POS3[i][1] + 3) + '">' + (ts.length ? 't' + ts.join(',') : '') + '</text>';
      o += '<text class="vq-tr-x" x="' + POS3[i][0] + '" y="' + (POS3[i][1] + (i === 1 ? -10 : 15)) + '">x' + (i + 1) + '</text>';
    }
    return o + '</svg>';
  }
  // ── COBYLA (Powell, 1994) sin restricciones: un símplex de n + 1 puntos, un modelo lineal de f
  // ajustado en él, un paso dentro de la región de confianza de radio ρ, pasos de geometría cuando el
  // símplex se deforma y ρ a la mitad cuando un paso no rinde. Cada llamada a paso() hace una evaluación.
  function resolverLineal(M, b) {
    var n = M.length, A = M.map(function (f, i) { return f.slice().concat([b[i]]); });
    for (var c = 0; c < n; c++) {
      var p = c; for (var r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-14) return null;
      var tmp = A[c]; A[c] = A[p]; A[p] = tmp;
      for (var r2 = 0; r2 < n; r2++) if (r2 !== c) { var k = A[r2][c] / A[c][c]; for (var j = c; j <= n; j++) A[r2][j] -= k * A[c][j]; }
    }
    return A.map(function (f, i) { return f[n] / f[i]; });
  }
  function inversa(M) {
    var n = M.length, cols = [];
    for (var j = 0; j < n; j++) { var e = []; for (var i = 0; i < n; i++) e.push(i === j ? 1 : 0); var c = resolverLineal(M, e); if (!c) return null; cols.push(c); }
    return cols;   // cols[j] = columna j de M⁻¹
  }
  function crearCobyla(f, x0, op) {
    op = op || {};
    var n = x0.length, rho = op.rhobeg || 1, rhoend = op.rhoend || 1e-4, maxfun = op.maxfun || 300, nf = 0, armado = 0;
    var P = [], F = [];
    function norma(v) { var s = 0; for (var i = 0; i < v.length; i++) s += v[i] * v[i]; return Math.sqrt(s); }
    function mejorPrimero() { var j = 0; for (var i = 1; i < F.length; i++) if (F[i] < F[j]) j = i; var tp = P[0]; P[0] = P[j]; P[j] = tp; var tf = F[0]; F[0] = F[j]; F[j] = tf; }
    return {
      evaluaciones: function () { return nf; }, rho: function () { return rho; }, mejor: function () { return { x: P[0], f: F[0] }; },
      paso: function () {
        if (nf >= maxfun || rho < rhoend) return null;
        if (armado <= n) {   // el símplex inicial: x0 y x0 + ρ·e_i
          var x = x0.slice(); if (armado > 0) x[armado - 1] += rho;
          P.push(x); F.push(f(x)); nf++;
          var info = { tipo: 'simplex', i: armado, x: x, f: F[armado], rho: rho };
          armado++; if (armado > n) mejorPrimero();
          return info;
        }
        mejorPrimero();
        var xb = P[0], fb = F[0], D = [], df = [];
        for (var i = 1; i <= n; i++) { D.push(P[i].map(function (v, k) { return v - xb[k]; })); df.push(F[i] - fb); }
        var C = inversa(D);
        if (!C) { rho *= 0.5; return { tipo: 'reduce', rho: rho, f: fb, x: xb }; }
        // modelo lineal: D g = df  →  g = D⁻¹ df
        var g = new Array(n).fill(0);
        for (var j = 0; j < n; j++) for (var k = 0; k < n; k++) g[k] += C[j][k] * df[j];
        // ¿símplex aceptable? η_j = |v_j| (lejanía), σ_j = 1/|c_j| (distancia a la cara opuesta)
        var malo = -1, peor = 0;
        for (var j2 = 0; j2 < n; j2++) {
          var eta = norma(D[j2]), sig = 1 / norma(C[j2]), m = Math.max(eta / (2.1 * rho), 0.25 * rho / sig);
          if (m > 1 && m > peor) { peor = m; malo = j2; }
        }
        var gn = norma(g);
        if (malo >= 0) {   // paso de geometría: reemplaza el vértice malo por uno a distancia ρ, normal a su cara
          var c = C[malo], cn = norma(c), sg = 0; for (var k2 = 0; k2 < n; k2++) sg += g[k2] * c[k2];
          var xg = xb.map(function (v, k) { return v + (sg > 0 ? -1 : 1) * rho * c[k] / cn; });
          var fg = f(xg); nf++;
          P[malo + 1] = xg; F[malo + 1] = fg;
          var etaM = norma(D[malo]), sigM = 1 / norma(C[malo]);
          return { tipo: 'geometria', x: xg, f: fg, f0: fb, rho: rho, g: g.slice(), gn: gn, eta: etaM, sig: sigM, lejos: etaM > 2.1 * rho, d: xg.map(function (v, k) { return v - xb[k]; }) };
        }
        if (gn < 1e-12) { rho *= 0.5; return { tipo: 'reduce', rho: rho, f: fb, x: xb }; }
        // paso de prueba: minimiza el modelo lineal dentro de |d| ≤ ρ
        var d = g.map(function (v) { return -rho * v / gn; }), xt = xb.map(function (v, k) { return v + d[k]; });
        var ft = f(xt); nf++;
        var pred = rho * gn, ratio = (fb - ft) / pred;
        // entra al símplex en lugar del vértice que mejor conserva su volumen
        var jr = 0, sc = -1;
        for (var j3 = 0; j3 < n; j3++) { var lam = 0; for (var k3 = 0; k3 < n; k3++) lam += d[k3] * C[j3][k3]; var s3 = Math.abs(lam) * Math.max(1, norma(D[j3]) / rho); if (s3 > sc) { sc = s3; jr = j3; } }
        P[jr + 1] = xt; F[jr + 1] = ft;
        var rhoAntes = rho, fallo = ratio < 0.1;   // el paso no rindió lo que predijo el modelo: ρ a la mitad
        if (fallo) rho = Math.max(rho * 0.5, rhoend * 0.999);
        return { tipo: 'paso', x: xt, f: ft, f0: fb, d: d, rho: rhoAntes, rhoNuevo: rho, g: g.slice(), gn: gn, pred: pred, ratio: ratio, mejora: ft < fb, fallo: fallo };
      }
    };
  }
  window.montarVQEMat = function (caja) {
    function pintarTexto() {
      numero = 0;
      return '<div class="dv-cab"><div class="mx-kicker">El VQE en matemáticas</div><h3 class="dv-tit">De la energía E(θ, φ) a la ruta</h3>' +
        '<p class="dv-resumen"><b>Resumen.</b> El ansatz propone un estado |ψ(θ, φ)⟩; el VQE calcula su energía y ajusta los ángulos. Como Ĥ es diagonal, E(θ, φ) es un promedio de las energías de las rutas, pesado por su probabilidad, y nunca baja del mínimo. Cada ángulo entra en una sola R<sub>Y</sub>, así que E es una sinusoide en ese ángulo: con tres evaluaciones se salta a su mínimo. Abajo se ve en vivo con el triángulo.</p></div>' +
        '<div class="dv-pizarra">' + SV.map(seccion).join('') + '</div>';
    }
    var H0 = window.HAM_TRI, DISPAROS = 1024, MAXFUN = 300;
    caja.innerHTML = '<div class="az-texto">' + pintarTexto() + '</div>' +
      '<div class="az-demo vq-demo"><div class="cp-mult-tit">Demostración en vivo: triángulo, 9 qubits, 18 ángulos</div>' +
      '<div class="az-controles"><button type="button" class="dv-btn" data-az="azar">θ y φ al azar</button><button type="button" class="dv-btn dv-play" data-az="opt">optimizar con COBYLA</button><button type="button" class="dv-btn" data-az="paso">una iteración</button><button type="button" class="dv-btn" data-az="construido">θ y φ para 1 → 2 → 3</button>' +
      '<label class="vq-vel">velocidad <select data-az="vel"><option value="250">lenta</option><option value="60" selected>normal</option><option value="0">rápida</option></select></label></div>' +
            // 1 · el ansatz y lo que sale al medir
      '<div class="vq-paso"><span>1</span>El ansatz prepara el estado y se mide el Hamiltoniano</div>' +
      '<div data-az="circ"></div>' +
      '<div class="vq-sub">Lo que sale al medir: las configuraciones más probables</div><div data-az="prob"></div>' +
      '<div class="vq-sub">De dónde sale P(b): el estado del ansatz, vector por vector</div><div class="vq-amp"><div data-az="ampF"></div><div data-az="ampN"></div></div>' +
      '<p class="vq-fund"><b>Fundamento.</b> El ansatz U(θ, φ) prepara |ψ(θ, φ)⟩ = U(θ, φ)|0⟩<sup>⊗9</sup>, y lo que se mide es el Hamiltoniano Ĥ. Ĥ no es una compuerta (no es unitario): es el observable, la cantidad que se quiere conocer. Como solo tiene Z y Z⊗Z, medir Ĥ es medir los 9 qubits en la base Z: cada disparo da una cadena b, con probabilidad P(b) = |⟨b|ψ(θ, φ)⟩|², y Ĥ vale H(b) en ella. Los qubits van por tiempo, así que q<sub>1</sub>q<sub>2</sub>q<sub>3</sub> es la columna t<sub>1</sub> de la matriz x, q<sub>4</sub>q<sub>5</sub>q<sub>6</sub> la t<sub>2</sub> y q<sub>7</sub>q<sub>8</sub>q<sub>9</sub> la t<sub>3</sub>.</p>' +
      // 2 · la energía
      '<div class="vq-paso"><span>2</span>La energía: el promedio de H(b) en los disparos</div>' +
      '<div class="vq-energia" data-az="energia"></div>' +
      '<div class="vq-sub">La misma energía con las matrices J y h: los valores esperados ⟨z<sub>k</sub>⟩ y ⟨z<sub>k</sub>z<sub>l</sub>⟩</div>' +
      '<div class="vq-formula" data-az="formula"></div>' +
      '<div class="vq-mats2"><div class="vq-bloque"><div class="vq-rot">h<sub>k</sub> y ⟨z<sub>k</sub>⟩</div><table class="vq-tabla vq-num" data-az="h"></table></div>' +
      '<div class="vq-bloque"><div class="vq-rot">J<sub>kl</sub> (k &lt; l)</div><table class="vq-tabla vq-num" data-az="J"></table></div>' +
      '<div class="vq-bloque"><div class="vq-rot">⟨z<sub>k</sub>z<sub>l</sub>⟩ (k &lt; l)</div><table class="vq-tabla vq-num" data-az="zz"></table></div></div>' +
      '<div class="vq-suma" data-az="suma"></div>' +
      '<p class="vq-fund"><b>Fundamento.</b> El valor esperado de Ĥ en el estado es la energía: E(θ, φ) = ⟨ψ(θ, φ)|Ĥ|ψ(θ, φ)⟩ = Σ<sub>b</sub> P(b) H(b). Un chip no la da de una vez: se repite el circuito y se promedia H(b) sobre los disparos. Es el número que el optimizador quiere bajar. (En otros ansatz, como QAOA, Ĥ también entra dentro del circuito como compuertas e<sup>−iγĤ</sup>; en este ansatz solo se mide.)</p>' +
      // 3 · COBYLA
      '<div class="vq-paso"><span>3</span>COBYLA decide cómo cambiar los ángulos, y el ciclo vuelve a empezar</div>' +
      '<div class="vq-flujo"><span>θ, φ</span>→<span>ansatz U(θ, φ)</span>→<span>medir Ĥ: P(b) y H(b)</span>→<span>promedio: E(θ, φ) = ⟨Ĥ⟩</span>→<span>COBYLA cambia θ y φ</span>→<span>vuelve a empezar</span></div>' +
      '<div class="vq-cobyla"><div><svg class="az-curva" viewBox="0 0 420 220" aria-label="Energía en cada evaluación"></svg></div><div class="vq-decision" data-az="decision"></div></div>' +
      '<div class="vq-log" data-az="log"></div>' +
      '<p class="vq-fund"><b>Fundamento.</b> COBYLA no usa derivadas. Evalúa E en un símplex de 19 puntos (θ y θ + ρ en cada ángulo) y ajusta un plano: E(θ + d) ≈ E(θ, φ) + g·d. Su pendiente g reemplaza al gradiente. El paso va en contra de g, con largo ρ (la región de confianza): d = −ρ g/|g|. Si la energía baja menos del 10 % de lo que predijo el plano, ρ se reduce a la mitad. Si un vértice del símplex queda muy lejos (η &gt; 2,1ρ) o casi sobre su cara opuesta (σ &lt; 0,25ρ), lo repara con un paso de geometría, también de largo ρ y hacia donde baja el plano. Con 18 ángulos el símplex se deforma seguido: en esta implementación, unas 9 de cada 10 evaluaciones son pasos de geometría. Como en el cuaderno (SciPy), se detiene a las ' + MAXFUN + ' evaluaciones; desde los mismos 200 arranques, sus resultados en el triángulo son equivalentes a los del COBYLA de SciPy (27 contra 22 llegan a E = 12).</p>' +
      '</div>';
    function $(k) { return caja.querySelector('[data-az="' + k + '"]'); }
    (function listo() {
      if (!window.katex) { setTimeout(listo, 300); return; }
      caja.querySelector('.az-texto').innerHTML = pintarTexto();
      $('formula').innerHTML = tex(String.raw`E(\boldsymbol\theta,\boldsymbol\varphi) = c + \sum_{k} h_k\,\langle z_k\rangle + \sum_{k<l} J_{kl}\,\langle z_k z_l\rangle, \qquad \langle z_k\rangle = \sum_b P(b)\, z_k(b), \quad \langle z_k z_l\rangle = \sum_b P(b)\, z_k(b)\, z_l(b), \quad z = 1 - 2x`, true);
      $('ampF').innerHTML = [String.raw`|\psi_1\rangle = \bigotimes_{k=1}^{9} R_Y(\theta_k)|0\rangle = \bigotimes_{k=1}^{9}\begin{pmatrix}\cos\frac{\theta_k}{2}\\ \sin\frac{\theta_k}{2}\end{pmatrix}, \qquad \psi_1(b) = \prod_{k=1}^{9} a_k(b_k),\quad a_k(0) = \cos\tfrac{\theta_k}{2},\ a_k(1) = \sin\tfrac{\theta_k}{2}`,
        String.raw`\psi_2(b) = (-1)^{\,b_1b_2 + b_2b_3 + \cdots + b_8b_9}\;\psi_1(b)`,
        String.raw`\psi(b) = \sum_{b'} \Big[\prod_{k=1}^{9} R_Y(\varphi_k)_{b_k b'_k}\Big]\,\psi_2(b'), \qquad R_Y(\varphi) = \begin{pmatrix}\cos\frac{\varphi}{2} & -\sin\frac{\varphi}{2}\\ \sin\frac{\varphi}{2} & \cos\frac{\varphi}{2}\end{pmatrix}`,
        String.raw`P(b) = |\psi(b)|^2, \qquad \sum_b P(b) = 1`].map(function (f, i) { return '<div class="vq-amp-f"><span>(' + (i + 1) + ')</span>' + tex(f, true) + '</div>'; }).join('');
    })();
    var sim = prepararSim();
    if (!sim || !H0) return;
    var th = [], tim = 0, corriendo = false, activos = [], co = null, evals = [], log = [], ultima = null;
    function f2(v) { return n2(v); }
    function fr(v) { return (+v.toPrecision(2)).toString().replace('.', ','); }
    function gr(x) { return (Math.abs(x) < 10 ? x.toFixed(1) : x.toFixed(0)).replace('.', ','); }
    // H por partes (A = 100) y por las matrices: c + hᵀz + Σ J z z
    function partes(s) {
      var x = rutaDe(sim, s), d = 0, rt = 0, rl = 0;
      for (var t = 0; t < 2; t++) for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) if (a !== b) d += DTRI[a][b] * x[a][t] * x[b][t + 1];
      for (var t2 = 0; t2 < 3; t2++) rt += Math.pow(1 - x[0][t2] - x[1][t2] - x[2][t2], 2);
      for (var a2 = 0; a2 < 3; a2++) rl += Math.pow(1 - x[a2][0] - x[a2][1] - x[a2][2], 2);
      var z = [], hz = 0, jz = 0;
      for (var q = 0; q < sim.n; q++) z[sim.kDe[q]] = ((s >> q) & 1) ? -1 : 1;
      for (var k = 0; k < sim.n; k++) { hz += H0.h[k] * z[k]; for (var l = k + 1; l < sim.n; l++) jz += H0.J[k][l] * z[k] * z[l]; }
      return { x: x, dist: d, rt: rt, rl: rl, ok: rt + rl === 0, hz: hz, jz: jz };
    }
    function nuevo() { parar(); co = null; evals = []; log = []; activos = []; ultima = null; }
    function sortear() { nuevo(); th = []; for (var j = 0; j < 18; j++) th.push(Math.random() * 2 * Math.PI); }
    function construido() { nuevo(); th = []; var b = [1, 0, 0, 0, 1, 0, 0, 0, 1]; for (var j = 0; j < 9; j++) th.push(0); for (var q = 0; q < 9; q++) th.push(Math.PI * b[q]); }

    // ── 1 · lo que sale al medir: probabilidad de cada configuración ──
    var P = null, cuenta = null;
    function contar(Pv, n) {   // n disparos con las probabilidades Pv
      var dim = Pv.length, cdf = new Float64Array(dim), acc = 0, c = {};
      for (var s = 0; s < dim; s++) { acc += Pv[s]; cdf[s] = acc; }
      for (var k = 0; k < n; k++) { var r = Math.random() * acc, lo = 0, hi = dim - 1; while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; } c[lo] = (c[lo] || 0) + 1; }
      return c;
    }
    function bitsDe(s) { var b = []; for (var q = 0; q < sim.n; q++) b.push((s >> q) & 1); return b; }
    function matrizX(x) {
      return '<table class="vq-matx"><tr><th></th><th>t<sub>1</sub></th><th>t<sub>2</sub></th><th>t<sub>3</sub></th></tr>' +
        [0, 1, 2].map(function (i) { return '<tr><th>x<sub>' + (i + 1) + '</sub></th>' + [0, 1, 2].map(function (t) { return '<td>' + x[i][t] + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>';
    }
    function rutaTxt(p) { return p.ok ? lugaresPorTiempo(p.x).map(function (l) { return 'x' + (l[0] + 1); }).join(' → ') : motivos(p.x).join(' · '); }
    function pintarProb() {
      var orden = []; for (var s = 0; s < P.length; s++) orden.push(s);
      orden.sort(function (a, b) { return P[b] - P[a]; });
      var top = orden.slice(0, 8), escala = 0, resto = 0;
      top.forEach(function (s) { escala = Math.max(escala, P[s], (cuenta[s] || 0) / DISPAROS); });
      orden.slice(8).forEach(function (s) { resto += P[s]; });
      var h = '<table class="vq-ptab"><tr><th>b = q<sub>1</sub>…q<sub>9</sub></th><th>matriz x</th><th>ruta</th><th class="vq-pcol">P(b) = |ψ(b)|² y veces/1024</th><th>H(b)</th></tr>';
      top.forEach(function (s) {
        var p = partes(s), v = cuenta[s] || 0, b = bitsDe(s);
        h += '<tr><td><code>' + b.slice(0, 3).join('') + ' ' + b.slice(3, 6).join('') + ' ' + b.slice(6).join('') + '</code></td><td>' + matrizX(p.x) + '</td><td class="vq-pruta">' + (p.ok ? '✓ ' : '✗ ') + rutaTxt(p) + '</td>' +
          '<td class="vq-pcol"><span class="vq-pbar"><span style="width:' + (P[s] / escala * 100).toFixed(1) + '%"></span><i style="left:' + (v / DISPAROS / escala * 100).toFixed(1) + '%"></i></span>' +
          '<span class="vq-pnum">' + (P[s] * 100).toFixed(1).replace('.', ',') + ' % · ' + v + ' veces</span></td><td><b>' + f2(sim.E[s]) + '</b></td></tr>';
      });
      h += '</table><p class="vq-pnota">Barra: probabilidad P(b) calculada con el estado del ansatz. Raya: fracción de los ' + DISPAROS + ' disparos en que salió b. Las otras 504 configuraciones suman ' + (resto * 100).toFixed(1).replace('.', ',') + ' %. Cada vez que se mide, el estado colapsa en una de ellas: por eso hacen falta muchos disparos.</p>';
      $('prob').innerHTML = h;
      return orden;
    }
    // ── de dónde sale P(b): el estado del ansatz, vector por vector ──
    function pintarAmp(orden) {
      var bs = orden[0], b = bitsDe(bs), n = sim.n;
      var filas = '';
      for (var k = 0; k < n; k++) {
        var t = th[k], f = th[n + k], ct = Math.cos(t / 2), st = Math.sin(t / 2), cf = Math.cos(f / 2), sf = Math.sin(f / 2);
        filas += '<tr><th>q<sub>' + (k + 1) + '</sub></th><td>' + grados(t) + '°</td><td>(' + f3(ct) + ', ' + f3(st) + ')</td><td>' + grados(f) + '°</td><td>[' + f3(cf) + ', ' + f3(-sf) + ' ; ' + f3(sf) + ', ' + f3(cf) + ']</td></tr>';
      }
      // ψ₁(b*) como producto de 9 números, el signo de la cascada y el resultado
      var fact = [], psi1 = 1, signo = 0;
      for (var k2 = 0; k2 < n; k2++) { var a = b[k2] ? Math.sin(th[k2] / 2) : Math.cos(th[k2] / 2); fact.push(f3(a)); psi1 *= a; }
      for (var k3 = 0; k3 < n - 1; k3++) signo += b[k3] * b[k3 + 1];
      var psi = Math.sqrt(P[bs]) * Math.sign(estado(sim, th)[bs] || 1);
      $('ampN').innerHTML = '<table class="vq-tabla vq-angs"><tr><th></th><th>θ<sub>k</sub></th><th>R<sub>Y</sub>(θ<sub>k</sub>)|0⟩ = (cos θ<sub>k</sub>/2, sin θ<sub>k</sub>/2)</th><th>φ<sub>k</sub></th><th>R<sub>Y</sub>(φ<sub>k</sub>) = [cos, −sin ; sin, cos] de φ<sub>k</sub>/2</th></tr>' + filas + '</table>' +
        '<div class="vq-ej"><div class="vq-ej-tit">Con la configuración más probable, b = ' + b.join('') + '</div>' +
        '<div>(1) primera capa: ψ<sub>1</sub>(b) = ' + fact.join(' · ') + ' = <b>' + f3(psi1) + '</b></div>' +
        '<div>(2) cascada de CZ: b<sub>1</sub>b<sub>2</sub> + … + b<sub>8</sub>b<sub>9</sub> = ' + signo + ' → ψ<sub>2</sub>(b) = ' + (signo % 2 ? '−' : '+') + 'ψ<sub>1</sub>(b) = <b>' + f3((signo % 2 ? -1 : 1) * psi1) + '</b></div>' +
        '<div>(3) capa final: ψ(b) = Σ<sub>b′</sub> [∏<sub>k</sub> R<sub>Y</sub>(φ<sub>k</sub>)<sub>b<sub>k</sub>b′<sub>k</sub></sub>] ψ<sub>2</sub>(b′), suma de 512 términos = <b>' + f3(psi) + '</b></div>' +
        '<div>(4) P(b) = ψ(b)² = <b>' + (P[bs] * 100).toFixed(1).replace('.', ',') + ' %</b></div></div>';
    }
    // ── 2 · la energía: medida con los disparos y exacta con P(b) ──
    function pintarEnergia(orden) {
      var ex = 0, em = 0, n = 0;
      for (var s = 0; s < P.length; s++) ex += P[s] * sim.E[s];
      for (var s2 in cuenta) { em += cuenta[s2] * sim.E[s2]; n += cuenta[s2]; }
      em /= n;
      var terminos = orden.slice(0, 3).map(function (s) { return f3(P[s]) + '·' + f2(sim.E[s]); }).join(' + ');
      $('energia').innerHTML = '<div class="vq-e"><span>E medida</span><b>' + f2(em) + '</b><small>Σ veces · H(b) / ' + n + '</small></div>' +
        '<div class="vq-e gris"><span>E exacta</span><b>' + f2(ex) + '</b><small>Σ P(b) · H(b)</small></div>' +
        '<div class="vq-e-txt"><b>E exacta</b> = Σ<sub>b</sub> P(b)·H(b) sobre las 512 configuraciones, con P(b) = ψ(b)² del vector de estado, sin sortear disparos: = ' + terminos + ' + … = ' + f2(ex) + '. Es lo que daría un número infinito de disparos. <b>E medida</b> usa las ' + n + ' veces que salió cada b; difiere de la exacta en ' + f2(em - ex) + ' por el azar de los disparos. COBYLA minimiza la exacta, como Statevector en el cuaderno.</div>';
    }
    // ⟨z_k⟩ y ⟨z_k z_l⟩ con las probabilidades exactas, en el orden de las matrices (por lugar)
    function esperados(Pv) {
      var n = sim.n, ez = new Float64Array(n), ezz = [], z = new Array(n);
      for (var a = 0; a < n; a++) ezz.push(new Float64Array(n));
      for (var s = 0; s < Pv.length; s++) {
        var p = Pv[s]; if (p < 1e-15) continue;
        for (var q = 0; q < n; q++) z[sim.kDe[q]] = ((s >> q) & 1) ? -1 : 1;
        for (var a2 = 0; a2 < n; a2++) { ez[a2] += p * z[a2]; for (var b = a2 + 1; b < n; b++) ezz[a2][b] += p * z[a2] * z[b]; }
      }
      var hz = 0, jzz = 0;
      for (var a3 = 0; a3 < n; a3++) { hz += H0.h[a3] * ez[a3]; for (var b2 = a3 + 1; b2 < n; b2++) jzz += H0.J[a3][b2] * ezz[a3][b2]; }
      return { ez: ez, ezz: ezz, hz: hz, jzz: jzz };
    }
    function etq(a) { return 'z<sub>' + (Math.floor(a / 3) + 1) + (a % 3 + 1) + '</sub>'; }   // matrices por lugar: a = (i − 1)T + (t − 1)
    function pintarMatrices() {
      var r = esperados(P), n = sim.n, ex = 0;
      for (var s = 0; s < P.length; s++) ex += P[s] * sim.E[s];
      var h = '<tr><th></th><th>h<sub>k</sub></th><th>⟨z<sub>k</sub>⟩</th><th>h<sub>k</sub>⟨z<sub>k</sub>⟩</th></tr>';
      for (var a = 0; a < n; a++) h += '<tr><th>' + etq(a) + '</th><td>' + f2(H0.h[a]) + '</td><td>' + f3(r.ez[a]) + '</td><td>' + f2(H0.h[a] * r.ez[a]) + '</td></tr>';
      h += '<tr class="vq-tot"><th>Σ</th><td></td><td></td><td>' + f2(r.hz) + '</td></tr>';
      $('h').innerHTML = h;
      function mat(val, dec) {
        var t = '<tr><th></th>' + Array.from({ length: n }, function (_, b) { return '<th>' + etq(b) + '</th>'; }).join('') + '</tr>';
        for (var a = 0; a < n; a++) { t += '<tr><th>' + etq(a) + '</th>'; for (var b = 0; b < n; b++) t += b > a ? '<td>' + dec(val(a, b)) + '</td>' : '<td class="vq-bajo"></td>'; t += '</tr>'; }
        return t;
      }
      $('J').innerHTML = mat(function (a, b) { return H0.J[a][b]; }, function (v) { return v ? f2(v) : '0'; });
      $('zz').innerHTML = mat(function (a, b) { return r.ezz[a][b]; }, f3);
      $('suma').innerHTML =
        '<div class="vq-linea"><span>Con J y h:</span> E(θ, φ) = c + Σ h<sub>k</sub>⟨z<sub>k</sub>⟩ + Σ<sub>k&lt;l</sub> J<sub>kl</sub>⟨z<sub>k</sub>z<sub>l</sub>⟩ = ' + f2(H0.cte) + ' ' + (r.hz < 0 ? '−' : '+') + ' ' + f2(Math.abs(r.hz)) + ' ' + (r.jzz < 0 ? '−' : '+') + ' ' + f2(Math.abs(r.jzz)) + ' = <b>' + f2(H0.cte + r.hz + r.jzz) + '</b></div>' +
        '<div class="vq-linea"><span>Comprobación:</span> Σ<sub>b</sub> P(b)·H(b) = <b>' + f2(ex) + '</b> · diferencia ' + Math.abs(H0.cte + r.hz + r.jzz - ex).toExponential(1).replace('.', ',') + '</div>' +
        '<p class="vq-pnota">Cada ⟨z<sub>k</sub>⟩ va de −1 (la variable x<sub>k</sub> siempre vale 1) a +1 (siempre vale 0); ⟨z<sub>k</sub>z<sub>l</sub>⟩ = +1 si las dos variables salen siempre iguales y −1 si salen siempre distintas. Las matrices van por lugar, como en Inicializar: z<sub>it</sub> es el lugar i en el tiempo t. Al minimizar, COBYLA mueve estos valores esperados hasta que c + Σh⟨z⟩ + ΣJ⟨zz⟩ llega al mínimo.</p>';
    }
    function medir() {
      var psi = estado(sim, th);
      P = new Float64Array(psi.length); for (var s = 0; s < psi.length; s++) P[s] = psi[s] * psi[s];
      cuenta = contar(P, DISPAROS);
      var orden = pintarProb(); pintarAmp(orden); pintarEnergia(orden); pintarMatrices();
    }
    // ── 3 · COBYLA ──
    function top(v, n) { return v.map(function (x, j) { return j; }).sort(function (a, b) { return Math.abs(v[b]) - Math.abs(v[a]); }).slice(0, n); }
    function pintarDecision() {
      var r = ultima, h;
      if (!r) h = '<div class="vq-dec-tit">La decisión de cada iteración</div><p>Pulsa «optimizar con COBYLA» o «una iteración». Aquí aparece qué calculó COBYLA y por qué movió los ángulos así.</p>';
      else if (r.tipo === 'simplex') h = '<div class="vq-dec-tit">Evaluación ' + r.k + ': armando el símplex</div><p>' + (r.i === 0 ? 'Mide E en el punto de partida θ<sub>0</sub>.' : 'Mueve solo ' + nomParam(r.i - 1) + ' en ρ = ' + fr(r.rho) + ' rad y mide E: así conoce cuánto cambia la energía con ese ángulo.') + '</p><div class="vq-dec-num">E = ' + f2(r.f) + '</div><p class="vq-dec-nota">Hacen falta 19 puntos (θ<sub>0</sub> y uno por ángulo) antes del primer paso.</p>';
      else if (r.tipo === 'reduce') h = '<div class="vq-dec-tit">Iteración ' + r.k + ': ρ a la mitad</div><p>El plano ya no predice bien a esta escala: la región de confianza baja a ρ = ' + fr(r.rho) + ' rad.</p>';
      else {
        var g = r.g, ig = top(g, 4), id = top(r.d, 4);
        h = '<div class="vq-dec-tit">Evaluación ' + r.k + ': ' + (r.tipo === 'geometria' ? 'paso de geometría' : 'paso hacia donde baja el plano') + '</div>';
        h += '<div class="vq-dec-fila"><span>1 · Pendiente del plano g</span><b>|g| = ' + f2(r.gn) + '</b></div><p class="vq-dec-det">' + ig.map(function (j) { return '∂E/∂' + nomParam(j) + ' ≈ ' + f2(g[j]); }).join(' · ') + ' …</p>';
        if (r.tipo === 'geometria') {
          h += r.lejos ? '<div class="vq-dec-fila"><span>2 · Un vértice quedó lejos: η = ' + fr(r.eta) + ' rad</span><b>&gt; 2,1ρ = ' + fr(2.1 * r.rho) + '</b></div>' : '<div class="vq-dec-fila"><span>2 · Un vértice casi toca su cara: σ = ' + fr(r.sig) + ' rad</span><b>&lt; 0,25ρ = ' + fr(0.25 * r.rho) + '</b></div>';
          h += '<p class="vq-dec-det">Con ese vértice el plano se apoyaría en puntos casi alineados y su pendiente no sería confiable. Se reemplaza por θ<sub>mejor</sub> + ρ·n, con n normal a esa cara y el signo con que el plano baja.</p>';
          h += '<div class="vq-dec-fila"><span>3 · Cambio de ángulos (|d| = ρ = ' + fr(r.rho) + ' rad)</span></div><p class="vq-dec-det">' + id.map(function (j) { var v = r.d[j] * 180 / Math.PI; return nomParam(j) + ' ' + (v < 0 ? '−' : '+') + gr(Math.abs(v)) + '°'; }).join(', ') + ' …</p>';
          h += '<div class="vq-dec-fila veredicto ' + (r.f < r.f0 ? 'ok' : 'mal') + '"><span>4 · E: ' + f2(r.f0) + ' → ' + f2(r.f) + '</span><b>' + (r.f < r.f0 ? 'baja ' + f2(r.f0 - r.f) : 'no baja') + '</b></div>';
        } else {
          h += '<div class="vq-dec-fila"><span>2 · Paso d = −ρ g/|g|</span><b>ρ = ' + fr(r.rho) + ' rad</b></div><p class="vq-dec-det">' + id.map(function (j) { var v = r.d[j] * 180 / Math.PI; return nomParam(j) + ' ' + (v < 0 ? '−' : '+') + gr(Math.abs(v)) + '°'; }).join(', ') + ' … (los ángulos con más pendiente se mueven más)</p>';
          h += '<div class="vq-dec-fila"><span>3 · Baja prevista ρ·|g|</span><b>' + f2(r.pred) + '</b></div>';
          h += '<div class="vq-dec-fila"><span>4 · Baja real ' + f2(r.f0) + ' → ' + f2(r.f) + '</span><b>' + f2(r.f0 - r.f) + '</b></div>';
          h += '<div class="vq-dec-fila veredicto ' + (r.fallo ? 'mal' : 'ok') + '"><span>5 · Razón real / prevista = ' + f2(r.ratio) + '</span><b>' + (r.fallo ? '< 0,1 → ρ a la mitad' : '≥ 0,1 → sigue con ρ') + '</b></div>';
        }
      }
      $('decision').innerHTML = h;
    }
    function pintarLog() {
      $('log').innerHTML = '<table class="vq-tabla vq-tlog"><tr><th>#</th><th>qué hizo</th><th>ρ</th><th>|g|</th><th>baja prevista</th><th>baja real</th><th>Σ h⟨z⟩</th><th>Σ J⟨zz⟩</th><th>E = c + …</th></tr>' +
        (log.length ? log.slice(-8).reverse().map(function (r) { return '<tr class="' + (r.mejora ? 'vq-mejora' : '') + '"><td>' + r.k + '</td><td>' + r.que + '</td><td>' + r.rho + '</td><td>' + r.gn + '</td><td>' + r.pred + '</td><td>' + r.real + '</td><td>' + r.hz + '</td><td>' + r.jzz + '</td><td>' + f2(r.f) + '</td></tr>'; }).join('') : '<tr><td colspan="9" class="vq-vacio">Las últimas 8 iteraciones aparecerán aquí.</td></tr>') + '</table>';
    }
    function pintarCurva() {
      var svg = caja.querySelector('.az-curva'), NS = 'http://www.w3.org/2000/svg';
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      function e(tag, at) { var nn = document.createElementNS(NS, tag); for (var k in at) nn.setAttribute(k, at[k]); svg.appendChild(nn); return nn; }
      var vals = evals.map(function (x) { return x.f; }), maxE = Math.max.apply(null, vals.concat([sim.min + 10])), minE = sim.min;
      var N = Math.max(MAXFUN, evals.length), X = function (i) { return 40 + i * (370 / N); }, Y = function (v) { return 190 - (Math.min(v, maxE) - minE) / (maxE - minE || 1) * 160; };
      e('line', { x1: 40, y1: 20, x2: 40, y2: 190, 'class': 'az-eje' }); e('line', { x1: 40, y1: 190, x2: 410, y2: 190, 'class': 'az-eje' });
      e('line', { x1: 40, y1: Y(sim.min), x2: 410, y2: Y(sim.min), 'class': 'az-min' });
      e('text', { x: 408, y: Y(sim.min) - 5, 'class': 'az-txt', 'text-anchor': 'end' }).textContent = 'mínimo = ' + n2(sim.min);
      e('text', { x: 40, y: 212, 'class': 'az-txt' }).textContent = 'evaluaciones de COBYLA →';
      e('text', { x: 36, y: 16, 'class': 'az-txt', 'text-anchor': 'start' }).textContent = 'E(θ, φ)';
      evals.forEach(function (x, i) { e('circle', { cx: X(i), cy: Y(x.f), r: 1.8, 'class': 'vq-pto-eval' }); });
      var mejor = Infinity, d = '';
      evals.forEach(function (x, i) { mejor = Math.min(mejor, x.f); d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(mejor).toFixed(1); });
      if (d) e('path', { d: d, 'class': 'az-linea' });
      e('text', { x: 408, y: 34, 'class': 'az-txt', 'text-anchor': 'end' }).textContent = '— la mejor hasta ahora · • cada evaluación';
    }
    function pintarCircuito() { $('circ').innerHTML = circuitoValores(th, activos); }
    function f3(v) { var r = Math.round(v * 1000) / 1000; return (Math.abs(r) < 5e-4 ? 0 : r).toFixed(3).replace('.', ','); }
    function pintarTodo() { pintarCircuito(); medir(); pintarDecision(); pintarLog(); pintarCurva(); }
    function parar() { clearTimeout(tim); corriendo = false; }
    function asegurarCobyla() {
      if (!co || co.evaluaciones() >= MAXFUN || co.rho() < 1e-4) { co = crearCobyla(function (x) { return energia(sim, x); }, th.slice(), { rhobeg: 1, rhoend: 1e-4, maxfun: MAXFUN }); evals = []; log = []; }
    }
    function iterar() {   // una llamada a COBYLA: una evaluación (o ρ a la mitad, que no evalúa)
      var info = co.paso();
      if (!info) return false;
      var d = info.d || info.x.map(function (v, k) { return v - th[k]; });
      th = info.x.slice();
      activos = info.tipo === 'reduce' ? [] : top(d, 3).filter(function (j) { return Math.abs(d[j]) > 1e-9; });
      info.k = co.evaluaciones(); info.d = d;
      ultima = info;
      if (info.tipo !== 'reduce') evals.push({ f: info.f });
      var que = info.tipo === 'simplex' ? (info.i === 0 ? 'símplex: θ₀' : 'símplex: θ₀ + ρ en ' + nomParam(info.i - 1)) : info.tipo === 'geometria' ? 'geometría' : info.tipo === 'reduce' ? 'ρ a la mitad' : (info.fallo ? 'paso · no rinde' : 'paso · baja E');
      var pz = null; if (info.tipo !== 'reduce') { var ps = estado(sim, th), Pi = new Float64Array(ps.length); for (var s9 = 0; s9 < ps.length; s9++) Pi[s9] = ps[s9] * ps[s9]; pz = esperados(Pi); }
      log.push({ hz: pz ? f2(pz.hz) : '—', jzz: pz ? f2(pz.jzz) : '—', k: info.k, que: que, rho: fr(info.rho), gn: info.gn != null ? f2(info.gn) : '—', pred: info.pred != null ? f2(info.pred) : '—', real: info.f0 != null ? f2(info.f0 - info.f) : '—', f: info.f, mejora: info.tipo === 'paso' && info.mejora });
      return true;
    }
    function correr() {
      if (corriendo) return;
      asegurarCobyla(); corriendo = true;
      (function paso() {
        var vel = +$('vel').value, sigue = true;
        for (var r = 0; r < (vel === 0 ? 8 : 1) && sigue; r++) sigue = iterar();
        pintarTodo();
        if (sigue && co.evaluaciones() < MAXFUN) tim = setTimeout(paso, quieto ? 0 : Math.max(vel, 16));
        else { corriendo = false; th = co.mejor().x.slice(); activos = []; pintarTodo(); }
      })();
    }
    $('azar').addEventListener('click', function () { sortear(); pintarTodo(); });
    $('opt').addEventListener('click', correr);
    $('paso').addEventListener('click', function () { if (corriendo) return; asegurarCobyla(); if (iterar()) pintarTodo(); });
    $('construido').addEventListener('click', function () { construido(); pintarTodo(); });
    sortear(); pintarTodo();
  };
})();
