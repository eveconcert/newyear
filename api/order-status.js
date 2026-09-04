// GET /api/order-status?reference=EVE-XXXX&phone=+2519xxxxxxxx
//
// Public endpoint the buyer's own browser polls after they submit their
// order, so they can see the ticket the instant an admin approves it —
// without any login/account system.
//
// Because this is public (no admin session needed), it requires BOTH the
// reference AND the phone number used on the order to match before
// returning anything. The reference alone has a random suffix and is
// already hard to guess, but requiring the phone too means someone who
// spots/guesses a reference still can't pull another buyer's name/phone.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference, phone } = req.query || {};

  if (!reference || !phone) {
    return res.status(400).json({ error: "reference and phone are required." });
  }

  try {
    const snap = await db.collection("orders").doc(String(reference)).get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Order not found." });
    }

    const order = snap.data();

    if (normalizePhone(order.phone) !== normalizePhone(phone)) {
      // Deliberately the same "not found" message as a missing doc, so
      // this endpoint can't be used to confirm whether a reference exists.
      return res.status(404).json({ error: "Order not found." });
    }

    return res.status(200).json({
      reference: order.reference,
      status: order.status,
      fullName: order.fullName,
      phone: order.phone,
      tickets: order.tickets || null,
      totalEtb: order.totalEtb,
    });
  } catch (err) {
    console.error("order-status failed:", err);
    return res.status(500).json({ error: "Could not look up your order." });
  }
};
