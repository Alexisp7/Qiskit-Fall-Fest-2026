"""Rutas con QUBO y VQE: Qiskit Fall Fest 2026, Track 2.

Mismo codigo que codigo/rutas_qubo_vqe.ipynb, en el mismo orden.
Sitio: https://qiskit-fall-fest-2026-iuhx.vercel.app
"""


# ## 1 · Inicializar: de la red al Hamiltoniano


# ---- Datos de entrada · red minera -----------------------------------------
# ---------- Grafo: red minera de Orcopampa (distancias en km) ----------
aristas = [
    (1, 2, 1.6),     # Planta - J1
    (2, 3, 0.072),   # J1 - Tajo
    (2, 4, 0.035),   # J1 - Botadero
    (2, 8, 1.4),     # J1 - Relaves
    (2, 5, 1.4),     # J1 - J2
    (1, 5, 1.7),     # Planta - J2
    (8, 5, 1.0),     # Relaves - J2
    (5, 6, 0.2),     # J2 - Lixiviacion
    (5, 7, 0.5),     # J2 - Baja ley
]

# Posiciones para dibujar (opcional, None para automatico)
posiciones = {1: (0, 2), 2: (2, 3), 3: (1, 4), 4: (3, 4),
              5: (3, 1), 6: (2, 0), 7: (4, 0), 8: (5, 2)}

# ---------- Pasos de tiempo ----------
T = 13              # sale de x1 y vuelve a x1 pasando por los 8 lugares
# 3, 4, 6 y 7 son hojas: la ruta debe volver a pasar por J1 (2) y J2 (5).
# Ruta valida de 13 pasos: 1-2-3-2-4-2-8-5-6-5-7-5-1

# ---------- Penalizacion de las restricciones ----------
A = None            # None: usa sugerir_penalizacion(prob) = (T-1)·d_max + 1 ≈ 21.4

# ---------- Piezas activas del Hamiltoniano ----------
# Cada linea es (nombre_de_pieza, argumentos_extra)
piezas_activas = [
    ("coste_distancia", ()),
    ("un_lugar_por_tiempo", ()),
    ("visitar_al_menos_una_vez", ()),   # no "visitar_una_vez": 13 tiempos > 8 lugares
    ("saltos_prohibidos", ()),          # incluye quedarse quieto (i -> i)
    ("empezar_en", (1,)),
    ("terminar_en", (1,)),
]

# ---------- Resolvedores ----------
USAR_EXACTO = False  # 8 x 13 + 24 holguras = 128 qubits: 2^128 estados no se pueden enumerar
USAR_VQE = False     # ni simular con Statevector en un computador normal


# ---- Caso de control: triángulo (9 qubits) ---------------------------------
# ---------- Caso de control: triangulo (9 qubits) ----------
# La red minera necesita 128 qubits: no se puede simular ni enumerar.
# Con True se reemplaza por el triangulo d12 = 5, d23 = 7, d13 = 9, donde
# el metodo exacto y el VQE si corren (exacto: ruta 1 -> 2 -> 3, energia 12).
CASO_TRIANGULO = False
aristas_mina = list(aristas)    # la etapa Resultado siempre usa la red minera

if CASO_TRIANGULO:
    aristas = [(1, 2, 5), (2, 3, 7), (1, 3, 9)]
    posiciones = {1: (0, 0), 2: (1, 1.6), 3: (2, 0)}
    T = 3
    A = 100
    piezas_activas = [
        ("coste_distancia", ()),
        ("un_lugar_por_tiempo", ()),
        ("visitar_una_vez", ()),      # aqui T = N: exactamente una vez si sirve
    ]
    USAR_EXACTO = True
    USAR_VQE = True


# ---- Librerías -------------------------------------------------------------
import itertools
from collections import defaultdict

import numpy as np
import networkx as nx
import matplotlib.pyplot as plt
from scipy.optimize import minimize
from qiskit import QuantumCircuit
from qiskit.quantum_info import SparsePauliOp, Statevector


# ---- Problema: cada (lugar, tiempo) es un qubit ----------------------------
class Problema:
    """Guarda el grafo, los tiempos y el mapa (nodo, tiempo) -> qubit."""

    def __init__(self, grafo, T=None):
        self.grafo = grafo
        self.nodos = sorted(grafo.nodes)
        self.N = len(self.nodos)
        self.T = T if T is not None else self.N
        self.tiempos = list(range(1, self.T + 1))
        self.n_qubits = self.N * self.T
        # qubit k = (t-1)*N + posicion del nodo
        self._pos = {nodo: p for p, nodo in enumerate(self.nodos)}

    def q(self, nodo, t):
        """Indice del qubit que representa x(nodo, t)."""
        return (t - 1) * self.N + self._pos[nodo]

    def var(self, k):
        """Inverso de q: qubit k -> (nodo, t)."""
        return self.nodos[k % self.N], k // self.N + 1

    def distancia(self, i, j):
        """Peso de la arista i-j, o None si no existe."""
        if self.grafo.has_edge(i, j):
            return self.grafo[i][j].get("weight", 1)
        return None


# ---- La instancia: grafo y problema ----------------------------------------
grafo = nx.Graph()
grafo.add_weighted_edges_from(aristas)      # (i, j, distancia en km)
prob = Problema(grafo, T)
print(f"{prob.N} lugares x {prob.T} tiempos = {prob.n_qubits} qubits de ruta")


# ---- QUBO: el polinomio que se arma por piezas (incluye a_ising: de QUBO a Ising) ----
class QUBO:
    """Polinomio cuadratico en variables binarias x_k en {0,1}.

    E(x) = constante + sum_k lin[k] x_k + sum_{k<l} quad[(k,l)] x_k x_l
    Se puede sumar y multiplicar por un numero, asi cada pieza es un QUBO
    y el Hamiltoniano total es la suma de las piezas.
    """

    def __init__(self, n):
        self.n = n
        self.constante = 0.0
        self.lin = defaultdict(float)
        self.quad = defaultdict(float)

    # ---- construccion ----
    def agregar_constante(self, c):
        self.constante += c
        return self

    def agregar_lineal(self, k, c):
        self.lin[k] += c
        return self

    def agregar_cuadratico(self, k, l, c):
        if k == l:                      # x^2 = x para binarias
            self.lin[k] += c
        else:
            self.quad[(min(k, l), max(k, l))] += c
        return self

    def agregar_cuadrado(self, coefs, c0=0.0, peso=1.0):
        """Suma peso * (c0 + sum_k coefs[k] x_k)^2 ya expandido."""
        items = list(coefs.items())
        self.constante += peso * c0 ** 2
        for k, a in items:
            self.agregar_lineal(k, peso * (a ** 2 + 2 * c0 * a))
        for (k, a), (l, b) in itertools.combinations(items, 2):
            self.agregar_cuadratico(k, l, peso * 2 * a * b)
        return self

    # ---- algebra para armar como lego ----
    def __add__(self, otro):
        if otro == 0:
            return self
        r = QUBO(max(self.n, otro.n))
        r.constante = self.constante + otro.constante
        for d in (self.lin, otro.lin):
            for k, c in d.items():
                r.lin[k] += c
        for d in (self.quad, otro.quad):
            for k, c in d.items():
                r.quad[k] += c
        return r

    __radd__ = __add__

    def __mul__(self, a):
        r = QUBO(self.n)
        r.constante = a * self.constante
        r.lin = defaultdict(float, {k: a * c for k, c in self.lin.items()})
        r.quad = defaultdict(float, {k: a * c for k, c in self.quad.items()})
        return r

    __rmul__ = __mul__

    # ---- evaluacion ----
    def energia(self, x):
        """Valor del QUBO para una lista/array de bits x."""
        x = np.asarray(x)
        e = self.constante
        e += sum(c * x[k] for k, c in self.lin.items())
        e += sum(c * x[k] * x[l] for (k, l), c in self.quad.items())
        return float(e)

    def energias_todas(self):
        """Energia de los 2^n estados (solo para n pequeno, n <= 22)."""
        if self.n > 22:
            raise ValueError(f"{self.n} qubits es demasiado para enumerar 2^n estados")
        idx = np.arange(2 ** self.n, dtype=np.int64)
        bits = (idx[:, None] >> np.arange(self.n)) & 1     # bit k = qubit k
        e = np.full(2 ** self.n, self.constante, dtype=float)
        for k, c in self.lin.items():
            e += c * bits[:, k]
        for (k, l), c in self.quad.items():
            e += c * bits[:, k] * bits[:, l]
        return e

    # ---- paso a lenguaje cuantico ----
    def a_ising(self):
        """Devuelve (H, offset) con H un SparsePauliOp y x_k = (1 - Z_k)/2.

        Se usan indices explicitos de qubit, asi no hay confusion con el
        orden little endian de Qiskit.
        """
        offset = self.constante
        z = defaultdict(float)
        zz = defaultdict(float)
        for k, c in self.lin.items():          # c x = c/2 - c/2 Z
            offset += c / 2
            z[k] -= c / 2
        for (k, l), c in self.quad.items():    # c x x = c/4 (1 - Zk - Zl + ZkZl)
            offset += c / 4
            z[k] -= c / 4
            z[l] -= c / 4
            zz[(k, l)] += c / 4
        terminos = [("Z", [k], c) for k, c in z.items() if abs(c) > 1e-12]
        terminos += [("ZZ", [k, l], c) for (k, l), c in zz.items() if abs(c) > 1e-12]
        if not terminos:
            terminos = [("", [], 0.0)]
        H = SparsePauliOp.from_sparse_list(terminos, num_qubits=self.n)
        return H, offset


# ---- Función de coste ------------------------------------------------------
def coste_distancia(prob):
    """Q_C = sum_t sum_{i,j vecinos} d_ij x(i,t) x(j,t+1)."""
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos[:-1]:
        for i in prob.nodos:
            for j in prob.nodos:
                d = prob.distancia(i, j)
                if i != j and d is not None:
                    Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), d)
    return Q


# ---- Restricciones que siempre van -----------------------------------------
def exactamente_uno(Q, qubits, peso=1.0):
    """Ayuda generica: suma peso * (1 - sum x)^2 sobre esos qubits."""
    return Q.agregar_cuadrado({k: -1.0 for k in qubits}, c0=1.0, peso=peso)


def un_lugar_por_tiempo(prob):
    """Q_A = sum_t (1 - sum_i x(i,t))^2."""
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos:
        exactamente_uno(Q, [prob.q(i, t) for i in prob.nodos])
    return Q


def visitar_una_vez(prob):
    """Q_B = sum_i (1 - sum_t x(i,t))^2."""
    Q = QUBO(prob.n_qubits)
    for i in prob.nodos:
        exactamente_uno(Q, [prob.q(i, t) for t in prob.tiempos])
    return Q


def saltos_prohibidos(prob):
    """Castiga ir de i a j en pasos seguidos si no hay arista i-j,
    y tambien quedarse en el mismo lugar (i -> i): con revisitas permitidas,
    esperar en un nodo costaria cero y el optimizador lo aprovecharia."""
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos[:-1]:
        for i in prob.nodos:
            for j in prob.nodos:
                if i == j or prob.distancia(i, j) is None:
                    Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), 1.0)
    return Q


# ---- Visitar al menos una vez (holguras) -----------------------------------
def bits_holgura(prob):
    """Bits por lugar para contar las visitas extra: s_i va de 0 a 2^m - 1 >= T - N."""
    return max(1, (prob.T - prob.N).bit_length())


def holgura(prob, nodo, b):
    """Qubit de holgura y(nodo, b), despues de los N*T qubits de la ruta."""
    return prob.n_qubits + prob._pos[nodo] * bits_holgura(prob) + b


def visitar_al_menos_una_vez(prob):
    """Q_B' = sum_i (sum_t x(i,t) - 1 - s_i)^2,  s_i = sum_b 2^b y(i,b) >= 0.

    Con T > N "exactamente una vez" choca con "un lugar por tiempo"
    (T unos contra N unos). La holgura s_i cuenta las visitas extra: la
    pieza vale 0 si el lugar aparece 1 + s_i veces, y s_i no puede ser
    negativo, asi que no visitarlo nunca siempre se castiga.
    """
    m = bits_holgura(prob)
    Q = QUBO(prob.n_qubits + prob.N * m)
    for i in prob.nodos:
        coefs = {prob.q(i, t): 1.0 for t in prob.tiempos}
        for b in range(m):
            coefs[holgura(prob, i, b)] = -float(2 ** b)
        Q.agregar_cuadrado(coefs, c0=-1.0)
    return Q


# ---- Restricciones que se eligen -------------------------------------------
def empezar_en(prob, nodo):
    """Castiga no estar en 'nodo' en el tiempo 1."""
    return QUBO(prob.n_qubits).agregar_constante(1.0).agregar_lineal(prob.q(nodo, 1), -1.0)


def terminar_en(prob, nodo):
    """Castiga no estar en 'nodo' en el ultimo tiempo."""
    return QUBO(prob.n_qubits).agregar_constante(1.0).agregar_lineal(prob.q(nodo, prob.T), -1.0)


def cerrar_camino(prob, i, j):
    """Castiga usar la arista i-j en cualquier sentido (camino cerrado)."""
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos[:-1]:
        Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), 1.0)
        Q.agregar_cuadratico(prob.q(j, t), prob.q(i, t + 1), 1.0)
    return Q


def visitar_antes(prob, a, b):
    """Castiga visitar b antes que a (por ejemplo tajo antes que chancadora)."""
    Q = QUBO(prob.n_qubits)
    for tb in prob.tiempos:
        for ta in prob.tiempos:
            if tb < ta:
                Q.agregar_cuadratico(prob.q(b, tb), prob.q(a, ta), 1.0)
    return Q


def sugerir_penalizacion(prob):
    """Un valor de A mayor que cualquier ahorro posible al romper reglas."""
    pesos = [d.get("weight", 1) for _, _, d in prob.grafo.edges(data=True)]
    return float((prob.T - 1) * max(pesos) + 1)


# ---- Armar el Hamiltoniano -------------------------------------------------
def armar_hamiltoniano(piezas):
    """piezas = {nombre: (peso, QUBO)}. Devuelve el QUBO total."""
    return sum(peso * Q for peso, Q in piezas.values())


catalogo = {
    "coste_distancia": coste_distancia,
    "un_lugar_por_tiempo": un_lugar_por_tiempo,
    "visitar_una_vez": visitar_una_vez,
    "visitar_al_menos_una_vez": visitar_al_menos_una_vez,
    "saltos_prohibidos": saltos_prohibidos,
    "empezar_en": empezar_en,
    "terminar_en": terminar_en,
    "cerrar_camino": cerrar_camino,
    "visitar_antes": visitar_antes,
}
if A is None:
    A = sugerir_penalizacion(prob)      # red minera: 12 · 1.7 + 1 = 21.4
piezas = {}
for nombre, args in piezas_activas:
    peso = 1.0 if nombre == "coste_distancia" else A
    clave = nombre + "".join(f"_{a}" for a in args)
    piezas[clave] = (peso, catalogo[nombre](prob, *args))

qubo = armar_hamiltoniano(piezas)
H, offset = qubo.a_ising()


# ## 2 · Ansatz: el circuito que propone las rutas


# ---- El ansatz propuesto ---------------------------------------------------
def ansatz(n_qubits, capas):
    """Capas de RY con entrelazamiento CZ en cadena, mas una capa final de RY."""
    from qiskit.circuit import ParameterVector
    th = ParameterVector("θ", n_qubits * (capas + 1))
    qc = QuantumCircuit(n_qubits)
    p = 0
    for _ in range(capas):
        for k in range(n_qubits):
            qc.ry(th[p], k)
            p += 1
        for k in range(n_qubits - 1):
            qc.cz(k, k + 1)
    for k in range(n_qubits):
        qc.ry(th[p], k)
        p += 1
    return qc


# ### ¿Por qué rotaciones R_Y?
# El Hamiltoniano solo tiene Z y ZZ: es diagonal en la base computacional, así que la respuesta es un estado de la base, una cadena de bits. Para llegar a cualquier cadena cada qubit debe poder pasar de |0⟩ a |1⟩. R_Y(θ) hace justo eso: cos(θ/2)|0⟩ + sin(θ/2)|1⟩. Una R_Z sobre |0⟩ solo agrega una fase y no cambia ninguna probabilidad.


# ### Amplitudes reales
# H es real y diagonal, entonces basta con estados de amplitudes reales. R_Y y CZ nunca crean fases complejas: el circuito explora solo esos estados y no gasta parámetros en fases que no cambian la energía.


# ### ¿Por qué entrelazar?
# Sin compuertas de dos qubits el estado es un producto y la energía queda multilineal en cos θ_k: su mínimo está en una esquina, cos θ_k = ±1, es decir, en una cadena de bits. Así que el campo medio también puede representar la ruta óptima; el entrelazamiento no hace falta para alcanzarla. Lo que cambia es el camino del optimizador: cada ruta válida es un mínimo local para movimientos de un qubit a la vez (pasar a otra ruta exige cambiar varios bits juntos y cada cambio suelto rompe una regla, que cuesta A). La cascada de CZ agrega direcciones correlacionadas que pueden ayudar a salir de esos mínimos. En el triángulo, desde 2000 arranques al azar, llegan al óptimo 35 % con CZ y 32 % sin CZ: ayuda, pero no lo garantiza.


# ### ¿Por qué una cascada de CZ?
# Los qubits del cuaderno están ordenados por tiempo: k = (t − 1)N + i. Con ese orden, unir cada qubit con el siguiente conecta los lugares de un mismo tiempo y, al pasar de x_N,t a x_1,t+1, un tiempo con el siguiente: la cadena sigue la estructura del Hamiltoniano. Ese argumento solo vale con el orden por tiempo; las matrices de Inicializar se muestran por lugar, k = (i − 1)T + t, que es la misma H con los índices permutados. Las holguras van al final de la cadena. Es además la conexión más barata: n − 1 compuertas de dos qubits por capa, solo entre vecinos.


# ### ¿Por qué CZ y una capa final de R_Y?
# CZ es simétrica y diagonal: no importa cuál qubit es el control. Por ser diagonal, una CZ justo antes de medir no cambia ninguna probabilidad; por eso el circuito termina con otra capa de R_Y, que convierte el entrelazamiento en diferencias medibles.


# ### El tamaño del ansatz
# Con n qubits y una capa hay n parámetros en la primera fila de R_Y, n en la última y n − 1 compuertas CZ. En la red minera, N = 8 y T = 13 dan 104 qubits de ruta más 8 × 3 = 24 de holgura: 128 qubits, 256 parámetros θ y 127 CZ.


# ### Escala y límites
# Con A ≈ 21,4 y distancias entre 0,035 y 1,7 km, las penalizaciones dominan el paisaje: distinguir dos rutas válidas depende de diferencias de décimas frente a saltos de 21. Por eso A no debe ser mayor que lo necesario (sugerir_penalizacion), y el Hamiltoniano se normaliza antes de optimizar. Aun así, 128 qubits con un ansatz hardware-efficient y 256 parámetros arriesgan barren plateaus (gradientes que se anulan) y COBYLA se vuelve lento. El triángulo (9 qubits) es donde el VQE se puede simular y validar; para la red, la referencia es clásica.


# ## 3 · Solver: VQE con COBYLA


# ---- resolver_vqe: preparar, energía E(θ), COBYLA desde varios arranques y lectura del estado ----
def resolver_vqe(qubo, capas=1, intentos=6, maxiter=300, semilla=1, candidatos=20):
    """VQE con COBYLA. Devuelve la mejor ruta entre los estados mas probables."""
    H, offset = qubo.a_ising()
    escala = max(np.max(np.abs(H.coeffs)), 1e-12)
    Hn = H / escala                          # normalizar ayuda al optimizador
    qc = ansatz(qubo.n, capas)
    rng = np.random.default_rng(semilla)
    def energia(theta):
        psi = Statevector(qc.assign_parameters(theta))
        return float(np.real(psi.expectation_value(Hn)))
    mejor = None
    historial = []
    for _ in range(intentos):
        theta0 = rng.uniform(0, 2 * np.pi, qc.num_parameters)
        hist = []
        res = minimize(energia, theta0, method="COBYLA",
                       callback=lambda th: hist.append(energia(th)),
                       options={"maxiter": maxiter})
        historial.append(np.array(hist) * escala + offset)
        if mejor is None or res.fun < mejor.fun:
            mejor = res
    psi = Statevector(qc.assign_parameters(mejor.x))
    probs = psi.probabilities()
    top = np.argsort(probs)[::-1][:candidatos]
    elegido = min(top, key=lambda s: qubo.energia(_entero_a_bits(int(s), qubo.n)))
    bits = _entero_a_bits(int(elegido), qubo.n)
    return {
        "bits": bits,
        "energia": qubo.energia(bits),
        "probabilidad": float(probs[elegido]),
        "energia_vqe": mejor.fun * escala + offset,
        "historial": historial,
        "probs": probs,
        "circuito": qc,
    }


# ## 4 · Validación: herramientas


# ---- Referencia exacta -----------------------------------------------------
def resolver_exacto(qubo, top=5):
    """Revisa los 2^n estados. Sirve como referencia para n pequeno."""
    e = qubo.energias_todas()
    orden = np.argsort(e, kind="stable")[:top]
    sols = [(_entero_a_bits(int(s), qubo.n), float(e[s])) for s in orden]
    return sols[0][0], sols[0][1], sols


def _entero_a_bits(s, n):
    return [(s >> k) & 1 for k in range(n)]


# ---- Bits → ruta y matriz x ------------------------------------------------
def bits_a_ruta(prob, bits):
    """Lista con el nodo activo en cada tiempo (None si no hay ninguno)."""
    ruta = []
    for t in prob.tiempos:
        activos = [i for i in prob.nodos if bits[prob.q(i, t)] == 1]
        ruta.append(activos[0] if len(activos) == 1 else (activos or None))
    return ruta


def matriz_x(prob, bits):
    """Matriz nodos x tiempos con los valores de x(i,t)."""
    return np.array([[bits[prob.q(i, t)] for t in prob.tiempos] for i in prob.nodos])


# ---- Dibujar la ruta -------------------------------------------------------
def dibujar_ruta(prob, ruta, posiciones=None, titulo="Ruta"):
    """Dibuja el grafo con sus distancias y resalta los tramos de la ruta."""
    G = prob.grafo
    pos = posiciones or nx.spring_layout(G, seed=1)
    plt.figure(figsize=(6, 4))
    nx.draw_networkx(G, pos, node_color="#F2EEE6", edgecolors="#1B2A4A", node_size=700)
    nx.draw_networkx_edge_labels(G, pos, edge_labels=nx.get_edge_attributes(G, "weight"), font_size=8)
    tramos = [(a, b) for a, b in zip(ruta, ruta[1:])
              if isinstance(a, int) and isinstance(b, int) and G.has_edge(a, b)]
    nx.draw_networkx_edges(G, pos, edgelist=tramos, width=3, edge_color="#C8A96E")
    plt.title(titulo)
    plt.axis("off")
    plt.show()


# ---- Desglose por pieza ----------------------------------------------------
def desglose(piezas, bits):
    """Valor de cada pieza para una solucion, con y sin su peso."""
    print(f"{'pieza':<26}{'peso':>10}{'valor':>10}{'aporte':>12}")
    total = 0.0
    for nombre, (peso, Q) in piezas.items():
        v = Q.energia(bits)
        total += peso * v
        print(f"{nombre:<26}{peso:>10.1f}{v:>10.1f}{peso * v:>12.1f}")
    print(f"{'TOTAL':<26}{'':>10}{'':>10}{total:>12.1f}")


# ---- Referencia clásica: 7,314 km · funciones ------------------------------
def ruta_a_bits(prob, ruta):
    """Bits de una ruta (lugar en cada tiempo), con sus holguras s_i = visitas - 1."""
    m = bits_holgura(prob)
    bits = [0] * (prob.n_qubits + prob.N * m)
    for t, i in enumerate(ruta, start=1):
        bits[prob.q(i, t)] = 1
    for i in prob.nodos:
        s = ruta.count(i) - 1
        for b in range(m):
            bits[holgura(prob, i, b)] = (s >> b) & 1
    return bits


# ## 5 · Correr: referencia, exacto y VQE


# ---- Referencia clásica: 7,314 km ------------------------------------------
if not CASO_TRIANGULO:
    # La red es un arbol con un ciclo central 1-2-8-5-1:
    #   ciclo 1.6 + 1.4 + 1.0 + 1.7 = 5.7 km
    #   hojas ida y vuelta 2 · (0.072 + 0.035 + 0.2 + 0.5) = 1.614 km
    ruta_ref = [1, 2, 3, 2, 4, 2, 8, 5, 6, 5, 7, 5, 1]      # 13 pasos = T
    d_ref = sum(prob.distancia(a, b) for a, b in zip(ruta_ref, ruta_ref[1:]))
    print(f"Distancia de referencia: {d_ref:.3f} km")       # 7.314
    desglose(piezas, ruta_a_bits(prob, ruta_ref))          # todas las restricciones en 0


# ---- VQE contra el exacto --------------------------------------------------
if USAR_EXACTO:
    bits_ex, E_ex, mejores = resolver_exacto(qubo, top=5)
    print("Mejores soluciones (metodo exacto):")
    for b, e in mejores:
        print(f"  ruta {bits_a_ruta(prob, b)}   energia {e:.1f}")
    print()
    desglose(piezas, bits_ex)
    dibujar_ruta(prob, bits_a_ruta(prob, bits_ex), posiciones, "Ruta exacta")


# ---- Correr el VQE ---------------------------------------------------------
if USAR_VQE:
    res = resolver_vqe(qubo)
    ruta_vqe = bits_a_ruta(prob, res["bits"])
    print("Ruta VQE:", ruta_vqe)
    print(f"Energia: {res['energia']:.1f}   Probabilidad del estado: {res['probabilidad']:.3f}")
    print("Matriz x(i,t), filas = nodos, columnas = tiempos")
    print(matriz_x(prob, res["bits"]))
    print()
    desglose(piezas, res["bits"])

    plt.figure(figsize=(5, 3))
    for h in res["historial"]:
        plt.plot(h)
    plt.xlabel("iteracion"); plt.ylabel("energia"); plt.title("Convergencia del VQE")
    plt.show()
    dibujar_ruta(prob, ruta_vqe, posiciones, "Ruta VQE")

    if USAR_EXACTO:
        print("Coincide con el exacto:", np.isclose(res["energia"], E_ex))


# ## 6 · Resultado: los 8 lugares de la mina
# Las hojas 3, 4, 6 y 7 pasan a un costo fijo de ida y vuelta (1,614 km) y el núcleo 1, 2, 5, 8 se completa con las distancias mínimas. El QUBO reducido tiene 16 qubits: el exacto revisa sus 65 536 estados y el VQE usa el mismo ansatz. Resultado: 7,314 km en 13 pasos.


# ---- A · Reducción: hojas colapsadas y cierre métrico ----------------------
# ---------- Reducción: hojas colapsadas + cierre métrico ----------
aristas = aristas_mina
grafo = nx.Graph()
grafo.add_weighted_edges_from(aristas)

hojas  = [v for v in grafo.nodes if grafo.degree(v) == 1]      # 3, 4, 6, 7
nucleo = sorted(v for v in grafo.nodes if v not in hojas)       # 1, 2, 5, 8

# Costo fijo de las excursiones: ida y vuelta de cada hoja a su nodo vecino
hub_de = {h: next(iter(grafo[h])) for h in hojas}
costo_hojas = sum(2 * grafo[h][hub_de[h]]["weight"] for h in hojas)   # 1.614

# Cierre métrico: distancia mínima entre pares del núcleo (grafo completo)
d = dict(nx.all_pairs_dijkstra_path_length(grafo))
grafo_red = nx.Graph()
for i, j in itertools.combinations(nucleo, 2):
    grafo_red.add_edge(i, j, weight=d[i][j])

T_red = len(nucleo)              # 4 tiempos
A = 10                           # cualquier violación cuesta >= A; la mejor ruta válida cuesta 5.7
base = 1
prob = Problema(grafo_red, T=T_red)
print(prob.n_qubits, "qubits | núcleo:", nucleo, "| hojas:", hojas, "| costo hojas:", costo_hojas)


# ---- B · Pieza de cierre y Hamiltoniano reducido ---------------------------
def coste_cierre(prob, base, d):
    """Σ_i d(i, base) · x(i, T): costo de volver a la base desde el último lugar."""
    Q = QUBO(prob.n_qubits)
    for i in prob.nodos:
        if i != base:
            Q.agregar_lineal(prob.q(i, prob.T), d[i][base])
    return Q

piezas = {
    "coste_distancia":     (1.0, coste_distancia(prob)),
    "coste_cierre":        (1.0, coste_cierre(prob, base, d)),
    "un_lugar_por_tiempo": (A,   un_lugar_por_tiempo(prob)),
    "visitar_una_vez":     (A,   visitar_una_vez(prob)),
    "empezar_en_1":        (A,   empezar_en(prob, base)),
}
# saltos_prohibidos y terminar_en ya no hacen falta: el grafo es completo y el cierre es un costo.
qubo = armar_hamiltoniano(piezas)
H, offset = qubo.a_ising()


# ---- C · Exacto: los 65 536 estados ----------------------------------------
def decodificar(prob, idx):
    bits = [(idx >> k) & 1 for k in range(prob.n_qubits)]
    return [[prob.var(k)[0] for k in range(prob.n_qubits) if bits[k] and prob.var(k)[1] == t]
            for t in prob.tiempos]

e = qubo.energias_todas()                      # bit k del índice = qubit k
E_min = e.min()
optimos = np.flatnonzero(np.isclose(e, E_min))
print("E mínima:", E_min, "| total con hojas:", E_min + costo_hojas)
for idx in optimos:
    print(decodificar(prob, idx))


# ---- Validación: fórmulas cerradas y H(z) = Q(x) ---------------------------
def cerrada(prob, d, base, A):
    """cte, h, J de las fórmulas cerradas (orden k = (t-1)N + p)."""
    N, T, nodos = prob.N, prob.T, prob.nodos
    D = np.array([[0.0 if i == j else d[i][j] for j in nodos] for i in nodos])
    I, U = np.eye(N), np.ones((N, N))
    J = np.zeros((N*T, N*T)); h = np.zeros(N*T)
    for t in range(T):
        sl = slice(t*N, (t+1)*N)
        J[sl, sl] = (A/2) * (U - I)
        for t2 in range(t+1, T):
            s2 = slice(t2*N, (t2+1)*N)
            B = (A/2) * I + (D/4 if t2 == t+1 else 0)
            J[sl, s2] = B
            J[s2, sl] = B.T
    a = D.sum(axis=1)
    for t in range(1, T+1):
        for p, i in enumerate(nodos):
            k = prob.q(i, t)
            h[k] = A*(2 - (N+T)/2) - (a[p]/4)*((t < T) + (t > 1))
            if t == T and i != base:
                h[k] -= d[i][base]/2
            if t == 1 and i == base:
                h[k] += A/2
    cte = ((T-1)/4)*D.sum() + sum(d[i][base] for i in nodos if i != base)/2 \
          + A*(T*(N**2-3*N+4)/4 + N*(T**2-3*T+4)/4 + 0.5)
    return cte, h, J

cte, h, J = cerrada(prob, d, base, A)
print("offset de a_ising vs cte:", offset, cte)          # ambos 182.7

# 1) Espectro completo: H(z) = Q(x) en los 2^16 estados
n = prob.n_qubits
bits = (np.arange(2**n, dtype=np.int64)[:, None] >> np.arange(n)) & 1
Z = 1 - 2*bits
E_z = cte + Z @ h + 0.5*np.einsum("si,ij,sj->s", Z, J, Z)
print("máx |H(z) - Q(x)| en los 65536 estados:", np.abs(E_z - qubo.energias_todas()).max())

# 2) Tres rutas: la óptima, una que rompe la regla de lugar y otra la de tiempo
def x_de(prob, estados):
    x = np.zeros(prob.n_qubits, dtype=int)
    for t, nodos_t in enumerate(estados, start=1):
        for i in nodos_t:
            x[prob.q(i, t)] = 1
    return x

casos = {"óptima":    [[1], [2], [8], [5]],
         "espacial":  [[1], [2], [1], [5]],
         "temporal":  [[1, 2], [8], [], [5]]}
for nombre, est in casos.items():
    x = x_de(prob, est); z = 1 - 2*x
    print(f"{nombre}: Q = {qubo.energia(x):.3f} | H = {cte + h@z + 0.5*z@J@z:.3f} | "
          f"h·z = {h@z:.2f} | zJz/2 = {0.5*z@J@z:.2f}")


# ---- D · VQE con el ansatz del cuaderno (Statevector) ----------------------
def vqe(qubo, capas=2, arranques=5, maxiter=1500, semilla=0):
    n = qubo.n
    e = qubo.energias_todas()
    qc = ansatz(n, capas)
    npar = len(qc.parameters)
    def f(theta):                                  # H es diagonal: E = p · e
        p = Statevector(qc.assign_parameters(theta)).probabilities()
        return float(p @ e)
    rng = np.random.default_rng(semilla)
    mejor = None
    for r in range(arranques):
        x0 = rng.uniform(0, 2 * np.pi, npar)
        res = minimize(f, x0, method="COBYLA", options={"maxiter": maxiter, "rhobeg": 0.5})
        print(f"arranque {r}: E = {res.fun:.4f}")
        if mejor is None or res.fun < mejor.fun:
            mejor = res
    p = Statevector(qc.assign_parameters(mejor.x)).probabilities()
    return mejor, p, e

# Consistencia entre el diagonal y el SparsePauliOp (con un θ cualquiera)
qc_t = ansatz(prob.n_qubits, 1)
th = np.random.default_rng(1).uniform(0, 2 * np.pi, len(qc_t.parameters))
sv = Statevector(qc_t.assign_parameters(th))
print(np.isclose(sv.expectation_value(H).real + offset, sv.probabilities() @ e))   # True

res, p, e = vqe(qubo)
top = int(np.argmax(p))
print("VQE: E =", res.fun, "| estado más probable:", decodificar(prob, top),
      "| E(estado) =", e[top], "| P =", p[top])
print("P de los óptimos exactos:", p[optimos].sum())


# ---- E · La ruta de 13 pasos -----------------------------------------------
def expandir(ruta_nucleo):
    """Ruta del núcleo (cerrada) -> caminata completa con excursiones a las hojas."""
    ruta = ruta_nucleo + [ruta_nucleo[0]]
    camino = [ruta[0]]
    for a, b in zip(ruta, ruta[1:]):
        camino += nx.shortest_path(grafo, a, b, weight="weight")[1:]
    out, hecho = [], set()
    for v in camino:
        out.append(v)
        if v not in hecho:
            hecho.add(v)
            for h in hojas:
                if hub_de[h] == v:
                    out += [h, v]          # ida y vuelta a la hoja
    return out

for idx in optimos:
    ruta_nuc = [t[0] for t in decodificar(prob, int(idx))]
    ruta = expandir(ruta_nuc)
    km = sum(grafo[a][b]["weight"] for a, b in zip(ruta, ruta[1:]))
    print(ruta, "|", len(ruta), "pasos |", round(km, 3), "km")
