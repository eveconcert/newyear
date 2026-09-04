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

  // Hero bar countdown elements
  const heroCd = document.getElementById("hero-countdown");
  const hcdDays = document.getElementById("hcd-days");
  const hcdHours = document.getElementById("hcd-hours");
  const hcdMins = document.getElementById("hcd-mins");
  const hcdSecs = document.getElementById("hcd-secs");

  function tick() {
    const diff = SALE_END.getTime() - Date.now();

    if (diff <= 0) {
      clearInterval(timer);
      wrap.hidden = true;
      if (heroCd) heroCd.hidden = true;
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

    // Mirror to hero bar
    if (hcdDays) hcdDays.textContent = pad(days);
    if (hcdHours) hcdHours.textContent = pad(hours);
    if (hcdMins) hcdMins.textContent = pad(mins);
    if (hcdSecs) hcdSecs.textContent = pad(secs);
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

    // Ethiopian phone: must start with 09 or 07 and be exactly 10 digits
    const phoneDigits = payload.phone.replace(/\D/g, "");
    const validPhone = /^(09|07)\d{8}$/.test(phoneDigits);
    if (!validPhone) {
      errorEl.textContent =
        "Phone number must start with 09 or 07 and be 10 digits (e.g. 0912345678).";
      errorEl.hidden = false;
      return;
    }
    payload.phone = phoneDigits;

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
  // Calculate total from payload so we can show the exact amount to deposit
  const totalEtb =
    (payload.tickets.normal || 0) * PACKAGE_PRICES_ETB.normal +
    (payload.tickets.vip || 0) * PACKAGE_PRICES_ETB.vip;

  container.innerHTML = `
    <div class="order__success">
      <h3>${t("success_heading")}</h3>
      <p>${t("success_ref_label")}</p>
      <p class="order__ref">${reference}</p>

      <div class="telebirr-box">
        <div class="telebirr-box__header">
          <img src="data:image/png;base64,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" class="telebirr-box__logo" alt="Telebirr" />
          <div class="telebirr-box__header-text">
            <div class="telebirr-box__header-title">Deposit via Telebirr</div>
            <div class="telebirr-box__header-sub">Send payment to the number below</div>
          </div>
        </div>
        <div class="telebirr-box__body">
          <div class="telebirr-box__row">
            <span class="telebirr-box__label">Account name</span>
            <span class="telebirr-box__value">Eve Concert</span>
          </div>
          <div class="telebirr-box__row">
            <span class="telebirr-box__label">Telebirr number</span>
            <span class="telebirr-box__value telebirr-box__value--number">0912 345 678</span>
          </div>
          <div class="telebirr-box__amount">
            <span class="telebirr-box__amount-label">Amount to send</span>
            <span class="telebirr-box__amount-value">${totalEtb.toLocaleString()} ETB</span>
          </div>
        </div>
      </div>

      <div class="screenshot-upload" id="screenshot-upload">
        <label for="screenshot-input">${t("screenshot_label")}</label>
        <div class="screenshot-upload__drop" id="screenshot-drop" onclick="document.getElementById('screenshot-input').click()">
          <span class="screenshot-upload__icon">📎</span>
          <span class="screenshot-upload__text" id="screenshot-filename">Tap to attach payment screenshot</span>
        </div>
        <input type="file" id="screenshot-input" accept="image/*" style="display:none" />
        <button class="btn btn--ghost" type="button" id="screenshot-submit" disabled style="opacity:0.4;cursor:not-allowed;">
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
  const filenameEl = document.getElementById("screenshot-filename");
  const dropEl = document.getElementById("screenshot-drop");

  // Enable submit only once a file is chosen
  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    if (file) {
      submitBtn.disabled = false;
      submitBtn.style.opacity = "1";
      submitBtn.style.cursor = "pointer";
      if (filenameEl) filenameEl.textContent = "✓ " + file.name;
      if (dropEl) dropEl.classList.add("screenshot-upload__drop--chosen");
    } else {
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.4";
      submitBtn.style.cursor = "not-allowed";
      if (filenameEl)
        filenameEl.textContent = "Tap to attach payment screenshot";
      if (dropEl) dropEl.classList.remove("screenshot-upload__drop--chosen");
    }
  });

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
    seat.packageType === "vip" ? "VVIP" : t("package_normal_name");

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
