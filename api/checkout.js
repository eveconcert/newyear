// POST /api/checkout  { fullName, email, phone, quantity }
//
// Creates the order in Firestore as "pending_payment" and hands back a
// reference number. The reference IS the Firestore doc ID, so later steps
// (screenshot upload, admin approve/reject) can look it up directly with
// db.collection("orders").doc(reference) — no query needed.
//
// PAYMENT — still manual. No gateway wired up here (that was intentionally
// left out for the senior dev team — see the note below). Buyer sends
// payment manually and uploads a screenshot via /api/upload-screenshot,
// then an admin approves/rejects it in admin.html.

const admin = require("./_firebaseAdmin");

const db = admin.firestore();

// Prices are decided here, server-side, and never trusted from the
// client — otherwise someone could submit a fake cheaper total.
const PACKAGE_PRICES_ETB = { normal: 25000, vvip: 50000 };

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVE-${stamp}-${rand}`;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fullName, phone, quantity, ticketType } = req.body || {};

  if (!fullName || !phone || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Missing or invalid order details." });
  }

  if (!PACKAGE_PRICES_ETB[ticketType]) {
    return res.status(400).json({ error: "Invalid ticket package." });
  }

  const reference = generateReference();
  const totalEtb = PACKAGE_PRICES_ETB[ticketType] * Number(quantity);

  try {
    await db.collection("orders").doc(reference).set({
      reference,
      fullName,
      phone,
      ticketType,
      quantity: Number(quantity),
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
