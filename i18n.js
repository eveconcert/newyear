// -----------------------------------------------------------------
// Simple English/Amharic toggle — no build step, no framework.
//
// Elements with data-i18n="key" get their textContent swapped based
// on the selected language. Dynamic strings generated in script.js
// (form errors, success messages) use the t(key) helper below.
//
// NOTE: the Amharic strings here are a best-effort translation, not
// reviewed by a native speaker. Have someone fluent check the wording
// before this goes in front of real ticket buyers.
// -----------------------------------------------------------------

const translations = {
  en: {
    hero_cta: "Buy Tickets",

    venue_label: "The venue",
    venue_heading: "An open-air New Year's Eve at the Musical Fountain",
    venue_body:
      "Ring in 2019 at Sheraton Addis's Musical Fountain, with Aster Aweke and T.I. sharing the stage for one night of live music, food, and open bar under the stars.",
    fact_location_label: "Location",
    fact_location_value: "Sheraton Addis Hotel — Musical Fountain",
    fact_date_label: "Date",
    fact_bottle_label: "Bottle service",
    fact_bottle_value: "Available at the Summerfields area",

    tickets_label: "Tickets",
    tickets_heading: "One package, everything included",
    package_name: "Main Event",
    item_1: "Concert ticket",
    item_2: "Unlimited dining experience",
    item_3: "Open bar, all night long",
    stub_note:
      "Price includes VAT and service charge. Bottle service available separately at the Summerfields area. Entry is 21 and over.",
    restriction_1: "21+",
    restriction_2: "No outside food or drink",
    restriction_3: "No weapons",

    countdown_label: "Ticket sales end in",
    countdown_target: "Pagume 5, 12:00 PM (Addis Ababa time)",
    days: "Days",
    hours: "Hrs",
    mins: "Min",
    secs: "Sec",
    buy_button_active: "Buy Tickets",
    buy_button_ended: "Sales closed",

    modal_reserve_label: "Reserve",
    modal_heading: "Hold your tickets",
    modal_intro:
      "Fill in your details to reserve tickets for the Main Event package. Payment is currently handled manually — you'll be contacted directly to complete it.",
    field_fullname: "Full name",
    field_email: "Email",
    field_phone: "Phone",
    field_tickets: "Tickets",
    total_label: "Total",
    submit_button: "Reserve tickets",
    submit_button_loading: "Submitting…",
    form_error_required: "Please fill in all fields.",
    form_error_network: "Could not reach the server — check your connection and try again.",
    order_disclaimer:
      "This reserves your order for the Main Event package. Payment is handled manually for now — you'll be contacted to complete payment and confirm your ticket.",

    success_heading: "Order received",
    success_ref_label: "Your reference number:",
    success_body:
      "This reserves your place at the Main Event package. Once you've paid, upload a screenshot of the payment below and our team will confirm your ticket.",
    screenshot_label: "Payment screenshot",
    screenshot_button: "Upload screenshot",
    screenshot_button_loading: "Uploading…",
    screenshot_error_none: "Choose a screenshot first.",
    screenshot_done: "Screenshot received — your order is awaiting review.",
    screenshot_error_read: "Could not read that file. Try another image.",

    footer_title: "Eve Concert — Enkutatash 2019",
    footer_location: "Sheraton Addis, Addis Ababa",
  },

  am: {
    hero_cta: "ትኬት ይግዙ",

    venue_label: "አዳራሽ",
    venue_heading: "በሙዚቃ ፏፏቴ የክፍት ሰማይ ስር የምትከበር የዘመን መለወጫ ምሽት",
    venue_body:
      "2019ን በሸራተን አዲስ ሙዚቃ ፏፏቴ ላይ ይቀበሉ፤ አስቴር አወቀ እና ቲ.አይ. በአንድ መድረክ ላይ ለአንድ ሌሊት ቀጥታ ሙዚቃ፣ ምግብና ክፍት ባር ከከዋክብት ስር ያቀርባሉ።",
    fact_location_label: "ቦታ",
    fact_location_value: "ሸራተን አዲስ ሆቴል — ሙዚቃ ፏፏቴ",
    fact_date_label: "ቀን",
    fact_bottle_label: "የጠርሙስ አገልግሎት",
    fact_bottle_value: "በሳመርፊልድስ አካባቢ ይገኛል",

    tickets_label: "ትኬት",
    tickets_heading: "አንድ ጥቅል፣ ሁሉንም ያካትታል",
    package_name: "ዋናው ዝግጅት",
    item_1: "የኮንሰርት ትኬት",
    item_2: "ያልተገደበ የምግብ አገልግሎት",
    item_3: "ሙሉ ሌሊት ክፍት ባር",
    stub_note:
      "ዋጋው ቫት እና የአገልግሎት ክፍያን ያካትታል። የጠርሙስ አገልግሎት በተናጠል በሳመርፊልድስ አካባቢ ይገኛል። መግቢያ ከ21 ዓመት በላይ ብቻ ነው።",
    restriction_1: "21+",
    restriction_2: "ከውጭ የመጣ ምግብ ወይም መጠጥ አይፈቀድም",
    restriction_3: "የጦር መሳሪያ አይፈቀድም",

    countdown_label: "የትኬት ሽያጭ የሚያበቃው በ",
    countdown_target: "ጳጉሜ 5፣ 12:00 ሰዓት (የአዲስ አበባ ሰዓት)",
    days: "ቀናት",
    hours: "ሰዓት",
    mins: "ደቂቃ",
    secs: "ሰከንድ",
    buy_button_active: "ትኬት ይግዙ",
    buy_button_ended: "ሽያጭ ተዘግቷል",

    modal_reserve_label: "ያስይዙ",
    modal_heading: "ትኬትዎን ያስይዙ",
    modal_intro:
      "ለዋናው ዝግጅት ጥቅል ትኬት ለማስያዝ መረጃዎን ይሙሉ። ክፍያ በአሁኑ ጊዜ በእጅ ይስተናገዳል — ክፍያውን ለማጠናቀቅ በቀጥታ እናገኝዎታለን።",
    field_fullname: "ሙሉ ስም",
    field_email: "ኢሜይል",
    field_phone: "ስልክ",
    field_tickets: "ትኬት ብዛት",
    total_label: "ጠቅላላ",
    submit_button: "ትኬት ያስይዙ",
    submit_button_loading: "በመላክ ላይ…",
    form_error_required: "እባክዎ ሁሉንም መስኮች ይሙሉ።",
    form_error_network: "አገልጋዩን ማግኘት አልተቻለም — ግንኙነትዎን ያረጋግጡና እንደገና ይሞክሩ።",
    order_disclaimer:
      "ይህ ለዋናው ዝግጅት ጥቅል ትዕዛዝዎን ያስይዛል። ክፍያ በአሁኑ ጊዜ በእጅ ይስተናገዳል — ክፍያውን አጠናቅቀው ትኬትዎን ለማረጋገጥ በቀጥታ እናገኝዎታለን።",

    success_heading: "ትዕዛዝ ደርሶናል",
    success_ref_label: "የማጣቀሻ ቁጥርዎ:",
    success_body:
      "ይህ ቦታዎን ለዋናው ዝግጅት ጥቅል ያስይዛል። ከከፈሉ በኋላ፣ ከታች የክፍያ ስክሪንሾት ይላኩ፤ ቡድናችን ትኬትዎን ያረጋግጣል።",
    screenshot_label: "የክፍያ ስክሪንሾት",
    screenshot_button: "ስክሪንሾት ላክ",
    screenshot_button_loading: "በመላክ ላይ…",
    screenshot_error_none: "እባክዎ መጀመሪያ ስክሪንሾት ይምረጡ።",
    screenshot_done: "ስክሪንሾት ደርሶናል — ትዕዛዝዎ በግምገማ ላይ ነው።",
    screenshot_error_read: "ፋይሉን ማንበብ አልተቻለም። እባክዎ ሌላ ምስል ይሞክሩ።",

    footer_title: "ኢቭ ኮንሰርት — እንቁጣጣሽ 2019",
    footer_location: "ሸራተን አዲስ፣ አዲስ አበባ",
  },
};

const LANG_KEY = "eve_lang";

function getLang() {
  return localStorage.getItem(LANG_KEY) || "en";
}

function t(key) {
  const lang = getLang();
  return (translations[lang] && translations[lang][key]) || translations.en[key] || key;
}

function applyTranslations() {
  const lang = getLang();
  document.documentElement.lang = lang;
  document.body.classList.toggle("lang-am", lang === "am");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const text = t(key);
    if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
      el.setAttribute("placeholder", text);
    } else {
      el.textContent = text;
    }
  });

  document.getElementById("lang-en")?.classList.toggle("lang-btn--active", lang === "en");
  document.getElementById("lang-am")?.classList.toggle("lang-btn--active", lang === "am");
}

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
}

function initLangToggle() {
  document.getElementById("lang-en")?.addEventListener("click", () => setLang("en"));
  document.getElementById("lang-am")?.addEventListener("click", () => setLang("am"));
  applyTranslations();
}

document.addEventListener("DOMContentLoaded", initLangToggle);
