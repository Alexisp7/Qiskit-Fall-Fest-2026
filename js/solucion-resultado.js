// Resultado: la propuesta para los 8 lugares de la mina, de punta a punta. La red se reduce
// sin perder exactitud (hojas → costo fijo, núcleo → grafo completo por cierre métrico), el
// QUBO reducido de 16 qubits se pasa a Ising con fórmulas cerradas y se resuelve con el exacto
// y con el VQE del cuaderno. Todos los números salen de correr las celdas de esta etapa.
(function () {
  var numero = 0;
  function tex(s, sinNumero) {
    var src = s + (sinNumero ? '' : ' \\tag{' + (++numero) + '}');
    if (window.katex) { try { return katex.renderToString(src, { displayMode: true, throwOnError: false }); } catch (e) {} }
    return '<code>' + s.replace(/</g, '&lt;') + '</code>';
  }
  function linea(f, nota, sinNumero) { return '<div class="dv-linea">' + tex(f, sinNumero) + (nota ? '<p class="dv-nota">' + nota + '</p>' : '') + '</div>'; }
  function seccion(n, titulo, cuerpo) { return '<section class="dv-seccion"><div class="dv-paso-tit"><span class="dv-num">' + n + '.</span>' + titulo + '</div>' + cuerpo + '</section>'; }
  function tabla(cab, filas, cls) { return '<table class="rs-tabla' + (cls ? ' ' + cls : '') + '"><tr>' + cab.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr>' + filas.map(function (f) { return '<tr>' + f.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; }

  // ── la ruta de 13 pasos sobre la red ──
  var POS = { 1: [40, 150], 2: [190, 96], 3: [120, 30], 4: [258, 30], 5: [258, 214], 6: [178, 268], 7: [336, 268], 8: [448, 150] };
  var NOM = { 1: 'Planta', 2: 'J1', 3: 'Tajo', 4: 'Botadero', 5: 'J2', 6: 'Lixiviación', 7: 'Baja ley', 8: 'Relaves' };
  var AR = [[1, 2, 1.6], [2, 3, 0.072], [2, 4, 0.035], [2, 8, 1.4], [2, 5, 1.4], [1, 5, 1.7], [8, 5, 1.0], [5, 6, 0.2], [5, 7, 0.5]];
  var RUTA = [1, 2, 3, 2, 4, 2, 8, 5, 6, 5, 7, 5, 1];
  function km(v) { return (v === Math.round(v) && v ? v.toFixed(1) : String(v)).replace('.', ','); }
  function rutaSVG() {
    var o = '<svg class="rs-red" viewBox="0 0 500 300" role="img" aria-label="La ruta de 13 pasos sobre la red minera">';
    AR.forEach(function (a) {
      var p = POS[a[0]], q = POS[a[1]], usada = false;
      for (var k = 1; k < RUTA.length; k++) if ((RUTA[k - 1] === a[0] && RUTA[k] === a[1]) || (RUTA[k - 1] === a[1] && RUTA[k] === a[0])) usada = true;
      o += '<line class="rs-arista' + (usada ? ' usada' : '') + '" x1="' + p[0] + '" y1="' + p[1] + '" x2="' + q[0] + '" y2="' + q[1] + '"/>';
      var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy), mx = p[0] + dx * 0.5 - dy / L * 12, my = p[1] + dy * 0.5 + dx / L * 12 + 4;   // la etiqueta, a un lado de la arista
      o += '<text class="rs-d" x="' + mx.toFixed(1) + '" y="' + my.toFixed(1) + '">' + km(a[2]) + '</text>';
    });
    for (var k in POS) {
      var p2 = POS[k], hoja = [3, 4, 6, 7].indexOf(+k) >= 0;
      o += '<circle class="rs-nodo' + (hoja ? ' hoja' : '') + '" cx="' + p2[0] + '" cy="' + p2[1] + '" r="15"/><text class="rs-x" x="' + p2[0] + '" y="' + (p2[1] + 5) + '">x' + k + '</text>';
      o += '<text class="rs-nom" x="' + p2[0] + '" y="' + (p2[1] + (p2[1] > 200 ? 30 : -21)) + '">' + NOM[k] + '</text>';
    }
    return o + '</svg>';
  }

  // resultados del VQE (celda D, corrida con capas = 1 y capas = 2, 5 arranques, maxiter = 1500, rhobeg = 0,5)
  var VQE = [
    { capas: 1, npar: 32, arranques: [14.0006, 5.7, 23.4938, 17.4003, 5.7026], mejor: 5.7, top: '1 → 5 → 8 → 2', p: '≈ 1,000', pOpt: '≈ 1,000' },
    { capas: 2, npar: 48, arranques: [5.7007, 5.7036, 7.2058, 17.0027, 17.4005], mejor: 5.7007, top: '1 → 2 → 8 → 5', p: '≈ 1,000', pOpt: '≈ 1,000' }
  ];
  var VQE_NOTA = 'Con una capa, 2 de 5 arranques llegan a 5,7; con dos capas, también 2 de 5 (otro queda en 7,2, un ciclo válido más largo, y los demás en configuraciones que rompen reglas). El mejor arranque de cada caso deja prácticamente toda la probabilidad en una de las dos rutas óptimas, la misma que da el exacto: el VQE resuelve el núcleo. Como siempre con COBYLA, el resultado depende del arranque, por eso se usan varios.';

  function texto() {
    numero = 0;
    var D = [[0, 1.6, 1.7, 2.7], [1.6, 0, 1.4, 1.4], [1.7, 1.4, 0, 1.0], [2.7, 1.4, 1.0, 0]], nn = [1, 2, 5, 8];
    function c(v) { return km(v); }
    var h = '<div class="dv-cab"><div class="mx-kicker">Resultado</div><h3 class="dv-tit">La ruta de los 8 lugares: 7,314 km</h3>' +
      '<p class="dv-resumen"><b>Resumen.</b> La red se reduce sin perder exactitud: las hojas pasan a un costo fijo y el núcleo de 4 lugares se completa con las distancias mínimas. El QUBO reducido tiene 16 qubits. El método exacto revisa sus 65 536 estados y el VQE, con el mismo ansatz del cuaderno, encuentra la misma ruta; luego se expande a los 13 pasos. Todos los números salen de correr las celdas de esta etapa.</p></div>';
    h += '<div class="dv-pizarra">';
    // 1 · reducción
    h += seccion(1, 'Por qué la reducción es exacta',
      linea(String.raw`G = \text{la red},\quad b = 1,\quad \mathcal L = \{3, 4, 6, 7\}\ \text{(hojas, grado 1)},\quad \mathcal C = \{1, 2, 5, 8\}\ \text{(núcleo)}`, 'El problema original: el recorrido cerrado más corto desde la planta que pasa por todos los lugares.') +
      '<p class="rs-sub">Paso 1 · las hojas</p>' +
      linea(String.raw`\min_{\text{recorrido}} \;=\; \min_{\text{recorrido en }\mathcal C} \;+\; 2\sum_{\ell\in\mathcal L} w_{\ell,\,h(\ell)}`, 'Una hoja ℓ solo se alcanza y se deja por su única arista hacia su vecino h(ℓ): todo recorrido paga al menos 2w por ella. Al revés, a cualquier recorrido del núcleo se le inserta la excursión en su vecino, que ya está visitado.') +
      linea(String.raw`2\,(0{,}072 + 0{,}035 + 0{,}2 + 0{,}5) = 1{,}614\ \text{km}`, 'Tajo y Botadero cuelgan de J1; Lixiviación y Baja ley, de J2.') +
      '<p class="rs-sub">Paso 2 · el cierre métrico</p>' +
      linea(String.raw`d_{ij} = \text{camino mínimo entre } i, j \in \mathcal C \qquad\Rightarrow\qquad \text{recorrido mínimo en } \mathcal C = \text{ciclo hamiltoniano con pesos } d_{ij}`, 'Si un recorrido repite nodos, la desigualdad triangular permite saltarse la repetición sin aumentar el costo. Por eso «visitar cada lugar exactamente una vez» vuelve a ser correcto, con 4 tiempos para 4 lugares.') +
      tabla(['d (km)'].concat(nn.map(function (k) { return k; })), D.map(function (f, i) { return [nn[i]].concat(f.map(c)); }), 'rs-dist') +
      '<p class="dv-nota">d<sub>18</sub> = 2,7 sale de 1 → 5 → 8; las demás son caminos directos.</p>');
    // 2 · QUBO reducido
    h += seccion(2, 'El QUBO reducido: 16 qubits',
      linea(String.raw`x_{i,t} = 1 \iff i \text{ es la parada } t \text{ del núcleo},\qquad N = T = 4,\qquad c_i = d_{i,b}`) +
      linea(String.raw`Q(x) = \sum_{t=1}^{T-1}\sum_{i\neq j} d_{ij}\,x_{i,t}x_{j,t+1} + \sum_{i\neq b} c_i\,x_{i,T} + A\sum_{t}\Big(1-\sum_i x_{i,t}\Big)^2 + A\sum_{i}\Big(1-\sum_t x_{i,t}\Big)^2 + A\,(1 - x_{b,1})`, 'El segundo término es volver a la planta desde la última parada: reemplaza a terminar_en. El último es empezar_en. Como el grafo reducido es completo, saltos_prohibidos desaparece.') +
      linea(String.raw`\text{configuración inválida} \;\Rightarrow\; Q(x) \ge A, \qquad A = 10 > 5{,}7 = \text{mejor ruta válida}`, 'Cada regla rota suma A por un entero positivo. Basta que A supere la mejor ruta válida; un A mucho mayor aplastaría las diferencias entre rutas válidas.'));
    // 3 · Ising
    h += seccion(3, 'Paso a Ising: x = (1 − z)/2',
      linea(String.raw`x_{i,t}x_{j,t+1} = \tfrac14\big(1 - z_{i,t} - z_{j,t+1} + z_{i,t}z_{j,t+1}\big), \qquad c_i\,x_{i,T} = \tfrac{c_i}{2}\big(1 - z_{i,T}\big)`) +
      linea(String.raw`A\Big(1 - \sum_{i=1}^{N} x_{i,t}\Big)^2 = A\Big[\tfrac{4 - 3N + N^2}{4} + \Big(1 - \tfrac N2\Big)\sum_i z_{i,t} + \tfrac12\sum_{i<j} z_{i,t}z_{j,t}\Big], \qquad A\,(1 - x_{b,1}) = \tfrac A2 + \tfrac A2\,z_{b,1}`, 'La regla de lugar es igual, cambiando N por T.') +
      linea(String.raw`H(z) = c + \sum_{i,t} h_{i,t}\,z_{i,t} + \sum_{k<l} J_{kl}\,z_k z_l, \qquad a_i = \sum_j d_{ij}`) +
      linea(String.raw`c = \frac{T-1}{4}\sum_{i\neq j} d_{ij} + \frac12\sum_{i\neq b} c_i + A\Big[\frac{T(N^2 - 3N + 4)}{4} + \frac{N(T^2 - 3T + 4)}{4} + \frac12\Big]`) +
      linea(String.raw`h_{i,t} = -\frac{a_i}{4}\big([t<T] + [t>1]\big) - \frac{c_i}{2}\,[t = T,\ i\neq b] + A\Big(2 - \frac{N+T}{2}\Big) + \frac A2\,[i = b,\ t = 1]`) +
      linea(String.raw`J_{(i,t)(j,t+1)} = \tfrac{d_{ij}}{4}\ (i\neq j), \qquad J_{(i,t)(j,t)} = \tfrac A2\ (i\neq j), \qquad J_{(i,t)(i,t')} = \tfrac A2\ (t\neq t'), \qquad 0 \text{ en otro caso}`, 'Los qubits van por tiempo: k = (t − 1)N + p, el mismo orden del código y del ansatz.'));
    // 4 · números
    var HT = [['t = 1', '−16,5', '−21,1', '−21,025', '−21,275'], ['t = 2 y 3', '−23,0', '−22,2', '−22,05', '−22,55'], ['t = 4', '−21,5', '−21,9', '−21,875', '−22,625']];
    h += seccion(4, 'Los números de la mina (A = 10)',
      linea(String.raw`\sum_{i\neq j} d_{ij} = 19{,}6, \qquad a = (6{,}0;\ 4{,}4;\ 4{,}1;\ 5{,}1)\ \text{para los nodos } (1, 2, 5, 8)`) +
      linea(String.raw`c = \tfrac34\cdot 19{,}6 + \tfrac12\,(1{,}6 + 1{,}7 + 2{,}7) + 10\cdot 16{,}5 = 14{,}7 + 3{,}0 + 165 = 182{,}7`, 'Coincide con el offset que entrega a_ising.') +
      '<p class="rs-sub">Los campos h<sub>i,t</sub></p>' + tabla(['', 'nodo 1', 'nodo 2', 'nodo 5', 'nodo 8'], HT) +
      '<p class="rs-sub">La matriz J (16 × 16) por bloques de 4 × 4, uno por par de tiempos</p>' +
      tabla(['bloque', 'valor'], [['(t, t)', 'A/2 · (U − I) = 5 (U − I)'], ['(t, t + 1)', 'D/4 + 5 I'], ['(t, t′) con |t − t′| ≥ 2', '5 I']]) +
      '<p class="dv-nota">D es la matriz de distancias del núcleo, I la identidad y U la matriz de unos. D/4 vale 0,4 · 0,425 · 0,675 · 0,35 · 0,35 · 0,25 para los pares 12, 15, 18, 25, 28 y 58.</p>');
    // 5 · comprobación
    h += seccion(5, 'Comprobación: H(z) = Q(x)',
      linea(String.raw`z = 1 - 2x, \qquad H(z) = c + h^{\mathsf T}z + \sum_{k<l} J_{kl}\,z_k z_l`, null, true) +
      tabla(['caso', 'Q(x)', 'hᵀz', 'Σ J<sub>kl</sub> z<sub>k</sub>z<sub>l</sub>', 'H(z)'], [
        ['óptima 1 → 2 → 8 → 5: distancia 4,0 + cierre 1,7', '5,7', '−181,15', '4,15', '182,7 − 181,15 + 4,15 = 5,7 ✓'],
        ['rompe la regla de lugar 1 → 2 → 1 → 5: distancia 4,9 + cierre 1,7 + 2A', '26,6', '−180,25', '24,15', '26,6 ✓'],
        ['rompe la regla de tiempo: t<sub>1</sub> = {1, 2}, t<sub>2</sub> = {8}, t<sub>3</sub> = ∅, t<sub>4</sub> = {5}: 4,1 + 1,7 + 2A', '25,8', '−183,35', '26,45', '25,8 ✓']]) +
      '<p class="dv-nota">En el segundo caso, J<sub>(1,1)(1,3)</sub> = A/2 = 5 multiplica a (−1)(−1) = +1: es el término que delata la repetición. En el tercero, J<sub>(1,1)(2,1)</sub> = 5 cumple el mismo papel dentro de un tiempo. En los 65 536 estados, la mayor diferencia entre H(z) y Q(x) es 2·10<sup>−13</sup>: redondeo.</p>');
    // 6 · exacto
    h += seccion(6, 'El método exacto: los 65 536 estados',
      tabla(['ciclo del núcleo desde la planta', 'Q (km)'], [['1 → 2 → 8 → 5 → 1', '<b>5,7</b>'], ['1 → 5 → 8 → 2 → 1', '<b>5,7</b>'], ['1 → 2 → 5 → 8 → 1', '6,7'], ['1 → 8 → 5 → 2 → 1', '6,7'], ['1 → 5 → 2 → 8 → 1', '7,2'], ['1 → 8 → 2 → 5 → 1', '7,2']]) +
      linea(String.raw`E_{\min} = 5{,}7 \qquad\Rightarrow\qquad 5{,}7 + 1{,}614 = 7{,}314\ \text{km}`, 'Las dos soluciones empatadas son la misma ruta en sentidos opuestos. Los otros cuatro ciclos válidos cuestan 6,7 y 7,2.'));
    // 7 · VQE
    var cuerpoVQE = linea(String.raw`E(\boldsymbol\theta) = \sum_b p_b(\boldsymbol\theta)\, e_b, \qquad p_b = |\langle b|\psi(\boldsymbol\theta)\rangle|^2`, 'Como H es diagonal, la energía es el producto de las probabilidades del estado por la energía de cada configuración. Se comprobó que da lo mismo que el valor esperado del SparsePauliOp.');
    if (VQE) {
      cuerpoVQE += VQE.map(function (r) {
        return '<p class="rs-sub">' + r.capas + (r.capas === 1 ? ' capa' : ' capas') + ' · ' + r.npar + ' ángulos · 5 arranques con COBYLA (maxiter = 1500, ρ inicial = 0,5)</p>' +
          tabla(['arranque', 'E final'], r.arranques.map(function (e, i) { return [i, String(e).replace('.', ',')]; })) +
          '<p class="dv-nota">Mejor: E = <b>' + c(r.mejor) + '</b>. Estado más probable: ' + r.top + ', con P ' + r.p + '. Probabilidad total de las dos rutas óptimas: <b>' + r.pOpt + '</b>.</p>';
      }).join('') + '<p class="dv-nota">' + VQE_NOTA + '</p>';
    }
    h += seccion(7, 'El VQE con el ansatz del cuaderno', cuerpoVQE);
    // 8 · la ruta
    h += seccion(8, 'La ruta de 13 pasos',
      '<p class="dv-nota">Cada tramo del ciclo del núcleo se recorre por su camino mínimo (1 → 8 pasa por 5) y, la primera vez que se llega a un nodo con hojas, se entra y sale de cada una.</p>' +
      '<div class="rs-ruta">' + rutaSVG() + '<div class="rs-pasos"><div class="rs-final"><span>Resultado</span><b>7,314 km</b><small>= 5,7 del núcleo + 1,614 de las hojas</small></div>' +
      '<ol>' + RUTA.map(function (k, i) { return '<li><span>t<sub>' + (i + 1) + '</sub></span>x<sub>' + k + '</sub> · ' + NOM[k] + (i ? ' <em>+' + c(AR.filter(function (a) { return (a[0] === RUTA[i - 1] && a[1] === k) || (a[1] === RUTA[i - 1] && a[0] === k); })[0][2]) + ' km</em>' : '') + '</li>'; }).join('') + '</ol>' +
      '<p class="dv-nota">La otra solución empatada da la misma ruta al revés: 1 → 5 → 6 → 5 → 7 → 5 → 8 → 2 → 3 → 2 → 4 → 2 → 1, también 7,314 km. Coincide con la referencia clásica de la etapa Validación.</p></div></div>');
    return h + '</div>';
  }

  window.montarResultadoMat = function (caja) {
    caja.innerHTML = texto();
    (function listo() { if (window.katex) caja.innerHTML = texto(); else setTimeout(listo, 300); })();
  };
})();
