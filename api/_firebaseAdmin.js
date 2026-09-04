// Shared Firebase Admin SDK init — every /api function that touches
// Firestore requires() this instead of initializing its own app (Firebase
// throws if you call initializeApp() more than once per process).
//
// Needs FIREBASE_SERVICE_ACCOUNT_KEY set in Vercel (Settings → Environment
// Variables) — the full service account JSON from Firebase Console →
// Project Settings → Service Accounts → Generate new private key,
// minified to one line. Never commit that file to the repo.

const admin = require("firebase-admin");

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

module.exports = admin;
