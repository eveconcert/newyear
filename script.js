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

const PACKAGE_PRICES_ETB = { normal: 25000, vvip: 50000 };
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
  const quantityInput = document.getElementById("quantity");
  const qtyDecrease = document.getElementById("qty-decrease");
  const qtyIncrease = document.getElementById("qty-increase");
  const packageToggle = document.getElementById("package-toggle");
  const totalEl = document.getElementById("order-total");
  const errorEl = document.getElementById("order-error");
  const submitBtn = document.getElementById("order-submit");
  const container = document.getElementById("order-form-container");

  let selectedPackage = "normal";

  function updateTotal() {
    const qty = Number(quantityInput.value);
    totalEl.textContent = formatEtb(PACKAGE_PRICES_ETB[selectedPackage] * qty);
  }

  packageToggle.querySelectorAll(".package-toggle__btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedPackage = btn.dataset.package;
      packageToggle.querySelectorAll(".package-toggle__btn").forEach((b) => {
        const active = b === btn;
        b.classList.toggle("package-toggle__btn--active", active);
        b.setAttribute("aria-checked", String(active));
      });
      updateTotal();
    });
  });

  function setQuantity(next) {
    const clamped = Math.min(MAX_TICKETS, Math.max(MIN_TICKETS, next));
    quantityInput.value = clamped;
    updateTotal();
  }

  qtyDecrease.addEventListener("click", () => setQuantity(Number(quantityInput.value) - 1));
  qtyIncrease.addEventListener("click", () => setQuantity(Number(quantityInput.value) + 1));

  updateTotal();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const payload = {
      fullName: document.getElementById("fullName").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      quantity: Number(quantityInput.value),
      ticketType: selectedPackage,
    };

    if (!payload.fullName || !payload.phone) {
      errorEl.textContent = t("form_error_required");
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

  initScreenshotUpload(reference);
}

function initScreenshotUpload(reference) {
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

      uploadBox.innerHTML = `
        <p class="screenshot-done">${t("screenshot_done")}</p>
      `;
    } catch (err) {
      errorEl.textContent = t("screenshot_error_read");
      errorEl.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = t("screenshot_button");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initCountdown();
  initModal();
  initOrderForm();
});
