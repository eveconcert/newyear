// -----------------------------------------------------------------
// DEMO STORAGE — localStorage, not a database
//
// There's no backend/database wired up yet, so orders (and payment
// screenshots) are stored in the browser's local storage. This is
// enough to demo the full flow (reserve → upload screenshot → admin
// approves) on one device, but it does NOT sync across devices or
// browsers, and clearing browser data wipes it.
//
// When the real backend goes in (alongside the SantimPay integration
// noted in api/checkout.js), this file should be replaced with real
// API calls to a database instead of localStorage.
// -----------------------------------------------------------------

const ORDERS_KEY = "eve_orders_v1";

function getOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
}

function updateOrder(reference, changes) {
  const orders = getOrders();
  const idx = orders.findIndex((o) => o.reference === reference);
  if (idx === -1) return null;
  orders[idx] = Object.assign({}, orders[idx], changes);
  saveOrders(orders);
  return orders[idx];
}
