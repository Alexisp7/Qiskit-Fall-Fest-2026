// El ansatz en matemáticas: por qué, partiendo de ángulos θ al azar, la capa de
// R_Y, la cascada de CZ y la capa final pueden llegar a la ruta de mínima
// energía. El VQE en matemáticas (etapa Solver): la energía E(θ), la regla de la
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
      ['\\text{triángulo, 2000 arranques:}\\quad P(\\text{llegar a } E = 12) \\approx ' + C + '{35\\,\\%} \\text{ con CZ}, \\quad 32\\,\\% \\text{ sin CZ}', 'Medido con la regla de la sinusoide de la etapa Solver. Los demás arranques terminan en H = 14 o 16, que son otras rutas válidas. La cascada ayuda, pero no lo garantiza: por eso el VQE usa varios arranques.']
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

  // ── el VQE en matemáticas: la energía E(θ), la regla de la sinusoide y la demostración en vivo ──
  // ── demostración en vivo del VQE: el ansatz real de 9 qubits, la energía con J y h, y el optimizador ──
  function grados(a) { return Math.round((((a * 180 / Math.PI) % 360) + 360) % 360); }
  function nomParam(j) { return (j < 9 ? 'θ' : 'φ') + '<sub>' + (j % 9 + 1) + '</sub>'; }
  // el circuito del triángulo con los ángulos actuales; 'activo' = el parámetro que se está ajustando
  function circuitoValores(th, activos, res) {   // activos: los parámetros que se acaban de mover; res: lo medido
    var N = 3, n = 9, dy = 30, y0 = 40, W = res ? 1210 : 900;
    var o = '<svg class="az-circ vq-circ" viewBox="0 0 ' + W + ' ' + (y0 + (n - 1) * dy + 28) + '" role="img" aria-label="Ansatz de 9 qubits con sus ángulos actuales, la medida, el Hamiltoniano y la energía">';
    o += '<text class="azc-col" x="170" y="16">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(θ)</tspan></text><text class="azc-col" x="420" y="16">cascada de CZ</text><text class="azc-col" x="670" y="16">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(φ)</tspan></text><text class="azc-col" x="790" y="16">medir</text>';
    for (var k = 0; k < n; k++) {
      var y = y0 + k * dy, i = k % N + 1, t = Math.floor(k / N) + 1;
      o += '<text class="azc-q" x="6" y="' + (y + 5) + '">q<tspan class="azc-sub" dy="3">' + (k + 1) + '</tspan><tspan dy="-3"> · x</tspan><tspan class="azc-sub" dy="3">' + i + t + '</tspan></text>';
      o += '<text class="azc-ket" x="90" y="' + (y + 5) + '">|0⟩</text><line class="azc-cable" x1="114" y1="' + y + '" x2="776" y2="' + y + '"/>';
      [[k, 132, th[k]], [n + k, 632, th[n + k]]].forEach(function (g) {
        o += '<rect class="azc-ry' + (activos.indexOf(g[0]) >= 0 ? ' vq-activo' : '') + '" x="' + g[1] + '" y="' + (y - 11) + '" width="76" height="22"/><text class="azc-g vq-g" x="' + (g[1] + 38) + '" y="' + (y + 5) + '">R<tspan class="azc-sub" dy="3">Y</tspan><tspan dy="-3">(' + grados(g[2]) + '°)</tspan></text>';
      });
      o += '<rect class="azc-ry" x="776" y="' + (y - 11) + '" width="28" height="22"/><path class="azc-aguja" d="M781 ' + (y + 6) + ' A9 9 0 0 1 799 ' + (y + 6) + ' M790 ' + (y + 6) + ' L797 ' + (y - 6) + '"/>';
    }
    [3, 6].forEach(function (m) { var yy = y0 + (m - .5) * dy; o += '<line class="azc-t" x1="114" y1="' + yy + '" x2="776" y2="' + yy + '"/>'; });
    for (var c = 0; c < n - 1; c++) {
      var xc = 250 + c * 44, ya = y0 + c * dy, yb = ya + dy, cruza = (c + 1) % N === 0;
      o += '<line class="azc-cz' + (cruza ? ' cruza' : '') + '" x1="' + xc + '" y1="' + ya + '" x2="' + xc + '" y2="' + yb + '"/><circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + ya + '" r="4"/><circle class="azc-p' + (cruza ? ' cruza' : '') + '" cx="' + xc + '" cy="' + yb + '" r="4"/>';
    }
    if (res) {
      var yt = y0 - 14, yf = y0 + (n - 1) * dy + 14, ym = (yt + yf) / 2;
      o += '<text class="azc-col" x="878" y="16">aplicar H</text><text class="azc-col" x="985" y="16">lo que salió</text><text class="azc-col" x="1135" y="16">energía</text>';
      for (var k2 = 0; k2 < n; k2++) { var y2 = y0 + k2 * dy; o += '<line class="vq-clasico" x1="804" y1="' + (y2 - 1.5) + '" x2="850" y2="' + (y2 - 1.5) + '"/><line class="vq-clasico" x1="804" y1="' + (y2 + 1.5) + '" x2="850" y2="' + (y2 + 1.5) + '"/>'; }
      o += '<rect class="vq-hbox" x="850" y="' + yt + '" width="56" height="' + (yf - yt) + '"/><text class="vq-hletra" x="878" y="' + (ym + 12) + '">H</text>';
      res.top.slice(0, 4).forEach(function (cf, q) {
        var yc = yt + 6 + q * 66, x0 = 934;
        o += '<line class="vq-clasico" x1="906" y1="' + (yc + 14) + '" x2="' + (x0 - 4) + '" y2="' + (yc + 14) + '"/>';
        for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) o += '<rect class="vq-celda' + (cf.x[a][b] ? ' on' : '') + '" x="' + (x0 + b * 10) + '" y="' + (yc + a * 10) + '" width="9" height="9"/>';
        o += '<text class="vq-ctxt" x="' + (x0 + 38) + '" y="' + (yc + 11) + '">×' + cf.veces + '</text><text class="vq-ctxt" x="' + (x0 + 38) + '" y="' + (yc + 25) + '">H = ' + n2(cf.H) + '</text>';
        o += '<text class="vq-ctxt ' + (cf.ok ? 'ok' : 'mal') + '" x="' + x0 + '" y="' + (yc + 44) + '">' + (cf.ok ? '✓ ruta válida' : '✗ rompe una regla') + '</text>';
      });
      o += '<path class="vq-llave" d="M1046 ' + yt + ' q10 0 10 12 V' + (ym - 8) + ' q0 8 8 8 q-8 0 -8 8 V' + (yf - 12) + ' q0 12 -10 12"/>';
      var ye = ym - 70;
      o += '<rect class="vq-ebox" x="1072" y="' + ye + '" width="132" height="140"/>';
      o += '<text class="vq-eletra" x="1138" y="' + (ye + 18) + '">E medida</text><text class="vq-enum" x="1138" y="' + (ye + 52) + '">' + n2(res.E) + '</text>';
      [['distancia', res.dist], ['+ A · tiempo', res.at], ['+ A · lugar', res.al]].forEach(function (pt, q) {
        o += '<text class="vq-eparte" x="1080" y="' + (ye + 76 + q * 16) + '">' + pt[0] + '</text><text class="vq-eparte num" x="1196" y="' + (ye + 76 + q * 16) + '">' + n2(pt[1]) + '</text>';
      });
      o += '<text class="vq-eparte gris" x="1138" y="' + (ye + 130) + '">promedio de ' + res.n + ' disparos</text>';
    }
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
  // ⟨z_a⟩ y ⟨z_a z_b⟩ en el orden de las matrices (por lugar), y la energía de las dos maneras
  function energiaJh(sim, psi) {
    var H0 = window.HAM_TRI, n = sim.n, ez = new Float64Array(n), ezz = [], directa = 0, z = new Array(n), mejor = 0;
    for (var a = 0; a < n; a++) ezz.push(new Float64Array(n));
    for (var s = 0; s < sim.dim; s++) {
      var p = psi[s] * psi[s];
      if (p > psi[mejor] * psi[mejor]) mejor = s;
      if (p < 1e-15) continue;
      for (var q = 0; q < n; q++) z[sim.kDe[q]] = ((s >> q) & 1) ? -1 : 1;
      for (var a2 = 0; a2 < n; a2++) { ez[a2] += p * z[a2]; for (var b = a2 + 1; b < n; b++) ezz[a2][b] += p * z[a2] * z[b]; }
      directa += p * sim.E[s];
    }
    var hz = 0, jzz = 0;
    for (var a3 = 0; a3 < n; a3++) { hz += H0.h[a3] * ez[a3]; for (var b2 = a3 + 1; b2 < n; b2++) jzz += H0.J[a3][b2] * ezz[a3][b2]; }
    return { ez: ez, ezz: ezz, hz: hz, jzz: jzz, cte: H0.cte, E: H0.cte + hz + jzz, directa: directa, mejor: mejor, pMejor: psi[mejor] * psi[mejor] };
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
          return { tipo: 'geometria', x: xg, f: fg, f0: fb, rho: rho, d: xg.map(function (v, k) { return v - xb[k]; }) };
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
        return { tipo: 'paso', x: xt, f: ft, f0: fb, d: d, rho: rhoAntes, rhoNuevo: rho, pred: pred, ratio: ratio, mejora: ft < fb, fallo: fallo };
      }
    };
  }
  // medir: n disparos del estado; devuelve los conteos y los primeros disparos en orden
  function medirDisparos(psi, n) {
    var dim = psi.length, cdf = new Float64Array(dim), acc = 0;
    for (var s = 0; s < dim; s++) { acc += psi[s] * psi[s]; cdf[s] = acc; }
    var cuenta = {}, primeros = [];
    for (var k = 0; k < n; k++) {
      var r = Math.random() * acc, lo = 0, hi = dim - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (cdf[mid] < r) lo = mid + 1; else hi = mid; }
      cuenta[lo] = (cuenta[lo] || 0) + 1;
      if (primeros.length < 16) primeros.push(lo);
    }
    return { cuenta: cuenta, primeros: primeros, n: n };
  }

  window.montarVQEMat = function (caja) {
    function pintarTexto() {
      numero = 0;
      return '<div class="dv-cab"><div class="mx-kicker">El VQE en matemáticas</div><h3 class="dv-tit">De la energía E(θ) a la ruta</h3>' +
        '<p class="dv-resumen"><b>Resumen.</b> El ansatz propone un estado |ψ(θ)⟩; el VQE calcula su energía y ajusta los ángulos. Como Ĥ es diagonal, E(θ) es un promedio de las energías de las rutas, pesado por su probabilidad, y nunca baja del mínimo. Cada ángulo entra en una sola R<sub>Y</sub>, así que E es una sinusoide en ese ángulo: con tres evaluaciones se salta a su mínimo. Abajo se ve en vivo con el triángulo.</p></div>' +
        '<div class="dv-pizarra">' + SV.map(seccion).join('') + '</div>';
    }
    var H0 = window.HAM_TRI, DISPAROS = 1024, MAXFUN = 300;
    function etq(a) { return 'z<sub>' + (Math.floor(a / 3) + 1) + (a % 3 + 1) + '</sub>'; }   // matrices por lugar: a = (i − 1)T + (t − 1)
    caja.innerHTML = '<div class="az-texto">' + pintarTexto() + '</div>' +
      '<div class="az-demo vq-demo"><div class="cp-mult-tit">Demostración en vivo: triángulo, 9 qubits, 18 ángulos</div>' +
      '<div class="az-controles"><button type="button" class="dv-btn" data-az="azar">θ al azar</button><button type="button" class="dv-btn" data-az="medir">volver a medir</button><button type="button" class="dv-btn dv-play" data-az="opt">optimizar con COBYLA</button><button type="button" class="dv-btn" data-az="construido">θ construido para 1 → 2 → 3</button>' +
      '<label class="vq-vel">velocidad <select data-az="vel"><option value="200">lenta</option><option value="50" selected>normal</option><option value="0">rápida</option></select></label>' +
      '<span class="az-estado" data-az="estado"></span></div>' +
      '<div class="vq-paso"><span>1</span>El ansatz real: 9 qubits con sus ángulos de ahora</div>' +
      '<div data-az="circ"></div>' +
      '<p class="dv-nota">Cada qubit q<sub>k</sub> es una variable x<sub>i,t</sub> (orden por tiempo). En dorado, los ángulos que acaba de mover el optimizador. Tras medir, cada disparo da 9 bits; H les asigna su energía y el promedio de los ' + DISPAROS + ' disparos es la E medida, separada en sus partes.</p>' +
      '<div class="vq-paso"><span>2</span>Ejecutar y medir: ' + DISPAROS + ' disparos</div>' +
      '<div class="vq-con-lado"><div class="vq-medida" data-az="medida"></div><aside class="vq-explica">' +
        '<div class="vq-explica-tit">Cómo leer lo que salió</div>' +
        '<p><b>Los cuadritos de 3 × 3</b> son una configuración x: filas = lugares x<sub>1</sub>, x<sub>2</sub>, x<sub>3</sub>; columnas = tiempos t<sub>1</sub>, t<sub>2</sub>, t<sub>3</sub>. Un cuadro dorado es x<sub>i,t</sub> = 1 (el camión está en el lugar i en el tiempo t); uno vacío es 0. Una ruta válida tiene exactamente un dorado en cada fila y en cada columna.</p>' +
        '<p><b>¿Por qué tantas, si son 3 nodos?</b> Cada uno de los 9 qubits sale 0 o 1, así que hay 2<sup>9</sup> = 512 configuraciones. Solo 3! = 6 son rutas: un lugar en cada tiempo y cada lugar una vez. Las otras 506 rompen alguna regla. El circuito reparte probabilidad entre las 512 y cada disparo saca una al azar.</p>' +
        '<p><b>H por partes.</b> H(b) = distancia + A·(regla de tiempo) + A·(regla de lugar), con A = 100: cada regla rota suma 100. Es la misma cuenta que c + hᵀz + ΣJ<sub>kl</sub>z<sub>k</sub>z<sub>l</sub> (comprobado en los 512 estados).</p>' +
        '<p><b>Minimizar E</b> es mover la probabilidad hacia las configuraciones de H bajo: primero las 6 válidas, sin castigo, y entre ellas la de menor distancia, 1 → 2 → 3 o 3 → 2 → 1 (5 + 7 = 12).</p></aside></div>' +
      '<div class="vq-paso"><span>3</span>La misma energía con las matrices J y h (valor exacto)</div>' +
      '<div class="vq-formula" data-az="formula"></div>' +
      '<div class="vq-mats"><div class="vq-bloque"><div class="vq-rot">h<sub>k</sub> · ⟨z<sub>k</sub>⟩</div><table class="vq-tabla" data-az="h"></table></div>' +
      '<div class="vq-bloque"><div class="vq-rot">J<sub>kl</sub> &nbsp;(color: ⟨z<sub>k</sub>z<sub>l</sub>⟩ en vivo)</div><table class="vq-tabla vq-j" data-az="J"></table>' +
      '<div class="vq-ley"><i class="vq-ley-o"></i>⟨z<sub>k</sub>z<sub>l</sub>⟩ = +1 <i class="vq-ley-a"></i>⟨z<sub>k</sub>z<sub>l</sub>⟩ = −1 · solo cuenta k &lt; l</div></div>' +
      '<aside class="vq-explica"><div class="vq-explica-tit">Qué significan los colores</div>' +
        '<p><b>Cada casilla</b> es un par de variables (k, l) con su J<sub>kl</sub>: 50 si están en el mismo tiempo o en el mismo lugar (la regla no deja que las dos valgan 1) y d/4 (1,25 · 1,75 · 2,25) si son tiempos seguidos en lugares distintos: la distancia.</p>' +
        '<p><b>El color</b> es ⟨z<sub>k</sub>z<sub>l</sub>⟩ del estado de ahora: dorado = las dos variables salen iguales (las dos 0 o las dos 1), azul = salen distintas (una 1 y la otra 0), blanco = mitad y mitad.</p>' +
        '<p><b>Con la minimización:</b> cada casilla aporta J<sub>kl</sub>·⟨z<sub>k</sub>z<sub>l</sub>⟩. Con J > 0 ese término baja en azul: en una ruta válida, en cada tiempo y cada lugar hay un solo 1, así que los pares que lo incluyen quedan azules. El balance final lo cierran h y c; por eso lo que se minimiza es la suma completa de abajo.</p></aside></div>' +
      '<div class="vq-suma" data-az="suma"></div>' +
      '<div class="vq-paso"><span>4</span>El optimizador: COBYLA, evaluación por evaluación</div>' +
      '<div class="az-cuerpo"><svg class="az-curva" viewBox="0 0 420 220" aria-label="Energía en cada evaluación"></svg><div class="vq-log" data-az="log"></div></div>' +
      '<p class="dv-nota">COBYLA arma un símplex de 19 puntos (θ y θ + ρ en cada ángulo), ajusta en él un modelo lineal de E y da un paso de largo ρ hacia donde el modelo baja. Si el paso no rinde, reduce ρ a la mitad; si el símplex se deforma, lo repara con un paso de geometría. Como en el cuaderno (SciPy, maxiter = 300), se detiene a las ' + MAXFUN + ' evaluaciones y minimiza la energía exacta del estado; la medida con ' + DISPAROS + ' disparos se muestra al lado. Desde distintos θ al azar puede quedar en otra ruta válida: vuelve a sortear y a optimizar. Este COBYLA está escrito para el navegador; en el triángulo, desde los mismos 200 arranques, se comporta como el de SciPy: llegan a E = 12 27 contra 22 con 300 evaluaciones y 56 contra 55 con 1000, con la misma mediana (≈ 14).</p></div>';
    function $(k) { return caja.querySelector('[data-az="' + k + '"]'); }
    (function listo() {
      if (!window.katex) { setTimeout(listo, 300); return; }
      caja.querySelector('.az-texto').innerHTML = pintarTexto();
      $('formula').innerHTML = tex(String.raw`E(\boldsymbol\theta) = c + \sum_{k} h_k\,\langle z_k\rangle_{\boldsymbol\theta} + \sum_{k<l} J_{kl}\,\langle z_k z_l\rangle_{\boldsymbol\theta}, \qquad \langle z_k\rangle_{\boldsymbol\theta} = \sum_b P_{\boldsymbol\theta}(b)\, z_k(b), \quad \langle z_k z_l\rangle_{\boldsymbol\theta} = \sum_b P_{\boldsymbol\theta}(b)\, z_k(b)\, z_l(b)`, true);
    })();
    var sim = prepararSim();
    if (!sim || !H0) return;
    var th = [], tim = 0, corriendo = false, activos = [], co = null, evals = [], log = [], ultimaMedida = null;
    function f2(v) { return n2(v); }
    function fr(v) { return (+v.toPrecision(2)).toString().replace('.', ','); }   // ρ con dos cifras significativas
    function color(v) { return v >= 0 ? 'rgba(200,169,110,' + (v * .85).toFixed(3) + ')' : 'rgba(43,108,176,' + (-v * .7).toFixed(3) + ')'; }
    function bits(s) { var b = ''; for (var q = 0; q < sim.n; q++) b += (s >> q) & 1; return b; }   // q1 … q9
    function malla(s) { return '<span class="az-malla">' + rutaDe(sim, s).map(function (f) { return f.map(function (v) { return '<i class="' + (v ? 'on' : '') + '"></i>'; }).join(''); }).join('') + '</span>'; }
    function emedida(m) { var e = 0; for (var s in m.cuenta) e += m.cuenta[s] * sim.E[s]; return e / m.n; }
    function nuevo() { parar(); co = null; evals = []; log = []; activos = []; }
    function sortear() { nuevo(); th = []; for (var j = 0; j < 18; j++) th.push(Math.random() * 2 * Math.PI); }
    function construido() { nuevo(); th = []; var b = [1, 0, 0, 0, 1, 0, 0, 0, 1]; for (var j = 0; j < 9; j++) th.push(0); for (var q = 0; q < 9; q++) th.push(Math.PI * b[q]); }

    // H por partes para una configuración: distancia, regla de tiempo y regla de lugar (A = 100)
    function partes(s) {
      var x = rutaDe(sim, s), d = 0, rt = 0, rl = 0;
      for (var t = 0; t < 2; t++) for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) if (a !== b) d += DTRI[a][b] * x[a][t] * x[b][t + 1];
      for (var t2 = 0; t2 < 3; t2++) rt += Math.pow(1 - x[0][t2] - x[1][t2] - x[2][t2], 2);
      for (var a2 = 0; a2 < 3; a2++) rl += Math.pow(1 - x[a2][0] - x[a2][1] - x[a2][2], 2);
      return { x: x, dist: d, rt: rt, rl: rl, ok: rt + rl === 0 };
    }
    function resumen(m) {
      var orden = Object.keys(m.cuenta).sort(function (a, b) { return m.cuenta[b] - m.cuenta[a]; }), d = 0, rt = 0, rl = 0;
      orden.forEach(function (s) { var p = partes(+s), c = m.cuenta[s]; d += c * p.dist; rt += c * p.rt; rl += c * p.rl; });
      return { orden: orden, n: m.n, E: emedida(m), dist: d / m.n, at: 100 * rt / m.n, al: 100 * rl / m.n,
               top: orden.slice(0, 4).map(function (s) { var p = partes(+s); return { s: +s, veces: m.cuenta[s], H: sim.E[s], x: p.x, ok: p.ok }; }) };
    }
    function pintarMedida(psi, m) {
      var r = resumen(m), em = r.E, ex = energia(sim, th), sd = 0, orden = r.orden;
      for (var s in m.cuenta) sd += m.cuenta[s] * Math.pow(sim.E[s] - em, 2);
      sd = Math.sqrt(sd / m.n);
      var p0 = partes(+orden[0]), mot = motivos(p0.x);
      var h = '<div class="vq-izq"><div class="vq-grande"><span>E medida</span><b>' + f2(em) + '</b><small>= distancia ' + f2(r.dist) + ' + A·tiempo ' + f2(r.at) + ' + A·lugar ' + f2(r.al) + '</small></div>' +
        '<div class="vq-tray-caja"><div class="vq-rot">Trayectoria del resultado más frecuente (×' + m.cuenta[orden[0]] + ')</div>' + trayectoriaSVG(p0.x, true) +
        '<div class="vq-tray-txt ' + (p0.ok ? 'ok' : 'mal') + '">' + (p0.ok ? '✓ ' + lugaresPorTiempo(p0.x).map(function (l) { return 'x' + (l[0] + 1); }).join(' → ') + ' · distancia ' + p0.dist : '✗ ' + mot.join(' · ')) + ' · H = ' + f2(sim.E[orden[0]]) + '</div></div></div>';
      h += '<div class="vq-conteo"><div class="vq-rot">Resultados más frecuentes y su trayectoria</div><table class="vq-tabla vq-tfrec"><tr><th>x</th><th>trayectoria</th><th>veces</th><th>distancia</th><th>reglas rotas</th><th>H(b)</th></tr>' +
        orden.slice(0, 5).map(function (s) { var p = partes(+s), mm = motivos(p.x); return '<tr><td>' + malla(+s) + '</td><td>' + trayectoriaSVG(p.x, false) + '</td><td>' + m.cuenta[s] + '</td><td>' + p.dist + '</td><td class="' + (p.ok ? 'ok' : 'mal') + '">' + (p.ok ? '0 ✓' : (p.rt + p.rl) + ' · ' + mm.join(', ')) + '</td><td><b>' + f2(sim.E[s]) + '</b></td></tr>'; }).join('') +
        '<tr class="vq-otros"><td colspan="6">… ' + Math.max(0, orden.length - 5) + ' configuraciones distintas más</td></tr></table></div>';
      h += '<div class="vq-disparos"><div class="vq-rot">Los primeros 16 disparos: el resultado b (q<sub>1</sub>…q<sub>9</sub>), su configuración y su H(b)</div><ol>' +
        m.primeros.map(function (s) { return '<li><code>' + bits(s) + '</code>' + malla(s) + '<b>' + f2(sim.E[s]) + '</b></li>'; }).join('') + '</ol></div>';
      h += '<div class="vq-linea"><span>Medida:</span> E = Σ veces · H(b) / ' + m.n + ' = <b>' + f2(em) + '</b> &nbsp;·&nbsp; exacta Σ P(b) H(b) = ' + f2(ex) + ' &nbsp;·&nbsp; diferencia ' + f2(em - ex) + ' (ruido de muestreo esperado ≈ ±' + f2(sd / Math.sqrt(m.n)) + ')</div>';
      $('medida').innerHTML = h;
    }
    function pintarEnergia(psi) {
      var r = energiaJh(sim, psi), n = sim.n, h = '<tr><th></th><th>h<sub>k</sub></th><th>⟨z<sub>k</sub>⟩</th><th>h<sub>k</sub>⟨z<sub>k</sub>⟩</th></tr>';
      for (var a = 0; a < n; a++) h += '<tr><th>' + etq(a) + '</th><td>' + f2(H0.h[a]) + '</td><td style="background:' + color(r.ez[a]) + '">' + f2(r.ez[a]) + '</td><td>' + f2(H0.h[a] * r.ez[a]) + '</td></tr>';
      $('h').innerHTML = h;
      var J = '<tr><th></th>' + Array.from({ length: n }, function (_, b) { return '<th>' + etq(b) + '</th>'; }).join('') + '</tr>';
      for (var a2 = 0; a2 < n; a2++) {
        J += '<tr><th>' + etq(a2) + '</th>';
        for (var b = 0; b < n; b++) {
          var v = H0.J[a2][b];
          if (b <= a2) J += '<td class="vq-bajo">' + (b === a2 ? '' : f2(v)) + '</td>';
          else J += '<td style="background:' + color(r.ezz[a2][b]) + '" title="⟨zz⟩ = ' + f2(r.ezz[a2][b]) + ' · aporte J·⟨zz⟩ = ' + f2(v * r.ezz[a2][b]) + '">' + (v ? f2(v) : '·') + '</td>';
        }
        J += '</tr>';
      }
      $('J').innerHTML = J;
      var err = Math.abs(r.E - r.directa);
      $('suma').innerHTML =
        '<div class="vq-linea"><span>Con J y h:</span> E(θ) = c + Σ h<sub>k</sub>⟨z<sub>k</sub>⟩ + Σ<sub>k&lt;l</sub> J<sub>kl</sub>⟨z<sub>k</sub>z<sub>l</sub>⟩ = ' + f2(r.cte) + ' ' + (r.hz < 0 ? '−' : '+') + ' ' + f2(Math.abs(r.hz)) + ' ' + (r.jzz < 0 ? '−' : '+') + ' ' + f2(Math.abs(r.jzz)) + ' = <b>' + f2(r.E) + '</b></div>' +
        '<div class="vq-linea"><span>Comprobación:</span> Σ<sub>b</sub> P(b) H(b) sobre los 512 estados = <b>' + f2(r.directa) + '</b> &nbsp;·&nbsp; diferencia = <b class="vq-err">' + (err < 1e-9 ? err.toExponential(1).replace('.', ',') : f2(err)) + '</b></div>';
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
      e('text', { x: 36, y: 16, 'class': 'az-txt', 'text-anchor': 'start' }).textContent = 'E';
      evals.forEach(function (x, i) { e('circle', { cx: X(i), cy: Y(x.f), r: 1.8, 'class': 'vq-pto-eval' }); if (x.m != null) e('circle', { cx: X(i), cy: Y(x.m), r: 1.4, 'class': 'vq-pto-med' }); });
      var mejor = Infinity, d = '';
      evals.forEach(function (x, i) { mejor = Math.min(mejor, x.f); d += (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(mejor).toFixed(1); });
      if (d) e('path', { d: d, 'class': 'az-linea' });
      e('text', { x: 408, y: 34, 'class': 'az-txt', 'text-anchor': 'end' }).textContent = '— la mejor hasta ahora · • cada evaluación (exacta) · • medida';
    }
    function pintarLog() {
      $('log').innerHTML = '<div class="vq-rot">Correcciones de COBYLA (las últimas 12)</div><table class="vq-tabla vq-tlog"><tr><th>#</th><th>qué hizo</th><th>ρ</th><th>cambio de ángulos</th><th>E exacta</th><th>E medida</th></tr>' +
        (log.length ? log.slice(-12).reverse().map(function (r) { return '<tr class="' + (r.mejora ? 'vq-mejora' : '') + '"><td>' + r.k + '</td><td>' + r.que + '</td><td>' + r.rho + '</td><td>' + r.cambio + '</td><td>' + f2(r.f) + '</td><td>' + f2(r.m) + '</td></tr>'; }).join('') : '<tr><td colspan="6" class="vq-vacio">Pulsa «optimizar con COBYLA».</td></tr>') + '</table>';
    }
    function pintar(m) {
      var psi = estado(sim, th);
      ultimaMedida = m || medirDisparos(psi, DISPAROS);
      $('circ').innerHTML = circuitoValores(th, activos, resumen(ultimaMedida));
      pintarMedida(psi, ultimaMedida);
      pintarEnergia(psi);
      pintarCurva(); pintarLog();
    }
    function estadoTxt() {
      var mejor = co ? co.mejor() : null;
      $('estado').innerHTML = (co ? 'evaluación ' + co.evaluaciones() + ' de ' + MAXFUN + ' · ρ = ' + fr(co.rho()) + ' rad · mejor E = ' + f2(mejor.f) : 'E exacta = ' + f2(energia(sim, th)) + ' · E medida = ' + f2(emedida(ultimaMedida)));
    }
    // describe la corrección: los ángulos que más cambiaron
    function cambio(d) {
      var idx = d.map(function (v, j) { return j; }).filter(function (j) { return Math.abs(d[j]) > 1e-9; }).sort(function (a, b) { return Math.abs(d[b]) - Math.abs(d[a]); });
      activos = idx.slice(0, 3);
      var nrm = Math.sqrt(d.reduce(function (s, v) { return s + v * v; }, 0)) * 180 / Math.PI;
      function gr(x) { return (Math.abs(x) < 10 ? x.toFixed(1) : x.toFixed(0)).replace('.', ','); }
      return '|Δθ| = ' + gr(nrm) + '° · ' + idx.slice(0, 3).map(function (j) { var g = d[j] * 180 / Math.PI; return nomParam(j) + ' ' + (g < 0 ? '−' : '+') + gr(Math.abs(g)) + '°'; }).join(', ') + (idx.length > 3 ? ', …' : '');
    }
    function parar() { clearTimeout(tim); corriendo = false; }
    function evaluar() {
      var info = co.paso();
      if (!info) return false;
      var d = info.d || info.x.map(function (v, k) { return v - th[k]; });
      th = info.x.slice();
      var psi = estado(sim, th), m = medirDisparos(psi, DISPAROS), em = emedida(m), que;
      if (info.tipo === 'simplex') que = info.i === 0 ? 'símplex: punto inicial θ₀' : 'símplex: θ₀ + ρ en ' + nomParam(info.i - 1);
      else if (info.tipo === 'geometria') que = 'paso de geometría';
      else if (info.tipo === 'reduce') que = 'ρ a la mitad';
      else que = 'paso de largo ρ' + (info.mejora ? ' · baja E' : ' · no mejora') + (info.fallo ? ' → ρ a la mitad' : '');
      if (info.tipo !== 'reduce') evals.push({ f: info.f, m: em });   // ρ a la mitad no evalúa
      log.push({ k: co.evaluaciones(), que: que, rho: fr(info.rho), cambio: info.tipo === 'reduce' ? '—' : cambio(d), f: info.f, m: em, mejora: info.tipo === 'paso' && info.mejora });
      ultimaMedida = m;
      return m;
    }
    function correr() {
      if (corriendo) return;
      if (!co || !co.paso) co = null;
      if (!co || co.evaluaciones() >= MAXFUN || co.rho() < 1e-4) { co = crearCobyla(function (x) { return energia(sim, x); }, th.slice(), { rhobeg: 1, rhoend: 1e-4, maxfun: MAXFUN }); evals = []; log = []; }
      corriendo = true;
      (function paso() {
        var vel = +$('vel').value, m = null, sigue = true;
        for (var r = 0; r < (vel === 0 ? 10 : 1) && sigue; r++) { m = evaluar(); sigue = !!m; }
        if (m) { pintar(m); estadoTxt(); }
        if (sigue && co.evaluaciones() < MAXFUN) tim = setTimeout(paso, quieto ? 0 : Math.max(vel, 16));
        else { corriendo = false; th = co.mejor().x.slice(); activos = []; pintar(); estadoTxt(); $('estado').innerHTML += ' · terminó: queda el mejor θ'; }
      })();
    }
    $('azar').addEventListener('click', function () { sortear(); pintar(); estadoTxt(); });
    $('medir').addEventListener('click', function () { if (corriendo) return; pintar(); estadoTxt(); });
    $('opt').addEventListener('click', correr);
    $('construido').addEventListener('click', function () { construido(); pintar(); estadoTxt(); });
    sortear(); pintar(); estadoTxt();
  };
})();
