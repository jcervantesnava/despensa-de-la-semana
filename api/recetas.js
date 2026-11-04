// Función de Vercel que arma las recetas con la API de Anthropic.
// Necesita la variable de entorno ANTHROPIC_API_KEY (en Vercel: Settings → Environment Variables).
// Opcional: ANTHROPIC_MODEL para cambiar el modelo.

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
const PREFIX = "Somos 2 adultos en México. Esto es lo que tenemos en casa ahora:";

// Límite sencillo por IP para que nadie gaste tu clave (se reinicia cuando Vercel recicla la función).
const hits = new Map();
function limited(ip) {
  const now = Date.now(), win = 60 * 60 * 1000, max = 20;
  const list = (hits.get(ip) || []).filter(t => now - t < win);
  list.push(now); hits.set(ip, list);
  return list.length > max;
}

function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) { try { return JSON.parse(fence[1]); } catch {} }
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(text.slice(a, b + 1)); } catch {} }
  return null;
}

export default async function handler(req, res) {
  if (req.method === "GET") return res.status(200).json({ ok: !!process.env.ANTHROPIC_API_KEY });
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!process.env.ANTHROPIC_API_KEY) return res.status(503).json({ error: "sin_clave" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (limited(ip)) return res.status(429).json({ error: "limite" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = String(body.prompt || "");
  // Solo acepta el pedido de recetas que manda la app
  if (!prompt.includes(PREFIX) || prompt.length > 8000) return res.status(400).json({ error: "pedido" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 6000,
        messages: [{ role: "user", content: prompt + "\n\nResponde únicamente con el JSON, sin texto adicional." }]
      })
    });
    if (r.status === 429) return res.status(429).json({ error: "limite" });
    if (!r.ok) return res.status(502).json({ error: "api", detail: (await r.text()).slice(0, 300) });
    const data = await r.json();
    const text = (data.content || []).filter(c => c.type === "text").map(c => c.text).join("");
    const json = parseJson(text);
    if (!json) return res.status(200).json({ error: "json" });
    return res.status(200).json(json);
  } catch (e) {
    return res.status(502).json({ error: "red" });
  }
}
