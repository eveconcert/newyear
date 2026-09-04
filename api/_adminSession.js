// Signed admin session cookie — replaces the old client-side password
// check in admin.js (which anyone could bypass by reading the JS source).
//
// The cookie is HttpOnly (JS on the page can't read it) and its value is
// signed with ADMIN_SESSION_SECRET, so it can't be forged without knowing
// that secret. No database/session store needed — the signature itself is
// the proof.
//
// Needs two env vars in Vercel:
//   ADMIN_PASSWORD        — the password entered on admin.html
//   ADMIN_SESSION_SECRET  — any long random string, used only to sign cookies

const crypto = require("crypto");

const COOKIE_NAME = "eve_admin_session";
const MAX_AGE_SECONDS = 12 * 60 * 60; // 12 hours

function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET || "";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function createSessionCookie() {
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  const signature = sign(payload);
  const value = encodeURIComponent(`${payload}.${signature}`);

  return `${COOKIE_NAME}=${value}; HttpOnly; Path=/; Max-Age=${MAX_AGE_SECONDS}; SameSite=Lax; Secure`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function isValidAdminSession(req) {
  const cookieHeader = req.headers.cookie || "";
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return false;

  const value = decodeURIComponent(match[1]);
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [prefix, expires, signature] = parts;
  const payload = `${prefix}.${expires}`;

  if (sign(payload) !== signature) return false;
  if (Date.now() > Number(expires)) return false;
  return true;
}

module.exports = { createSessionCookie, clearSessionCookie, isValidAdminSession };
