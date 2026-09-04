# Eve Concert — Enkutatash 2019 (plain HTML/CSS/JS)

Landing page + ticket order form for the Ethiopian New Year's Eve Concert
at Sheraton Addis (Musical Fountain), September 10th, featuring Aster
Aweke and T.I.

No login/auth, no build step, no framework — just HTML, CSS and JS you
can open and edit directly.

## Files

```
index.html        the landing page + order form
admin.html         admin panel (real server-side login now)
styles.css         shared design system
admin.css          admin panel-specific styles
script.js          starburst graphic + order form + screenshot upload
admin.js            admin panel logic (approve/reject, real auth)
firestore.rules      locks Firestore to server-only access
api/_firebaseAdmin.js     shared Firebase Admin SDK init
api/_adminSession.js      signed admin session cookie helpers
api/checkout.js           creates the order in Firestore
api/upload-screenshot.js  saves the payment screenshot, flips to pending_review
api/admin-login.js        checks password, sets session cookie
api/admin-logout.js       clears session cookie
api/admin-orders.js       lists all orders (admin-only)
api/admin-order-action.js approve/reject/reset an order (admin-only)
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

## Payment screenshots + admin approval (now backed by Firebase)

Orders live in **Firestore** now, not localStorage — this works across
devices: a customer submits an order and uploads a screenshot from their
phone, and you see it immediately in `/admin.html` on your laptop.

- A customer reserves tickets → `/api/checkout` creates the order in
  Firestore (`orders` collection, doc ID = the reference number) as
  `pending_payment`.
- They upload a payment screenshot → `/api/upload-screenshot` saves it
  and flips the order to `pending_review`.
- `/admin.html` is real now too: the password is checked **server-side**
  in `/api/admin-login` (nothing to read in the page source), and on
  success it sets a signed, HttpOnly session cookie — no password or
  session token lives in the browser's JS. Approve/reject buttons call
  `/api/admin-order-action`, which also requires that session cookie.

**Env vars required in Vercel** (Settings → Environment Variables):

| Variable | Purpose |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Full service account JSON (minified to one line) — Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `ADMIN_PASSWORD` | The password for `/admin.html` |
| `ADMIN_SESSION_SECRET` | Any long random string — signs the admin session cookie |

Redeploy after adding/changing any of these. Never commit the service
account JSON to the repo.

**One thing still temporary:** screenshots are currently stored as a
base64 data URL directly on the Firestore order doc (`screenshotUrl`
field). That works and ships fine, but Firestore docs cap out at 1MB and
there's no CDN/image optimization — the plan is to swap this for a real
Cloudinary upload (store the returned `secure_url` instead) once that's
wired in. Everything downstream (admin.html's `<img>` tags, the
lightbox) already just expects a URL string, so that swap won't touch
anything else.

**Still not wired up:** a real payment gateway. See the comment block in
`api/checkout.js` for the suggested SantimPay integration shape — that
was intentionally left for the senior dev team.


## Run locally

Just open `index.html` in a browser — no install, no build step.

The order form now depends on `/api/checkout` and `/api/upload-screenshot`
actually being live (there's no local-only fallback anymore, since orders
have to land in Firestore for admin.html to see them). Use `vercel dev`
to run the API functions locally, or just test against your Vercel
deployment.

## Deploy on Vercel

1. Push this folder to a GitHub repo (or drag it into a new Vercel
   project directly).
2. In Vercel: **New Project → Import** your repo. No framework preset
   needed — Vercel serves `index.html` as a static site and
   automatically turns everything in `api/` into live endpoints.
3. Add the three environment variables listed above
   (`FIREBASE_SERVICE_ACCOUNT_KEY`, `ADMIN_PASSWORD`,
   `ADMIN_SESSION_SECRET`) before or right after the first deploy —
   without them, `/api/checkout` and the admin login will fail.
4. Deploy (or redeploy, if you added the env vars after the first one).

## Payment — currently manual

Ticket orders submitted through the form hit `api/checkout.js`, which
records the order as `pending_payment` (logged to the console — no
database yet) and returns a reference number to the customer.

**No payment gateway is wired up.** That's intentionally left for the
senior dev team — see the comment block in `api/checkout.js` for the
suggested shape of the SantimPay integration (create payment session,
redirect the user, add a webhook for confirmation).
