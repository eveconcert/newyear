// GET /api/admin-orders — every order, newest first. Requires a valid
// admin session cookie (see _adminSession.js).

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  try {
    const snap = await db.collection("orders").orderBy("createdAt", "desc").get();
    const orders = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        ...d,
        createdAt: d.createdAt ? d.createdAt.toMillis() : null,
        screenshotUploadedAt: d.screenshotUploadedAt ? d.screenshotUploadedAt.toMillis() : null,
      };
    });

    return res.status(200).json({ orders });
  } catch (err) {
    console.error("admin-orders failed:", err);
    return res.status(500).json({ error: "Could not load orders." });
  }
};
