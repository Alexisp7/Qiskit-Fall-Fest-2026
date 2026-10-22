// Preguntas: un qubit gigante en 3D (esfera de Bloch) señala las 4 preguntas
// que respondemos, una por estado: |0⟩, |1⟩, |+⟩ y |−⟩. Las 30 preguntas
// se listan abajo; las demás quedan pendientes.
// Para editar el contenido, cambia PREGUNTAS (texto) y RESPUESTAS (las 4).
(function () {
  // ── contenido ──
  var PREGUNTAS = [];
  for (var i = 1; i <= 30; i++) PREGUNTAS.push('Pregunta ' + (i < 10 ? '0' : '') + i + ' · texto por definir');
  // las 4 que respondemos: número de pregunta, estado y respuesta
  var RESPUESTAS = [
    { n: 3,  estado: '0', respuesta: 'Aquí va la respuesta a esta pregunta.' },
    { n: 11, estado: '1', respuesta: 'Aquí va la respuesta a esta pregunta.' },
    { n: 18, estado: '+', respuesta: 'Aquí va la respuesta a esta pregunta.' },
    { n: 27, estado: '-', respuesta: 'Aquí va la respuesta a esta pregunta.' }
  ];
  // dirección de cada estado en la esfera (x, y, z); z hacia |0⟩
  var DIR = { '0': [0, 0, 1], '1': [0, 0, -1], '+': [1, 0, 0], '-': [-1, 0, 0] };
  var KET = { '0': '|0⟩', '1': '|1⟩', '+': '|+⟩', '-': '|−⟩' };
  var TINTA = '#1B2A4A', AZUL = '#2B6CB0', ORO = '#C8A96E', ORO_OSC = '#8C6D33';

  var canvas = document.getElementById('bloch');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── cámara: giro alrededor del eje z (yaw) e inclinación (pitch) ──
  var yaw = -0.6, pitch = 0.32, w = 0, h = 0, R = 0, cx = 0, cy = 0;
  var vec = [0.55, 0.45, 0.7], meta = null, activo = null;

  function tam() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(w, h) * 0.33; cx = w / 2; cy = h / 2;
  }
  // punto 3D → pantalla; devuelve [x, y, profundidad]
  function proy(p) {
    var cyw = Math.cos(yaw), syw = Math.sin(yaw);
    var x = p[0] * cyw - p[1] * syw, y = p[0] * syw + p[1] * cyw, z = p[2];
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    var y2 = y * cp - z * sp, z2 = y * sp + z * cp;
    var f = 1 + y2 * 0.12; // leve perspectiva
    return [cx + x * R * f, cy - z2 * R * f, y2];
  }
  // círculo máximo con trazo continuo adelante y punteado atrás
  function circulo(fn, color, ancho) {
    var pts = [];
    for (var k = 0; k <= 96; k++) pts.push(proy(fn(k / 96 * Math.PI * 2)));
    [false, true].forEach(function (delante) {
      ctx.beginPath();
      ctx.setLineDash(delante ? [] : [3, 4]);
      ctx.strokeStyle = color; ctx.lineWidth = delante ? ancho : ancho * 0.8;
      ctx.globalAlpha = delante ? 1 : 0.45;
      var abierto = false;
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k], esta = (p[2] <= 0) === delante;
        if (esta) { if (!abierto) { ctx.moveTo(p[0], p[1]); abierto = true; } else ctx.lineTo(p[0], p[1]); }
        else abierto = false;
      }
      ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
  function eje(a, b) {
    var p = proy(a), q = proy(b);
    ctx.beginPath(); ctx.setLineDash([2, 5]); ctx.strokeStyle = 'rgba(27,42,74,.35)'; ctx.lineWidth = 1;
    ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.setLineDash([]);
  }

  var marcas = {};
  function dibujar() {
    ctx.clearRect(0, 0, w, h);
    // esfera con sombreado, para el volumen
    var g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R * 1.05);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.55, '#EEF3FA'); g.addColorStop(1, '#C9D6E8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    eje([0, 0, 1.25], [0, 0, -1.25]); eje([1.25, 0, 0], [-1.25, 0, 0]); eje([0, 1.25, 0], [0, -1.25, 0]);
    circulo(function (t) { return [Math.cos(t), Math.sin(t), 0]; }, TINTA, 1.4);           // ecuador
    circulo(function (t) { return [Math.cos(t), 0, Math.sin(t)]; }, 'rgba(27,42,74,.55)', 1); // meridiano xz
    circulo(function (t) { return [0, Math.cos(t), Math.sin(t)]; }, 'rgba(27,42,74,.35)', 1); // meridiano yz
    ctx.beginPath(); ctx.strokeStyle = TINTA; ctx.lineWidth = 1.6; ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();

    // marcas de los 4 estados, con su ket
    marcas = {};
    RESPUESTAS.forEach(function (r) {
      var d = DIR[r.estado], p = proy(d), e = proy([d[0] * 1.32, d[1] * 1.32, d[2] * 1.32]);
      var es = activo && activo.estado === r.estado;
      marcas[r.estado] = e;
      ctx.beginPath(); ctx.fillStyle = es ? ORO : '#fff'; ctx.strokeStyle = es ? ORO_OSC : TINTA; ctx.lineWidth = 1.4;
      ctx.arc(p[0], p[1], es ? 6 : 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = 'italic ' + (es ? 600 : 500) + ' ' + (es ? 30 : 24) + 'px "Cormorant Garamond", serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = es ? ORO_OSC : TINTA;
      ctx.fillText(KET[r.estado], e[0], e[1]);
      ctx.font = '700 9px "Space Mono", monospace';
      ctx.fillStyle = es ? ORO_OSC : '#7A7A7A';
      ctx.fillText('P' + (r.n < 10 ? '0' : '') + r.n, e[0], e[1] + 20);
    });

    // vector de estado: flecha dorada desde el centro
    var c0 = proy([0, 0, 0]), p = proy(vec);
    ctx.strokeStyle = ORO_OSC; ctx.fillStyle = ORO_OSC; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
    var ang = Math.atan2(p[1] - c0[1], p[0] - c0[0]);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]);
    ctx.lineTo(p[0] - 14 * Math.cos(ang - 0.38), p[1] - 14 * Math.sin(ang - 0.38));
    ctx.lineTo(p[0] - 14 * Math.cos(ang + 0.38), p[1] - 14 * Math.sin(ang + 0.38));
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.fillStyle = TINTA; ctx.arc(c0[0], c0[1], 3.5, 0, Math.PI * 2); ctx.fill();
  }

  // ── movimiento: giro lento solo, arrastre con el mouse, flecha que viaja ──
  var arrastre = null, ultimo = 0, quieto = 0;
  function normal(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function paso(t) {
    var dt = ultimo ? Math.min(t - ultimo, 50) : 16; ultimo = t;
    if (!arrastre && !still && t > quieto) yaw += dt * 0.00018;
    if (meta) {
      var k = still ? 1 : Math.min(1, dt / 160);
      vec = normal([vec[0] + (meta[0] - vec[0]) * k, vec[1] + (meta[1] - vec[1]) * k, vec[2] + (meta[2] - vec[2]) * k]);
      // de |0⟩ a |1⟩ (o de |+⟩ a |−⟩) el camino recto pasa por el centro: se desvía por el ecuador
      if (Math.hypot(vec[0], vec[1], vec[2]) < 0.2) vec = normal([vec[0] + 0.3, vec[1] + 0.3, vec[2]]);
    }
    dibujar();
    requestAnimationFrame(paso);
  }
  canvas.addEventListener('pointerdown', function (e) {
    var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    // clic en un ket: elige ese estado
    for (var k in marcas) {
      if (Math.hypot(marcas[k][0] - x, marcas[k][1] - y) < 26) { elegir(RESPUESTAS.filter(function (q) { return q.estado === k; })[0]); return; }
    }
    arrastre = { x: e.clientX, y: e.clientY, yaw: yaw, pitch: pitch };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', function (e) {
    if (!arrastre) {
      var r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, sobre = false;
      for (var k in marcas) if (Math.hypot(marcas[k][0] - x, marcas[k][1] - y) < 26) sobre = true;
      canvas.style.cursor = sobre ? 'pointer' : 'grab';
      return;
    }
    yaw = arrastre.yaw + (e.clientX - arrastre.x) * 0.008;
    pitch = Math.max(-0.9, Math.min(0.9, arrastre.pitch + (e.clientY - arrastre.y) * 0.006));
  });
  ['pointerup', 'pointercancel'].forEach(function (ev) {
    canvas.addEventListener(ev, function () { if (arrastre) { arrastre = null; quieto = performance.now() + 2500; } });
  });

  // ── panel lateral: estados, respuesta y las 30 preguntas ──
  var botones = document.querySelector('.pq-estados');
  var panel = document.querySelector('.pq-respuesta');
  var lista = document.querySelector('.pq-lista');
  function dos(n) { return (n < 10 ? '0' : '') + n; }

  RESPUESTAS.forEach(function (r) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'pq-estado'; b.setAttribute('data-estado', r.estado);
    b.innerHTML = '<span class="pq-ket">' + KET[r.estado] + '</span><span class="pq-num">Pregunta ' + dos(r.n) + '</span>';
    b.addEventListener('click', function () { elegir(r); });
    botones.appendChild(b);
  });
  PREGUNTAS.forEach(function (texto, i) {
    var n = i + 1, r = RESPUESTAS.filter(function (q) { return q.n === n; })[0];
    var li = document.createElement('li');
    li.className = 'pq-item' + (r ? ' respondida' : '');
    li.setAttribute('data-n', n);
    li.innerHTML = '<span class="pq-item-num">' + dos(n) + '</span>' + (r ? '<span class="pq-item-ket">' + KET[r.estado] + '</span>' : '');
    li.title = texto;
    li.addEventListener('click', function () {
      if (r) return elegir(r);
      activo = null; meta = null;
      marcar(n);
      panel.innerHTML = '<div class="pq-r-cab"><span class="pq-r-ket pq-r-vacio">·</span><span class="pq-r-num">Pregunta ' + dos(n) + '</span></div>' +
        '<p class="pq-r-pregunta">' + texto + '</p><p class="pq-r-texto pq-r-pendiente">Aún sin responder: esta vez respondemos solo cuatro, una por cada estado.</p>';
    });
    lista.appendChild(li);
  });
  function marcar(n) {
    Array.prototype.forEach.call(document.querySelectorAll('.pq-item'), function (li) { li.classList.toggle('activa', +li.getAttribute('data-n') === n); });
    Array.prototype.forEach.call(document.querySelectorAll('.pq-estado'), function (b) { b.classList.toggle('activo', !!activo && b.getAttribute('data-estado') === activo.estado); });
  }
  function elegir(r) {
    activo = r; meta = DIR[r.estado].slice();
    marcar(r.n);
    panel.innerHTML = '<div class="pq-r-cab"><span class="pq-r-ket">' + KET[r.estado] + '</span><span class="pq-r-num">Pregunta ' + dos(r.n) + '</span></div>' +
      '<p class="pq-r-pregunta">' + PREGUNTAS[r.n - 1] + '</p><p class="pq-r-texto">' + r.respuesta + '</p>';
    panel.classList.remove('entra'); void panel.offsetWidth; panel.classList.add('entra');
  }

  window.addEventListener('resize', tam);
  tam();
  elegir(RESPUESTAS[0]);
  requestAnimationFrame(paso);
})();
