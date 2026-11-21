# Keyly — Agent Web App Build Brief (v1)

Keyly is a branded home app that real estate agents gift to buyers at closing. The **agent side is a website**: agents set up their brand, create a home for each buyer, add documents, details, reminders and vendors, then send the gift. The **buyer side is a native iPhone app** (built later, separately). Both share one Firebase backend.

**This build: the agent web app only.** The buyer iPhone app is out of scope, but the data model below must serve it.

Keep this project completely separate from Pixel Labs (separate GitHub repo, no shared branding or code).

---

## 1. Stack

- **Frontend:** React + TypeScript + Vite, React Router. Plain CSS modules or Tailwind — your choice, but match the design tokens below exactly.
- **Backend:** Firebase — Authentication, Cloud Firestore, Cloud Storage, Hosting. Start on the free Spark plan; move to Blaze (pay-as-you-go) when Cloud Functions are needed.
- **Hosting:** Firebase Hosting on the free `*.web.app` address for now. A custom domain (e.g. app.getkeyly.com) gets added later.
- **Payments:** Stripe, later. For v1, the Account page shows plan/billing UI with placeholder data and no live payments.

## 2. Repo layout

```
keyly/
  web/        ← this build (agent website)
  ios/        ← buyer iPhone app (later; leave empty with a README)
  design/     ← design reference files (see section 7)
  firebase.json, firestore.rules, storage.rules
  README.md
```

## 3. Brand

**Font:** Plus Jakarta Sans (Google Fonts), weights 400, 500, 600, 700, 800.

| Token | Hex | Use |
|---|---|---|
| Clay | `#E2725B` | Primary buttons, accents, icon tile. Text on clay is always Ink, never cream. |
| Deep Teal | `#0E4D5C` | Cards, selected states, links, brand panels |
| Cream | `#F4EDE1` | Soft tiles, secondary buttons, text on teal/ink |
| Paper | `#F7F5F0` | Page background |
| Sea Glass | `#7FC8B8` | Small labels on teal or ink |
| Ink | `#0B2730` | Body text, sidebar background, dark mode |
| Muted text | `#3F5A62` | Secondary text on light backgrounds |
| Border | `#E4DCCF` / `#DED6C8` | Card outlines, dividers |
| Blush | `#F6D6C8` | "Invited" status pill background (text `#7A2E1E`) |
| Teal tint | `#DCEAE6` | "Active" status pill and icon chips (text Deep Teal) |
| Card | `#FFFFFF` | Cards on Paper |
| Input fill | `#FBF9F5` | Text inputs (1px inset border `#D9D0C2`) |

**Type scale:** Page title 36/800 (letter-spacing −1.2px) · Section title 18/800 · Body 15–16/500 · Label 12/700, uppercase, letter-spacing 0.1em.

**Shapes:** cards radius 20px with 1px inset border; buttons and inputs radius 12–14px, height 46–52px; pills fully rounded. All touch targets ≥ 44px. Text contrast ≥ 4.5:1.

**Logo / icon:** the "Flip" icon — a solid house-shaped key, tilted −18°, on a rounded square.
- Light: Clay tile, Deep Teal key, Cream keyhole.
- Dark: Ink tile, Clay key, Ink keyhole.
- Wordmark: "keyly", lowercase, Plus Jakarta Sans 800, letter-spacing about −0.04em.

Icon SVG (100×100 viewBox; swap the fills per variant):

```svg
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" rx="22" fill="#E2725B"/>
  <g transform="translate(14 14) scale(0.72)">
    <g transform="rotate(-18 50 50)">
      <path d="M50 8L80 32V56H20V32Z" fill="#0E4D5C" stroke="#0E4D5C" stroke-width="6" stroke-linejoin="round"/>
      <circle cx="50" cy="33" r="6" fill="#F4EDE1"/>
      <path d="M47 35H53L55 47H45Z" fill="#F4EDE1"/>
      <rect x="43" y="52" width="14" height="40" rx="4" fill="#0E4D5C"/>
      <rect x="53" y="68" width="16" height="9" rx="2.5" fill="#0E4D5C"/>
      <rect x="53" y="81" width="11" height="9" rx="2.5" fill="#0E4D5C"/>
    </g>
  </g>
</svg>
```

## 4. Layout

- **App shell (every page except Sign in):** dark Ink sidebar (about 240px) with the logo, "for agents" label, nav links (Homes, My vendors, Brand, Account & plan) and the agent's name/brokerage card at the bottom. Active link: `#12343F` background with a Clay dot.
- **Responsive:** on phones the sidebar stacks above the content (or becomes a top bar/menu). Content is fluid, with 20–56px side padding. Wide tables scroll horizontally inside their card. Forms use wrapping rows so fields stack on narrow screens.

## 5. Pages and routes

| Route | Page | What it does |
|---|---|---|
| `/signin` | **A1 Sign in** | Split layout: teal brand panel (tagline "The closing gift that keeps you in the picture.") and a sign-in card: Continue with Apple, Continue with Google, or an emailed sign-in link (Firebase email-link auth). "Start your free trial" leads to brand setup for new agents. |
| `/brand` | **A2 Brand setup** | Upload logo and headshot (Storage). Choose a brand color from presets: Keyly Teal `#0E4D5C`, Navy `#1B2A4A`, Forest `#1F4D3A`, Burgundy `#6B2235`, Plum `#4A2C5E`, Charcoal `#2E2E2E`; all dark, so cream text works on them. Name, brokerage, phone, email. A **live phone preview** of the buyer's welcome screen updates instantly. The agent color is used only on the buyer welcome header and agent card; Keyly keeps the rest consistent. |
| `/homes` | **A3 Homes** (default after sign-in) | Search, filter chips (All / Draft / Invited / Active), and a table: home (photo/icon + address), buyer, closing date, status pill, chevron. "Add a home" button. Tip card at the bottom. |
| `/homes/new` | **A4 New home** | Step indicator (1 Home & buyer · 2 Details · 3 Preview & send). Address and home photo; buyer name(s), closing date, email, mobile. "Save as draft" or "Continue to details". Nothing is sent to the buyer yet. |
| `/homes/:id` | **A5 Home details** | Document upload (drag-and-drop, PDFs/photos) with a folder per file: Closing documents, Inspection, Warranties & manuals. Home details fields (furnace/water heater/roof install years, Wi-Fi, water shutoff, paint colors, plus "Add a detail"). Starter reminder switches (smoke detectors monthly, HVAC filter every 3 months, dryer vent yearly, gutters spring and fall). Vendor picker chips from the agent's saved vendors. A sticky **"Ready to send?"** checklist (only home and buyer are required) with a "Preview & send" button. |
| `/vendors` | **A6 My vendors** | Inline "Add a vendor" form (category, company, phone, website). Table: category pill, company, phone, "Add to new homes" switch, edit button. |
| `/homes/:id/send` | **A7 Preview & send** | A phone mockup of exactly what the buyer sees, next to a welcome-note textarea; the preview updates as the agent types. Send by Text / Email / Both. "Send the gift" sets the status to Invited and shows a "Your gift is on its way" confirmation with "Copy invite link". |
| `/account` | **A8 Account & plan** | Plan card (placeholder plan name, price, trial end date), "Change plan" and "Manage billing" (non-functional for now). Billing details, sign-in details, link to Brand, help links (support, privacy, terms), Sign out, Delete account. |

## 6. Data model (Firestore + Storage)

```
agents/{uid}
  name, brokerage, phone, email, brandColor, logoPath, headshotPath,
  plan: { name, status: "trial"|"active"|"canceled", trialEndsAt }, createdAt

vendors/{vendorId}
  agentId, category, company, phone, website, addToNewHomes: bool, createdAt

homes/{homeId}
  agentId, address, photoPath,
  buyer: { names, email, phone, people: [{name, email, phone}] }, closingDate,  // names/email/phone mirror the first buyer
  status: "draft"|"invited"|"active",
  details: { furnaceYear, waterHeaterYear, roofYear, wifi, waterShutoff, paintColors, extra: [{label, value}] },
  reminders: [{ id, name, schedule, enabled }],
  vendorIds: [vendorId],
  welcomeNote, invite: { token, method: "text"|"email"|"both", sentAt, openedAt },
  buyerUids: [uid] (one per buyer who accepts in the iPhone app), createdAt, updatedAt

homes/{homeId}/documents/{docId}
  name, folder: "closing"|"inspection"|"warranties"|"buyer", storagePath, uploadedBy: "agent"|"buyer", createdAt
```

**Storage paths:** `agents/{uid}/logo.*`, `agents/{uid}/headshot.*`, `homes/{homeId}/photo.*`, `homes/{homeId}/docs/{docId}-{filename}`.

**Security rules (write them, don't leave them open):**
- An agent can read/write only their own `agents/{uid}`, vendors where `agentId == uid`, and homes where `agentId == uid` (plus those homes' documents and files).
- A buyer (later) can read a home where `buyerUid == request.auth.uid`, read its documents and files, and add documents with `uploadedBy: "buyer"`. Buyers can't change agent fields.

**Invites:** v1 generates a unique invite token and link (e.g. `https://<host>/gift/<token>`). Show "Copy invite link". Actually sending email or SMS can come later (the Firebase "Trigger Email" extension, or Twilio, via Cloud Functions). Stub it behind one function so it's easy to plug in.

## 7. Design references

The `design/` folder has the approved designs as `.dc.html` files: HTML with inline styles for each page and screen. Use them as the source of truth for layout, spacing, copy and colors. (They use a small template syntax — `{{ }}`, `<sc-for>`, `<sc-if>`, `<dc-import>` — that you can ignore; read the markup and styles.)

- Agent web pages: `AgentNav`, `AgentSignIn`, `AgentBrand`, `AgentHomes`, `AgentNewHome`, `AgentHomeDetails`, `AgentVendors`, `AgentSend`, `AgentAccount`
- Buyer iPhone screens (for the preview mockups and the future iOS app): `BuyerWelcome`, `BuyerHome`, `BuyerDocuments`, `BuyerMaintenance`, `BuyerVendors`, `BuyerMyHome`
- Brand board: `Brand`

Text in [square brackets] is a placeholder for real data.

## 8. Build order

1. Scaffold `web/` (Vite + React + TS + Router), design tokens, fonts and the app shell with the sidebar. Set up Firebase config with env vars, no keys committed.
2. Auth: Apple, Google, email link. Protected routes; new agents go to `/brand`.
3. Brand setup with Storage uploads and the live preview.
4. Homes list, New home, and Home details (Firestore CRUD, document uploads, reminders, vendor picker, checklist).
5. My vendors.
6. Preview & send (invite token and link, status change, confirmation).
7. Account page (placeholder billing).
8. Firestore and Storage security rules; deploy to Firebase Hosting on the free web.app address.

## 9. Not in v1

Live Stripe billing · real SMS/email sending · the buyer iPhone app · team/brokerage accounts · analytics · seasonal tip emails · home anniversaries · referral tracking.
