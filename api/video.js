// ================ CONFIG ==================
const YOUR_API_KEYS = ["SPLEXXO"]; // tumhara private key
const TARGET_API_BASE =
  "https://yabes-api.pages.dev/api/ai/video/v1"; // original text-to-video API
const DEFAULT_QUALITY = "720p";
// ==========================================

module.exports = async (req, res) => {
  // Sirf GET allow
  if (req.method !== "GET") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(405).json({ error: "method not allowed" });
  }

  const { prompt, quality: rawQuality, key: rawKey } = req.query || {};

  // Basic validation
  if (!prompt || !rawKey) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(400).json({ error: "missing parameters: prompt or key" });
  }

  const key = String(rawKey).trim();
  const quality = rawQuality ? String(rawQuality).trim() : DEFAULT_QUALITY;

  // API key check
  if (!YOUR_API_KEYS.includes(key)) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(403).json({ error: "invalid key" });
  }

  // Upstream URL build
  const url =
    TARGET_API_BASE +
    "?prompt=" +
    encodeURIComponent(prompt) +
    "&quality=" +
    encodeURIComponent(quality);

  try {
    const upstream = await fetch(url);

    // Agar upstream fail ho gaya
    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      return res.status(502).json({
        error: "upstream API failed",
        status: upstream.status,
        details: text || "no body",
      });
    }

    // Upstream ka content-type copy karo
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    // Apna branding header
    res.setHeader("X-Developer", "splexxo");
    res.setHeader("X-Powered-By", "splexxo Text2Video Proxy");

    // Body as-is pass through (video ho ya JSON)
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return res.status(200).send(buffer);
  } catch (err) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.status(502).json({
      error: "upstream request error",
      details: err.message || "unknown error",
    });
  }
};
