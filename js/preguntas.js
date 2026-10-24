// Preguntas: cualquiera registra una pregunta y todas las registradas se
// muestran abajo, las más nuevas primero. Se guardan en el servidor
// (api/preguntas.js), así que las ve todo el que entra al sitio.
(function () {
  var API = 'api/preguntas';
  var form = document.querySelector('[data-pq-form]');
  var lista = document.querySelector('[data-pq-lista]');
  var total = document.querySelector('[data-pq-total]');
  var estado = document.querySelector('[data-pq-estado]');
  var cuenta = document.querySelector('[data-pq-cuenta]');
  if (!form || !lista) return;
  var texto = form.elements.pregunta, boton = form.querySelector('button[type="submit"]');
  var preguntas = [];

  function fecha(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }
  function nodo(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function pintar(n, nueva) {
    lista.innerHTML = '';
    if (total) total.textContent = n;
    if (!preguntas.length) { lista.appendChild(nodo('li', 'pq-vacio', 'Todavía no hay preguntas. Sé el primero en registrar una.')); return; }
    preguntas.forEach(function (p, k) {
      var li = nodo('li', 'pq-item' + (nueva && p.id === nueva ? ' nueva' : ''));
      li.appendChild(nodo('span', 'pq-n', String(n - k).padStart(2, '0')));
      var cuerpo = nodo('div', 'pq-cuerpo');
      cuerpo.appendChild(nodo('p', 'pq-texto', p.pregunta));
      cuerpo.appendChild(nodo('div', 'pq-meta', (p.nombre || 'Anónimo') + ' · ' + fecha(p.fecha)));
      li.appendChild(cuerpo);
      lista.appendChild(li);
    });
  }
  function aviso(msg, tipo) { estado.textContent = msg || ''; estado.className = 'pq-estado' + (tipo ? ' ' + tipo : ''); }

  function cargar() {
    fetch(API, { cache: 'no-store' }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok || !d.preguntas) throw new Error(d.error || 'No se pudieron cargar las preguntas.'); return d; });
    }).then(function (d) {
      preguntas = d.preguntas || []; pintar(d.total || preguntas.length);
    }).catch(function (e) {
      lista.innerHTML = ''; lista.appendChild(nodo('li', 'pq-vacio', e.message.indexOf('almacén') >= 0 ? e.message : 'No se pudieron cargar las preguntas.'));
    });
  }

  function contar() { cuenta.textContent = texto.value.length + ' / 500'; }
  texto.addEventListener('input', contar);
  contar();

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var datos = { nombre: form.elements.nombre.value, pregunta: texto.value, web: form.elements.web.value };
    if (datos.pregunta.trim().length < 10) { aviso('La pregunta debe tener al menos 10 caracteres.', 'error'); texto.focus(); return; }
    boton.disabled = true; aviso('Enviando…');
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) throw new Error(d.error || 'No se pudo registrar la pregunta.'); return d; }); })
      .then(function (d) {
        if (d.pregunta) { preguntas.unshift(d.pregunta); pintar(d.total || preguntas.length, d.pregunta.id); }
        form.reset(); contar(); aviso('¡Listo! Tu pregunta quedó registrada.', 'ok');
      })
      .catch(function (e) { aviso(e.message, 'error'); })
      .then(function () { boton.disabled = false; });
  });

  cargar();
})();
