# Eve Concert — Enkutatash 2019 (plain HTML/CSS/JS)

Landing page + ticket order form for the Ethiopian New Year's Eve Concert
at Sheraton Addis (Musical Fountain), September 10th, featuring Aster
Aweke and T.I.

No login/auth, no build step, no framework — just HTML, CSS and JS you
can open and edit directly.

## Files

```
index.html        the landing page + order form
admin.html         admin panel (password-gated order review)
styles.css         shared design system
admin.css          admin panel-specific styles
script.js          starburst graphic + order form + screenshot upload
admin.js            admin panel logic (approve/reject, password gate)
storage.js          shared order storage (see note below)
api/checkout.js    Vercel serverless function that records orders
```

## Language

There's a language toggle (English / አማርኛ) sticky at the top of the
page. It swaps text via `data-i18n` attributes and a small dictionary
in `i18n.js` — no build step, no separate URLs. The choice is
remembered per-browser (localStorage).

**The Amharic text is a best-effort translation, not reviewed by a
native speaker** — have someone fluent check the wording in
`i18n.js` before this goes in front of real ticket buyers.

## Ticket sale countdown

The countdown on the tickets section counts down to when sales
**close** — Pagume 5, 12:00 PM Addis Ababa time (September 10, 2026).
Buying is open right up until then; the "Buy Tickets" button disables
itself once the countdown hits zero. Change the target date in
`script.js` (`SALE_END`) if that's wrong.

## Mobile

98% of traffic is expected to be on phones, so this was built
mobile-first: full-width tap targets, a full-screen modal below
600px, 16px form inputs (prevents iOS auto-zoom on focus), and
tighter spacing on small screens. Worth testing on an actual phone
before the presentation, not just a resized browser window.

## Payment screenshots + admin approval (demo version)

For the presentation, this doesn't have a real backend yet, so orders
and payment screenshots are stored in the browser's **local storage**
(`storage.js`) rather than a database:

- A customer reserves tickets, then uploads a payment screenshot.
  The order (with the screenshot) is saved in that browser's local
  storage.
- `/admin.html` reads from the same local storage and lets you
  approve or reject orders that have a screenshot.

**This only works within one browser on one device** — it's for
demoing the flow, not for real multi-device use. The admin password
is also just a placeholder client-side check (see the comment in
`admin.js`), not real authentication.

When the real backend is built (alongside the SantimPay integration
noted in `api/checkout.js`), `storage.js` should be replaced with
real API calls to a database, and the admin page should sit behind
proper login.

**Default admin password:** `enkutatash2019` — change this in
`admin.js` before sharing the link with anyone.

## Run locally

Just open `index.html` in a browser — no install, no build step.

The order form will still work without the API: if `/api/checkout`
isn't available (e.g. you're just opening the file locally), it falls
back to generating a reference number in the browser so you can see
the full flow.

## Deploy on Vercel

1. Push this folder to a GitHub repo (or drag it into a new Vercel
   project directly).
2. In Vercel: **New Project → Import** your repo. No framework preset
   needed — Vercel serves `index.html` as a static site and
   automatically turns `api/checkout.js` into a live endpoint at
   `/api/checkout`.
3. Deploy. No environment variables required for the current build.

## Payment — currently manual

Ticket orders submitted through the form hit `api/checkout.js`, which
records the order as `pending_payment` (logged to the console — no
database yet) and returns a reference number to the customer.

**No payment gateway is wired up.** That's intentionally left for the
senior dev team — see the comment block in `api/checkout.js` for the
suggested shape of the SantimPay integration (create payment session,
redirect the user, add a webhook for confirmation).
