const { clearSessionCookie } = require("./_adminSession");

module.exports = (req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  return res.status(200).json({ ok: true });
};
