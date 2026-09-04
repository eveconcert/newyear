// POST /api/admin-order-action  { reference, status }
// status is one of "approved", "rejected", "pending_review" (the last one
// is used by admin.html's "Reset to review" button, for undoing a mistaken
// approve/reject). Requires a valid admin session cookie.

const admin = require("./_firebaseAdmin");
const { isValidAdminSession } = require("./_adminSession");

const db = admin.firestore();
const VALID_STATUSES = ["approved", "rejected", "pending_review"];

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!isValidAdminSession(req)) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const { reference, status } = req.body || {};

  if (!reference || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: "reference and a valid status are required." });
  }

  try {
    const orderRef = db.collection("orders").doc(reference);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    await orderRef.update({
      status,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true, status });
  } catch (err) {
    console.error("admin-order-action failed:", err);
    return res.status(500).json({ error: "Could not update the order." });
  }
};
