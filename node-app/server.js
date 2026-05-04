const fs = require("fs");
const http = require("http");
const path = require("path");
const { URL } = require("url");
const { JsonDatabase } = require("./lib/database");
const { loadEnv, requiredEnv } = require("./lib/env");
const {
  createSessionId,
  parseCookies,
  serializeCookie,
  sha256,
  timingSafeEqual,
} = require("./lib/security");

loadEnv();

const port = Number(process.env.PORT || 3000);
const db = new JsonDatabase(process.env.DB_FILE || "./data/app.db.json");
const passwordHash = process.env.COURSE_PASSWORD_HASH || sha256(requiredEnv("COURSE_PASSWORD", "Coconina@Bakri"));
const isProduction = process.env.NODE_ENV === "production";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, headers);
  res.end(body);
}

function sendJson(res, status, payload, headers = {}) {
  send(res, status, JSON.stringify(payload), {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
}

function redirect(res, location) {
  send(res, 302, "", { Location: location });
}

function serveFile(res, filePath, status = 200) {
  if (!fs.existsSync(filePath)) {
    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }
  const ext = path.extname(filePath);
  send(res, status, fs.readFileSync(filePath), { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
}

function getSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.course_session;
  if (!sessionId) return null;
  const session = db.getSession(sessionId);
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    db.deleteSession(sessionId);
    return null;
  }
  return { id: sessionId, ...session };
}

function requireAuth(req, res) {
  const session = getSession(req);
  if (!session) {
    redirect(res, "/");
    return null;
  }
  return session;
}

async function readBody(req) {
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

function renderLoginPage() {
  return fs.readFileSync(path.join(__dirname, "views", "login.html"), "utf8");
}

function renderCertificate({ studentName, courseName }) {
  const safeName = String(studentName || "Student").replace(/[<>]/g, "");
  const safeCourse = String(courseName || "Course").replace(/[<>]/g, "");
  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Certificate - ${safeName}</title>
    <style>
      body { margin: 0; background: #111; color: #111; font-family: Arial, sans-serif; }
      .certificate { width: 1120px; min-height: 780px; margin: 30px auto; padding: 70px; box-sizing: border-box; background: #f8f1df; border: 18px solid #e5bf32; text-align: center; }
      .brand { letter-spacing: 5px; text-transform: uppercase; font-weight: 800; }
      h1 { margin: 70px 0 10px; font-family: Georgia, serif; font-size: 64px; }
      h2 { margin: 28px 0; font-family: Georgia, serif; font-size: 46px; color: #8b6d00; }
      p { font-size: 24px; font-weight: 700; line-height: 1.5; }
      .footer { display: flex; justify-content: space-between; margin-top: 90px; font-size: 18px; font-weight: 800; }
      @media print { body { background: #fff; } .certificate { margin: 0; } }
    </style>
  </head>
  <body>
    <section class="certificate">
      <div class="brand">PR Media LLC & Tapoos</div>
      <h1>Certificate of Completion</h1>
      <p>This certificate is proudly presented to</p>
      <h2>${safeName}</h2>
      <p>for completing the ${safeCourse}.</p>
      <div class="footer">
        <span>Haris Sajjad</span>
        <span>${new Date().toLocaleDateString()}</span>
      </div>
    </section>
    <script>window.print();</script>
  </body>
</html>`;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/login" && req.method === "POST") {
    const payload = await readBody(req);
    if (!timingSafeEqual(sha256(payload.password || ""), passwordHash)) {
      sendJson(res, 401, { ok: false });
      return;
    }

    const sessionId = createSessionId();
    db.createSession(sessionId, {
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
      userAgent: req.headers["user-agent"] || "",
    });

    sendJson(res, 200, { ok: true }, {
      "Set-Cookie": serializeCookie("course_session", sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Lax",
        path: "/",
        maxAge: 28800,
      }),
    });
    return;
  }

  if (pathname === "/api/logout" && req.method === "POST") {
    const session = getSession(req);
    if (session) db.deleteSession(session.id);
    sendJson(res, 200, { ok: true }, {
      "Set-Cookie": serializeCookie("course_session", "", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Lax",
        path: "/",
        maxAge: 1,
      }),
    });
    return;
  }

  const session = getSession(req);
  if (!session) {
    sendJson(res, 401, { error: "Unauthorized" });
    return;
  }

  if (pathname === "/api/settings" && req.method === "GET") {
    sendJson(res, 200, db.getAdminSettings());
    return;
  }

  if (pathname === "/api/settings" && req.method === "POST") {
    const payload = await readBody(req);
    sendJson(res, 200, db.saveAdminSettings({
      portalTitle: String(payload.portalTitle || "").trim(),
      instructorName: String(payload.instructorName || "").trim(),
      supportEmail: String(payload.supportEmail || "").trim(),
    }));
    return;
  }

  if (pathname === "/api/progress" && req.method === "GET") {
    sendJson(res, 200, db.getProgress(session.id));
    return;
  }

  if (pathname === "/api/progress" && req.method === "POST") {
    const payload = await readBody(req);
    sendJson(res, 200, db.saveProgress(session.id, payload));
    return;
  }

  if (pathname === "/api/certificate" && req.method === "POST") {
    const payload = await readBody(req);
    send(res, 200, renderCertificate(payload), { "Content-Type": "text/html; charset=utf-8" });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname.startsWith("/api/")) {
      await handleApi(req, res, pathname);
      return;
    }

    if (pathname === "/") {
      if (getSession(req)) {
        redirect(res, "/course");
        return;
      }
      send(res, 200, renderLoginPage(), { "Content-Type": "text/html; charset=utf-8" });
      return;
    }

    if (pathname === "/course") {
      if (!requireAuth(req, res)) return;
      serveFile(res, path.join(__dirname, "private", "course.html"));
      return;
    }

    if (pathname === "/private/app.js") {
      if (!requireAuth(req, res)) return;
      serveFile(res, path.join(__dirname, "private", "app.js"));
      return;
    }

    if (pathname.startsWith("/downloads/")) {
      if (!requireAuth(req, res)) return;
      serveFile(res, path.join(__dirname, pathname));
      return;
    }

    const publicFile = path.join(__dirname, "public", pathname === "/styles.css" ? "styles.css" : pathname.slice(1));
    if (fs.existsSync(publicFile) && fs.statSync(publicFile).isFile()) {
      serveFile(res, publicFile);
      return;
    }

    const pageFile = path.join(__dirname, "views", pathname.slice(1));
    if (fs.existsSync(pageFile) && fs.statSync(pageFile).isFile()) {
      serveFile(res, pageFile);
      return;
    }

    send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
  } catch (error) {
    console.error(error);
    send(res, 500, "Internal server error", { "Content-Type": "text/plain; charset=utf-8" });
  }
});

server.listen(port, () => {
  console.log(`PR Media LLC & Tapoos course app running on http://localhost:${port}`);
});
