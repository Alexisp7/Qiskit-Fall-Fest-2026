// Bloques de código tomados del cuaderno TRACK1_rutas_QUBO.ipynb (sin cambios).
window.CELDAS = {
 "ansatz": [
  {
   "id": "datos",
   "titulo": "Datos de entrada",
   "codigo": "# ---------- Grafo: (nodo_a, nodo_b, distancia) ----------\naristas = [\n    (1, 2, 5),\n    (2, 3, 7),\n    (3, 1, 9),\n]\n\n# Posiciones para dibujar (opcional, None para automatico)\nposiciones = {1: (0, 0), 2: (1, 1), 3: (2, 0)}\n\n# ---------- Pasos de tiempo ----------\nT = None            # None = un paso por nodo\n\n# ---------- Penalizacion de las restricciones ----------\nA = None            # None = valor sugerido automaticamente\n\n# ---------- Piezas activas del Hamiltoniano ----------\n# Cada linea es (nombre_de_pieza, argumentos_extra)\npiezas_activas = [\n    (\"coste_distancia\", ()),\n    (\"un_lugar_por_tiempo\", ()),\n    (\"visitar_una_vez\", ()),\n    (\"saltos_prohibidos\", ()),\n    # (\"empezar_en\", (1,)),\n    # (\"terminar_en\", (3,)),\n    # (\"cerrar_camino\", (1, 2)),\n    # (\"visitar_antes\", (1, 3)),\n]\n\n# ---------- Resolvedores ----------\nUSAR_EXACTO = True   # recomendable hasta unos 20 qubits\nUSAR_VQE = True      # recomendable hasta unos 12 qubits\n",
   "clave": false
  },
  {
   "id": "libs",
   "titulo": "Librerías",
   "codigo": "import itertools\nfrom collections import defaultdict\n\nimport numpy as np\nimport networkx as nx\nimport matplotlib.pyplot as plt\nfrom scipy.optimize import minimize\nfrom qiskit import QuantumCircuit\nfrom qiskit.quantum_info import SparsePauliOp, Statevector\n",
   "clave": false
  },
  {
   "id": "problema",
   "titulo": "Problema: cada (lugar, tiempo) es un qubit",
   "codigo": "class Problema:\n    \"\"\"Guarda el grafo, los tiempos y el mapa (nodo, tiempo) -> qubit.\"\"\"\n\n    def __init__(self, grafo, T=None):\n        self.grafo = grafo\n        self.nodos = sorted(grafo.nodes)\n        self.N = len(self.nodos)\n        self.T = T if T is not None else self.N\n        self.tiempos = list(range(1, self.T + 1))\n        self.n_qubits = self.N * self.T\n        # qubit k = (t-1)*N + posicion del nodo\n        self._pos = {nodo: p for p, nodo in enumerate(self.nodos)}\n\n    def q(self, nodo, t):\n        \"\"\"Indice del qubit que representa x(nodo, t).\"\"\"\n        return (t - 1) * self.N + self._pos[nodo]\n\n    def var(self, k):\n        \"\"\"Inverso de q: qubit k -> (nodo, t).\"\"\"\n        return self.nodos[k % self.N], k // self.N + 1\n\n    def distancia(self, i, j):\n        \"\"\"Peso de la arista i-j, o None si no existe.\"\"\"\n        if self.grafo.has_edge(i, j):\n            return self.grafo[i][j].get(\"weight\", 1)\n        return None\n",
   "clave": false
  },
  {
   "id": "qubo",
   "titulo": "QUBO: el polinomio que se arma por piezas",
   "codigo": "class QUBO:\n    \"\"\"Polinomio cuadratico en variables binarias x_k en {0,1}.\n\n    E(x) = constante + sum_k lin[k] x_k + sum_{k<l} quad[(k,l)] x_k x_l\n    Se puede sumar y multiplicar por un numero, asi cada pieza es un QUBO\n    y el Hamiltoniano total es la suma de las piezas.\n    \"\"\"\n\n    def __init__(self, n):\n        self.n = n\n        self.constante = 0.0\n        self.lin = defaultdict(float)\n        self.quad = defaultdict(float)\n\n    # ---- construccion ----\n    def agregar_constante(self, c):\n        self.constante += c\n        return self\n\n    def agregar_lineal(self, k, c):\n        self.lin[k] += c\n        return self\n\n    def agregar_cuadratico(self, k, l, c):\n        if k == l:                      # x^2 = x para binarias\n            self.lin[k] += c\n        else:\n            self.quad[(min(k, l), max(k, l))] += c\n        return self\n\n    def agregar_cuadrado(self, coefs, c0=0.0, peso=1.0):\n        \"\"\"Suma peso * (c0 + sum_k coefs[k] x_k)^2 ya expandido.\"\"\"\n        items = list(coefs.items())\n        self.constante += peso * c0 ** 2\n        for k, a in items:\n            self.agregar_lineal(k, peso * (a ** 2 + 2 * c0 * a))\n        for (k, a), (l, b) in itertools.combinations(items, 2):\n            self.agregar_cuadratico(k, l, peso * 2 * a * b)\n        return self\n\n    # ---- algebra para armar como lego ----\n    def __add__(self, otro):\n        if otro == 0:\n            return self\n        r = QUBO(max(self.n, otro.n))\n        r.constante = self.constante + otro.constante\n        for d in (self.lin, otro.lin):\n            for k, c in d.items():\n                r.lin[k] += c\n        for d in (self.quad, otro.quad):\n            for k, c in d.items():\n                r.quad[k] += c\n        return r\n\n    __radd__ = __add__\n\n    def __mul__(self, a):\n        r = QUBO(self.n)\n        r.constante = a * self.constante\n        r.lin = defaultdict(float, {k: a * c for k, c in self.lin.items()})\n        r.quad = defaultdict(float, {k: a * c for k, c in self.quad.items()})\n        return r\n\n    __rmul__ = __mul__\n\n    # ---- evaluacion ----\n    def energia(self, x):\n        \"\"\"Valor del QUBO para una lista/array de bits x.\"\"\"\n        x = np.asarray(x)\n        e = self.constante\n        e += sum(c * x[k] for k, c in self.lin.items())\n        e += sum(c * x[k] * x[l] for (k, l), c in self.quad.items())\n        return float(e)\n\n    def energias_todas(self):\n        \"\"\"Energia de los 2^n estados (solo para n pequeno, n <= 22).\"\"\"\n        if self.n > 22:\n            raise ValueError(f\"{self.n} qubits es demasiado para enumerar 2^n estados\")\n        idx = np.arange(2 ** self.n, dtype=np.int64)\n        bits = (idx[:, None] >> np.arange(self.n)) & 1     # bit k = qubit k\n        e = np.full(2 ** self.n, self.constante, dtype=float)\n        for k, c in self.lin.items():\n            e += c * bits[:, k]\n        for (k, l), c in self.quad.items():\n            e += c * bits[:, k] * bits[:, l]\n        return e\n",
   "clave": false
  },
  {
   "id": "coste",
   "titulo": "Función de coste",
   "codigo": "def coste_distancia(prob):\n    \"\"\"Q_C = sum_t sum_{i,j vecinos} d_ij x(i,t) x(j,t+1).\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for t in prob.tiempos[:-1]:\n        for i in prob.nodos:\n            for j in prob.nodos:\n                d = prob.distancia(i, j)\n                if i != j and d is not None:\n                    Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), d)\n    return Q\n",
   "clave": true
  },
  {
   "id": "basicas",
   "titulo": "Restricciones que siempre van",
   "codigo": "def exactamente_uno(Q, qubits, peso=1.0):\n    \"\"\"Ayuda generica: suma peso * (1 - sum x)^2 sobre esos qubits.\"\"\"\n    return Q.agregar_cuadrado({k: -1.0 for k in qubits}, c0=1.0, peso=peso)\n\n\ndef un_lugar_por_tiempo(prob):\n    \"\"\"Q_A = sum_t (1 - sum_i x(i,t))^2.\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for t in prob.tiempos:\n        exactamente_uno(Q, [prob.q(i, t) for i in prob.nodos])\n    return Q\n\n\ndef visitar_una_vez(prob):\n    \"\"\"Q_B = sum_i (1 - sum_t x(i,t))^2.\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for i in prob.nodos:\n        exactamente_uno(Q, [prob.q(i, t) for t in prob.tiempos])\n    return Q\n\n\ndef saltos_prohibidos(prob):\n    \"\"\"Castiga ir de i a j en pasos seguidos si no hay arista i-j.\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for t in prob.tiempos[:-1]:\n        for i in prob.nodos:\n            for j in prob.nodos:\n                if i != j and prob.distancia(i, j) is None:\n                    Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), 1.0)\n    return Q\n",
   "clave": true
  },
  {
   "id": "elegibles",
   "titulo": "Restricciones que se eligen",
   "codigo": "def empezar_en(prob, nodo):\n    \"\"\"Castiga no estar en 'nodo' en el tiempo 1.\"\"\"\n    return QUBO(prob.n_qubits).agregar_constante(1.0).agregar_lineal(prob.q(nodo, 1), -1.0)\n\n\ndef terminar_en(prob, nodo):\n    \"\"\"Castiga no estar en 'nodo' en el ultimo tiempo.\"\"\"\n    return QUBO(prob.n_qubits).agregar_constante(1.0).agregar_lineal(prob.q(nodo, prob.T), -1.0)\n\n\ndef cerrar_camino(prob, i, j):\n    \"\"\"Castiga usar la arista i-j en cualquier sentido (camino cerrado).\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for t in prob.tiempos[:-1]:\n        Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), 1.0)\n        Q.agregar_cuadratico(prob.q(j, t), prob.q(i, t + 1), 1.0)\n    return Q\n\n\ndef visitar_antes(prob, a, b):\n    \"\"\"Castiga visitar b antes que a (por ejemplo tajo antes que chancadora).\"\"\"\n    Q = QUBO(prob.n_qubits)\n    for tb in prob.tiempos:\n        for ta in prob.tiempos:\n            if tb < ta:\n                Q.agregar_cuadratico(prob.q(b, tb), prob.q(a, ta), 1.0)\n    return Q\n\n\ndef sugerir_penalizacion(prob):\n    \"\"\"Un valor de A mayor que cualquier ahorro posible al romper reglas.\"\"\"\n    pesos = [d.get(\"weight\", 1) for _, _, d in prob.grafo.edges(data=True)]\n    return float((prob.T - 1) * max(pesos) + 1)\n",
   "clave": true
  },
  {
   "id": "armar",
   "titulo": "Armar el Hamiltoniano",
   "codigo": "def armar_hamiltoniano(piezas):\n    \"\"\"piezas = {nombre: (peso, QUBO)}. Devuelve el QUBO total.\"\"\"\n    return sum(peso * Q for peso, Q in piezas.values())\n\n\ncatalogo = {\n    \"coste_distancia\": coste_distancia,\n    \"un_lugar_por_tiempo\": un_lugar_por_tiempo,\n    \"visitar_una_vez\": visitar_una_vez,\n    \"saltos_prohibidos\": saltos_prohibidos,\n    \"empezar_en\": empezar_en,\n    \"terminar_en\": terminar_en,\n    \"cerrar_camino\": cerrar_camino,\n    \"visitar_antes\": visitar_antes,\n}\npiezas = {}\nfor nombre, args in piezas_activas:\n    peso = 1.0 if nombre == \"coste_distancia\" else A\n    clave = nombre + \"\".join(f\"_{a}\" for a in args)\n    piezas[clave] = (peso, catalogo[nombre](prob, *args))\n\nqubo = armar_hamiltoniano(piezas)\nH, offset = qubo.a_ising()\n",
   "clave": false
  },
  {
   "id": "ising",
   "titulo": "De QUBO a Ising",
   "codigo": "class QUBO:\n    ...\n    # ---- paso a lenguaje cuantico ----\n    def a_ising(self):\n        \"\"\"Devuelve (H, offset) con H un SparsePauliOp y x_k = (1 - Z_k)/2.\n\n        Se usan indices explicitos de qubit, asi no hay confusion con el\n        orden little endian de Qiskit.\n        \"\"\"\n        offset = self.constante\n        z = defaultdict(float)\n        zz = defaultdict(float)\n        for k, c in self.lin.items():          # c x = c/2 - c/2 Z\n            offset += c / 2\n            z[k] -= c / 2\n        for (k, l), c in self.quad.items():    # c x x = c/4 (1 - Zk - Zl + ZkZl)\n            offset += c / 4\n            z[k] -= c / 4\n            z[l] -= c / 4\n            zz[(k, l)] += c / 4\n        terminos = [(\"Z\", [k], c) for k, c in z.items() if abs(c) > 1e-12]\n        terminos += [(\"ZZ\", [k, l], c) for (k, l), c in zz.items() if abs(c) > 1e-12]\n        if not terminos:\n            terminos = [(\"\", [], 0.0)]\n        H = SparsePauliOp.from_sparse_list(terminos, num_qubits=self.n)\n        return H, offset\n",
   "clave": false
  },
  {
   "id": "ansatzc",
   "titulo": "El ansatz propuesto",
   "codigo": "def ansatz(n_qubits, capas):\n    \"\"\"Capas de RY con entrelazamiento CZ en cadena, mas una capa final de RY.\"\"\"\n    from qiskit.circuit import ParameterVector\n    th = ParameterVector(\"θ\", n_qubits * (capas + 1))\n    qc = QuantumCircuit(n_qubits)\n    p = 0\n    for _ in range(capas):\n        for k in range(n_qubits):\n            qc.ry(th[p], k)\n            p += 1\n        for k in range(n_qubits - 1):\n            qc.cz(k, k + 1)\n    for k in range(n_qubits):\n        qc.ry(th[p], k)\n        p += 1\n    return qc\n",
   "clave": true
  }
 ],
 "solver": [
  {
   "id": "vqe1",
   "titulo": "VQE · preparar",
   "codigo": "def resolver_vqe(qubo, capas=1, intentos=6, maxiter=300, semilla=1, candidatos=20):\n    \"\"\"VQE con COBYLA. Devuelve la mejor ruta entre los estados mas probables.\"\"\"\n    H, offset = qubo.a_ising()\n    escala = max(np.max(np.abs(H.coeffs)), 1e-12)\n    Hn = H / escala                          # normalizar ayuda al optimizador\n    qc = ansatz(qubo.n, capas)\n    rng = np.random.default_rng(semilla)\n",
   "clave": true
  },
  {
   "id": "vqe2",
   "titulo": "VQE · la energía como función de θ",
   "codigo": "    def energia(theta):\n        psi = Statevector(qc.assign_parameters(theta))\n        return float(np.real(psi.expectation_value(Hn)))\n",
   "clave": true
  },
  {
   "id": "vqe3",
   "titulo": "VQE · COBYLA desde varios arranques",
   "codigo": "    mejor = None\n    historial = []\n    for _ in range(intentos):\n        theta0 = rng.uniform(0, 2 * np.pi, qc.num_parameters)\n        hist = []\n        res = minimize(energia, theta0, method=\"COBYLA\",\n                       callback=lambda th: hist.append(energia(th)),\n                       options={\"maxiter\": maxiter})\n        historial.append(np.array(hist) * escala + offset)\n        if mejor is None or res.fun < mejor.fun:\n            mejor = res\n",
   "clave": true
  },
  {
   "id": "vqe4",
   "titulo": "VQE · leer el estado final",
   "codigo": "    psi = Statevector(qc.assign_parameters(mejor.x))\n    probs = psi.probabilities()\n    top = np.argsort(probs)[::-1][:candidatos]\n    elegido = min(top, key=lambda s: qubo.energia(_entero_a_bits(int(s), qubo.n)))\n    bits = _entero_a_bits(int(elegido), qubo.n)\n    return {\n        \"bits\": bits,\n        \"energia\": qubo.energia(bits),\n        \"probabilidad\": float(probs[elegido]),\n        \"energia_vqe\": mejor.fun * escala + offset,\n        \"historial\": historial,\n        \"probs\": probs,\n        \"circuito\": qc,\n    }\n",
   "clave": true
  },
  {
   "id": "correr",
   "titulo": "Correr el VQE",
   "codigo": "if USAR_VQE:\n    res = resolver_vqe(qubo)\n    ruta_vqe = bits_a_ruta(prob, res[\"bits\"])\n    print(\"Ruta VQE:\", ruta_vqe)\n    print(f\"Energia: {res['energia']:.1f}   Probabilidad del estado: {res['probabilidad']:.3f}\")\n    print(\"Matriz x(i,t), filas = nodos, columnas = tiempos\")\n    print(matriz_x(prob, res[\"bits\"]))\n    print()\n    desglose(piezas, res[\"bits\"])\n\n    plt.figure(figsize=(5, 3))\n    for h in res[\"historial\"]:\n        plt.plot(h)\n    plt.xlabel(\"iteracion\"); plt.ylabel(\"energia\"); plt.title(\"Convergencia del VQE\")\n    plt.show()\n    dibujar_ruta(prob, ruta_vqe, posiciones, \"Ruta VQE\")\n\n    if USAR_EXACTO:\n        print(\"Coincide con el exacto:\", np.isclose(res[\"energia\"], E_ex))\n",
   "clave": false
  }
 ],
 "validacion": [
  {
   "id": "exacto",
   "titulo": "Referencia exacta",
   "codigo": "def resolver_exacto(qubo, top=5):\n    \"\"\"Revisa los 2^n estados. Sirve como referencia para n pequeno.\"\"\"\n    e = qubo.energias_todas()\n    orden = np.argsort(e, kind=\"stable\")[:top]\n    sols = [(_entero_a_bits(int(s), qubo.n), float(e[s])) for s in orden]\n    return sols[0][0], sols[0][1], sols\n\n\ndef _entero_a_bits(s, n):\n    return [(s >> k) & 1 for k in range(n)]\n",
   "clave": false
  },
  {
   "id": "lectura",
   "titulo": "Bits → ruta y matriz x",
   "codigo": "def bits_a_ruta(prob, bits):\n    \"\"\"Lista con el nodo activo en cada tiempo (None si no hay ninguno).\"\"\"\n    ruta = []\n    for t in prob.tiempos:\n        activos = [i for i in prob.nodos if bits[prob.q(i, t)] == 1]\n        ruta.append(activos[0] if len(activos) == 1 else (activos or None))\n    return ruta\n\n\ndef matriz_x(prob, bits):\n    \"\"\"Matriz nodos x tiempos con los valores de x(i,t).\"\"\"\n    return np.array([[bits[prob.q(i, t)] for t in prob.tiempos] for i in prob.nodos])\n",
   "clave": false
  },
  {
   "id": "desglose",
   "titulo": "Desglose por pieza",
   "codigo": "def desglose(piezas, bits):\n    \"\"\"Valor de cada pieza para una solucion, con y sin su peso.\"\"\"\n    print(f\"{'pieza':<22}{'peso':>10}{'valor':>10}{'aporte':>12}\")\n    total = 0.0\n    for nombre, (peso, Q) in piezas.items():\n        v = Q.energia(bits)\n        total += peso * v\n        print(f\"{nombre:<22}{peso:>10.1f}{v:>10.1f}{peso * v:>12.1f}\")\n    print(f\"{'TOTAL':<22}{'':>10}{'':>10}{total:>12.1f}\")\n",
   "clave": false
  },
  {
   "id": "compara",
   "titulo": "VQE contra el exacto",
   "codigo": "if USAR_EXACTO:\n    bits_ex, E_ex, mejores = resolver_exacto(qubo, top=5)\n    print(\"Mejores soluciones (metodo exacto):\")\n    for b, e in mejores:\n        print(f\"  ruta {bits_a_ruta(prob, b)}   energia {e:.1f}\")\n    print()\n    desglose(piezas, bits_ex)\n    dibujar_ruta(prob, bits_a_ruta(prob, bits_ex), posiciones, \"Ruta exacta\")\n",
   "clave": false
  }
 ]
};
