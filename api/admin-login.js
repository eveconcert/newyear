// POST /api/admin-login  { password }
// Replaces the old plaintext password check that lived in admin.js
// (readable by anyone viewing page source). This checks server-side
// against ADMIN_PASSWORD and, on success, sets a signed HttpOnly cookie.

const { createSessionCookie } = require("./_adminSession");

module.exports = (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { password } = req.body || {};

  if (!process.env.ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD env var is not set.");
    return res.status(500).json({ error: "Admin login isn't configured yet." });
  }

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  res.setHeader("Set-Cookie", createSessionCookie());
  return res.status(200).json({ ok: true });
};
