// POST /api/upload-screenshot  { reference, screenshotBase64 }
//
// TEMPORARY: stores the screenshot as a base64 data URL directly on the
// order doc. This works and is fine to ship, but isn't the final design —
// swap this for a real Cloudinary upload (store the returned secure_url
// instead of the raw base64) once that's wired up. Two reasons to swap:
//   1. Firestore documents cap out at 1MB — a compressed screenshot fits
//      today, but there's no headroom and no warning when it doesn't.
//   2. No CDN/image optimization — Cloudinary serves a resized, cached
//      version instead of the full original every time admin.html loads.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference, screenshotBase64 } = req.body || {};

  if (!reference || !screenshotBase64) {
    return res.status(400).json({ error: "Missing reference or screenshot." });
  }

  try {
    const orderRef = db.collection("orders").doc(reference);
    const snap = await orderRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    await orderRef.update({
      screenshotUrl: screenshotBase64,
      status: "pending_review",
      screenshotUploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("upload-screenshot failed:", err);
    return res.status(500).json({ error: "Could not save the screenshot. Please try again." });
  }
};
