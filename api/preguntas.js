// Preguntas del público: GET devuelve las registradas (las más nuevas primero),
// POST registra una. Se guardan en Redis (Upstash) por su API REST; Vercel pone
// las variables KV_REST_API_URL y KV_REST_API_TOKEN al conectar el almacén.
const URL_KV = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const CLAVE = 'preguntas';
const MAX_LISTA = 300;     // cuántas se muestran
const POR_HORA = 5;        // tope de envíos por IP

async function redis(...cmd) {
  const r = await fetch(URL_KV, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return (await r.json()).result;
}

function limpiar(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

module.exports = async function (req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_KV || !TOKEN) return res.status(503).json({ error: 'El almacén de preguntas no está conectado.' });
  try {
    if (req.method === 'GET') {
      const filas = await redis('LRANGE', CLAVE, 0, MAX_LISTA - 1);
      const lista = (filas || []).map(function (f) { try { return JSON.parse(f); } catch (e) { return null; } }).filter(Boolean);
      const total = await redis('LLEN', CLAVE);
      return res.status(200).json({ total: total, preguntas: lista });
    }
    if (req.method === 'POST') {
      let b = req.body || {};
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
      if (b.web) return res.status(200).json({ ok: true });   // trampa para bots
      const pregunta = limpiar(b.pregunta, 500), nombre = limpiar(b.nombre, 60);
      if (pregunta.length < 10) return res.status(400).json({ error: 'La pregunta debe tener al menos 10 caracteres.' });
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'anon';
      const n = await redis('INCR', 'rl:' + ip);
      if (n === 1) await redis('EXPIRE', 'rl:' + ip, 3600);
      if (n > POR_HORA) return res.status(429).json({ error: 'Demasiadas preguntas seguidas; intenta en una hora.' });
      const item = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), nombre: nombre, pregunta: pregunta, fecha: new Date().toISOString() };
      await redis('LPUSH', CLAVE, JSON.stringify(item));
      const total = await redis('LLEN', CLAVE);
      return res.status(201).json({ ok: true, total: total, pregunta: item });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Método no permitido.' });
  } catch (e) {
    return res.status(500).json({ error: 'No se pudo acceder al almacén.' });
  }
};
