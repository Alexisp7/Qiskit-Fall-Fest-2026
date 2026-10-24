"""Solución final del Track 2 · Qiskit Fall Fest 2026.

La ruta más corta para recorrer los 8 lugares de la mina Orcopampa, saliendo de
la planta (x1) y volviendo a ella, calculada de punta a punta:

  1. Reducción exacta: las hojas 3, 4, 6 y 7 pasan a un costo fijo de ida y vuelta
     y el núcleo 1, 2, 5, 8 se completa con las distancias mínimas (cierre métrico).
  2. QUBO reducido de 16 qubits (4 lugares × 4 tiempos) y su Hamiltoniano de Ising.
  3. Fórmulas cerradas de c, h y J, y la comprobación H(z) = Q(x) en los 2^16 estados.
  4. Método exacto: los 65 536 estados.
  5. VQE con el ansatz del cuaderno: RY(θ) → cascada de CZ → RY(φ), con COBYLA.
  6. La ruta de 13 pasos y su costo.

Uso:
    python solucion_final.py                  # VQE con 1 capa y 5 arranques (unos 15 min)
    python solucion_final.py --capas 1 2      # también con 2 capas (unos 30 min en total)
    python solucion_final.py --rapido         # 1 arranque corto: comprueba que todo corre
    python solucion_final.py --sin-vqe        # solo reducción, Ising, exacto y ruta

Resultado esperado: E mínima del núcleo = 5,7; con las hojas, 7,314 km;
ruta 1 → 2 → 3 → 2 → 4 → 2 → 8 → 5 → 6 → 5 → 7 → 5 → 1 (13 pasos).
"""
import argparse
import itertools
import time
from collections import defaultdict

import networkx as nx
import numpy as np
from qiskit import QuantumCircuit
from qiskit.circuit import ParameterVector
from qiskit.quantum_info import SparsePauliOp, Statevector
from scipy.optimize import minimize

# ---------- Datos: la red minera de Orcopampa (distancias en km) ----------
ARISTAS = [
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
NOMBRE = {1: "Planta", 2: "J1", 3: "Tajo", 4: "Botadero", 5: "J2", 6: "Lixiviación", 7: "Baja ley", 8: "Relaves"}
BASE = 1          # se sale y se vuelve a la planta
A = 10            # toda violación cuesta >= A; la mejor ruta válida del núcleo cuesta 5,7


# ---------- Las clases del cuaderno ----------
class Problema:
    """Guarda el grafo, los tiempos y el mapa (nodo, tiempo) -> qubit."""

    def __init__(self, grafo, T=None):
        self.grafo = grafo
        self.nodos = sorted(grafo.nodes)
        self.N = len(self.nodos)
        self.T = T if T is not None else self.N
        self.tiempos = list(range(1, self.T + 1))
        self.n_qubits = self.N * self.T
        self._pos = {nodo: p for p, nodo in enumerate(self.nodos)}   # qubit k = (t-1)*N + posición

    def q(self, nodo, t):
        return (t - 1) * self.N + self._pos[nodo]

    def var(self, k):
        return self.nodos[k % self.N], k // self.N + 1

    def distancia(self, i, j):
        return self.grafo[i][j].get("weight", 1) if self.grafo.has_edge(i, j) else None


class QUBO:
    """Polinomio cuadrático en variables binarias: constante + lineales + cuadráticos."""

    def __init__(self, n):
        self.n = n
        self.constante = 0.0
        self.lin = defaultdict(float)
        self.quad = defaultdict(float)

    def agregar_constante(self, c):
        self.constante += c
        return self

    def agregar_lineal(self, k, c):
        self.lin[k] += c
        return self

    def agregar_cuadratico(self, k, l, c):
        if k == l:
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

    def energia(self, x):
        x = np.asarray(x)
        return float(self.constante + sum(c * x[k] for k, c in self.lin.items())
                     + sum(c * x[k] * x[l] for (k, l), c in self.quad.items()))

    def energias_todas(self):
        idx = np.arange(2 ** self.n, dtype=np.int64)
        bits = (idx[:, None] >> np.arange(self.n)) & 1     # bit k del índice = qubit k
        e = np.full(2 ** self.n, self.constante, dtype=float)
        for k, c in self.lin.items():
            e += c * bits[:, k]
        for (k, l), c in self.quad.items():
            e += c * bits[:, k] * bits[:, l]
        return e

    def a_ising(self):
        """(H, offset) con H un SparsePauliOp y x_k = (1 - Z_k)/2."""
        offset = self.constante
        z, zz = defaultdict(float), defaultdict(float)
        for k, c in self.lin.items():
            offset += c / 2
            z[k] -= c / 2
        for (k, l), c in self.quad.items():
            offset += c / 4
            z[k] -= c / 4
            z[l] -= c / 4
            zz[(k, l)] += c / 4
        terminos = [("Z", [k], c) for k, c in z.items() if abs(c) > 1e-12]
        terminos += [("ZZ", [k, l], c) for (k, l), c in zz.items() if abs(c) > 1e-12]
        return SparsePauliOp.from_sparse_list(terminos or [("", [], 0.0)], num_qubits=self.n), offset


# ---------- Las piezas del Hamiltoniano ----------
def coste_distancia(prob):
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos[:-1]:
        for i in prob.nodos:
            for j in prob.nodos:
                d = prob.distancia(i, j)
                if i != j and d is not None:
                    Q.agregar_cuadratico(prob.q(i, t), prob.q(j, t + 1), d)
    return Q


def un_lugar_por_tiempo(prob):
    Q = QUBO(prob.n_qubits)
    for t in prob.tiempos:
        Q.agregar_cuadrado({prob.q(i, t): -1.0 for i in prob.nodos}, c0=1.0)
    return Q


def visitar_una_vez(prob):
    Q = QUBO(prob.n_qubits)
    for i in prob.nodos:
        Q.agregar_cuadrado({prob.q(i, t): -1.0 for t in prob.tiempos}, c0=1.0)
    return Q


def empezar_en(prob, nodo):
    return QUBO(prob.n_qubits).agregar_constante(1.0).agregar_lineal(prob.q(nodo, 1), -1.0)


def coste_cierre(prob, base, d):
    """Σ_i d(i, base) · x(i, T): costo de volver a la base desde el último lugar."""
    Q = QUBO(prob.n_qubits)
    for i in prob.nodos:
        if i != base:
            Q.agregar_lineal(prob.q(i, prob.T), d[i][base])
    return Q


def ansatz(n_qubits, capas):
    """Capas de RY(θ) con entrelazamiento CZ en cadena, más una capa final de RY(φ)."""
    th = ParameterVector("θ", n_qubits * capas)   # ángulos de las capas con la cascada de CZ
    ph = ParameterVector("φ", n_qubits)           # ángulos de la capa final
    qc = QuantumCircuit(n_qubits)
    p = 0
    for _ in range(capas):
        for k in range(n_qubits):
            qc.ry(th[p], k)
            p += 1
        for k in range(n_qubits - 1):
            qc.cz(k, k + 1)
    for k in range(n_qubits):
        qc.ry(ph[k], k)
    return qc   # qc.parameters ordena primero los θ y luego los φ


# ---------- Utilidades ----------
def titulo(texto):
    print("\n" + "=" * 72 + "\n" + texto + "\n" + "=" * 72)


def decodificar(prob, idx):
    bits = [(idx >> k) & 1 for k in range(prob.n_qubits)]
    return [[prob.var(k)[0] for k in range(prob.n_qubits) if bits[k] and prob.var(k)[1] == t] for t in prob.tiempos]


def x_de(prob, estados):
    x = np.zeros(prob.n_qubits, dtype=int)
    for t, nodos_t in enumerate(estados, start=1):
        for i in nodos_t:
            x[prob.q(i, t)] = 1
    return x


def cerrada(prob, d, base, A):
    """cte, h, J de las fórmulas cerradas (orden k = (t-1)N + p)."""
    N, T, nodos = prob.N, prob.T, prob.nodos
    D = np.array([[0.0 if i == j else d[i][j] for j in nodos] for i in nodos])
    I, U = np.eye(N), np.ones((N, N))
    J = np.zeros((N * T, N * T))
    h = np.zeros(N * T)
    for t in range(T):
        sl = slice(t * N, (t + 1) * N)
        J[sl, sl] = (A / 2) * (U - I)
        for t2 in range(t + 1, T):
            s2 = slice(t2 * N, (t2 + 1) * N)
            B = (A / 2) * I + (D / 4 if t2 == t + 1 else 0)
            J[sl, s2] = B
            J[s2, sl] = B.T
    a = D.sum(axis=1)
    for t in range(1, T + 1):
        for p, i in enumerate(nodos):
            k = prob.q(i, t)
            h[k] = A * (2 - (N + T) / 2) - (a[p] / 4) * ((t < T) + (t > 1))
            if t == T and i != base:
                h[k] -= d[i][base] / 2
            if t == 1 and i == base:
                h[k] += A / 2
    cte = ((T - 1) / 4) * D.sum() + sum(d[i][base] for i in nodos if i != base) / 2 \
        + A * (T * (N ** 2 - 3 * N + 4) / 4 + N * (T ** 2 - 3 * T + 4) / 4 + 0.5)
    return cte, h, J


def vqe(qubo, e, capas, arranques, maxiter, semilla=0):
    """VQE con Statevector: E(θ, φ) = p(θ, φ) · e, porque H es diagonal."""
    qc = ansatz(qubo.n, capas)

    def f(angulos):                     # angulos = (θ, φ): primero los θ, luego los φ
        return float(Statevector(qc.assign_parameters(angulos)).probabilities() @ e)

    rng = np.random.default_rng(semilla)
    finales, mejor = [], None
    for r in range(arranques):
        angulos0 = rng.uniform(0, 2 * np.pi, qc.num_parameters)
        t0 = time.time()
        res = minimize(f, angulos0, method="COBYLA", options={"maxiter": maxiter, "rhobeg": 0.5})
        finales.append(res.fun)
        print(f"  arranque {r}: E = {res.fun:.4f}  ({res.nfev} evaluaciones, {time.time() - t0:.0f} s)", flush=True)
        if mejor is None or res.fun < mejor.fun:
            mejor = res
    p = Statevector(qc.assign_parameters(mejor.x)).probabilities()
    return qc, mejor, p, finales


def expandir(grafo, hojas, hub_de, ruta_nucleo):
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
                    out += [h, v]
    return out


def main():
    ap = argparse.ArgumentParser(description="Solución final del Track 2: la ruta de los 8 lugares de la mina.")
    ap.add_argument("--capas", type=int, nargs="+", default=[1], help="capas del ansatz para el VQE (por defecto 1)")
    ap.add_argument("--arranques", type=int, default=5)
    ap.add_argument("--maxiter", type=int, default=1500)
    ap.add_argument("--rapido", action="store_true", help="1 arranque de 200 iteraciones, para comprobar que todo corre")
    ap.add_argument("--sin-vqe", action="store_true")
    args = ap.parse_args()
    if args.rapido:
        args.arranques, args.maxiter = 1, 200

    # 1 · reducción exacta
    titulo("1 · Reducción exacta: hojas colapsadas y cierre métrico")
    grafo = nx.Graph()
    grafo.add_weighted_edges_from(ARISTAS)
    hojas = [v for v in grafo.nodes if grafo.degree(v) == 1]
    nucleo = sorted(v for v in grafo.nodes if v not in hojas)
    hub_de = {h: next(iter(grafo[h])) for h in hojas}
    costo_hojas = sum(2 * grafo[h][hub_de[h]]["weight"] for h in hojas)
    d = dict(nx.all_pairs_dijkstra_path_length(grafo))
    grafo_red = nx.Graph()
    for i, j in itertools.combinations(nucleo, 2):
        grafo_red.add_edge(i, j, weight=d[i][j])
    print("hojas:", hojas, "| vecino de cada hoja:", hub_de)
    print(f"costo fijo de las hojas (ida y vuelta): {costo_hojas:.3f} km")
    print("núcleo:", nucleo, "| distancias mínimas d_ij (km):")
    print("      " + "".join(f"{j:>7}" for j in nucleo))
    for i in nucleo:
        print(f"  {i:>3} " + "".join(f"{d[i][j]:>7.1f}" for j in nucleo))

    # 2 · QUBO reducido
    titulo("2 · QUBO reducido y Hamiltoniano de Ising")
    prob = Problema(grafo_red, T=len(nucleo))
    piezas = {
        "coste_distancia": (1.0, coste_distancia(prob)),
        "coste_cierre": (1.0, coste_cierre(prob, BASE, d)),
        "un_lugar_por_tiempo": (A, un_lugar_por_tiempo(prob)),
        "visitar_una_vez": (A, visitar_una_vez(prob)),
        "empezar_en_1": (A, empezar_en(prob, BASE)),
    }
    qubo = sum(peso * Q for peso, Q in piezas.values())
    H, offset = qubo.a_ising()
    print(f"{prob.n_qubits} qubits ({prob.N} lugares × {prob.T} tiempos), A = {A}")
    print(f"H: {len(H)} términos de Pauli (Z y ZZ), offset = {offset:.4f}")

    # 3 · fórmulas cerradas y comprobación
    titulo("3 · Fórmulas cerradas de c, h y J, y H(z) = Q(x)")
    cte, h, J = cerrada(prob, d, BASE, A)
    print(f"c (fórmula) = {cte:.4f} | offset de a_ising = {offset:.4f}")
    print("h por tiempo (columnas = nodos " + ", ".join(map(str, nucleo)) + "):")
    for t in prob.tiempos:
        print(f"  t = {t}: " + "  ".join(f"{h[prob.q(i, t)]:>8.3f}" for i in nucleo))
    e = qubo.energias_todas()
    n = prob.n_qubits
    Z = 1 - 2 * ((np.arange(2 ** n, dtype=np.int64)[:, None] >> np.arange(n)) & 1)
    E_z = cte + Z @ h + 0.5 * np.einsum("si,ij,sj->s", Z, J, Z)
    print(f"máx |H(z) − Q(x)| en los {2 ** n} estados: {np.abs(E_z - e).max():.2e}")
    for nombre, est in {"óptima 1→2→8→5": [[1], [2], [8], [5]],
                        "rompe la regla de lugar 1→2→1→5": [[1], [2], [1], [5]],
                        "rompe la regla de tiempo": [[1, 2], [8], [], [5]]}.items():
        x = x_de(prob, est)
        z = 1 - 2 * x
        print(f"  {nombre:<34} Q = {qubo.energia(x):7.3f} | c + hᵀz + Σ J z z = {cte:.1f} {h @ z:+.2f} {0.5 * z @ J @ z:+.2f} = {cte + h @ z + 0.5 * z @ J @ z:.3f}")

    # 4 · exacto
    titulo("4 · Método exacto: los 65 536 estados")
    E_min = e.min()
    optimos = np.flatnonzero(np.isclose(e, E_min))
    print(f"E mínima = {E_min:.4f} | con las hojas: {E_min + costo_hojas:.3f} km")
    validos = []
    for idx in range(2 ** n):
        r = decodificar(prob, idx)
        if all(len(t) == 1 for t in r) and len({t[0] for t in r}) == prob.N and r[0] == [BASE]:
            validos.append((e[idx], [t[0] for t in r]))
    print("los ciclos válidos del núcleo desde la planta:")
    for costo, ciclo in sorted(validos):
        print(f"  {' → '.join(map(str, ciclo + [ciclo[0]])):<22} {costo:.1f} km" + ("   ← óptimo" if np.isclose(costo, E_min) else ""))

    # 5 · VQE
    resultados_vqe = []
    if not args.sin_vqe:
        titulo("5 · VQE con el ansatz RY(θ) → CZ → RY(φ) y COBYLA")
        qc_t = ansatz(n, 1)
        sv = Statevector(qc_t.assign_parameters(np.random.default_rng(1).uniform(0, 2 * np.pi, qc_t.num_parameters)))
        print("valor esperado del SparsePauliOp == p · e:", bool(np.isclose(sv.expectation_value(H).real + offset, sv.probabilities() @ e)))
        for capas in args.capas:
            qc = ansatz(n, capas)
            nth = n * capas
            print(f"\n{capas} capa(s): {nth} ángulos θ + {n} ángulos φ = {qc.num_parameters} parámetros · "
                  f"{args.arranques} arranques · maxiter = {args.maxiter}")
            qc, mejor, p, finales = vqe(qubo, e, capas, args.arranques, args.maxiter)
            top = int(np.argmax(p))
            p_opt = float(p[optimos].sum())
            print(f"  mejor E = {mejor.fun:.4f} | estado más probable: {decodificar(prob, top)} (E = {e[top]:.1f}, P = {p[top]:.4f})")
            print(f"  probabilidad de las rutas óptimas: {p_opt:.4f} | arranques que llegan a 5,7: {sum(np.isclose(f, E_min, atol=0.05) for f in finales)} de {len(finales)}")
            resultados_vqe.append((capas, mejor.fun, decodificar(prob, top), p_opt))

    # 6 · la ruta de 13 pasos
    titulo("6 · La ruta de 13 pasos")
    for idx in optimos:
        ruta_nuc = [t[0] for t in decodificar(prob, int(idx))]
        ruta = expandir(grafo, hojas, hub_de, ruta_nuc)
        km = sum(grafo[a][b]["weight"] for a, b in zip(ruta, ruta[1:]))
        print(f"núcleo {ruta_nuc} → {' → '.join(map(str, ruta))}  ({len(ruta)} pasos, {km:.3f} km)")

    titulo("Resultado")
    ruta_nuc = [t[0] for t in decodificar(prob, int(optimos[-1]))]
    ruta = expandir(grafo, hojas, hub_de, ruta_nuc)
    print(f"Distancia mínima: {E_min + costo_hojas:.3f} km = {E_min:.1f} (núcleo) + {costo_hojas:.3f} (hojas)")
    print("Ruta: " + " → ".join(map(str, ruta)))
    print("      " + " → ".join(NOMBRE[v] for v in ruta))
    for capas, E, est, p_opt in resultados_vqe:
        print(f"VQE ({capas} capa{'s' if capas > 1 else ''}): E = {E:.4f}, estado {est}, probabilidad de las rutas óptimas {p_opt:.4f}")


if __name__ == "__main__":
    main()
