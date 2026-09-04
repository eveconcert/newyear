// Vercel serverless function — deployed automatically at /api/checkout
// (Vercel picks up any file in /api as its own endpoint, no framework
// or build step required).
//
// This currently only records the order as "pending_payment" (logged
// to the console — no database wired up). No payment is actually
// taken here.

const TICKET_PRICE_ETB = 25000;

function generateReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EVE-${stamp}-${rand}`;
}

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { fullName, email, phone, quantity } = req.body || {};

  if (!fullName || !email || !phone || !quantity || quantity < 1) {
    res.status(400).json({ error: "Missing or invalid order details." });
    return;
  }

  const reference = generateReference();
  const totalEtb = TICKET_PRICE_ETB * quantity;

  const order = {
    reference,
    fullName,
    email,
    phone,
    quantity,
    totalEtb,
    status: "pending_payment",
    createdAt: new Date().toISOString(),
  };

  // -----------------------------------------------------------------
  // PAYMENT INTEGRATION — SantimPay
  //
  // This endpoint currently only records the order as "pending_payment".
  // No payment is actually taken here. The SantimPay gateway integration
  // is intentionally left out of this build — that's the senior dev
  // team's part to wire up. Suggested shape for that work:
  //
  //   1. Persist `order` to a real database (this stub only logs it).
  //   2. Call the SantimPay API to create a payment session for
  //      `order.totalEtb`, passing `order.reference` as the merchant
  //      reference / callback identifier.
  //   3. Return the SantimPay redirect/checkout URL to the client so
  //      script.js can send the user there instead of showing the
  //      "Order received" screen directly.
  //   4. Add a webhook endpoint (e.g. /api/santimpay-webhook.js) to
  //      receive payment confirmation and flip `order.status` to "paid".
  // -----------------------------------------------------------------

  console.log("New ticket order (pending manual payment):", order);

  res.status(200).json({ reference: order.reference });
};
