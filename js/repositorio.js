// Página del repositorio: el árbol de archivos y los últimos commits se leen
// en vivo desde la API pública de GitHub, así nunca quedan desactualizados.
// Sin conexión (o sin cuota de la API) se muestra un aviso y el enlace.
(function () {
  var REPO = 'Alexisp7/Qiskit-Fall-Fest-2026', RAMA = 'main';
  var API = 'https://api.github.com/repos/' + REPO;
  var WEB = 'https://github.com/' + REPO;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  function aviso(el) {
    el.innerHTML = '<li class="repo-estado">No se pudo leer GitHub ahora. <a href="' + WEB + '" target="_blank" rel="noopener" style="color:var(--gold)">Verlo en GitHub →</a></li>';
  }

  // árbol: carpetas primero, con ramas dibujadas como `tree`
  var arbol = document.getElementById('arbol');
  fetch(API + '/git/trees/' + RAMA + '?recursive=1')
    .then(function (r) { if (!r.ok) throw r; return r.json(); })
    .then(function (d) {
      var raiz = { hijos: {} };
      d.tree.forEach(function (n) {
        var partes = n.path.split('/'), nodo = raiz;
        partes.forEach(function (p, i) {
          nodo.hijos[p] = nodo.hijos[p] || { hijos: {}, tipo: 'tree' };
          if (i === partes.length - 1) { nodo.hijos[p].tipo = n.type; nodo.hijos[p].ruta = n.path; }
          nodo = nodo.hijos[p];
        });
      });
      var lineas = [];
      (function pinta(nodo, prefijo) {
        var nombres = Object.keys(nodo.hijos).sort(function (a, b) {
          var da = nodo.hijos[a].tipo === 'tree', db = nodo.hijos[b].tipo === 'tree';
          return da === db ? a.localeCompare(b) : da ? -1 : 1;
        });
        nombres.forEach(function (n, i) {
          var h = nodo.hijos[n], ultimo = i === nombres.length - 1, dir = h.tipo === 'tree';
          var url = WEB + '/' + (dir ? 'tree' : 'blob') + '/' + RAMA + '/' + h.ruta;
          lineas.push('<li><span class="rama">' + prefijo + (ultimo ? '└── ' : '├── ') + '</span>' +
            '<a class="' + (dir ? 'dir' : '') + '" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(n) + (dir ? '/' : '') + '</a></li>');
          if (dir) pinta(h, prefijo + (ultimo ? '    ' : '│   '));
        });
      })(raiz, '');
      arbol.innerHTML = lineas.join('') || '<li class="repo-estado">Todavía vacío.</li>';
    })
    .catch(function () { aviso(arbol); });

  // últimos commits
  var commits = document.getElementById('commits');
  fetch(API + '/commits?sha=' + RAMA + '&per_page=6')
    .then(function (r) { if (!r.ok) throw r; return r.json(); })
    .then(function (lista) {
      commits.innerHTML = lista.map(function (c) {
        var msg = c.commit.message.split('\n')[0];
        var fecha = new Date(c.commit.author.date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
        return '<li><span class="nodo"></span><div><div class="msg">' + esc(msg) + '</div>' +
          '<div class="meta"><a href="' + esc(c.html_url) + '" target="_blank" rel="noopener">' + c.sha.slice(0, 7) + '</a> · ' +
          esc(c.commit.author.name) + ' · ' + fecha + '</div></div></li>';
      }).join('');
    })
    .catch(function () { aviso(commits); });

  // copiar el comando de clonado
  var boton = document.getElementById('copiar');
  if (boton) boton.addEventListener('click', function () {
    var txt = document.getElementById('cmd-clonar').textContent;
    var hecho = function () { boton.textContent = 'Copiado'; setTimeout(function () { boton.textContent = 'Copiar'; }, 1600); };
    if (navigator.clipboard) navigator.clipboard.writeText(txt).then(hecho, function () {});
  });
})();
