const crypto = require("crypto");

const defaultPasswordHash = "aaf5601bb787b76fb556eecd4ac7d4b78b855551bd06b22256f9cc36cba399df";

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function getPasswordHash() {
  if (process.env.COURSE_PASSWORD_HASH) return process.env.COURSE_PASSWORD_HASH;
  if (process.env.COURSE_PASSWORD) return sha256(process.env.COURSE_PASSWORD);
  return defaultPasswordHash;
}

function getSecret() {
  return process.env.COURSE_AUTH_SECRET || getPasswordHash();
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

function createToken() {
  const expires = Date.now() + 1000 * 60 * 60 * 8;
  const value = `access:${expires}`;
  return `${value}.${sign(value)}`;
}

function parseCookies(header = "") {
  return Object.fromEntries(
    header
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function isAuthorized(req) {
  const token = parseCookies(req.headers.cookie).course_access;
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return false;
  const value = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  if (signature !== sign(value)) return false;
  const [, expires] = value.split(":");
  return Number(expires) > Date.now();
}

module.exports = {
  createToken,
  getPasswordHash,
  isAuthorized,
  sha256,
};
