// Jupyter 2.0 de la página Solución. Cada etapa abre su cuaderno: a la izquierda
// los bloques del cuaderno; a la derecha, fijo y siempre entero, el ejemplo de la
// red minera (8 lugares) y lo que hace ese bloque. En Inicializar cada bloque solo
// muestra la acción de su función sobre un camino cualquiera; el ansatz tiene su
// propio espacio; y al final de Inicializar se construyen las matrices J y h.
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sub(s) { return '<sub>' + s + '</sub>'; }

  // ── la red minera ──
  var NOM = { 1: 'Planta', 2: 'J1', 3: 'Tajo', 4: 'Botadero', 5: 'J2', 6: 'Lixiviación', 7: 'Baja ley', 8: 'Relaves' };
  var ARISTAS = [[1, 2, 1.6], [2, 3, 0.072], [2, 4, 0.035], [2, 8, 1.4], [2, 5, 1.4], [1, 5, 1.7], [8, 5, 1.0], [5, 6, 0.2], [5, 7, 0.5]];
  var POS0 = { 1: [74, 150], 2: [262, 96], 3: [176, 38], 4: [348, 38], 5: [348, 214], 6: [250, 266], 7: [446, 266], 8: [586, 150] };
  var G = {}; for (var k0 in POS0) G[k0] = [24 + (POS0[k0][0] - 74) * 0.79, 20 + (POS0[k0][1] - 38) * 0.5];
  function hayCamino(a, b) { return ARISTAS.some(function (e) { return (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a); }); }
  function dist(a, b) { var e = ARISTAS.filter(function (e) { return (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a); })[0]; return e ? e[2] : null; }
  var T = 13, N = 8;
  // el camino cualquiera con el que se trabaja (tiene un salto sin camino, x4 queda fuera y termina en x2)
  var P = [1, 5, 7, 5, 6, 5, 8, 1, 2, 3, 2, 8, 2];
  // la ruta óptima de referencia (7,314 km)
  var RREF = [1, 2, 3, 2, 4, 2, 8, 5, 6, 5, 7, 5, 1];

  var EXPLICA = {
    datos: { t: 'La red minera: 8 lugares unidos por 9 caminos con sus distancias en km y T = 13 tiempos. Como 3, 4, 6 y 7 son hojas, la ruta tiene que volver a pasar por J1 y J2; por eso se activa visitar_al_menos_una_vez y no visitar_una_vez. A queda en None para usar la sugerida, 21,4. Las piezas activas incluyen partir y terminar en x<sub>1</sub>, la planta.', f: ['1 → 2 → 3 → 2 → 4 → 2 → 8 → 5 → 6 → 5 → 7 → 5 → 1 &nbsp;(13 pasos)'] },
    instancia: { t: 'Crea el grafo de NetworkX con las 9 aristas y sus distancias, y el Problema con T = 13: 8 × 13 = 104 qubits de ruta.' },
    libs: { t: 'NumPy y NetworkX para los datos, SciPy para el optimizador COBYLA y Qiskit para el circuito, el Hamiltoniano (SparsePauliOp) y el estado (Statevector).' },
    problema: { t: 'x<sub>i,t</sub> = 1 si el camión está en el lugar i en el tiempo t: 8 × 13 = 104 variables de ruta, una por qubit (las holguras se agregan después). A la derecha, un camino cualquiera escrito como esas variables.', f: ['x<sub>i,t</sub> ↦ q<sub>k</sub>, &nbsp;k = (t − 1)N + i'] },
    qubo: { t: 'Un polinomio en variables binarias que se suma y se escala por piezas. Su herramienta clave, agregar_cuadrado, expande (c<sub>0</sub> + Σ a<sub>k</sub>x<sub>k</sub>)²: sobre una columna de la matriz aparece un término por cada par de sus qubits.', f: ['(1 − Σ x<sub>k</sub>)² = 1 − Σ x<sub>k</sub> + 2 Σ<sub>k&lt;l</sub> x<sub>k</sub>x<sub>l</sub>'] },
    coste: { t: 'La función de coste: por cada par de tiempos seguidos suma d<sub>ij</sub> si el camión va de i a j por un camino. Sobre el camino cualquiera, cada tramo aporta su distancia; el salto sin camino no aporta nada aquí: lo castiga otra pieza.', f: ['Q<sub>C</sub> = Σ<sub>t=1</sub><sup>T−1</sup> Σ<sub>i≠j</sub> d<sub>ij</sub> x<sub>i,t</sub> x<sub>j,t+1</sub>'] },
    basicas: { t: 'Cada pieza vale 0 si la regla se cumple. Sobre el camino: cada tiempo tiene un lugar (bien), los lugares no aparecen exactamente una vez y hay un salto sin camino. saltos_prohibidos también castiga quedarse quieto (i → i): con revisitas, esperar no costaría nada. visitar_una_vez solo sirve si T = N, como en el triángulo.', f: ['Σ<sub>t</sub> (1 − Σ<sub>i</sub> x<sub>i,t</sub>)² &nbsp;·&nbsp; Σ<sub>i</sub> (1 − Σ<sub>t</sub> x<sub>i,t</sub>)²', 'Σ<sub>t</sub> Σ<sub>(i,j)∉E &nbsp;o&nbsp; i=j</sub> x<sub>i,t</sub> x<sub>j,t+1</sub>'] },
    revisitas: { t: 'Con T = 13 > N = 8, «exactamente una vez» choca con «un lugar por tiempo»: pide 8 unos y la otra pide 13. La holgura s<sub>i</sub> ≥ 0 cuenta las visitas extra: la pieza vale 0 si el lugar aparece 1 + s<sub>i</sub> veces. Sobre el camino, las revisitas ya no se castigan, pero x<sub>4</sub> nunca aparece y eso sí cuesta.', f: ['Q<sub>B′</sub> = Σ<sub>i</sub> (Σ<sub>t</sub> x<sub>i,t</sub> − 1 − s<sub>i</sub>)²', 's<sub>i</sub> = Σ<sub>b</sub> 2<sup>b</sup> y<sub>i,b</sub>: 3 bits por lugar, 24 qubits más'] },
    elegibles: { t: 'Piezas que se agregan según el caso. Aquí: partir en x<sub>1</sub> (el camino lo cumple) y terminar en x<sub>1</sub> (el camino termina en x<sub>2</sub>).', f: ['1 − x<sub>s,1</sub> &nbsp;·&nbsp; 1 − x<sub>f,T</sub>', 'A = (T − 1) · máx d + 1 = 12 · 1,7 + 1 = 21,4 &nbsp;(sugerida)'] },
    armar: { t: 'El Hamiltoniano es la suma ponderada de las piezas: la distancia con peso 1 y cada restricción con peso A. Si A se dejó en None, se usa la sugerida, 21,4. Para el camino, cada regla rota pesa mucho más que toda la distancia.', f: ['Q = Q<sub>C</sub> + A·Q<sub>tiempo</sub> + A·Q<sub>visita′</sub> + …'] },
    ising: { t: 'x<sub>k</sub> = (1 − z<sub>k</sub>)/2 lleva el QUBO a espines: un qubit en 1 es z = −1. Cada término lineal da un h<sub>k</sub>, cada producto un J<sub>kl</sub> y lo constante queda como offset. Las matrices explícitas están al final de esta etapa.', f: ['x<sub>k</sub> = (1 − z<sub>k</sub>)/2', 'H = Σ<sub>k&lt;l</sub> J<sub>kl</sub> z<sub>k</sub>z<sub>l</sub> + Σ<sub>k</sub> h<sub>k</sub> z<sub>k</sub> + c'] },
    ansatzc: { t: 'Capas de R<sub>Y</sub>(θ) en cada qubit, una cascada de CZ entre qubits vecinos y una capa final de R<sub>Y</sub>. Las celdas siguientes explican por qué.', f: ['|ψ(θ)⟩ = R<sub>Y</sub>(θ) · [CZ<sub>cadena</sub> · R<sub>Y</sub>(θ)]<sup>capas</sup> |0⟩<sup>⊗n</sup>'] },
    por1: { c: 'R<sub>Y</sub> lleva |0⟩ hacia |1⟩; R<sub>Z</sub> solo gira la fase.' },
    por2: { c: 'R<sub>Y</sub> y CZ mantienen el estado en el plano real.' },
    por3: { c: 'Sin CZ el mínimo ya es una cadena de bits: la cascada ayuda a optimizar, no a alcanzar.' },
    por4: { c: 'La cascada sigue el orden por tiempo, k = (t − 1)N + i.' },
    por5: { c: 'CZ = diag(1, 1, 1, −1): antes de medir no cambia nada; la última R<sub>Y</sub> sí.' },
    por6: { c: 'El tamaño del circuito para la red minera, con holguras.' },
    por7: { c: 'Penalizaciones contra distancias, y el riesgo de barren plateaus.' },
    vqe1: { t: 'El QUBO se traduce a Ising y se normaliza por su coeficiente más grande, porque eso ayuda al optimizador. Se arma el ansatz y un generador aleatorio con semilla para los puntos de partida.', f: ['Ĥ = H / máx |coef|'] },
    vqe2: { t: 'La energía que se minimiza: se asignan los θ al circuito, se simula el estado y se calcula el valor esperado del Hamiltoniano.', f: ['E(θ) = ⟨ψ(θ)| Ĥ |ψ(θ)⟩'] },
    vqe3: { t: 'COBYLA minimiza E(θ) desde varios θ iniciales al azar. Se guarda el historial de cada intento, en la escala original, y se queda el mejor.', f: ['θ* = argmin<sub>θ</sub> E(θ)'] },
    vqe4: { t: 'Con los mejores θ se calculan las probabilidades de cada estado. Entre los más probables se elige el de menor costo QUBO.' },
    correr: { t: 'Se corre el VQE con el Hamiltoniano armado y se muestran la ruta, la matriz x(i,t), el desglose, la convergencia y si coincide con el exacto.' },
    exacto: { t: 'Revisa los 2<sup>n</sup> estados y los ordena por energía. Con los 128 qubits de la red no se puede: por eso la celda de datos lo deja apagado.', f: ['x* = argmin<sub>x ∈ {0,1}<sup>n</sup></sub> E(x)'] },
    referencia: { t: 'La red es un árbol con un ciclo central 1–2–8–5–1: se recorre el ciclo (5,7 km) y se entra y sale de cada hoja (1,614 km). Son 7,314 km con todas las restricciones en 0. Una búsqueda exacta por programación dinámica confirma que es el óptimo con T = 13.', f: ['5,7 + 2·(0,072 + 0,035 + 0,2 + 0,5) = 7,314 km'] },
    reduccion: { t: 'Las hojas 3, 4, 6 y 7 solo tienen un camino: cualquier ruta entra y sale por él, así que pagan un costo fijo de ida y vuelta (1,614 km). Queda el núcleo 1, 2, 5, 8, que se completa con las distancias mínimas (cierre métrico). Con 4 lugares y 4 tiempos son 16 qubits.', f: ['mín = mín<sub>núcleo</sub> + 2 Σ<sub>ℓ</sub> w<sub>ℓ,h(ℓ)</sub>', 'd<sub>18</sub> = 1,7 + 1,0 = 2,7 (1 → 5 → 8)'] },
    cierre: { t: 'Una pieza nueva: el costo de volver a la planta desde el último lugar del núcleo. Reemplaza a terminar_en. Como el grafo reducido es completo, saltos_prohibidos ya no hace falta, y con 4 tiempos para 4 lugares «exactamente una vez» vuelve a ser correcto.', f: ['Q<sub>cierre</sub> = Σ<sub>i≠b</sub> d<sub>i,b</sub> x<sub>i,T</sub>', 'A = 10 > 5,7'] },
    exactored: { t: 'Con 16 qubits se pueden revisar los 2<sup>16</sup> = 65 536 estados. La energía mínima es 5,7, empatada en dos ciclos que son la misma ruta en sentidos opuestos: 1 → 2 → 8 → 5 y 1 → 5 → 8 → 2. Con las hojas: 7,314 km.', f: ['E<sub>mín</sub> = 5,7 &nbsp;·&nbsp; 5,7 + 1,614 = 7,314 km'] },
    cerrada: { t: 'Las fórmulas cerradas de c, h y J reproducen el Hamiltoniano que arma a_ising: la misma constante (182,7) y la misma energía en los 65 536 estados, con diferencia de 10<sup>−13</sup>.', f: ['c = 182,7', 'máx |H(z) − Q(x)| ≈ 2·10<sup>−13</sup>'] },
    vqered: { t: 'El VQE con el ansatz del cuaderno. Como H es diagonal, la energía es p · e: las probabilidades del estado por la energía de cada configuración, igual que el valor esperado del SparsePauliOp.', f: ['E(θ) = Σ<sub>b</sub> p<sub>b</sub>(θ) e<sub>b</sub>'] },
    expandir: { t: 'La ruta del núcleo se completa: cada tramo se recorre por el camino mínimo y, la primera vez que se pasa por un nodo con hojas, se entra y sale de cada una. Sale la caminata de 13 pasos y 7,314 km.', f: ['1 → 2 → 3 → 2 → 4 → 2 → 8 → 5 → 6 → 5 → 7 → 5 → 1'] },
    lectura: { t: 'Traduce los bits a la ruta: en cada tiempo, el lugar cuyo qubit vale 1. matriz_x ordena los mismos bits como lugares × tiempos.' },
    desglose: { t: 'El aporte de cada pieza para una solución. Con el camino cualquiera: la distancia, más A por cada regla que rompe.' },
    compara: { t: 'Lista las mejores soluciones exactas y su desglose; la celda del VQE termina comparando su energía con la exacta.' }
  };

  // ── resaltado de Python ──
  var KW = /^(def|class|return|for|in|if|elif|else|not|and|or|None|True|False|import|from|as|lambda|while|with|is|raise|pass|yield)$/;
  var BI = /^(print|range|len|sum|min|max|abs|float|int|list|sorted|enumerate|zip|isinstance|super|self|dict|set)$/;
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // ── glosario: lo que hace cada función, clase o llamada que aparece en el código ──
  var GLOS = {
    Problema: 'Clase que guarda el grafo, los tiempos y el mapa (lugar, tiempo) → qubit.',
    QUBO: 'Clase de un polinomio cuadrático en variables binarias: constante + términos lineales + términos cuadráticos. Se suma y se escala por piezas.',
    q: 'Índice del qubit que representa x(lugar, tiempo).',
    var: 'Camino inverso de q: de un qubit k al par (lugar, tiempo).',
    distancia: 'Distancia de la arista i–j, o None si no hay camino.',
    agregar_constante: 'Suma un número fijo al polinomio.',
    agregar_lineal: 'Suma c·x_k: un término de una sola variable.',
    agregar_cuadratico: 'Suma c·x_k·x_l; si k = l queda como lineal porque x² = x en binario.',
    agregar_cuadrado: 'Expande peso·(c₀ + Σ a_k x_k)² y lo suma: la forma de casi todas las restricciones.',
    energia: 'Valor del polinomio para una cadena de bits concreta.',
    energias_todas: 'Energía de los 2ⁿ estados de una vez; solo sirve para n pequeño.',
    a_ising: 'Cambia x_k = (1 − Z_k)/2 y devuelve el Hamiltoniano de Pauli (Z y ZZ) más el offset.',
    coste_distancia: 'Pieza de la distancia: suma d_ij · x(i,t) · x(j,t+1) para cada salto por un camino.',
    exactamente_uno: 'Ayuda genérica: agrega (1 − Σ x)², que vale 0 solo si exactamente un qubit está en 1.',
    un_lugar_por_tiempo: 'Restricción temporal: en cada tiempo, exactamente un lugar.',
    visitar_una_vez: 'Restricción espacial: cada lugar aparece exactamente una vez.',
    saltos_prohibidos: 'Castiga ir de i a j en tiempos seguidos cuando no hay camino entre ellos, y quedarse en el mismo lugar.',
    visitar_al_menos_una_vez: 'Restricción espacial con revisitas: cada lugar aparece 1 + s_i veces, con una holgura s_i ≥ 0.',
    bits_holgura: 'Cuántos bits necesita cada holgura para contar hasta T − N visitas extra.',
    holgura: 'Índice del qubit de holgura y(lugar, b), después de los N·T qubits de la ruta.',
    ruta_a_bits: 'Convierte una ruta (lugar en cada tiempo) en bits, con sus holguras.',
    empezar_en: 'Castiga no estar en el lugar indicado en el tiempo 1.',
    terminar_en: 'Castiga no estar en el lugar indicado en el último tiempo.',
    cerrar_camino: 'Castiga usar la arista i–j en cualquier sentido.',
    visitar_antes: 'Castiga visitar b antes que a.',
    sugerir_penalizacion: 'Propone un A mayor que cualquier ahorro que se consiga rompiendo una regla.',
    armar_hamiltoniano: 'Suma las piezas con su peso: el QUBO total.',
    resolver_exacto: 'Revisa todos los estados y devuelve los de menor energía: la referencia.',
    _entero_a_bits: 'Convierte el número de un estado en su lista de bits (bit k = qubit k).',
    ansatz: 'Arma el circuito: capas de RY(θ), cascada de CZ y una capa final de RY.',
    resolver_vqe: 'VQE: minimiza ⟨ψ(θ)|H|ψ(θ)⟩ con COBYLA desde varios arranques y lee el mejor estado.',
    bits_a_ruta: 'Traduce los bits a la ruta: el lugar activo en cada tiempo.',
    matriz_x: 'Ordena los bits como matriz lugares × tiempos.',
    desglose: 'Imprime el aporte de cada pieza para una solución.',
    dibujar_ruta: 'Dibuja el grafo y resalta la ruta.',
    pasar_por_en: 'Pieza propia de ejemplo: castiga no pasar por un lugar en un tiempo dado.',
    ParameterVector: 'Lista de parámetros simbólicos θ de Qiskit, que se reemplazan por números al evaluar.',
    QuantumCircuit: 'Circuito cuántico de Qiskit con n qubits.',
    ry: 'Compuerta RY(θ): gira el qubit entre |0⟩ y |1⟩ con amplitudes reales.',
    cz: 'Compuerta CZ: cambia el signo cuando los dos qubits están en |1⟩.',
    SparsePauliOp: 'Operador de Qiskit escrito como suma de productos de Pauli (aquí Z y ZZ).',
    from_sparse_list: 'Construye el SparsePauliOp a partir de (etiqueta, qubits, coeficiente).',
    Statevector: 'Simula el estado exacto del circuito (vector de 2ⁿ amplitudes).',
    expectation_value: 'Valor esperado ⟨ψ|H|ψ⟩ del operador en el estado.',
    probabilities: 'Probabilidad de medir cada estado de la base.',
    assign_parameters: 'Reemplaza los θ simbólicos por valores numéricos.',
    num_parameters: 'Cantidad de parámetros θ del circuito.',
    minimize: 'Optimizador de SciPy; aquí con el método COBYLA, sin gradientes.',
    default_rng: 'Generador de números aleatorios de NumPy con semilla fija.',
    uniform: 'Números al azar repartidos de forma pareja en un intervalo.',
    argsort: 'Índices que ordenan un arreglo de menor a mayor.',
    defaultdict: 'Diccionario que crea el valor 0.0 la primera vez que se usa una clave.',
    combinations: 'Todos los pares (sin repetir) de una lista.',
    Graph: 'Grafo de NetworkX.',
    add_weighted_edges_from: 'Agrega aristas con su peso (la distancia).',
    has_edge: '¿Existe la arista i–j?',
    asarray: 'Convierte una lista en arreglo de NumPy.',
    arange: 'Números consecutivos 0, 1, 2, …',
    full: 'Arreglo lleno con un mismo valor.',
    real: 'Parte real de un número complejo.',
    abs: 'Valor absoluto.',
    isclose: '¿Son iguales salvo errores de redondeo?',
    items: 'Pares (clave, valor) del diccionario.',
    values: 'Valores del diccionario.',
    append: 'Agrega un elemento al final de la lista.',
    __add__: 'Suma de dos QUBO: junta constantes, términos lineales y cuadráticos.',
    __mul__: 'Multiplica todo el QUBO por un número (el peso de la pieza).',
    __init__: 'Constructor: prepara el objeto al crearlo.',
    print: 'Muestra un texto en la salida.',
    range: 'Secuencia de enteros para recorrer.',
    len: 'Cantidad de elementos.',
    sum: 'Suma de los elementos.',
    min: 'El menor valor (con key, el que minimiza esa función).',
    max: 'El mayor valor.',
    float: 'Convierte a número decimal.',
    enumerate: 'Recorre dando la posición y el valor.',
    zip: 'Recorre dos listas a la vez.',
    sorted: 'Copia ordenada.',
    isinstance: '¿Es de este tipo?'
  };
  function descLinea(raw) {
    var l = raw.trim(), m, nota = '';
    if (!l) return '';
    var com = l.indexOf('#') > 0 && !/['"][^'"]*#/.test(l) ? l.slice(l.indexOf('#') + 1).trim() : '';
    if (l[0] === '#') return l.replace(/^#+\s*/, '').replace(/-{3,}/g, '').trim() || 'Comentario.';
    if (/^"""|"""$/.test(l)) return 'Documentación: ' + l.replace(/"""/g, '').trim();
    var base = '';
    if ((m = /^def (\w+)\((.*)\)\s*:/.exec(l))) base = 'Define la función ' + m[1] + '(' + m[2] + ')' + (GLOS[m[1]] ? ': ' + GLOS[m[1]] : '.');
    else if ((m = /^class (\w+)/.exec(l))) base = 'Define la clase ' + m[1] + (GLOS[m[1]] ? ': ' + GLOS[m[1]] : '.');
    else if ((m = /^return\s+(.+)/.exec(l))) base = 'Devuelve ' + m[1].replace(/\s*#.*$/, '') + '.';
    else if ((m = /^for (.+?) in (.+):/.exec(l))) base = 'Recorre cada ' + m[1] + ' en ' + m[2] + '.';
    else if ((m = /^if (.+):/.exec(l))) base = 'Si ' + m[1] + ', hace lo de abajo.';
    else if ((m = /^elif (.+):/.exec(l))) base = 'Si no, pero ' + m[1] + ', hace lo de abajo.';
    else if (/^else\s*:/.test(l)) base = 'En cualquier otro caso, hace lo de abajo.';
    else if (/^(import|from) /.test(l)) base = 'Importa ' + l.replace(/^from\s+/, '').replace(/\s+import\s+/, ': ') + '.';
    else if ((m = /^([\w\.\[\]\(\), ]+?)\s*(\+=|-=|\*=|=)\s*(.+)$/.exec(l)) && !/==/.test(m[2])) {
      var rhs = m[3].replace(/\s*#.*$/, '');
      base = m[2] === '+=' ? 'Suma ' + rhs + ' a ' + m[1] + '.' : m[2] === '-=' ? 'Resta ' + rhs + ' a ' + m[1] + '.' : 'Guarda en ' + m[1] + ': ' + rhs + '.';
    }
    else base = 'Ejecuta: ' + l.replace(/\s*#.*$/, '');
    // si la línea llama a algo conocido, se agrega qué hace
    if (!/^(def|class) /.test(l)) {
      var ids = l.replace(/#.*$/, '').match(/[A-Za-z_]\w*(?=\s*\()/g) || [];
      for (var i = 0; i < ids.length; i++) if (GLOS[ids[i]] && !/^(print|range|len|sum|min|max|float|enumerate|zip|sorted|isinstance|abs)$/.test(ids[i])) { nota = ids[i] + ': ' + GLOS[ids[i]]; break; }
    }
    return (com ? com.charAt(0).toUpperCase() + com.slice(1) + '. ' : '') + base + (nota ? ' — ' + nota : '');
  }

  function resaltar(linea, enCadena) {
    var out = '', i = 0, n = linea.length, previo = '', m;
    if (enCadena) {
      var fin = linea.indexOf('"""');
      if (fin < 0) return { html: '<span class="py-s">' + esc(linea) + '</span>', abierta: true };
      out += '<span class="py-s">' + esc(linea.slice(0, fin + 3)) + '</span>'; i = fin + 3;
    }
    while (i < n) {
      var c = linea[i], resto = linea.slice(i);
      if (c === '#') { out += '<span class="py-c">' + esc(resto) + '</span>'; break; }
      if (resto.indexOf('"""') === 0) {
        var f2 = linea.indexOf('"""', i + 3);
        if (f2 < 0) { out += '<span class="py-s">' + esc(resto) + '</span>'; return { html: out, abierta: true }; }
        out += '<span class="py-s">' + esc(linea.slice(i, f2 + 3)) + '</span>'; i = f2 + 3; continue;
      }
      if (c === '"' || c === "'") {
        var j = i + 1; while (j < n && linea[j] !== c) { if (linea[j] === '\\') j++; j++; }
        out += '<span class="py-s">' + esc(linea.slice(i, j + 1)) + '</span>'; i = j + 1; continue;
      }
      if ((m = /^\d+(\.\d+)?(e-?\d+)?/.exec(resto)) && !/\w/.test(linea[i - 1] || '')) { out += '<span class="py-n">' + m[0] + '</span>'; i += m[0].length; continue; }
      if ((m = /^[A-Za-z_θ]\w*/.exec(resto))) {
        var w = m[0];
        var pieza = KW.test(w) ? '<span class="py-k">' + w + '</span>' : (previo === 'def' || previo === 'class') ? '<span class="py-f">' + w + '</span>' : BI.test(w) ? '<span class="py-b">' + w + '</span>' : esc(w);
        out += GLOS.hasOwnProperty(w) && !KW.test(w) ? '<span class="py-id" data-g="' + w + '">' + pieza + '</span>' : pieza;
        previo = w; i += w.length; continue;
      }
      out += esc(c); if (c !== ' ') previo = ''; i++;
    }
    return { html: out, abierta: false };
  }
  function codigoHtml(src) {
    var abierta = false;
    return src.replace(/\n$/, '').split('\n').map(function (l) { var r = resaltar(l, abierta); abierta = r.abierta; var d = descLinea(l); return '<span class="nb-linea"' + (d ? ' data-l="' + esc(d).replace(/"/g, '&quot;') + '"' : '') + '>' + (r.html || ' ') + '</span>'; }).join('');
  }

  // ── dibujo del ejemplo ──
  var GX = 98, GY = 182, CW = 26, CH = 24;
  function celda(i, t) { return [GX + (t - 1) * CW, GY + (i - 1) * CH]; }
  function centro(i, t) { var c = celda(i, t); return [c[0] + CW / 2 - 1, c[1] + CH / 2 - 1]; }
  var semilla = 7;
  function azar() { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; }
  function el(tag, at, padre) { var n = document.createElementNS(NS, tag); for (var k in at) n.setAttribute(k, at[k]); padre.appendChild(n); return n; }
  function tx(padre, cls, x, y, s, html) { var n = el('text', { 'class': cls, x: x, y: y }, padre); if (html) n.innerHTML = s; else n.textContent = s; return n; }
  function entra(at, nuevo, d) { if (nuevo) { at['class'] = (at['class'] || '') + ' ent'; at.style = '--d:' + (d || 0) + 's'; } return at; }
  function trazo(at, nuevo, d) { if (nuevo) { at['class'] = (at['class'] || '') + ' ent-trazo'; at.pathLength = 1; at.style = '--d:' + (d || 0) + 's'; } return at; }
  function rutaGrafo(g, ruta, cls, nuevo) {
    for (var n = 1; n < ruta.length; n++) {
      var a = G[ruta[n - 1]], b = G[ruta[n]], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1, ox = -ey / l * 3, oy = ex / l * 3;
      var ok = hayCamino(ruta[n - 1], ruta[n]);
      el('line', trazo({ 'class': (ok ? cls : 'ej-salto'), x1: a[0] + ex / l * 13 + ox, y1: a[1] + ey / l * 13 + oy, x2: b[0] - ex / l * 15 + ox, y2: b[1] - ey / l * 15 + oy }, nuevo, n * .08), g);
    }
  }

  var DIBUJA = {
    grafo: function (g, nuevo, apagado) {
      if (apagado) g.setAttribute('opacity', '.22');
      ARISTAS.forEach(function (e, n) { el('line', trazo({ 'class': 'ej-arista', x1: G[e[0]][0], y1: G[e[0]][1], x2: G[e[1]][0], y2: G[e[1]][1] }, nuevo, n * .05), g); });
      for (var k = 1; k <= 8; k++) {
        var h = el('g', entra({}, nuevo, .25 + k * .04), g);
        el('circle', { 'class': 'ej-nodo', cx: G[k][0], cy: G[k][1], r: 11 }, h);
        tx(h, 'ej-nodo-t', G[k][0] - 1, G[k][1] + 4, 'x<tspan class="ej-sub" dy="2">' + k + '</tspan>', true);
      }
    },
    herramientas: function (g) {
      ['numpy', 'networkx', 'scipy', 'qiskit'].forEach(function (s, n) {
        var h = el('g', entra({}, true, n * .1), g);
        el('rect', { 'class': 'ej-chip', x: 30 + n * 102, y: 250, width: 90, height: 28, rx: 3 }, h);
        tx(h, 'ej-chip-t', 75 + n * 102, 269, s);
      });
    },
    malla: function (g, nuevo) {
      for (var t = 1; t <= T; t++) tx(g, 'ej-col', GX + (t - 1) * CW + CW / 2 - 1, GY - 5, 't' + t);
      for (var i = 1; i <= N; i++) {
        tx(g, 'ej-fila', GX - 6, GY + (i - 1) * CH + 15, 'x' + i);
        for (var t2 = 1; t2 <= T; t2++) {
          var c = celda(i, t2);
          el('rect', entra({ 'class': 'ej-celda', 'data-c': i + ',' + t2, x: c[0], y: c[1], width: CW - 3, height: CH - 3, rx: 2 }, nuevo, (i + t2) * .012), g);
        }
      }
    },
    camino: function (g, nuevo) {
      P.forEach(function (i, n) { var r = g.ownerSVGElement.querySelector('[data-c="' + i + ',' + (n + 1) + '"]'); if (r) r.setAttribute('class', 'ej-celda uno' + (nuevo ? ' ent' : '')); });
      rutaGrafo(g, P, 'ej-ruta', nuevo);
      tx(g, 'ej-nota', 446, GY - 16, 'un camino cualquiera').setAttribute('text-anchor', 'end');
    },
    expande: function (g) {
      var t = 1, x = GX - 3, y0 = GY - 2;
      el('rect', { 'class': 'ej-brk ent', x: x, y: y0, width: CW + 3, height: N * CH + 1, rx: 3 }, g);
      var n = 0;
      for (var a = 1; a <= N; a++) for (var b = a + 1; b <= N; b++) {
        var ca = centro(a, t), cb = centro(b, t), r = (cb[1] - ca[1]) / 2;
        el('path', trazo({ 'class': 'ej-par', d: 'M' + (ca[0] + 9) + ' ' + ca[1] + ' A' + r + ' ' + r + ' 0 0 1 ' + (cb[0] + 9) + ' ' + cb[1] }, true, (n++ % 14) * .05), g);
      }
      tx(g, 'ej-nota', GX + CW + 40, GY + N * CH + 14, '(1 − Σx)² → un término por par');
    },
    cupCamino: function (g) {
      for (var t = 1; t < T; t++) {
        var a = centro(P[t - 1], t), b = centro(P[t], t + 1), d = dist(P[t - 1], P[t]);
        el('line', trazo({ 'class': d != null ? 'ej-cup-c' : 'ej-cup-0', x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-width': d != null ? 1.5 + d * 2.4 : 1.4 }, true, t * .08), g);
      }
      tx(g, 'ej-nota', GX, GY + N * CH + 14, 'grosor ∝ distancia · el salto sin camino no suma aquí');
    },
    chequeoBasicas: function (g) {
      for (var t = 1; t <= T; t++) el('path', { 'class': 'ej-ok ent', d: 'M' + (GX + (t - 1) * CW + 7) + ' ' + (GY + N * CH + 6) + ' l3 3 l6 -7', style: '--d:' + t * .04 + 's' }, g);
      for (var i = 1; i <= N; i++) {
        var veces = P.filter(function (k) { return k === i; }).length, y = GY + (i - 1) * CH + 11;
        for (var v = 0; v < veces; v++) el('circle', { 'class': 'ej-vez ent' + (veces === 1 ? '' : ' mal'), cx: 18 + v * 9, cy: y, r: 3.2, style: '--d:' + (.4 + i * .05) + 's' }, g);
        if (!veces) el('circle', { 'class': 'ej-vez-0 ent', cx: 18, cy: y, r: 3.2, style: '--d:' + (.4 + i * .05) + 's' }, g);
      }
      for (var t2 = 1; t2 < T; t2++) if (!hayCamino(P[t2 - 1], P[t2])) {
        var a = centro(P[t2 - 1], t2), b = centro(P[t2], t2 + 1);
        el('line', trazo({ 'class': 'ej-cup-r', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }, true, .8), g);
      }
      tx(g, 'ej-nota', GX, GY + N * CH + 24, '✓ un lugar por tiempo · ● visitas por lugar · rojo: salto sin camino');
    },
    chequeoRevisitas: function (g) {
      for (var i = 1; i <= N; i++) {
        var veces = P.filter(function (k) { return k === i; }).length, y = GY + (i - 1) * CH + 11;
        for (var v = 0; v < veces; v++) el('circle', { 'class': 'ej-vez ent', cx: 18 + v * 9, cy: y, r: 3.2, style: '--d:' + (.2 + i * .05) + 's' }, g);
        if (!veces) el('circle', { 'class': 'ej-vez-0 ent', cx: 18, cy: y, r: 3.2, style: '--d:' + (.2 + i * .05) + 's' }, g);
      }
      tx(g, 'ej-nota', GX, GY + N * CH + 14, '● visitas por lugar: repetir está bien · x4 nunca aparece ✗');
    },
    rutaRef: function (g, nuevo) {
      RREF.forEach(function (i, n) { var r = g.ownerSVGElement.querySelector('[data-c="' + i + ',' + (n + 1) + '"]'); if (r) r.setAttribute('class', 'ej-celda uno' + (nuevo ? ' ent' : '')); });
      rutaGrafo(g, RREF, 'ej-ruta', nuevo);
      tx(g, 'ej-nota', 446, GY - 16, 'ruta de referencia · 7,314 km').setAttribute('text-anchor', 'end');
    },
    nucleo: function (g) {   // el núcleo 1, 2, 5, 8 y el cierre métrico 1–8
      [1, 2, 5, 8].forEach(function (k, n) { el('circle', { 'class': 'ej-nucleo ent', cx: G[k][0], cy: G[k][1], r: 15, style: '--d:' + n * .08 + 's' }, g); });
      el('line', trazo({ 'class': 'ej-cierre', x1: G[1][0], y1: G[1][1], x2: G[8][0], y2: G[8][1] }, true, .3), g);
      tx(g, 'ej-nota', (G[1][0] + G[8][0]) / 2, (G[1][1] + G[8][1]) / 2 + 14, 'd₁₈ = 2,7 (1 → 5 → 8)').setAttribute('text-anchor', 'middle');
      tx(g, 'ej-nota', 24, 172, 'núcleo: 1, 2, 5, 8 (16 qubits)');
      tx(g, 'ej-nota', 24, 188, 'hojas 3, 4, 6, 7: ida y vuelta fija = 1,614 km');
    },
    chequeoElegibles: function (g) {
      var s = celda(1, 1), f = celda(1, T), u = celda(P[T - 1], T);
      el('rect', { 'class': 'ej-marca bien ent', x: s[0] - 3, y: s[1] - 3, width: CW + 3, height: CH + 3, rx: 4 }, g);
      el('rect', { 'class': 'ej-marca mal ent', x: f[0] - 3, y: f[1] - 3, width: CW + 3, height: CH + 3, rx: 4, style: '--d:.3s' }, g);
      el('path', { 'class': 'ej-flechita ent', d: 'M' + (u[0] + 11) + ' ' + (u[1] + 2) + ' L' + (f[0] + 11) + ' ' + (f[1] + CH - 2), style: '--d:.5s' }, g);
      tx(g, 'ej-nota', GX, GY + N * CH + 14, 's = x1 en t1 ✓ · f = x1 en t13 ✗ (termina en x2)');
    },
    sumaPiezas: function (g) {
      var y = GY + N * CH + 8, x = GX, segs = [['coste', 'ej-seg-c', 18], ['visita', 'ej-seg-r', 120], ['salto', 'ej-seg-r', 60], ['fin', 'ej-seg-r', 60]];
      segs.forEach(function (s, n) {
        var h = el('g', entra({}, true, n * .15), g);
        el('rect', { 'class': s[1], x: x, y: y, width: s[2] - 2, height: 9 }, h);
        tx(h, 'ej-nota', x + (s[2] - 2) / 2, y + 21, s[0]).setAttribute('text-anchor', 'middle');
        x += s[2];
      });
    },
    spinsCamino: function (g) {
      for (var i = 1; i <= N; i++) for (var t = 1; t <= T; t++) {
        var c = centro(i, t), uno = P[t - 1] === i;
        el('path', { 'class': 'ej-spin' + (uno ? ' abajo' : ''), d: uno ? 'M' + c[0] + ' ' + (c[1] - 7) + ' V' + (c[1] + 7) + ' m-3 -4 l3 4 l3 -4' : 'M' + c[0] + ' ' + (c[1] + 7) + ' V' + (c[1] - 7) + ' m-3 4 l3 -4 l3 4' }, g);
      }
      tx(g, 'ej-nota', GX, GY + N * CH + 14, 'x = 1 → z = −1 (↓) · x = 0 → z = +1 (↑)');
    },
    // ── ansatz ──
    circuito: function (g, nuevo, foco) {
      var bandas = [[1, 'x1…x8 · t1'], [2, 't2'], [13, 't13']], y = 168, dy = 7.2, cab = [];
      var filas = [];
      bandas.forEach(function (b, bi) {
        if (bi === 2) { tx(g, 'ej-col', 28, y + 6, '⋮'); y += 16; }
        tx(g, 'ej-fila', 34, y + 4 * dy, b[1]).setAttribute('text-anchor', 'end');
        for (var q = 0; q < 8; q++) { filas.push({ y: y + q * dy, t: b[0], i: q + 1 }); }
        y += 8 * dy + 6;
      });
      filas.forEach(function (f, n) { el('line', trazo({ 'class': 'ej-cable', x1: 40, y1: f.y, x2: 446, y2: f.y }, nuevo, n * .01), g); });
      var h = el('g', entra({}, nuevo, .3), g);
      filas.forEach(function (f) {
        el('rect', { 'class': 'ej-ry' + (foco === 'ry1' || foco === 'ry' ? ' foco' : ''), x: 50, y: f.y - 2.8, width: 18, height: 5.6 }, h);
        el('rect', { 'class': 'ej-ry' + (foco === 'ry2' || foco === 'ry' ? ' foco' : ''), x: 414, y: f.y - 2.8, width: 18, height: 5.6 }, h);
      });
      for (var n = 0; n < filas.length - 1; n++) {
        var a = filas[n], b = filas[n + 1], x = 84 + n * 13.4, salto = a.t !== b.t;
        var cls = 'ej-cz' + (foco === 'cz' || foco === 'cadena' ? ' foco' : '') + (foco === 'cadena' && salto ? ' salto-t' : '');
        if (salto && b.t === 13) { el('line', { 'class': cls + ' punteada', x1: x, y1: a.y, x2: x, y2: b.y }, h); continue; }
        el('line', { 'class': cls, x1: x, y1: a.y, x2: x, y2: b.y }, h);
        el('circle', { 'class': 'ej-czp' + (foco === 'cz' || foco === 'cadena' ? ' foco' : ''), cx: x, cy: a.y, r: 1.9 }, h);
        el('circle', { 'class': 'ej-czp' + (foco === 'cz' || foco === 'cadena' ? ' foco' : ''), cx: x, cy: b.y, r: 1.9 }, h);
      }
      if (foco === 'cadena') {
        tx(g, 'ej-nota', 200, 160, 'mismo t: x1 → x2 → … → x8');
        var sal = filas[7], x2 = 84 + 7 * 13.4;
        tx(g, 'ej-nota foco', x2 + 8, sal.y + 6, '← de t a t + 1');
      }
      tx(g, 'ej-col', 59, 163, 'RY'); tx(g, 'ej-col', 423, 163, 'RY');
    },
    bloch: function (g) {
      var cx = 120, cy = 82, r = 52, h = el('g', { 'class': 'ent' }, g);
      el('circle', { 'class': 'ej-bloch', cx: cx, cy: cy, r: r }, h);
      el('line', { 'class': 'ej-bloch-eje', x1: cx, y1: cy - r - 6, x2: cx, y2: cy + r + 6 }, h);
      tx(h, 'ej-nota', cx, cy - r - 9, '|0⟩').setAttribute('text-anchor', 'middle');
      tx(h, 'ej-nota', cx, cy + r + 16, '|1⟩').setAttribute('text-anchor', 'middle');
      el('line', { 'class': 'ej-vector', x1: cx, y1: cy, x2: cx, y2: cy - r }, h);
      el('ellipse', { 'class': 'ej-fase', cx: 330, cy: 46, rx: 40, ry: 10 }, h);
      el('line', { 'class': 'ej-bloch-eje', x1: 330, y1: 20, x2: 330, y2: 96 }, h);
      el('line', { 'class': 'ej-vector gris', x1: 330, y1: 46, x2: 330, y2: 20 }, h);
      tx(h, 'ej-nota', 330, 116, 'RZ sobre |0⟩: misma probabilidad').setAttribute('text-anchor', 'middle');
      tx(h, 'ej-nota foco', cx + r + 12, cy + 4, 'RY(θ)');
    },
    plano: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      el('rect', { 'class': 'ej-plano', x: 70, y: 22, width: 320, height: 110, rx: 4 }, h);
      tx(h, 'ej-nota', 230, 40, 'estados de amplitudes reales').setAttribute('text-anchor', 'middle');
      semilla = 3;
      for (var n = 0; n < 9; n++) { var x = 100 + azar() * 260, y = 56 + azar() * 66; el('circle', { 'class': 'ej-pto', cx: x, cy: y, r: 3 }, h); }
      tx(h, 'ej-nota foco', 230, 150, 'RY y CZ no salen de aquí').setAttribute('text-anchor', 'middle');
    },
    acoples: function (g) {
      var h = el('g', { 'class': 'ent' }, g), ox = 70, oy = 24, c = 30;
      for (var i = 0; i < 4; i++) for (var t = 0; t < 4; t++) el('rect', { 'class': 'ej-celda', x: ox + t * c, y: oy + i * 26, width: 24, height: 20, rx: 2 }, h);
      el('rect', { 'class': 'ej-brk', x: ox + c - 3, y: oy - 3, width: 30, height: 108, rx: 3 }, h);
      el('rect', { 'class': 'ej-brk verde', x: ox - 3, y: oy + 26 - 3, width: 4 * c + 2, height: 26, rx: 3 }, h);
      el('line', { 'class': 'ej-cup-c', x1: ox + 2 * c + 12, y1: oy + 10, x2: ox + 3 * c + 12, y2: oy + 62, 'stroke-width': 2 }, h);
      tx(h, 'ej-nota', 230, oy + 20, 'mismo t · uno solo');
      tx(h, 'ej-nota', 230, oy + 46, 'mismo lugar · una vez');
      tx(h, 'ej-nota', 230, oy + 72, 't → t + 1 · distancia');
      tx(h, 'ej-nota', 70, 146, '(se muestra un trozo de la matriz x)');
    },
    orden: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      var lab = ['x1,t1', 'x2,t1', '…', 'x8,t1', 'x1,t2', 'x2,t2', '…'];
      lab.forEach(function (s, n) {
        var x = 26 + n * 60;
        if (s !== '…') { el('rect', { 'class': 'ej-caja' + (n === 3 || n === 4 ? ' foco' : ''), x: x, y: 50, width: 50, height: 26, rx: 3 }, h); tx(h, 'ej-chip-t chico', x + 25, 68, s); }
        else tx(h, 'ej-chip-t', x + 25, 68, '…');
        if (n < lab.length - 1) el('line', { 'class': 'ej-cz foco', x1: x + 50, y1: 63, x2: x + 60, y2: 63 }, h);
      });
      tx(h, 'ej-nota', 26, 34, 'k = (t − 1)N + i');
      tx(h, 'ej-nota foco', 206, 102, 'aquí la cadena pasa de t1 a t2');
    },
    diag: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      tx(h, 'ej-chip-t', 120, 40, 'CZ =');
      var M = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, -1]];
      M.forEach(function (fila, r) { fila.forEach(function (v, c) { tx(h, 'ej-chip-t' + (r === c ? ' foco' : ''), 170 + c * 30, 30 + r * 22, String(v)); }); });
      el('path', { 'class': 'ej-bloch-eje', d: 'M156 14 v86 M262 14 v86' }, h);
      tx(h, 'ej-nota', 230, 126, 'diagonal: no mueve probabilidades').setAttribute('text-anchor', 'middle');
    },
    tamano: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      [['128', 'qubits = 8 × 13 + 24'], ['256', 'parámetros θ'], ['127', 'compuertas CZ']].forEach(function (z, n) {
        var x = 80 + n * 150; tx(h, 'ej-grande', x, 70, z[0]); tx(h, 'ej-nota', x, 94, z[1]).setAttribute('text-anchor', 'middle');
      });
    },
    // ── solver y validación ──
    chip: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      el('rect', { 'class': 'ej-chip', x: 300, y: 18, width: 140, height: 40, rx: 4 }, h);
      tx(h, 'ej-chip-t', 370, 43, 'Ĥ = H / máx');
    },
    thetas: function (g) { for (var k = 0; k < 6; k++) el('path', { 'class': 'ej-theta', d: 'M52 ' + (168 + k * 7.2 * 3) + ' a6 6 0 0 1 12 0', style: 'animation-delay:-' + (k * .1) + 's' }, g); },
    medidor: function (g) {
      var h = el('g', { 'class': 'ent' }, g);
      el('path', { 'class': 'ej-medidor', d: 'M326 92 A44 44 0 0 1 414 92' }, h);
      el('line', { 'class': 'ej-aguja', x1: 370, y1: 92, x2: 370, y2: 56 }, h);
      tx(h, 'ej-chip-t', 370, 114, '⟨Ĥ⟩');
    },
    curvas: function (g) {
      el('line', { 'class': 'ej-eje', x1: 40, y1: 170, x2: 40, y2: 380 }, g); el('line', { 'class': 'ej-eje', x1: 40, y1: 380, x2: 440, y2: 380 }, g);
      tx(g, 'ej-nota', 240, 396, 'iteraciones').setAttribute('text-anchor', 'middle');
      semilla = 5; var fins = [], ds = [];
      for (var c = 0; c < 6; c++) { var y = 180 + azar() * 40, fin = 290 + azar() * 80, d = 'M42 ' + y.toFixed(1); for (var x = 50; x <= 438; x += 8) { y += (fin - y) * .1 + (azar() - .5) * 10; d += ' L' + x + ' ' + y.toFixed(1); } fins.push(fin); ds.push(d); }
      var mejor = fins.indexOf(Math.max.apply(null, fins));
      ds.forEach(function (d, c) { el('path', { 'class': 'ej-curva ent-trazo' + (c === mejor ? ' mejor' : ''), pathLength: 1, d: d, style: '--d:' + c * .3 + 's' }, g); });
    },
    histo: function (g, nuevo) {
      semilla = 17; el('line', { 'class': 'ej-eje', x1: 36, y1: 380, x2: 440, y2: 380 }, g);
      for (var b = 0; b < 34; b++) { var hg = b === 22 ? 160 : b === 9 ? 90 : 4 + azar() * azar() * 50; el('rect', entra({ 'class': 'ej-barra', 'data-b': b, x: 40 + b * 11.8, y: 380 - hg, width: 8.6, height: hg }, nuevo, b * .015), g); }
      tx(g, 'ej-nota', 240, 396, 'probabilidad de cada estado').setAttribute('text-anchor', 'middle');
    },
    histoSel: function (g) { var r = g.ownerSVGElement.querySelector('[data-b="22"]'); if (r) r.setAttribute('class', 'ej-barra sel'); el('circle', { 'class': 'ej-anillo ent', cx: 40 + 22 * 11.8 + 4.3, cy: 208, r: 9 }, g); },
    bitsFila: function (g) {
      for (var k = 0; k < 52; k++) el('rect', { 'class': 'ej-bit ent' + ([0, 12, 22, 30, 37, 44].indexOf(k) >= 0 ? ' uno' : ''), x: 34 + (k % 26) * 15.6, y: 300 + Math.floor(k / 26) * 16, width: 12, height: 12, style: '--d:' + k * .01 + 's' }, g);
      tx(g, 'ej-nota', 34, 350, '… los 128 bits del estado elegido');
    },
    puntos: function (g) {
      semilla = 31; var es = []; for (var p = 0; p < 64; p++) es.push(azar()); es.sort();
      el('line', { 'class': 'ej-eje', x1: 36, y1: 380, x2: 440, y2: 380 }, g);
      es.forEach(function (v, p) { el('circle', { 'class': 'ej-punto ent' + (p === 0 ? ' min' : ''), cx: 44 + p * 6.1, cy: 374 - v * 170, r: p === 0 ? 4 : 2.4, style: '--d:' + p * .015 + 's' }, g); });
      tx(g, 'ej-nota', 240, 396, 'los 2ⁿ estados, ordenados por energía').setAttribute('text-anchor', 'middle');
    },
    piezas: function (g) {
      [['coste', 'c', 40], ['un lugar por tiempo', 'ok', 0], ['visitar al menos una vez', 'r', 100], ['saltos prohibidos', 'r', 100], ['empezar en x1', 'ok', 0], ['terminar en x1', 'r', 100]].forEach(function (p, n) {
        var y = 180 + n * 32, h = el('g', entra({}, true, n * .1), g);
        tx(h, 'ej-nota', 150, y + 12, p[0]).setAttribute('text-anchor', 'end');
        if (p[2]) el('rect', { 'class': p[1] === 'c' ? 'ej-seg-c' : 'ej-seg-r', x: 160, y: y, width: p[2], height: 14 }, h);
        else el('path', { 'class': 'ej-ok', d: 'M164 ' + (y + 7) + ' l4 4 l9 -10' }, h);
      });
      tx(g, 'ej-nota', 160, 386, 'aporte de cada pieza para el camino');
    },
    comparar: function (g) {
      [[90, 'VQE'], [300, 'exacto']].forEach(function (z, n) {
        var h = el('g', entra({}, true, n * .2), g);
        el('rect', { 'class': 'ej-seg-c', x: z[0], y: 240, width: 60, height: 110 }, h);
        tx(h, 'ej-nota', z[0] + 30, 372, z[1]).setAttribute('text-anchor', 'middle');
      });
      var h2 = el('g', entra({}, true, .5), g);
      tx(h2, 'ej-igual', 240, 306, '=?');
      tx(g, 'ej-nota', 240, 392, 'energía de cada método').setAttribute('text-anchor', 'middle');
    }
  };

  // qué se ve en cada bloque (en Inicializar: solo la acción de esa función)
  var CAPAS = {
    datos: ['grafo'], libs: ['grafo', 'herramientas'], problema: ['grafo', 'malla', 'camino'], instancia: ['grafo'],
    revisitas: ['grafo', 'malla', 'camino', 'chequeoRevisitas'], por7: ['circuito', 'tamano'], referencia: ['grafo', 'malla', 'rutaRef'],
    qubo: ['grafo', 'malla', 'camino', 'expande'], coste: ['grafo', 'malla', 'camino', 'cupCamino'],
    basicas: ['grafo', 'malla', 'camino', 'chequeoBasicas'], elegibles: ['grafo', 'malla', 'camino', 'chequeoElegibles'],
    armar: ['grafo', 'malla', 'camino', 'sumaPiezas'], ising: ['grafo', 'malla', 'spinsCamino'],
    ansatzc: [['grafo', 1], 'circuito'], por1: [['circuito', 'ry1'], 'bloch'], por2: [['circuito', 'ry'], 'plano'], por3: [['circuito', 'cz'], 'acoples'],
    por4: [['circuito', 'cadena'], 'orden'], por5: [['circuito', 'ry2'], 'diag'], por6: ['circuito', 'tamano'],
    vqe1: [['grafo', 1], 'circuito', 'chip'], vqe2: ['circuito', 'thetas', 'medidor'], vqe3: [['grafo', 1], 'curvas'], vqe4: [['grafo', 1], 'histo'],
    correr: [['grafo', 1], 'histo', 'histoSel', 'bitsFila'], exacto: [['grafo', 1], 'puntos'], lectura: ['grafo', 'malla', 'camino'],
    desglose: [['grafo', 1], 'piezas'], compara: [['grafo', 1], 'comparar'],
    reduccion: ['grafo', 'nucleo'], cierre: ['grafo', 'nucleo'], exactored: [['grafo', 1], 'puntos'], cerrada: ['grafo', 'nucleo'],
    vqered: [['grafo', 1], 'curvas'], expandir: ['grafo', 'malla', 'rutaRef']
  };
  function dibujarEjemplo(svg, clave, previas) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var defs = el('defs', {}, svg);
    [['ej-flecha', 'ej-punta'], ['ej-flecha-r', 'ej-punta-r']].forEach(function (m) {
      var mk = el('marker', { id: m[0], viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '5', markerHeight: '5', orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0 0 L10 5 L0 10 z', 'class': m[1] }, mk);
    });
    var nombres = [];
    (CAPAS[clave] || ['grafo']).forEach(function (c) {
      var nom = Array.isArray(c) ? c[0] : c, arg = Array.isArray(c) ? c[1] : null;
      nombres.push(nom);
      var g = el('g', { 'data-capa': nom }, svg);
      DIBUJA[nom](g, previas.indexOf(nom) < 0 && !quieto, arg);
    });
    if (quieto) Array.prototype.forEach.call(svg.querySelectorAll('.ent, .ent-trazo'), function (n) { n.classList.remove('ent'); n.classList.remove('ent-trazo'); });
    return nombres;
  }

  // ── el cuadro de ayuda: sobre una función o llamada, qué hace; sobre una línea, qué hace esa línea ──
  var tip = null;
  function mostrarTip(ev) {
    var id = ev.target.closest && ev.target.closest('.py-id'), ln = ev.target.closest && ev.target.closest('.nb-linea');
    if (!id && !(ln && ln.getAttribute('data-l'))) { if (tip) tip.hidden = true; return; }
    if (!tip) { tip = document.createElement('div'); tip.className = 'nb-tip'; document.body.appendChild(tip); }
    if (id) { var w = id.getAttribute('data-g'); tip.innerHTML = '<b>' + w + '</b>' + GLOS[w]; }
    else tip.innerHTML = '<span class="nb-tip-l">línea</span>' + ln.getAttribute('data-l');
    tip.hidden = false;
    var x = ev.clientX + 16, y = ev.clientY + 18, r = tip.getBoundingClientRect();
    if (x + r.width > window.innerWidth - 10) x = window.innerWidth - r.width - 10;
    if (y + r.height > window.innerHeight - 10) y = ev.clientY - r.height - 12;
    tip.style.left = x + 'px'; tip.style.top = y + 'px';
  }
  document.addEventListener('mousemove', function (ev) { if (ev.target.closest && ev.target.closest('.nb-codigo')) mostrarTip(ev); else if (tip && !tip.hidden) tip.hidden = true; }, { passive: true });
  document.addEventListener('scroll', function () { if (tip) tip.hidden = true; }, { passive: true, capture: true });

  // ── montar el cuaderno ──
  window.montarCuaderno = function (raiz, etapa) {
    var nb = document.querySelector('.nb[data-nb="' + etapa + '"]');
    var celdas = (window.CELDAS || {})[etapa];
    if (!nb || !celdas || nb.childElementCount) return;
    var orden = ['inicializar', 'ansatz', 'solver', 'validacion', 'resultado'], base = 0;
    for (var o = 0; o < orden.indexOf(etapa); o++) base += window.CELDAS[orden[o]].filter(function (c) { return c.tipo !== 'md'; }).length;
    var col = document.createElement('div'); col.className = 'nb-celdas';
    var nIn = 0;
    celdas.forEach(function (c) {
      var ex = EXPLICA[c.id] || {};
      var art = document.createElement('article');
      art.className = 'nb-celda' + (c.clave ? ' clave' : '') + (c.tipo === 'md' ? ' md' : '');
      art.setAttribute('data-celda', c.id); art.id = 'celda-' + c.id;
      if (c.tipo === 'md') {
        art.innerHTML = '<div class="nb-cab"><span class="nb-in">Md</span><span class="nb-tit">' + c.titulo + '</span></div><div class="nb-md"><p>' + c.codigo + '</p></div>';
      } else {
        nIn++;
        art.innerHTML = '<div class="nb-cab"><span class="nb-in">In [' + (base + nIn) + ']:</span><span class="nb-tit">' + c.titulo + '</span>' +
          (c.clave ? '<span class="nb-clave">clave</span>' : '') + '<button type="button" class="nb-copiar">copiar</button></div>' +
          '<pre class="nb-codigo"><code>' + codigoHtml(c.codigo) + '</code></pre><div class="nb-texto-movil">' + (ex.t || '') + '</div>';
        art.querySelector('.nb-copiar').addEventListener('click', function (ev) {
          ev.stopPropagation(); var b = ev.currentTarget;
          (navigator.clipboard ? navigator.clipboard.writeText(c.codigo) : Promise.reject()).then(function () { b.textContent = 'copiado'; }, function () { b.textContent = 'no se pudo'; });
          setTimeout(function () { b.textContent = 'copiar'; }, 1400);
        });
      }
      art.querySelector('.nb-cab').addEventListener('click', function () { activar(c.id, true); });
      col.appendChild(art);
    });
    var lado = document.createElement('aside'); lado.className = 'nb-lado';
    lado.innerHTML = '<div class="nb-ej-cab"><span class="nb-ej-rot">Red minera · ' + (etapa === 'inicializar' ? 'acción del bloque' : 'en este bloque') + '</span><span class="nb-ej-paso"></span></div>' +
      '<svg class="nb-ej" viewBox="0 0 460 400" role="img" aria-label="La red minera en este bloque del código"></svg><div class="nb-exp"></div>';
    // celdas y ejemplo en su propia grilla: así el ejemplo fijo no se monta sobre las matrices
    var grilla = document.createElement('div'); grilla.className = 'nb-grilla';
    grilla.appendChild(col); grilla.appendChild(lado); nb.appendChild(grilla);
    if (etapa === 'ansatz' && window.montarAnsatzMat) {
      var az = document.createElement('section'); az.className = 'nb-deriva nb-ansatz-mat'; az.id = 'celda-ansatz-mat';
      nb.appendChild(az); window.montarAnsatzMat(az);
    }
    if (etapa === 'resultado' && window.montarResultadoMat) {
      var rs = document.createElement('section'); rs.className = 'nb-deriva nb-resultado-mat'; rs.id = 'celda-resultado-mat';
      nb.appendChild(rs); window.montarResultadoMat(rs);
    }
    if (etapa === 'solver' && window.montarVQEMat) {
      var vq = document.createElement('section'); vq.className = 'nb-deriva nb-ansatz-mat'; vq.id = 'celda-vqe-mat';
      nb.appendChild(vq); window.montarVQEMat(vq);
    }
    // primero la demostración, de corrido, y al final las matrices de la red
    if (etapa === 'inicializar' && window.montarDerivacion) {
      var dv = document.createElement('section'); dv.className = 'nb-deriva'; dv.id = 'celda-derivacion';
      nb.appendChild(dv); window.montarDerivacion(dv);
    }
    if (etapa === 'inicializar' && window.montarComprobador) {
      var cp = document.createElement('section'); cp.className = 'nb-comprueba'; cp.id = 'celda-comprueba';
      nb.appendChild(cp); window.montarComprobador(cp);
    }
    if (etapa === 'inicializar' && window.montarMatrices) {
      var mat = document.createElement('section'); mat.className = 'nb-matrices'; mat.id = 'celda-matrices';
      nb.appendChild(mat); window.montarMatrices(mat);
    }
    var svg = lado.querySelector('.nb-ej'), exp = lado.querySelector('.nb-exp'), paso = lado.querySelector('.nb-ej-paso');
    var previas = [], actual = null, fijo = 0;
    var indice = document.querySelector('.sol-indice[data-indice="' + etapa + '"]');
    if (indice) {
      indice.innerHTML = '';
      celdas.forEach(function (c) {
        var li = document.createElement('li'), b = document.createElement('button');
        b.type = 'button'; b.textContent = c.titulo.replace(/<[^>]+>/g, ''); b.setAttribute('data-ir', c.id); if (c.clave) b.className = 'clave';
        b.addEventListener('click', function () { activar(c.id, true); });
        li.appendChild(b); indice.appendChild(li);
      });
      if (etapa === 'inicializar') {
        var li3 = document.createElement('li'), b3 = document.createElement('button');
        b3.type = 'button'; b3.textContent = 'Del QUBO al Ising, paso a paso'; b3.className = 'clave';
        b3.addEventListener('click', function () { document.getElementById('celda-derivacion').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' }); });
        li3.appendChild(b3); indice.appendChild(li3);
        var li2 = document.createElement('li'), b2 = document.createElement('button');
        b2.type = 'button'; b2.textContent = 'Matrices explícitas J y h'; b2.className = 'clave';
        b2.addEventListener('click', function () { document.getElementById('celda-matrices').scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'start' }); });
        li2.appendChild(b2); indice.appendChild(li2);
      }
    }
    function activar(id, ir) {
      var c = celdas.filter(function (x) { return x.id === id; })[0]; if (!c) return;
      if (id !== actual) {
        actual = id;
        Array.prototype.forEach.call(col.children, function (a) { a.classList.toggle('activa', a.getAttribute('data-celda') === id); });
        if (indice) Array.prototype.forEach.call(indice.querySelectorAll('button[data-ir]'), function (b) { b.classList.toggle('activa', b.getAttribute('data-ir') === id); });
        previas = dibujarEjemplo(svg, id, previas);
        var ex = EXPLICA[id] || {};
        exp.classList.remove('cambia'); void exp.offsetWidth; exp.classList.add('cambia');
        exp.innerHTML = c.tipo === 'md'
          ? '<p class="nb-exp-txt">' + (ex.c || '') + '</p>'
          : '<h4 class="nb-exp-tit">' + c.titulo + '</h4><p class="nb-exp-txt">' + (ex.t || '') + '</p>' + (ex.f || []).map(function (f) { return '<div class="nb-exp-f">' + f + '</div>'; }).join('');
        paso.textContent = (celdas.indexOf(c) + 1) + ' / ' + celdas.length;
      }
      if (ir) {
        fijo = Date.now() + 1100;
        var art = document.getElementById('celda-' + id);
        if (art) art.scrollIntoView({ behavior: quieto ? 'auto' : 'smooth', block: 'center' });
      }
    }
    function revisar() {
      if (Date.now() < fijo) return;
      var mejor = null, d0 = Infinity, medio = window.innerHeight * .45;
      Array.prototype.forEach.call(col.children, function (a) {
        var r = a.getBoundingClientRect();
        if (r.bottom < 80 || r.top > window.innerHeight) return;
        var d = Math.abs((r.top + Math.min(r.height, 260) / 2) - medio);
        if (d < d0) { d0 = d; mejor = a; }
      });
      if (mejor) activar(mejor.getAttribute('data-celda'), false);
    }
    var pend = false;
    window.addEventListener('scroll', function () { if (pend) return; pend = true; requestAnimationFrame(function () { pend = false; if (nb.isConnected) revisar(); }); }, { passive: true });
    activar(celdas[0].id, false);
  };

  // ── las matrices explícitas: el mismo armado del cuaderno, en el navegador ──
  // QUBO → Ising con x = (1 − z)/2: h_k y J_kl son los coeficientes de z_k y z_k z_l.
  var CASOS = {
    red: { nombre: 'Red minera · 8 lugares', nodos: [1, 2, 3, 4, 5, 6, 7, 8], aristas: ARISTAS, T: 13, nom: function (i) { return 'x' + i; } },
    tri: { nombre: 'Triángulo · 3 lugares (control)', nodos: [1, 2, 3], aristas: [[1, 2, 5], [2, 3, 7], [3, 1, 9]], T: 3, nom: function (i) { return 'x' + i; } }
  };
  function bitsHolgura(T2, Nn) { var v = Math.abs(T2 - Nn); return Math.max(1, v ? v.toString(2).length : 0); }
  function construir(cs, T2, A, B, piezas) {
    var Nn = cs.nodos.length, nRuta = Nn * T2, m = piezas.visita1 ? bitsHolgura(T2, Nn) : 0, n = nRuta + Nn * m;
    function q(i, t) { return (t - 1) * Nn + cs.nodos.indexOf(i); }
    function dd(i, j) { var e = cs.aristas.filter(function (e) { return (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i); })[0]; return e ? e[2] : null; }
    var c = 0, lin = new Float64Array(n), quad = {};
    function cuad(k, l, v) { if (k === l) { lin[k] += v; return; } var a = Math.min(k, l), b = Math.max(k, l), key = a * n + b; quad[key] = (quad[key] || 0) + v; }
    function cuadrado(ks, peso) { c += peso; ks.forEach(function (k) { lin[k] += peso * (1 - 2); }); for (var x = 0; x < ks.length; x++) for (var y = x + 1; y < ks.length; y++) cuad(ks[x], ks[y], 2 * peso); }
    // peso · (c0 + Σ a_k x_k)², como QUBO.agregar_cuadrado
    function cuadradoGen(ks, as, c0, peso) { c += peso * c0 * c0; ks.forEach(function (k, x) { lin[k] += peso * (as[x] * as[x] + 2 * c0 * as[x]); }); for (var x = 0; x < ks.length; x++) for (var y = x + 1; y < ks.length; y++) cuad(ks[x], ks[y], 2 * peso * as[x] * as[y]); }
    var t, i, j;
    if (piezas.coste) for (t = 1; t < T2; t++) cs.nodos.forEach(function (i) { cs.nodos.forEach(function (j) { var d = dd(i, j); if (i !== j && d != null) cuad(q(i, t), q(j, t + 1), B * d); }); });
    if (piezas.lugar) for (t = 1; t <= T2; t++) cuadrado(cs.nodos.map(function (i) { return q(i, t); }), A);
    if (piezas.visita) cs.nodos.forEach(function (i) { var ks = []; for (var t3 = 1; t3 <= T2; t3++) ks.push(q(i, t3)); cuadrado(ks, A); });
    if (piezas.visita1) cs.nodos.forEach(function (i, p) {
      var ks = [], as = [];
      for (var t4 = 1; t4 <= T2; t4++) { ks.push(q(i, t4)); as.push(1); }
      for (var b4 = 0; b4 < m; b4++) { ks.push(nRuta + p * m + b4); as.push(-Math.pow(2, b4)); }
      cuadradoGen(ks, as, -1, A);
    });
    if (piezas.saltos) for (t = 1; t < T2; t++) cs.nodos.forEach(function (i) { cs.nodos.forEach(function (j) { if (i === j || dd(i, j) == null) cuad(q(i, t), q(j, t + 1), A); }); });
    if (piezas.inicio) { c += A; lin[q(cs.nodos[0], 1)] -= A; }
    if (piezas.fin) { c += A; lin[q(cs.nodos[0], T2)] -= A; }
    // a Ising, igual que QUBO.a_ising()
    var h = new Float64Array(n), J = new Float64Array(n * n), off = c;
    for (var k = 0; k < n; k++) { off += lin[k] / 2; h[k] -= lin[k] / 2; }
    Object.keys(quad).forEach(function (key) {
      var v = quad[key], a = Math.floor(key / n), b = key % n;
      off += v / 4; h[a] -= v / 4; h[b] -= v / 4; J[a * n + b] += v / 4; J[b * n + a] += v / 4;
    });
    return { n: n, nRuta: nRuta, m: m, N: Nn, T: T2, h: h, J: J, off: off, q: q };
  }
  function fmt(v) { return (Math.abs(v) < 5e-13 ? 0 : v).toLocaleString('es-ES', { minimumFractionDigits: 3, maximumFractionDigits: 3 }); }

  window.montarMatrices = function (caja) {
    caja.innerHTML =
      '<div class="mx-cab"><div class="mx-kicker">In [·] · construcción explícita</div><h3 class="mx-tit">Las matrices del Hamiltoniano</h3>' +
      '<div class="mx-formula">H = Σ<sub>k&lt;l</sub> J<sub>kl</sub> z<sub>k</sub> z<sub>l</sub> + Σ<sub>k</sub> h<sub>k</sub> z<sub>k</sub> + c &nbsp;·&nbsp; z<sub>k</sub> → z<sub>i,t</sub></div>' +
      '<p class="mx-nota">Se arma con las mismas piezas del cuaderno y el cambio x = (1 − z)/2. J es simétrica: cada par aparece dos veces en la matriz y se cuenta una vez en la suma.</p></div>' +
      '<div class="mx-controles">' +
      '<label>Caso <select data-mx="caso"><option value="tri">Triángulo · 3 lugares</option><option value="red">Red minera · 8 lugares</option></select></label>' +
      '<label>T <select data-mx="T"></select></label>' +
      '<label>A <input type="number" data-mx="A" value="100" min="0" step="10"></label>' +
      '<label>B <input type="number" data-mx="B" value="1" min="0" step="0.5"></label>' +
      '<label>Orden <select data-mx="orden"><option value="lugar">por lugar: z<sub>i,t</sub> con i fijo</option><option value="tiempo">por tiempo: como el cuaderno</option></select></label>' +
      '<div class="mx-piezas">' + [['coste', 'coste_distancia'], ['lugar', 'un_lugar_por_tiempo'], ['visita', 'visitar_una_vez'], ['visita1', 'visitar_al_menos_una_vez'], ['saltos', 'saltos_prohibidos'], ['inicio', 'empezar_en(1)'], ['fin', 'terminar_en(1)']].map(function (p) {
        return '<label class="mx-pieza"><input type="checkbox" data-pieza="' + p[0] + '" checked> ' + p[1] + '</label>';
      }).join('') + '</div></div>' +
      '<div class="mx-resumen" data-mx="resumen"></div>' +
      '<div class="mx-cuerpo"><div class="mx-bloque mx-z"><div class="mx-rot">z</div><div data-mx="z"></div></div>' +
      '<div class="mx-bloque mx-j"><div class="mx-rot">J<sub>kl</sub></div><div class="mx-j-caja" data-mx="J"></div></div>' +
      '<div class="mx-bloque mx-h"><div class="mx-rot">h<sub>k</sub></div><div data-mx="h"></div></div></div>' +
      '<div class="mx-pie"><button type="button" class="nb-copiar" data-mx="numeros">ver todos los números de J</button><button type="button" class="nb-copiar" data-mx="csv">descargar J y h (CSV)</button></div>' +
      '<div class="mx-tabla" data-mx="tabla" hidden></div><div class="mx-tip" data-mx="tip" hidden></div>';
    function $(k) { return caja.querySelector('[data-mx="' + k + '"]'); }
    var selT = $('T'); for (var t = 2; t <= 16; t++) selT.insertAdjacentHTML('beforeend', '<option' + (t === 13 ? ' selected' : '') + '>' + t + '</option>');
    var R = null, perm = [];
    // las holguras y(i,b) van después de los N·T qubits de la ruta
    function etiqueta(k) { var cs = CASOS[$('caso').value]; if (k >= R.nRuta) return 'y<sub>' + cs.nodos[Math.floor((k - R.nRuta) / R.m)] + ',' + ((k - R.nRuta) % R.m) + '</sub>'; return 'z<sub>' + cs.nodos[k % R.N] + ',' + (Math.floor(k / R.N) + 1) + '</sub>'; }
    function texto(k) { var cs = CASOS[$('caso').value]; if (k >= R.nRuta) return 'y' + cs.nodos[Math.floor((k - R.nRuta) / R.m)] + ',' + ((k - R.nRuta) % R.m); return 'z' + cs.nodos[k % R.N] + ',' + (Math.floor(k / R.N) + 1); }
    function calcular() {
      var cs = CASOS[$('caso').value];
      if ($('caso').value === 'tri') { selT.value = '3'; selT.disabled = true; }
      else { if (selT.disabled) selT.value = '13'; selT.disabled = false; }   // al volver del triángulo, T de la red
      var piezas = {}; Array.prototype.forEach.call(caja.querySelectorAll('[data-pieza]'), function (c) { piezas[c.getAttribute('data-pieza')] = c.checked; });
      R = construir(cs, Number(selT.value), Number($('A').value) || 0, Number($('B').value) || 0, piezas);
      // orden de las filas: por lugar (z_{i,1..T} juntos, como la foto) o por tiempo (k del cuaderno)
      perm = [];
      if ($('orden').value === 'lugar') { for (var i = 0; i < R.N; i++) for (var t3 = 0; t3 < R.T; t3++) perm.push(t3 * R.N + i); for (var k5 = R.nRuta; k5 < R.n; k5++) perm.push(k5); }
      else for (var k = 0; k < R.n; k++) perm.push(k);
      var nJ = 0, maxJ = 0; for (var a = 0; a < R.n; a++) for (var b = a + 1; b < R.n; b++) { var v = R.J[a * R.n + b]; if (v) { nJ++; maxJ = Math.max(maxJ, v); } }
      $('resumen').innerHTML = '<span><b>' + R.n + '</b> qubits' + (R.m ? ' (' + R.nRuta + ' de ruta + ' + (R.n - R.nRuta) + ' de holgura)' : '') + '</span><span><b>' + nJ + '</b> pares con J ≠ 0</span><span>c = <b>' + fmt(R.off) + '</b></span>';
      pintar();
      $('tabla').hidden = true; $('numeros').textContent = 'ver todos los números de J';
    }
    function pintar() {
      var n = R.n, chico = n <= 16, alto = Math.max(3, Math.floor(560 / n)), maxH = 1e-9;
      perm.forEach(function (k) { maxH = Math.max(maxH, Math.abs(R.h[k])); });
      // en el modo denso cada fila mide lo mismo que una fila del mapa de J; h se ve como barras
      $('z').innerHTML = '<div class="mx-vec' + (chico ? '' : ' denso') + '">' + perm.map(function (k) { return '<span title="' + texto(k) + '"' + (chico ? '' : ' style="height:' + alto + 'px"') + '>' + etiqueta(k) + '</span>'; }).join('') + '</div>';
      $('h').innerHTML = '<div class="mx-vec num' + (chico ? '' : ' denso') + '">' + perm.map(function (k) { return '<span title="h[' + texto(k) + '] = ' + fmt(R.h[k]) + '"' + (chico ? '' : ' style="height:' + Math.max(1, alto - 1) + 'px;margin-bottom:1px;width:' + (6 + 60 * Math.abs(R.h[k]) / maxH).toFixed(1) + 'px"') + '>' + fmt(R.h[k]) + '</span>'; }).join('') + '</div>';
      var cj = $('J');
      if (chico) {
        cj.innerHTML = '<table class="mx-num"><tbody>' + perm.map(function (a) { return '<tr>' + perm.map(function (b) { return '<td>' + fmt(R.J[a * n + b]) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
        return;
      }
      // mapa de calor: penalidades (≥ A/8) en azul, distancias en dorado
      var celda = Math.max(3, Math.floor(560 / n)), lado = celda * n, cv = document.createElement('canvas');
      var dpr = window.devicePixelRatio || 1; cv.width = lado * dpr; cv.height = lado * dpr; cv.style.width = lado + 'px'; cv.style.height = lado + 'px';
      var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lado, lado);
      var A = Number($('A').value) || 1, maxC = 1e-9;
      for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) { var v = R.J[perm[a] * n + perm[b]]; if (v && v < A / 8) maxC = Math.max(maxC, v); }
      for (var r = 0; r < n; r++) for (var s = 0; s < n; s++) {
        var v2 = R.J[perm[r] * n + perm[s]]; if (!v2) continue;
        ctx.fillStyle = v2 >= A / 8 ? 'rgba(27,42,74,.85)' : 'rgba(200,140,40,' + (.35 + .65 * v2 / maxC).toFixed(3) + ')';
        ctx.fillRect(s * celda, r * celda, celda, celda);
      }
      var bloque = $('orden').value === 'lugar' ? R.T : R.N;
      ctx.strokeStyle = 'rgba(140,109,51,.45)'; ctx.lineWidth = 1;
      for (var g = bloque; g < R.nRuta; g += bloque) { ctx.beginPath(); ctx.moveTo(g * celda + .5, 0); ctx.lineTo(g * celda + .5, lado); ctx.moveTo(0, g * celda + .5); ctx.lineTo(lado, g * celda + .5); ctx.stroke(); }
      cj.innerHTML = '';
      var leyenda = document.createElement('div'); leyenda.className = 'mx-leyenda';
      leyenda.innerHTML = '<span><i class="az"></i>restricciones (A)</span><span><i class="or"></i>distancias (B·d)</span><span>líneas: cada ' + ($('orden').value === 'lugar' ? 'lugar' : 'tiempo') + '</span>';
      cj.appendChild(cv); cj.appendChild(leyenda);
      var tip = $('tip');
      cv.addEventListener('mousemove', function (ev) {
        var rc = cv.getBoundingClientRect(), s2 = Math.floor((ev.clientX - rc.left) / celda), r2 = Math.floor((ev.clientY - rc.top) / celda);
        if (r2 < 0 || s2 < 0 || r2 >= n || s2 >= n) { tip.hidden = true; return; }
        tip.hidden = false;
        tip.innerHTML = 'J[' + etiqueta(perm[r2]) + ', ' + etiqueta(perm[s2]) + '] = <b>' + fmt(R.J[perm[r2] * n + perm[s2]]) + '</b>';
        var cr = caja.getBoundingClientRect();
        tip.style.left = (ev.clientX - cr.left + 14) + 'px'; tip.style.top = (ev.clientY - cr.top + 14) + 'px';
      });
      cv.addEventListener('mouseleave', function () { tip.hidden = true; });
    }
    $('numeros').addEventListener('click', function () {
      var tb = $('tabla');
      if (!tb.hidden) { tb.hidden = true; this.textContent = 'ver todos los números de J'; return; }
      var n = R.n;
      var h = '<table class="mx-num grande"><thead><tr><th></th>' + perm.map(function (k) { return '<th>' + etiqueta(k) + '</th>'; }).join('') + '</tr></thead><tbody>';
      perm.forEach(function (a) { h += '<tr><th>' + etiqueta(a) + '</th>' + perm.map(function (b) { var v = R.J[a * n + b]; return '<td' + (v ? '' : ' class="cero"') + '>' + fmt(v) + '</td>'; }).join('') + '</tr>'; });
      tb.innerHTML = h + '</tbody></table>'; tb.hidden = false; this.textContent = 'ocultar los números';
    });
    $('csv').addEventListener('click', function () {
      var n = R.n, filas = [[''].concat(perm.map(texto)).concat(['h']).join(',')];
      perm.forEach(function (a) { filas.push([texto(a)].concat(perm.map(function (b) { return R.J[a * n + b]; })).concat([R.h[a]]).join(',')); });
      filas.push('c,' + R.off);
      var url = URL.createObjectURL(new Blob([filas.join('\n')], { type: 'text/csv' }));
      var a2 = document.createElement('a'); a2.href = url; a2.download = 'hamiltoniano_' + $('caso').value + '_T' + R.T + '.csv'; a2.click();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    });
    // cada caso empieza con sus piezas: el triángulo con las dos restricciones, la red con todas
    function piezasDelCaso() {
      var tri = $('caso').value === 'tri', on = tri ? ['coste', 'lugar', 'visita'] : ['coste', 'lugar', 'visita1', 'saltos', 'inicio', 'fin'];
      Array.prototype.forEach.call(caja.querySelectorAll('[data-pieza]'), function (c) { c.checked = on.indexOf(c.getAttribute('data-pieza')) >= 0; });
    }
    $('caso').addEventListener('change', piezasDelCaso);
    Array.prototype.forEach.call(caja.querySelectorAll('select, input'), function (c) { c.addEventListener('change', calcular); });
    piezasDelCaso();
    calcular();
  };
})();
