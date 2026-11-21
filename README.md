# Keyly

Branded home app that real estate agents gift to buyers at closing.

- `web/` — agent website (React + TypeScript + Vite + Firebase)
- `ios/` — buyer iPhone app (later)
- `design/` — approved design references
- `Keyly-Build-Brief.md` — full build brief

## Run the web app

```bash
cd web
cp .env.example .env.local   # fill in Firebase values
npm install
npm run dev
```

## Firebase

- Project id: see `.firebaserc`. Security rules: `firestore.rules`, `storage.rules`.
- The web app reads its config from `VITE_FIREBASE_*` env vars (`web/.env.local`). With no config it runs in local demo mode.
- GitHub Pages deploy: add a repo secret `FIREBASE_WEB_CONFIG` containing the web app config as JSON.
- Rules tests (needs Java + firebase-tools + @firebase/rules-unit-testing):
  `firebase emulators:exec --only firestore,storage "node tests/rules.test.mjs"`.
  Firestore rules are fully covered. The emulator cannot evaluate Storage's cross-service `firestore.get`, so those
  checks must be verified against the real project.
