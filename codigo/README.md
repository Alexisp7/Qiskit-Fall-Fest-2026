# Código: rutas con QUBO y VQE

El cuaderno de la página [Solución](https://qiskit-fall-fest-2026-iuhx.vercel.app/solucion.html), en orden y listo para correr.

| Archivo | Qué es |
|---|---|
| [`rutas_qubo_vqe.ipynb`](rutas_qubo_vqe.ipynb) | Notebook de Jupyter con las cinco partes y sus explicaciones |
| [`rutas_qubo_vqe.py`](rutas_qubo_vqe.py) | El mismo código como un script de Python |
| [`requirements.txt`](requirements.txt) | Librerías que necesita |

## Cómo correrlo

```bash
pip install -r requirements.txt
jupyter notebook rutas_qubo_vqe.ipynb
```

o, sin Jupyter:

```bash
python rutas_qubo_vqe.py
```

## Las seis partes

1. **Inicializar.** La red minera de Orcopampa (8 lugares, 9 caminos, T = 13) se escribe como un QUBO armado por piezas: distancia, un lugar por tiempo, visitar al menos una vez (con variables de holgura), saltos prohibidos, partir y terminar en la planta. Luego pasa a un Hamiltoniano de Ising con x = (1 − z)/2.
2. **Ansatz.** Una capa de R<sub>Y</sub>(θ), una cascada de CZ entre vecinos y una capa final de R<sub>Y</sub>.
3. **Solver.** `resolver_vqe` minimiza ⟨ψ(θ)|H|ψ(θ)⟩ con COBYLA desde varios arranques al azar.
4. **Validación.** Método exacto (para n pequeño), lectura de la ruta, desglose por pieza y dibujo.
5. **Correr.** La referencia clásica, el exacto y el VQE.
6. **Resultado: los 8 lugares.** Las hojas pasan a un costo fijo (1,614 km) y el núcleo 1, 2, 5, 8 se completa con las distancias mínimas: 16 qubits. El exacto revisa los 65 536 estados (E = 5,7), se comprueba H(z) = Q(x) con fórmulas cerradas, el VQE con el mismo ansatz llega a 5,7 y la ruta se expande a 13 pasos: **7,314 km**. El VQE de esta parte tarda unos minutos.

## Dos casos

| Caso | Qubits | Qué se puede correr | Resultado |
|---|---|---|---|
| Red minera (por defecto) | 128 (104 de ruta + 24 de holgura) | Armar el Hamiltoniano y validar la ruta de referencia | 1 → 2 → 3 → 2 → 4 → 2 → 8 → 5 → 6 → 5 → 7 → 5 → 1, **7,314 km**, todas las restricciones en 0 |
| Triángulo: `CASO_TRIANGULO = True` | 9 | También el método exacto y el VQE | Ruta 1 → 2 → 3, energía 12; el VQE coincide con el exacto |

Con 128 qubits no se pueden enumerar los 2<sup>128</sup> estados ni simular el estado con `Statevector`, por eso en la red minera el exacto y el VQE están apagados (`USAR_EXACTO`, `USAR_VQE`).
