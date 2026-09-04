// -----------------------------------------------------------------
// DEMO PASSWORD — not real security.
//
// This is a client-side check anyone can bypass by reading this file
// or the page source. It's here so the admin view isn't wide open
// during the presentation. Replace with real authentication before
// this handles live orders.
// -----------------------------------------------------------------
const ADMIN_PASSWORD = "enkutatash2019";

const STATUS_LABELS = {
  pending_payment: "Awaiting screenshot",
  pending_review: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

function initPasswordGate() {
  const gate = document.getElementById("password-gate");
  const content = document.getElementById("admin-content");
  const form = document.getElementById("password-form");
  const input = document.getElementById("password-input");
  const error = document.getElementById("password-error");

  if (sessionStorage.getItem("eve_admin_unlocked") === "1") {
    gate.hidden = true;
    content.hidden = false;
    renderOrders();
    return;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (input.value === ADMIN_PASSWORD) {
      sessionStorage.setItem("eve_admin_unlocked", "1");
      gate.hidden = true;
      content.hidden = false;
      renderOrders();
    } else {
      error.hidden = false;
    }
  });
}

function renderOrders() {
  const orders = getOrders();
  const listEl = document.getElementById("orders-list");
  const summaryEl = document.getElementById("admin-summary");

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  summaryEl.innerHTML = Object.keys(STATUS_LABELS)
    .map(
      (key) =>
        `<span class="badge badge--${key}">${counts[key] || 0} ${STATUS_LABELS[key]}</span>`
    )
    .join("");

  if (orders.length === 0) {
    listEl.innerHTML = `<p class="empty-state">No orders yet.</p>`;
    return;
  }

  listEl.innerHTML = orders.map(orderCardHtml).join("");

  listEl.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateOrder(btn.dataset.approve, { status: "approved" });
      renderOrders();
    });
  });

  listEl.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateOrder(btn.dataset.reject, { status: "rejected" });
      renderOrders();
    });
  });

  listEl.querySelectorAll("[data-resetref]").forEach((btn) => {
    btn.addEventListener("click", () => {
      updateOrder(btn.dataset.resetref, { status: "pending_review" });
      renderOrders();
    });
  });

  listEl.querySelectorAll("[data-thumb]").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img.dataset.thumb));
  });
}

function orderCardHtml(order) {
  const thumb = order.screenshot
    ? `<img class="order-card__thumb" data-thumb="${order.screenshot}" src="${order.screenshot}" alt="Payment screenshot for ${order.fullName}" />`
    : `<div class="order-card__thumb order-card__thumb--empty">No screenshot</div>`;

  const canReview = order.status === "pending_review";

  const actions =
    order.status === "approved" || order.status === "rejected"
      ? `<button class="mini-btn" data-resetref="${order.reference}">Reset to review</button>`
      : canReview
      ? `<div class="order-card__buttons">
           <button class="mini-btn mini-btn--approve" data-approve="${order.reference}">Approve</button>
           <button class="mini-btn mini-btn--reject" data-reject="${order.reference}">Reject</button>
         </div>`
      : "";

  return `
    <div class="order-card">
      ${thumb}
      <div class="order-card__info">
        <span class="order-card__name">${escapeHtml(order.fullName)}</span>
        <span class="order-card__meta">${escapeHtml(order.email)} · ${escapeHtml(order.phone)}</span>
        <span class="order-card__meta">${order.quantity} ticket(s) · ${order.totalEtb.toLocaleString()} ETB</span>
        <span class="order-card__ref">${order.reference}</span>
      </div>
      <div class="order-card__actions">
        <span class="badge badge--${order.status}">${STATUS_LABELS[order.status]}</span>
        ${actions}
      </div>
    </div>
  `;
}

function openLightbox(src) {
  const lightbox = document.getElementById("lightbox");
  const img = document.getElementById("lightbox-img");
  img.src = src;
  lightbox.hidden = false;
}

document.getElementById("lightbox")?.addEventListener("click", () => {
  document.getElementById("lightbox").hidden = true;
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", initPasswordGate);
