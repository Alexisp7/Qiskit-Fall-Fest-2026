// Circuito del equipo: cada integrante es un qubit. Una H en q0 y una
// cadena de CNOT (q0→q1→q2→q3) preparan el estado GHZ
// (|0000⟩ + |1111⟩)/√2. Un pulso dorado recorre los cables como la
// información que se entrelaza; cada CNOT enciende el cable siguiente.
// Al medir, el resultado sale al azar pero siempre igual en los cuatro:
// las flechas de las esferas de Bloch apuntan todas a |0⟩ (azul) o a |1⟩ (rojo).
(function () {
  var circuito = document.querySelector('.circuito');
  if (!circuito) return;
  var canvas = circuito.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var filas = Array.prototype.slice.call(circuito.querySelectorAll('.qubit'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GOLD = '200,169,110', BLUE = '59,130,246', RED = '239,68,68', CABLE = '#34312C';

  // posiciones de las compuertas como fracción del cable
  var H = 0.12, CNOT = [0.32, 0.50, 0.68], MED = 0.88;
  // el cable i se enciende cuando el pulso llega a su CNOT de entrada
  var inicio = [0, CNOT[0], CNOT[1], CNOT[2]];
  var T = 5200, PAUSA = 1400;

  var w = 0, h = 0, cables = [], medicion = null, brillo = {};

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = circuito.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cables = filas.map(function (f) {
      var ket = f.querySelector('.ket').getBoundingClientRect();
      var ficha = f.querySelector('.ficha').getBoundingClientRect();
      var foto = f.querySelector('.foto').getBoundingClientRect();
      return { x0: ket.right - r.left + 18, x1: ficha.left - r.left, y: foto.top + foto.height / 2 - r.top };
    });
  }

  function xEn(c, f) { return c.x0 + (c.x1 - c.x0) * f; }

  function caja(x, y, txt, alfa) {
    ctx.fillStyle = '#111';
    ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.55 + 0.45 * alfa) + ')';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 15, y - 15, 30, 30); ctx.strokeRect(x - 15, y - 15, 30, 30);
    if (alfa > 0.01) { ctx.fillStyle = 'rgba(' + GOLD + ',' + 0.18 * alfa + ')'; ctx.fillRect(x - 15, y - 15, 30, 30); }
    ctx.fillStyle = 'rgb(' + GOLD + ')';
    ctx.font = 'italic 600 19px "Cormorant Garamond", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + 1);
  }

  function medidor(x, y, bit, alfa) {
    var col = bit === 0 ? BLUE : bit === 1 ? RED : GOLD;
    ctx.fillStyle = '#111';
    ctx.strokeStyle = 'rgba(' + col + ',' + (bit === null ? 0.55 + 0.45 * alfa : 1) + ')';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 17, y - 13, 34, 26); ctx.strokeRect(x - 17, y - 13, 34, 26);
    if (bit === null) {
      ctx.beginPath(); ctx.arc(x, y + 6, 10, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 7, y - 5); ctx.stroke();
    } else {
      ctx.fillStyle = 'rgb(' + col + ')';
      ctx.font = '700 13px "Space Mono", monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(bit), x, y + 1);
    }
  }

  function draw(t) {
    ctx.clearRect(0, 0, w, h);
    if (!cables.length) return;
    // avance del pulso: 0 → 1 en T, luego una pausa
    var ciclo = still ? T : (t % (T + PAUSA));
    var frente = Math.min(1, ciclo / T);
    var colMed = medicion ? (medicion.bit ? RED : BLUE) : null;

    cables.forEach(function (c, i) {
      // cable base (doble después del medidor, como canal clásico)
      ctx.strokeStyle = CABLE; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.x0, c.y); ctx.lineTo(xEn(c, MED), c.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(xEn(c, MED), c.y - 2); ctx.lineTo(c.x1, c.y - 2);
      ctx.moveTo(xEn(c, MED), c.y + 2); ctx.lineTo(c.x1, c.y + 2); ctx.stroke();

      // tramo encendido por el pulso
      if (medicion) {
        ctx.strokeStyle = 'rgba(' + colMed + ',' + 0.7 * medicion.alfa + ')'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(c.x0, c.y); ctx.lineTo(c.x1, c.y); ctx.stroke();
      } else if (frente > inicio[i]) {
        var a = xEn(c, inicio[i]), b = xEn(c, Math.min(frente, MED));
        var g = ctx.createLinearGradient(a, 0, b, 0);
        g.addColorStop(0, 'rgba(' + GOLD + ',0.08)');
        g.addColorStop(1, 'rgba(' + GOLD + ',0.9)');
        ctx.strokeStyle = g; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(a, c.y); ctx.lineTo(b, c.y); ctx.stroke();
        if (frente < MED) {
          var halo = ctx.createRadialGradient(b, c.y, 0, b, c.y, 14);
          halo.addColorStop(0, 'rgba(' + GOLD + ',0.9)'); halo.addColorStop(1, 'rgba(' + GOLD + ',0)');
          ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(b, c.y, 14, 0, Math.PI * 2); ctx.fill();
        }
      }
    });

    // compuertas: se iluminan un momento cuando el pulso pasa por ellas
    function luz(f) { var d = frente - f; return medicion || d < 0 ? 0 : Math.max(0, 1 - d / 0.08); }

    caja(xEn(cables[0], H), cables[0].y, 'H', luz(H));

    CNOT.forEach(function (f, k) {
      var c0 = cables[k], c1 = cables[k + 1];
      if (!c1) return;
      var x = xEn(c0, f), l = luz(f);
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.6 + 0.4 * l) + ')'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, c0.y); ctx.lineTo(x, c1.y + 11); ctx.stroke();
      ctx.fillStyle = 'rgb(' + GOLD + ')';
      ctx.beginPath(); ctx.arc(x, c0.y, 4.5 + 2 * l, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(x, c1.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 11, c1.y); ctx.lineTo(x + 11, c1.y); ctx.moveTo(x, c1.y - 11); ctx.lineTo(x, c1.y + 11); ctx.stroke();
      if (l > 0.01) {
        ctx.fillStyle = 'rgba(' + GOLD + ',' + 0.25 * l + ')';
        ctx.beginPath(); ctx.arc(x, c1.y, 16, 0, Math.PI * 2); ctx.fill();
      }
    });

    cables.forEach(function (c) {
      medidor(xEn(c, MED), c.y, medicion ? medicion.bit : null, luz(MED));
    });
  }

  var raf = 0, t0 = performance.now(), visible = true;
  function loop(now) {
    if (medicion && !still) medicion.alfa = Math.max(0.35, 1 - (now - medicion.t) / 1600);
    draw(now - t0);
    raf = visible && !still ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  // ── medición ──
  var boton = document.querySelector('.boton-medir');
  var salida = document.querySelector('.eq-resultado');
  var conteo = document.querySelector('.eq-conteo');
  var veces = [0, 0];
  if (boton) boton.addEventListener('click', function () {
    var bit = Math.random() < 0.5 ? 0 : 1;
    veces[bit]++;
    medicion = { bit: bit, t: performance.now(), alfa: 1 };
    filas.forEach(function (f, i) {
      f.classList.remove('medido-0', 'medido-1');
      var ket = f.querySelector('.ket-medido');
      if (ket) ket.textContent = '|' + bit + '⟩';
      // cada esfera colapsa un instante después de la anterior, siguiendo las CNOT
      setTimeout(function () { f.classList.add('medido-' + bit); }, still ? 0 : i * 140);
    });
    var k = bit ? '1111' : '0000';
    salida.innerHTML = 'Colapsamos en <b style="color:rgb(' + (bit ? RED : BLUE) + ')">|' + k + '⟩</b>: los cuatro coincidimos.';
    conteo.textContent = '|0000⟩ × ' + veces[0] + '   ·   |1111⟩ × ' + veces[1] + '   ·   nunca otra combinación';
    boton.textContent = 'Medir otra vez';
    start(); draw(performance.now() - t0);
  });

  // al cambiar el tamaño se recalculan los cables
  var pendiente = 0;
  window.addEventListener('resize', function () {
    if (pendiente) return;
    pendiente = requestAnimationFrame(function () { pendiente = 0; layout(); draw(performance.now() - t0); });
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      visible = e[0].isIntersecting;
      if (visible) start(); else { cancelAnimationFrame(raf); raf = 0; }
    }).observe(circuito);
  }
  // las fichas entran deslizándose: se mide otra vez cuando terminan
  layout(); start();
  setTimeout(layout, 1300);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
