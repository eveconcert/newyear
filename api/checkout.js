// POST /api/checkout  { fullName, phone, tickets: { normal, vip } }
//
// Creates the order in Firestore as "pending_payment" and hands back a
// reference number. The reference IS the Firestore doc ID, so later steps
// (screenshot upload, admin approve/reject) can look it up directly with
// db.collection("orders").doc(reference) — no query needed.
//
// A single order can now mix both ticket types (e.g. 3 Normal + 2 VIP) —
// tickets is { normal: <int>, vip: <int> }, at least one of them > 0 and
// the combined total capped at 6 per order. The client generates one
// individual seat/QR per ticket once approved (see script.js), but they
// all live under this one order doc and get approved/rejected together.
//
// PAYMENT — still manual. No gateway wired up here (that was intentionally
// left out for the senior dev team — see the note below). Buyer sends
// payment manually and uploads a screenshot via /api/upload-screenshot,
// then an admin approves/rejects it in admin.html.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

// Prices are decided here, server-side, and never trusted from the
// client — otherwise someone could submit a fake cheaper total.
const PACKAGE_PRICES_ETB = { normal: 25000, vip: 50000 };

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVE-${stamp}-${rand}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullName, phone, tickets } = req.body || {};

  const normalQty = Number(tickets?.normal) || 0;
  const vipQty = Number(tickets?.vip) || 0;
  const totalQty = normalQty + vipQty;

  if (!fullName || !phone) {
    return res.status(400).json({ error: "Missing or invalid order details." });
  }

  if (
    !Number.isInteger(normalQty) ||
    !Number.isInteger(vipQty) ||
    normalQty < 0 ||
    vipQty < 0 ||
    totalQty < 1 ||
    totalQty > 6
  ) {
    return res.status(400).json({ error: "Choose between 1 and 6 tickets." });
  }

  const reference = generateReference();
  const totalEtb = normalQty * PACKAGE_PRICES_ETB.normal + vipQty * PACKAGE_PRICES_ETB.vip;

  try {
    await db.collection("orders").doc(reference).set({
      reference,
      fullName,
      phone,
      tickets: { normal: normalQty, vip: vipQty },
      totalEtb,
      status: "pending_payment",
      screenshotUrl: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ reference });
  } catch (err) {
    console.error("checkout failed:", err);
    return res.status(500).json({ error: "Could not save your order. Please try again." });
  }

  // -----------------------------------------------------------------
  // PAYMENT INTEGRATION — SantimPay (still not wired up)
  //
  // Suggested shape for that work, left for the senior dev team:
  //   1. Call the SantimPay API to create a payment session for
  //      `totalEtb`, passing `reference` as the merchant reference.
  //   2. Return the SantimPay redirect/checkout URL to the client so
  //      script.js can send the user there instead of the manual
  //      screenshot-upload flow below.
  //   3. Add a webhook endpoint (e.g. /api/santimpay-webhook.js) to
  //      receive payment confirmation and flip order.status to "paid"
  //      automatically instead of requiring manual admin approval.
  // -----------------------------------------------------------------
};
