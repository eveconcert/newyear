// ---------- Sale countdown ----------

// Ticket sales CLOSE at Pagume 5, 12:00 PM Addis Ababa time (East
// Africa Time, UTC+3, no daylight saving). Pagume 5, 2018 E.C. falls
// on September 10, 2026 in the Gregorian calendar — the day the
// countdown counts down to.
const SALE_END = new Date("2026-09-10T12:00:00+03:00");

function initCountdown() {
  const wrap = document.getElementById("countdown");
  const buyBtn = document.getElementById("buy-tickets-btn");
  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tick() {
    const diff = SALE_END.getTime() - Date.now();

    if (diff <= 0) {
      clearInterval(timer);
      wrap.hidden = true;
      buyBtn.disabled = true;
      buyBtn.setAttribute("data-i18n", "buy_button_ended");
      buyBtn.textContent = t("buy_button_ended");
      return;
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    daysEl.textContent = pad(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);
  }

  tick();
  const timer = setInterval(tick, 1000);
}

// ---------- Buy Tickets modal ----------

function initModal() {
  const overlay = document.getElementById("modal-overlay");
  const buyBtn = document.getElementById("buy-tickets-btn");
  const heroBuyBtn = document.getElementById("hero-buy-btn");
  const closeBtn = document.getElementById("modal-close");

  function openModal() {
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = "";
    stopStatusPolling();
  }

  buyBtn.addEventListener("click", () => {
    if (!buyBtn.disabled) openModal();
  });

  // Hero button mirrors the in-section Buy Tickets button — same
  // disabled state (sales-closed), same modal, no more scroll-to-form.
  heroBuyBtn?.addEventListener("click", () => {
    if (!buyBtn.disabled) openModal();
  });

  closeBtn.addEventListener("click", closeModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeModal();
  });
}

// ---------- Order form ----------

const PACKAGE_PRICES_ETB = { normal: 25000, vip: 50000 };
const MIN_TICKETS = 1;
const MAX_TICKETS = 6;

function formatEtb(amount) {
  return amount.toLocaleString() + " ETB";
}

// Compress an uploaded image to a reasonable size before storing it
// as a data URL (localStorage has limited space, and phone camera
// screenshots can be large).
function compressImage(file, maxWidth = 1000, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function initOrderForm() {
  const form = document.getElementById("order-form");
  const picker = document.getElementById("ticket-picker");
  const hintEl = document.getElementById("ticket-picker-hint");
  const totalEl = document.getElementById("order-total");
  const errorEl = document.getElementById("order-error");
  const submitBtn = document.getElementById("order-submit");
  const container = document.getElementById("order-form-container");

  const qty = { normal: 1, vip: 0 };
  const valueEls = {
    normal: document.getElementById("qty-normal"),
    vip: document.getElementById("qty-vip"),
  };
  const rowEls = {
    normal: picker.querySelector('[data-package="normal"]'),
    vip: picker.querySelector('[data-package="vip"]'),
  };

  function total() {
    return qty.normal + qty.vip;
  }

  function render() {
    Object.keys(qty).forEach((pkg) => {
      valueEls[pkg].textContent = qty[pkg];
      rowEls[pkg].classList.toggle("ticket-picker__row--active", qty[pkg] > 0);
    });

    picker.querySelectorAll("[data-increase]").forEach((btn) => {
      btn.disabled = total() >= MAX_TICKETS;
    });
    picker.querySelectorAll("[data-decrease]").forEach((btn) => {
      btn.disabled = qty[btn.dataset.decrease] <= 0;
    });

    const totalEtb =
      qty.normal * PACKAGE_PRICES_ETB.normal + qty.vip * PACKAGE_PRICES_ETB.vip;
    totalEl.textContent = formatEtb(totalEtb);

    if (total() >= MAX_TICKETS) {
      hintEl.textContent = t("ticket_picker_hint_limit");
      hintEl.classList.add("ticket-picker__hint--limit");
    } else {
      hintEl.textContent = t("ticket_picker_hint");
      hintEl.classList.remove("ticket-picker__hint--limit");
    }
  }

  picker.querySelectorAll("[data-increase]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pkg = btn.dataset.increase;
      if (total() >= MAX_TICKETS) return;
      qty[pkg] += 1;
      render();
    });
  });

  picker.querySelectorAll("[data-decrease]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pkg = btn.dataset.decrease;
      if (qty[pkg] <= 0) return;
      qty[pkg] -= 1;
      render();
    });
  });

  render();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      tickets: { normal: qty.normal, vip: qty.vip },
    };

    if (!payload.fullName || !payload.phone) {
      errorEl.textContent = t("form_error_required");
      errorEl.hidden = false;
      return;
    }

    if (total() < MIN_TICKETS) {
      errorEl.textContent = t("form_error_no_tickets");
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("submit_button_loading");

    try {
      // Talks to /api/checkout (a Vercel serverless function, see
      // /api/checkout.js). If you're not deploying on Vercel, or
      // haven't set that function up yet, this call will fail and
      // fall back to a local-only reference below.
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      finishOrder(container, data.reference, payload);
    } catch (err) {
      errorEl.textContent = t("form_error_network");
      errorEl.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = t("submit_button");
    }
  });
}

function finishOrder(container, reference, payload) {
  container.innerHTML = `
    <div class="order__success">
      <h3>${t("success_heading")}</h3>
      <p>${t("success_ref_label")}</p>
      <p class="order__ref">${reference}</p>
      <p>${t("success_body")}</p>

      <div class="screenshot-upload" id="screenshot-upload">
        <label for="screenshot-input">${t("screenshot_label")}</label>
        <input type="file" id="screenshot-input" accept="image/*" />
        <button class="btn btn--ghost" type="button" id="screenshot-submit">
          ${t("screenshot_button")}
        </button>
        <p class="order__error" id="screenshot-error" hidden></p>
      </div>
    </div>
  `;

  initScreenshotUpload(container, reference, payload);
}

function initScreenshotUpload(container, reference, payload) {
  const input = document.getElementById("screenshot-input");
  const submitBtn = document.getElementById("screenshot-submit");
  const errorEl = document.getElementById("screenshot-error");
  const uploadBox = document.getElementById("screenshot-upload");

  submitBtn.addEventListener("click", async () => {
    errorEl.hidden = true;
    const file = input.files && input.files[0];

    if (!file) {
      errorEl.textContent = t("screenshot_error_none");
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = t("screenshot_button_loading");

    try {
      const dataUrl = await compressImage(file);

      const res = await fetch("/api/upload-screenshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, screenshotBase64: dataUrl }),
      });

      if (!res.ok) throw new Error("Server error");

      startStatusPolling(container, reference, payload);
    } catch (err) {
      errorEl.textContent = t("screenshot_error_read");
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = t("screenshot_button");
    }
  });
}

// ---------- Live status polling + ticket ----------
//
// After the screenshot is uploaded, the buyer's own browser polls
// /api/order-status (public, keyed by reference+phone) so the ticket
// appears here the instant an admin approves the order — no login
// needed. Only runs while this modal/page stays open; if the buyer
// closes it, polling stops (there's no "come back later and check"
// page yet).

const STATUS_POLL_INTERVAL_MS = 5000;
const STATUS_POLL_TIMEOUT_MS = 45 * 60 * 1000; // give up nagging the server after 45 min
let statusPollTimer = null;

function stopStatusPolling() {
  if (statusPollTimer) {
    clearInterval(statusPollTimer);
    statusPollTimer = null;
  }
}

function startStatusPolling(container, reference, payload) {
  container.innerHTML = `
    <div class="order__success order__waiting" id="status-waiting">
      <div class="spinner" aria-hidden="true"></div>
      <h3>${t("waiting_heading")}</h3>
      <p>${t("waiting_body")}</p>
      <p class="order__ref">${reference}</p>
      <p class="order__error" id="status-error" hidden></p>
    </div>
  `;

  const startedAt = Date.now();

  async function poll() {
    if (Date.now() - startedAt > STATUS_POLL_TIMEOUT_MS) {
      stopStatusPolling();
      const waitingEl = document.getElementById("status-waiting");
      if (waitingEl) {
        waitingEl.querySelector(".spinner")?.remove();
        waitingEl.querySelector("p").textContent = t("waiting_timeout");
      }
      return;
    }

    try {
      const url = `/api/order-status?reference=${encodeURIComponent(
        reference
      )}&phone=${encodeURIComponent(payload.phone)}`;
      const res = await fetch(url);
      if (!res.ok) return; // transient network/server hiccup — just try again next tick

      const order = await res.json();

      if (order.status === "approved") {
        stopStatusPolling();
        renderTicket(container, order);
      } else if (order.status === "rejected") {
        stopStatusPolling();
        renderRejected(container, order);
      }
      // pending_payment / pending_review: keep waiting silently
    } catch (err) {
      const errorEl = document.getElementById("status-error");
      if (errorEl) {
        errorEl.textContent = t("status_check_error");
        errorEl.hidden = false;
      }
    }
  }

  poll();
  statusPollTimer = setInterval(poll, STATUS_POLL_INTERVAL_MS);
}

function renderRejected(container, order) {
  container.innerHTML = `
    <div class="order__success">
      <h3>${t("rejected_heading")}</h3>
      <p>${t("rejected_body")}</p>
      <p class="order__ref">${order.reference}</p>
    </div>
  `;
}

function renderTicket(container, order) {
  const seats = buildSeatList(order);

  container.innerHTML = `
    <div class="tickets-result">
      <h3 class="tickets-result__heading">${t("tickets_ready_heading")}</h3>
      <div class="tickets-result__list">
        ${seats.map((seat) => ticketCardHtml(order, seat)).join("")}
      </div>
    </div>
  `;

  seats.forEach((seat) => {
    const qrHost = document.getElementById(`ticket-qr-${seat.seatId}`);
    if (!qrHost) return;
    try {
      // Encode a full verification URL so scanning opens the verify page
      const verifyUrl = `${
        location.origin
      }/verify.html?ref=${encodeURIComponent(
        order.reference
      )}&seat=${encodeURIComponent(seat.seatId)}&phone=${encodeURIComponent(
        order.phone
      )}`;
      qrHost.innerHTML = makeQrSvg(verifyUrl);
    } catch (e) {
      qrHost.textContent = seat.seatId;
    }
  });
}

// Every ticket TYPE bought (Normal + VIP) can be bought together in one
// order now, and each individual ticket gets its own seat ID + QR code —
// so a group of 5 friends can each show their own scannable ticket at
// the door instead of passing around one shared code for the whole order.
// `order.tickets` is the new shape ({ normal, vip }); the `quantity`/
// `ticketType` fallback below is just so this still works against any
// older order docs already sitting in Firestore from before this change.
function buildSeatList(order) {
  const tickets = order.tickets || {
    [order.ticketType || "normal"]: order.quantity || 1,
  };
  const seats = [];

  for (let i = 1; i <= (tickets.normal || 0); i++) {
    seats.push({ seatId: `${order.reference}-N${i}`, packageType: "normal" });
  }
  for (let i = 1; i <= (tickets.vip || 0); i++) {
    seats.push({ seatId: `${order.reference}-V${i}`, packageType: "vip" });
  }

  return seats;
}

function ticketCardHtml(order, seat) {
  const packageLabel =
    seat.packageType === "vip"
      ? t("package_vip_name")
      : t("package_normal_name");

  return `
    <div class="ticket">
      <div class="ticket__main">
        <img class="ticket__poster" src="images/hero-banner.jpg" alt="" />
      </div>

      <div class="ticket__stub">
        <p class="ticket__eyebrow">${t("ticket_eyebrow")}</p>
        <h3 class="ticket__heading">${t("ticket_subheading")}</h3>
        <span class="ticket__badge ticket__badge--${
          seat.packageType
        }">${packageLabel}</span>

        <dl class="ticket__fields">
          <div>
            <dt>${t("ticket_name_label")}</dt>
            <dd>${escapeHtml(order.fullName)}</dd>
          </div>
          <div>
            <dt>${t("ticket_phone_label")}</dt>
            <dd>${escapeHtml(order.phone)}</dd>
          </div>
          <div>
            <dt>${t("ticket_id_label")}</dt>
            <dd class="ticket__id">${escapeHtml(seat.seatId)}</dd>
          </div>
        </dl>

        <div class="ticket__qr" id="ticket-qr-${seat.seatId}"></div>
        <p class="ticket__scan-label">${t("ticket_scan_label")}</p>
      </div>
    </div>
  `;
}

// The vendored qrcode-generator library (vendor/qrcode.min.js, global
// `qrcode`) needs an explicit "type number" (roughly, QR code size/
// capacity) rather than picking one automatically — it throws if the
// text doesn't fit the requested size. So we just try increasing sizes
// until one fits, same as the library's own official demos do.
//
// We build the <svg> ourselves from the module grid (qr.isDark(row,col))
// instead of using the library's own createSvgTag(): that helper emits a
// fixed-pixel SVG with NO viewBox, so once CSS resizes it to fit the
// ticket layout, browsers have nothing to scale the drawing coordinates
// against — the QR can end up clipped or blank depending on the browser.
// A real viewBox tied to the module count fixes that for good.
function makeQrSvg(text) {
  for (let typeNumber = 1; typeNumber <= 20; typeNumber++) {
    try {
      const qr = qrcode(typeNumber, "M");
      qr.addData(text);
      qr.make();

      const count = qr.getModuleCount();
      let path = "";
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.isDark(row, col)) {
            path += `M${col},${row}h1v1h-1z`;
          }
        }
      }

      return (
        `<svg viewBox="0 0 ${count} ${count}" xmlns="http://www.w3.org/2000/svg" ` +
        `shape-rendering="crispEdges" preserveAspectRatio="xMidYMid meet">` +
        `<rect width="${count}" height="${count}" fill="#ffffff"/>` +
        `<path d="${path}" fill="#111"/></svg>`
      );
    } catch (e) {
      // too small for this typeNumber — try the next size up
    }
  }
  throw new Error("Could not generate QR code");
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initModal();
  initOrderForm();
});
