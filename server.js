"use strict";

const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { URLSearchParams } = require("node:url");

loadDotEnv(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const APP_PASSWORD = String(process.env.APP_PASSWORD || "").trim();
const SESSION_SECRET = String(process.env.SESSION_SECRET || "").trim();
const APP_DIR = path.join(__dirname, "BAXK");
const COOKIE_NAME = "dasholda_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const STATIC_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon"
};

if (!APP_PASSWORD || !SESSION_SECRET) {
  console.error("Missing required environment variables. Set APP_PASSWORD and SESSION_SECRET in .env.");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  try {
    applySecurityHeaders(res);

    const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = normalizePathname(requestUrl.pathname);

    if (pathname === "/healthz") {
      return sendText(res, 200, "ok");
    }

    if (pathname === "/login" && req.method === "GET") {
      if (isAuthenticated(req)) {
        redirect(res, "/");
        return;
      }

      return sendHtml(res, 200, renderLoginPage());
    }

    if (pathname === "/login" && req.method === "POST") {
      const form = await readFormBody(req);
      const password = String(form.get("password") || "").trim();
      if (!timingSafeEqual(password, APP_PASSWORD)) {
        return sendHtml(res, 401, renderLoginPage("Mot de passe invalide."));
      }

      setSessionCookie(res);
      redirect(res, "/");
      return;
    }

    if (pathname === "/logout" && req.method === "POST") {
      clearSessionCookie(res);
      redirect(res, "/login");
      return;
    }

    if (!isAuthenticated(req)) {
      redirect(res, "/login");
      return;
    }

    if (pathname === "/") {
      return serveFile(res, path.join(APP_DIR, "index.html"));
    }

    return serveStaticAsset(res, pathname);
  } catch (error) {
    console.error(error);
    sendText(res, 500, "Internal Server Error");
  }
});

server.on("clientError", (error, socket) => {
  console.error(error);
  if (socket.writable) {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  }
});

process.on("uncaughtException", (error) => {
  console.error("uncaughtException", error);
});

process.on("unhandledRejection", (error) => {
  console.error("unhandledRejection", error);
});

server.listen(PORT, HOST, () => {
  console.log(`Dasholda Atelier listening on http://${HOST}:${PORT}`);
});

function loadDotEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = stripQuotes(value);
  }
}

function stripQuotes(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizePathname(pathname) {
  return pathname.replace(/\/{2,}/g, "/");
}

function applySecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "frame-ancestors 'none'"
    ].join("; ")
  );
}

function isAuthenticated(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return false;
  }

  const payload = verifySignedValue(token);
  if (!payload) {
    return false;
  }

  return Number(payload.expiresAt) > Date.now();
}

function setSessionCookie(res) {
  const payload = {
    issuedAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(12).toString("hex")
  };
  const token = signValue(payload);
  res.setHeader("Set-Cookie", serializeCookie(COOKIE_NAME, token, SESSION_TTL_MS));
}

function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`);
}

function signValue(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");
  return `${body}.${signature}`;
}

function verifySignedValue(token) {
  const [body, signature] = String(token || "").split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(body)
    .digest("base64url");

  if (!timingSafeEqual(signature, expected)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""));
  const rightBuffer = Buffer.from(String(right || ""));
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseCookies(header) {
  return header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf("=");
      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function serializeCookie(name, value, maxAgeMs) {
  const maxAge = Math.max(1, Math.floor(maxAgeMs / 1000));
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.end();
}

async function readFormBody(req) {
  const body = await readRequestBody(req);
  return new URLSearchParams(body);
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 16 * 1024) {
        reject(new Error("Request body too large"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function serveStaticAsset(res, pathname) {
  const relativePath = pathname === "/" ? "/index.html" : pathname;
  const resolvedPath = path.resolve(APP_DIR, `.${relativePath}`);
  if (!resolvedPath.startsWith(APP_DIR)) {
    return sendText(res, 403, "Forbidden");
  }

  return serveFile(res, resolvedPath);
}

function serveFile(res, filePath) {
  try {
    const stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      return sendText(res, 404, "Not Found");
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = STATIC_TYPES[extension] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    sendText(res, 404, "Not Found");
  }
}

function sendHtml(res, statusCode, html) {
  res.writeHead(statusCode, { "Content-Type": "text/html; charset=utf-8" });
  res.end(html);
}

function sendText(res, statusCode, body) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

function renderLoginPage(errorMessage = "") {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Connexion Atelier</title>
  <style>
    :root {
      color-scheme: light;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #f3f5f8;
      color: #111827;
    }
    .card {
      width: min(100% - 2rem, 24rem);
      padding: 1.5rem;
      border-radius: 1.25rem;
      background: #fff;
      border: 1px solid #e5e7eb;
      box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
    }
    h1 {
      margin: 0 0 0.4rem;
      font-size: 1.7rem;
    }
    p {
      margin: 0 0 1rem;
      color: #6b7280;
    }
    label {
      display: grid;
      gap: 0.45rem;
      font-weight: 600;
      font-size: 0.92rem;
      color: #1f2937;
    }
    input {
      height: 3rem;
      padding: 0 0.9rem;
      border: 1px solid #d1d5db;
      border-radius: 999px;
      font-size: 1rem;
    }
    button {
      width: 100%;
      height: 3rem;
      margin-top: 1rem;
      border: 0;
      border-radius: 999px;
      background: #0a84ff;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
    }
    .error {
      margin-top: 0.75rem;
      color: #b91c1c;
      font-size: 0.92rem;
    }
  </style>
</head>
<body>
  <form class="card" method="post" action="/login">
    <h1>Dasholda Atelier</h1>
    <p>Accès protégé.</p>
    <label>
      Mot de passe
      <input name="password" type="password" autocomplete="current-password" required>
    </label>
    <button type="submit">Se connecter</button>
    ${errorMessage ? `<div class="error">${escapeHtml(errorMessage)}</div>` : ""}
  </form>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
