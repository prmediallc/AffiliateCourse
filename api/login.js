const { createToken, getPasswordHash, sha256 } = require("./_auth");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method not allowed");
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;

  let payload = {};
  try {
    payload = JSON.parse(body || "{}");
  } catch {
    payload = {};
  }

  if (sha256(String(payload.password || "")) !== getPasswordHash()) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false }));
    return;
  }

  res.statusCode = 200;
  res.setHeader("Set-Cookie", `course_access=${encodeURIComponent(createToken())}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`);
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
};
