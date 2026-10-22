// Circuito del equipo: cada integrante es un qubit. Una H en q0 y una
// cadena de CNOT (q0→q1→q2→q3) preparan el estado GHZ
// (|0000⟩ + |1111⟩)/√2.
// Intro: la página arranca en negro, los cables se dibujan en blanco de
// izquierda a derecha y las compuertas aparecen en dorado cuando el trazo
// pasa por ellas; al final las fichas con las fotos entran suave por la
// derecha. Después un pulso dorado recorre los cables en bucle.
// Al medir, el resultado sale al azar pero siempre igual en los cuatro:
// las flechas de las esferas de Bloch apuntan todas a |0⟩ (azul) o a |1⟩ (rojo).
(function () {
  var circuito = document.querySelector('.circuito');
  if (!circuito) return;
  var canvas = circuito.querySelector('canvas');
  var ctx = canvas.getContext('2d');
  var filas = Array.prototype.slice.call(circuito.querySelectorAll('.qubit'));
  var raizHtml = document.documentElement;
  var intro = raizHtml.classList.contains('eq-intro');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var GOLD = '200,169,110', BLUE = '59,130,246', RED = '239,68,68', TRAZO = '242,238,230';

  // posiciones de las compuertas como fracción del cable
  var H = 0.12, CNOT = [0.32, 0.50, 0.68], MED = 0.88;
  // el cable i se enciende cuando el pulso llega a su CNOT de entrada
  var inicio = [0, CNOT[0], CNOT[1], CNOT[2]];
  var T = 5200, PAUSA = 1400;

  // guion de la intro, en ms desde que carga la página
  var CABECERA = 200, TRAZO_0 = 700, TRAZO_PASO = 180, TRAZO_DUR = 1500;
  var FICHAS_0 = 2500, FICHAS_PASO = 160, MENU = 3300, FIN = 4900;
  var PULSO_0 = intro ? TRAZO_0 + TRAZO_PASO * 3 + TRAZO_DUR : 0;

  var w = 0, h = 0, cables = [], medicion = null;
  var t0 = performance.now();

  function layout() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = circuito.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cables = filas.map(function (f) {
      var ket = f.querySelector('.ket').getBoundingClientRect();
      var ficha = f.querySelector('.ficha');
      // la ficha puede estar corrida durante la intro: se usa su lugar final
      var fl = ficha.offsetLeft + f.offsetLeft;
      var foto = f.querySelector('.foto');
      var fy = f.offsetTop + ficha.offsetTop + foto.offsetTop + foto.offsetHeight / 2;
      return { x0: ket.right - r.left + 18, x1: fl, y: fy };
    });
  }

  function xEn(c, f) { return c.x0 + (c.x1 - c.x0) * f; }
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  // cuánto del cable i ya se dibujó (0 → 1)
  function trazado(i, t) { return intro && !still ? clamp((t - TRAZO_0 - i * TRAZO_PASO) / TRAZO_DUR) : 1; }
  function suave(v) { return 1 - Math.pow(1 - v, 3); }
  // una compuerta aparece cuando el trazo de su cable la alcanza
  function aparece(prog, f) { return clamp((prog - f) / 0.05); }

  function caja(x, y, txt, luz) {
    ctx.fillStyle = '#111';
    ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.6 + 0.4 * luz) + ')';
    ctx.lineWidth = 1;
    ctx.fillRect(x - 15, y - 15, 30, 30); ctx.strokeRect(x - 15, y - 15, 30, 30);
    if (luz > 0.01) { ctx.fillStyle = 'rgba(' + GOLD + ',' + 0.18 * luz + ')'; ctx.fillRect(x - 15, y - 15, 30, 30); }
    ctx.fillStyle = 'rgb(' + GOLD + ')';
    ctx.font = 'italic 600 19px "Cormorant Garamond", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(txt, x, y + 1);
  }

  function medidor(x, y, bit, luz) {
    var col = bit === 0 ? BLUE : bit === 1 ? RED : GOLD;
    ctx.fillStyle = '#111';
    ctx.strokeStyle = 'rgba(' + col + ',' + (bit === null ? 0.6 + 0.4 * luz : 1) + ')';
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
    var prog = cables.map(function (c, i) { return suave(trazado(i, t)); });
    // avance del pulso: empieza cuando terminó de dibujarse el circuito
    var tp = t - PULSO_0;
    var frente = tp < 0 ? -1 : still ? 1 : Math.min(1, (tp % (T + PAUSA)) / T);
    var colMed = medicion ? (medicion.bit ? RED : BLUE) : null;

    cables.forEach(function (c, i) {
      var p = prog[i];
      if (p <= 0) return;
      var xm = xEn(c, Math.min(p, MED));
      // cable cuántico en blanco, y doble (canal clásico) después del medidor
      ctx.strokeStyle = 'rgba(' + TRAZO + ',0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(c.x0, c.y); ctx.lineTo(xm, c.y); ctx.stroke();
      if (p > MED) {
        var xf = xEn(c, p);
        ctx.beginPath(); ctx.moveTo(xEn(c, MED), c.y - 2); ctx.lineTo(xf, c.y - 2);
        ctx.moveTo(xEn(c, MED), c.y + 2); ctx.lineTo(xf, c.y + 2); ctx.stroke();
      }
      // punta blanca mientras se dibuja
      if (p < 1) {
        var px = xEn(c, p);
        var halo = ctx.createRadialGradient(px, c.y, 0, px, c.y, 10);
        halo.addColorStop(0, 'rgba(' + TRAZO + ',0.95)'); halo.addColorStop(1, 'rgba(' + TRAZO + ',0)');
        ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(px, c.y, 10, 0, Math.PI * 2); ctx.fill();
      }

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
          var brillo = ctx.createRadialGradient(b, c.y, 0, b, c.y, 14);
          brillo.addColorStop(0, 'rgba(' + GOLD + ',0.9)'); brillo.addColorStop(1, 'rgba(' + GOLD + ',0)');
          ctx.fillStyle = brillo; ctx.beginPath(); ctx.arc(b, c.y, 14, 0, Math.PI * 2); ctx.fill();
        }
      }
    });

    // compuertas: aparecen con el trazo y se iluminan cuando pasa el pulso
    function luz(f) { var d = frente - f; return medicion || frente < 0 || d < 0 ? 0 : Math.max(0, 1 - d / 0.08); }

    ctx.save();
    ctx.globalAlpha = aparece(prog[0], H);
    if (ctx.globalAlpha > 0) caja(xEn(cables[0], H), cables[0].y, 'H', luz(H));
    ctx.restore();

    CNOT.forEach(function (f, k) {
      var c0 = cables[k], c1 = cables[k + 1];
      if (!c1) return;
      var vis = aparece(prog[k], f);
      if (vis <= 0) return;
      var x = xEn(c0, f), l = luz(f);
      ctx.save(); ctx.globalAlpha = vis;
      ctx.strokeStyle = 'rgba(' + GOLD + ',' + (0.6 + 0.4 * l) + ')'; ctx.lineWidth = 1.2;
      // la línea vertical de la CNOT baja desde el control hasta el objetivo
      var yb = c0.y + (c1.y + 11 - c0.y) * vis;
      ctx.beginPath(); ctx.moveTo(x, c0.y); ctx.lineTo(x, yb); ctx.stroke();
      ctx.fillStyle = 'rgb(' + GOLD + ')';
      ctx.beginPath(); ctx.arc(x, c0.y, 4.5 + 2 * l, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#111';
      ctx.beginPath(); ctx.arc(x, c1.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 11, c1.y); ctx.lineTo(x + 11, c1.y); ctx.moveTo(x, c1.y - 11); ctx.lineTo(x, c1.y + 11); ctx.stroke();
      if (l > 0.01) {
        ctx.fillStyle = 'rgba(' + GOLD + ',' + 0.25 * l + ')';
        ctx.beginPath(); ctx.arc(x, c1.y, 16, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });

    cables.forEach(function (c, i) {
      var vis = aparece(prog[i], MED);
      if (vis <= 0) return;
      ctx.save(); ctx.globalAlpha = vis;
      medidor(xEn(c, MED), c.y, medicion ? medicion.bit : null, luz(MED));
      ctx.restore();
    });
  }

  var raf = 0, visible = true;
  function loop(now) {
    if (medicion && !still) medicion.alfa = Math.max(0.35, 1 - (now - medicion.t) / 1600);
    draw(now - t0);
    raf = visible && !still ? requestAnimationFrame(loop) : 0;
  }
  function start() { if (!raf) raf = requestAnimationFrame(loop); }

  // ── guion de la intro: se van mostrando las piezas de la página ──
  function ver(el, ms) { if (el) setTimeout(function () { el.classList.add('ver'); }, ms); }
  if (intro) {
    ver(document.querySelector('.eq-cabecera'), CABECERA);
    filas.forEach(function (f, i) {
      ver(f.querySelector('.ket'), TRAZO_0 + i * TRAZO_PASO);
      ver(f.querySelector('.ficha'), FICHAS_0 + i * FICHAS_PASO);
    });
    ver(document.querySelector('.header'), MENU);
    ver(document.querySelector('.eq-medir'), MENU);
    // al terminar se quita la clase: quedan los estilos normales (hover incluido)
    setTimeout(function () { raizHtml.classList.remove('eq-intro'); }, FIN);
  }

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
  layout(); start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
})();
