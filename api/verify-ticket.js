// POST /api/verify-ticket  { reference, seatId, phone }
//
// This is the actual door check-in — called by verify.html when a QR
// gets scanned. Unlike /api/order-status (read-only, used for the
// buyer's own "is my ticket ready" polling), this one MUTATES state:
// the first scan of a given seatId marks it checked-in with a
// timestamp; every scan after that comes back "already_used" with the
// original check-in time, instead of silently saying "valid" again.
//
// Uses a Firestore transaction so two doormen scanning the same QR at
// the same instant can't both get "valid" — one wins, one gets
// "already_used".

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

function normalizePhone(phone) {
  return String(phone || "").replace(/[^\d]/g, "");
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { reference, seatId, phone } = req.body || {};

  if (!reference || !seatId || !phone) {
    return res.status(400).json({ error: "reference, seatId and phone are required." });
  }

  const orderRef = db.collection("orders").doc(String(reference));

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(orderRef);

      if (!snap.exists) return { outcome: "not_found" };

      const order = snap.data();

      if (normalizePhone(order.phone) !== normalizePhone(phone)) {
        // Same "not found" as a missing doc — don't let this endpoint
        // confirm whether a reference exists.
        return { outcome: "not_found" };
      }

      if (order.status === "rejected") return { outcome: "rejected", order };
      if (order.status !== "approved") return { outcome: "not_approved", order };

      const normalTickets = order.tickets?.normal || 0;
      const vipTickets = order.tickets?.vip || 0;
      const validIds = [];
      for (let i = 1; i <= normalTickets; i++) validIds.push(`${reference}-N${i}`);
      for (let i = 1; i <= vipTickets; i++) validIds.push(`${reference}-V${i}`);

      if (!validIds.includes(seatId)) {
        return { outcome: "bad_seat", order };
      }

      const checkedIn = order.checkedIn || {};
      if (checkedIn[seatId]) {
        return { outcome: "already_used", order, checkedInAt: checkedIn[seatId] };
      }

      const checkedInAt = new Date().toISOString();
      tx.update(orderRef, { [`checkedIn.${seatId}`]: checkedInAt });
      return { outcome: "ok", order, checkedInAt };
    });

    if (result.outcome === "not_found") {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.status(200).json({
      outcome: result.outcome,
      checkedInAt: result.checkedInAt || null,
      order: {
        reference: result.order.reference,
        fullName: result.order.fullName,
        phone: result.order.phone,
        tickets: result.order.tickets || null,
      },
    });
  } catch (err) {
    console.error("verify-ticket failed:", err);
    return res.status(500).json({ error: "Could not verify this ticket. Try again." });
  }
};
