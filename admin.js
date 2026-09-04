// Real backend now: password is checked server-side in /api/admin-login
// (never sent to the browser to compare against), which sets a signed
// HttpOnly cookie on success. Every request below relies on that cookie —
// there's no password or session token sitting in this file to read.

const STATUS_LABELS = {
  pending_payment: "Awaiting screenshot",
  pending_review: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

let currentOrders = [];

function initPasswordGate() {
  const gate = document.getElementById("password-gate");
  const content = document.getElementById("admin-content");
  const form = document.getElementById("password-form");
  const input = document.getElementById("password-input");
  const error = document.getElementById("password-error");
  const submitBtn = document.getElementById("password-submit");

  function showAdmin() {
    gate.hidden = true;
    content.hidden = false;
    loadOrders();
  }

  // If there's already a valid session cookie from an earlier visit,
  // skip straight to the admin view instead of asking for the password
  // again. admin-orders will 401 if the cookie's missing/expired, and
  // we just fall back to showing the password form in that case.
  fetch("/api/admin-orders")
    .then((res) => {
      if (res.ok) showAdmin();
    })
    .catch(() => {});

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    error.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Checking…";

    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: input.value }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error.textContent = data.error || "Wrong password.";
        error.hidden = false;
        return;
      }

      showAdmin();
    } catch (err) {
      error.textContent = "Network error — try again.";
      error.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enter";
    }
  });
}

async function loadOrders() {
  const listEl = document.getElementById("orders-list");
  const errorEl = document.getElementById("orders-error");
  errorEl.hidden = true;

  try {
    const res = await fetch("/api/admin-orders");

    if (res.status === 401) {
      // Session expired mid-visit — back to the password gate.
      document.getElementById("admin-content").hidden = true;
      document.getElementById("password-gate").hidden = false;
      return;
    }

    if (!res.ok) throw new Error("Server error");

    const data = await res.json();
    currentOrders = data.orders;
    renderOrders();
  } catch (err) {
    errorEl.textContent = "Could not load orders — check your connection and try refreshing.";
    errorEl.hidden = false;
    listEl.innerHTML = "";
  }
}

function renderOrders() {
  const listEl = document.getElementById("orders-list");
  const summaryEl = document.getElementById("admin-summary");

  const counts = currentOrders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  summaryEl.innerHTML = Object.keys(STATUS_LABELS)
    .map(
      (key) =>
        `<span class="badge badge--${key}">${counts[key] || 0} ${STATUS_LABELS[key]}</span>`
    )
    .join("");

  if (currentOrders.length === 0) {
    listEl.innerHTML = `<p class="empty-state">No orders yet.</p>`;
    return;
  }

  listEl.innerHTML = currentOrders.map(orderCardHtml).join("");

  listEl.querySelectorAll("[data-approve]").forEach((btn) => {
    btn.addEventListener("click", () => reviewOrder(btn.dataset.approve, "approved", btn));
  });

  listEl.querySelectorAll("[data-reject]").forEach((btn) => {
    btn.addEventListener("click", () => reviewOrder(btn.dataset.reject, "rejected", btn));
  });

  listEl.querySelectorAll("[data-resetref]").forEach((btn) => {
    btn.addEventListener("click", () => reviewOrder(btn.dataset.resetref, "pending_review", btn));
  });

  listEl.querySelectorAll("[data-thumb]").forEach((img) => {
    img.addEventListener("click", () => openLightbox(img.dataset.thumb));
  });
}

async function reviewOrder(reference, status, triggerBtn) {
  const card = triggerBtn.closest(".order-card");
  card.querySelectorAll("button").forEach((b) => (b.disabled = true));

  try {
    const res = await fetch("/api/admin-order-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, status }),
    });

    if (!res.ok) throw new Error("Server error");

    // Update locally so the list re-renders instantly instead of waiting
    // on a full reload from the server.
    const idx = currentOrders.findIndex((o) => o.reference === reference);
    if (idx !== -1) currentOrders[idx] = { ...currentOrders[idx], status };
    renderOrders();
  } catch (err) {
    alert("Could not update this order — check your connection and try again.");
    card.querySelectorAll("button").forEach((b) => (b.disabled = false));
  }
}

function orderCardHtml(order) {
  const thumb = order.screenshotUrl
    ? `<img class="order-card__thumb" data-thumb="${order.screenshotUrl}" src="${order.screenshotUrl}" alt="Payment screenshot for ${order.fullName}" />`
    : `<div class="order-card__thumb order-card__thumb--empty">No screenshot</div>`;

  const canReview = order.status === "pending_review";
  const packageLabel = order.ticketType === "vip" ? "VIP" : "Normal";

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
        <span class="order-card__meta">${escapeHtml(order.phone)} · ${escapeHtml(packageLabel)}</span>
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

document.getElementById("lightbox-close")?.addEventListener("click", (e) => {
  e.stopPropagation();
  document.getElementById("lightbox").hidden = true;
});

document.getElementById("refresh-btn")?.addEventListener("click", loadOrders);

document.getElementById("logout-btn")?.addEventListener("click", async () => {
  await fetch("/api/admin-logout", { method: "POST" }).catch(() => {});
  document.getElementById("admin-content").hidden = true;
  document.getElementById("password-gate").hidden = false;
  document.getElementById("password-input").value = "";
});

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", initPasswordGate);
