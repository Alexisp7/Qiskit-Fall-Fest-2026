# Qiskit Fall Fest 2026 · Track 2

**Optimización de rutas y conexiones mediante algoritmos cuánticos.** Sitio de referencia y didáctico del hackathon: el reto, el caso real de la mina Orcopampa y la solución con QUBO y VQE.

Sitio: https://qiskit-fall-fest-2026-iuhx.vercel.app

## El código de la solución

Está en [`codigo/`](codigo): un notebook ejecutable ([`rutas_qubo_vqe.ipynb`](codigo/rutas_qubo_vqe.ipynb)), el mismo código como script y sus dependencias. **La solución final del track** está en [`codigo/solucion_final.py`](codigo/solucion_final.py): resuelve los 8 lugares de la mina (7,314 km, 13 pasos) de punta a punta. Las instrucciones están en [`codigo/README.md`](codigo/README.md).

## Estructura del repositorio

```
├── index.html          Portada
├── problemas.html      El reto y el caso real: la red minera de Orcopampa
├── solucion.html       La solución: inicializar, ansatz, solver y validación
├── equipo.html         El equipo
├── preguntas.html      Preguntas del público
├── codigo/             Notebook, script y solucion_final.py (la solución final del track)
├── api/
│   └── preguntas.js    Función de Vercel: guarda y lista las preguntas (Upstash Redis)
├── js/
│   ├── qubits.js               Portada: teselado de qubits, QFT y medición
│   ├── caso-minero.js          Problemas: mapa, grafo, pasos de la ruta y optimizador
│   ├── problemas.js            Problemas: ejemplos rápidos de trayectoria mínima
│   ├── solucion.js             Solución: las cuatro etapas
│   ├── solucion-celdas.js      Celdas del cuaderno (la fuente de codigo/)
│   ├── solucion-cuaderno.js    El cuaderno interactivo y las matrices J y h
│   ├── solucion-derivacion.js  De QUBO a Ising, paso a paso
│   ├── solucion-ansatz.js      El ansatz y el VQE en matemáticas, con simulación en vivo
│   └── preguntas.js            Formulario y lista de preguntas
└── img/                Imágenes (mina, equipo)
```

## Ver el sitio en local

```bash
python -m http.server 8765
```

y abrir http://localhost:8765. Las preguntas necesitan la función de `api/`, que corre en Vercel con un almacén Upstash Redis conectado (variables `KV_REST_API_URL` y `KV_REST_API_TOKEN`).

## Equipo

- Ronaldo Alexis Salvatierra Baldeón (UNMSM)
- Edward Criths Galindo Gutiérrez (UNMSM)
- Paul Miguel Reyes Díaz (UNI)
- Hernán Duval Esteban Prado (UNI)
