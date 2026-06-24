# Agent Guide

This document is for any new coding agent picking up this project. Read it before touching code.

---

## Project Purpose

Single-artist e-commerce portfolio. An artist sells physical prints/canvases. Visitors browse a gallery, view product detail pages, and check out via Stripe. The admin manages listings, orders, site content (hero image, social links, home page), and can generate Instagram marketing copy via an AI tool backed by a local Ollama instance.

There is no multi-tenant logic. There is no user registration. Everything is either public storefront, admin panel, or Stripe/webhook plumbing.

---

## Tech Stack (exact versions from `package.json`)

| Layer | Package | Version |
|---|---|---|
| Frontend framework | `vue` | ^3.5.30 |
| Frontend router | `vue-router` | ^5.0.4 |
| Build tool | `vite` | ^8.0.2 |
| Vite Vue plugin | `@vitejs/plugin-vue` | ^6.0.5 |
| Backend framework | `express` | ^5.2.1 |
| Sessions | `express-session` ^1.19.0 + `connect-mongo` ^6.0.0 |
| Database ORM | `mongoose` | ^8.9.3 |
| File uploads | `multer` | ^2.1.1 |
| Storage (R2) | `@aws-sdk/client-s3` | ^3.1061.0 |
| Payments | `stripe` | ^22.2.0 |
| Email | `resend` | ^6.12.4 |
| AI graph | `@langchain/langgraph` ^1.4.1 + `@langchain/ollama` ^1.2.7 |
| Validation | `zod` | ^3.24.2 |
| Image cropping | `cropperjs` | ^1.6.2 |
| Env loading | `dotenv` | ^16.4.5 |
| Test runner | `jest` | ^29.7.0 |
| In-memory MongoDB | `mongodb-memory-server` | ^10.1.4 |
| HTTP test client | `supertest` | ^7.0.0 |

The repo is `"type": "commonjs"` — all server files use `require`/`module.exports`. Frontend files use ESM `import`/`export` (Vite handles the boundary). Tests run through Babel (`@babel/plugin-transform-modules-commonjs`) so Jest can parse frontend ESM files.

---

## Folder Structure

```
/
├── server/
│   ├── server.js              # Entry point — listen on PORT
│   ├── app.js                 # Express factory: middleware order + all route mounts
│   ├── db.js                  # Mongoose connect + re-exports all models
│   ├── sessionStore.js        # connect-mongo session middleware factory
│   ├── sessionConfig.js       # Cookie options, isProduction() helper
│   ├── ai/
│   │   ├── igGenerationGraph.js   # LangGraph agent loop (generate-ig endpoint)
│   │   ├── igTools.js             # LangChain tools: preferred examples + voice profile
│   │   ├── modelProvider.js       # ChatOllama setup (OLLAMA_HOST, OLLAMA_MODEL)
│   │   ├── preferredExamplesStore.js
│   │   └── schemas.js             # Zod schemas for AI input/output
│   ├── controllers/           # Thin request handlers — parse req, call service, send res
│   │   ├── adminProductController.js
│   │   ├── adminOrderController.js
│   │   ├── adminUploadController.js
│   │   ├── adminDashboardController.js
│   │   ├── adminSiteSettingsController.js
│   │   ├── checkoutController.js
│   │   ├── contactFormController.js
│   │   ├── orderController.js
│   │   ├── publicCatalogController.js
│   │   └── stripeWebhookController.js
│   ├── middleware/
│   │   ├── adminAuth.js           # attachAdminUser + requireAdminRole
│   │   └── uploadProductImage.js  # multer memory storage, 10 MB limit
│   ├── models/                # Mongoose schemas (all re-exported from db.js)
│   │   ├── Product.js, ProductImage.js
│   │   ├── Order.js, OrderItem.js
│   │   ├── AdminUser.js, SiteSettings.js
│   │   ├── PaidCheckoutNotification.js
│   │   ├── AiPreferredExample.js, AiVoiceProfile.js, AiGeneration.js
│   ├── routes/                # Express Router modules — no logic, just wiring
│   │   ├── adminProducts.js, adminOrders.js, adminDashboard.js
│   │   ├── adminSession.js, adminSiteSettings.js, adminUpload.js
│   │   ├── catalog.js, contact.js, site.js
│   │   ├── cartSession.js, orders.js
│   │   ├── stripeWebhook.js, aiIg.js
│   ├── services/              # All business logic and DB access
│   │   ├── checkoutService.js             # Build Stripe session from DB prices
│   │   ├── fulfillOrderFromStripeSession.js  # Idempotent order creation (Mongo transaction)
│   │   ├── recordCompletedStoreOrder.js   # Called by webhook + order-success page
│   │   ├── checkoutSessionSummaryService.js
│   │   ├── orderNotificationEmailService.js
│   │   ├── adminProductService.js, adminOrderService.js
│   │   ├── adminSiteSettingsService.js
│   │   ├── contactFormService.js
│   │   ├── r2StorageService.js            # S3 PutObjectCommand to Cloudflare R2
│   │   ├── resendMailService.js
│   │   └── ensureAdminUserFromEnv.js
│   └── utils/
│       ├── stripeClient.js        # Singleton Stripe client
│       ├── productPopulate.js     # Mongoose populate helper
│       ├── productDisplay.js      # primaryProductImageUrl, lineItemDisplayName
│       ├── productImages.js
│       ├── checkoutValidation.js
│       └── adminPassword.js       # bcrypt hash/verify
├── frontend/
│   └── src/
│       ├── main.js                # createApp, use(router), mount
│       ├── App.vue
│       ├── router/index.js        # All routes + admin navigation guard
│       ├── services/api.js        # All HTTP calls — single fetchJson helper
│       ├── composables/
│       │   ├── useCart.js         # Reactive cart state + drawer
│       │   ├── useAdminNav.js, useMobileNav.js, useMediaQuery.js
│       │   └── adminNavItems.js
│       ├── utils/
│       │   ├── money.js           # dollarsToCents, formatMoneyFromCents
│       │   ├── cart.js            # localStorage cart + PUT /api/cart sync
│       │   ├── storefrontProduct.js
│       │   ├── orderFulfillmentStatus.js
│       │   ├── adminListSort.js
│       │   └── adminLoginErrors.js
│       ├── constants/
│       │   ├── contactPageDefaults.js
│       │   └── socialPlatformIcons.js
│       ├── pages/                 # 19 route-level components
│       └── components/            # 32 reusable components (admin/, cart/, home/, product/, social/, mobile/)
├── tests/                     # Jest backend integration tests
│   ├── setup.js               # Fake env vars + Stripe mock (runs before every suite)
│   ├── helpers/stripeMock.js
│   ├── cart.test.js
│   ├── checkout.test.js
│   ├── orderSuccessApi.test.js
│   ├── webhook.test.js
│   └── ai.test.js
├── .env.example               # Canonical list of all env vars
├── vite.config.mjs            # Vite root: frontend/, proxy /api → localhost:3000
├── jest.config.js
└── package.json
```

---

## Important Files — Read These First

| File | Why it matters |
|---|---|
| `server/app.js` | Single place that defines **middleware order and all route mounts**. Change mount order carefully — the Stripe webhook route must stay above `express.json()`. |
| `server/db.js` | Connects to Mongo, runs `ensureAdminUserFromEnv()` on start, re-exports all models. Never require a model directly — import from `db.js`. |
| `server/services/fulfillOrderFromStripeSession.js` | The most critical business-logic file. Runs inside a Mongoose transaction. Handles idempotency, stock decrement, and order creation. |
| `server/services/checkoutService.js` | Builds Stripe Checkout sessions. **Prices always come from the database — never from the client request.** |
| `server/middleware/adminAuth.js` | `attachAdminUser` + `requireAdminRole` — the only auth gate. |
| `frontend/src/router/index.js` | All Vue Router routes + admin guard (calls `getAdminSession()` for every `/admin/*` path). |
| `frontend/src/services/api.js` | All HTTP calls from the SPA. Every function delegates to `fetchJson`. Add new API calls here, nowhere else. |
| `frontend/src/utils/money.js` | `dollarsToCents` + `formatMoneyFromCents`. Shared by `AdminCreate.vue` and `AdminForm.vue`. |
| `frontend/src/utils/cart.js` | localStorage cart + server sync. Called by `useCart.js`. |
| `.env.example` | Authoritative list of every environment variable. |
| `ARCHITECTURE.md` | Full system architecture with flows, models, and route table. |

---

## How to Run Locally

### Prerequisites

- Node.js (LTS)
- A running MongoDB instance (local or Atlas)
- A Stripe account (test mode keys)
- Cloudflare R2 bucket (or skip image uploads in dev)
- Resend account (or skip contact form in dev)
- Ollama running at a reachable host (or skip AI feature in dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Create `.env`

Copy `.env.example` to `.env` and fill in at minimum:

```
MONGO_STRING=mongodb://localhost:27017
DB_NAME=artist_portfolio
SESSION_SECRET=any-random-string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=yourpassword
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CLIENT_URL=http://localhost:5173
```

The R2, Resend, and Ollama variables can be left empty to disable those features during development.

### 3. Run both servers together

```bash
npm run dev:all
```

This uses `concurrently` to start Express (`node server/server.js`) on port **3000** and Vite (`vite --config vite.config.mjs`) on port **5173**. The Vite dev server proxies `/api/*` to Express.

### 4. Run separately (if needed)

```bash
# Terminal 1 — Express API
npm run server

# Terminal 2 — Vite SPA
npm run dev
```

### 5. First login

On startup, `ensureAdminUserFromEnv()` upserts the admin account from `ADMIN_USERNAME`/`ADMIN_PASSWORD` into MongoDB. Navigate to `http://localhost:5173/admin/login`.

### 6. Stripe webhook in development

Use the Stripe CLI to forward events to the local server:

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the displayed `whsec_...` value into `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## Common Commands

| Command | What it does |
|---|---|
| `npm run dev:all` | Start Express + Vite together (recommended for development) |
| `npm run server` | Start Express only (port 3000) |
| `npm run dev` | Start Vite only (port 5173) |
| `npm run build` | Build SPA to `frontend/dist/` |
| `npm run preview` | Preview production build (Vite preview server, also proxies `/api`) |
| `npm start` | Production — `NODE_ENV=production node server/server.js` (serves SPA from `frontend/dist`) |
| `npm test` | Run Jest backend tests (all `tests/**/*.test.js`) |

---

## Environment Variables

Every variable is documented in `.env.example`. Summary:

### Database / Session

| Variable | Required | Purpose |
|---|---|---|
| `MONGO_STRING` | Yes | MongoDB connection URI |
| `DB_NAME` | Yes | Database name |
| `SESSION_SECRET` | Yes | Signs the session cookie — use a random string, never expose it |
| `NODE_ENV` | Prod | Set to `production` by `npm start`. Enables `trust proxy`, secure cookies, static SPA serving |
| `PORT` | No | HTTP port (default: `3000`) |

### Admin Accounts

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_USERNAME` | Yes | Primary admin username (synced to DB on start) |
| `ADMIN_PASSWORD` | Yes | Primary admin password (bcrypt-hashed on upsert) |
| `ADMIN_MASTER_USERNAME` | No | Secondary/master admin (defaults to `admin` if unset) |
| `ADMIN_MASTER_PASSWORD` | No | Password for master admin (skipped if blank) |

There is no admin registration UI. Accounts are managed entirely via these env vars. Changing `ADMIN_PASSWORD` in `.env` and restarting the server updates the hash in MongoDB.

### Stripe

| Variable | Required | Purpose |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | Server-side Stripe client (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Yes | Verifies webhook signature (`whsec_...`). Without this, `POST /api/webhooks/stripe` returns 503 |
| `CLIENT_URL` | Yes | Base URL of the frontend. Used to build `success_url` and `cancel_url` in Stripe sessions (e.g. `http://localhost:5173` in dev, `https://yourdomain.com` in prod) |
| `FRONTEND_URL` | No | Legacy alias for `CLIENT_URL` — `CLIENT_URL` takes precedence |
| `STRIPE_SUCCESS_URL` | No | Override the Stripe success redirect URL. **Must contain `{CHECKOUT_SESSION_ID}`** or the server will fall back to default and log an error |
| `STRIPE_CANCEL_URL` | No | Override the Stripe cancel redirect URL |

### Cloudflare R2 (image uploads)

| Variable | Required | Purpose |
|---|---|---|
| `R2_ACCESS_KEY_ID` | For uploads | R2 API token key ID |
| `R2_SECRET_ACCESS_KEY` | For uploads | R2 API token secret |
| `R2_BUCKET_NAME` | For uploads | Bucket name |
| `R2_ENDPOINT` | For uploads | S3-compatible endpoint, e.g. `https://<account_id>.r2.cloudflarestorage.com` |
| `R2_PUBLIC_URL` | For uploads | Public base URL (no trailing slash), e.g. `https://assets.yourdomain.com` |

If these are unset, the upload endpoint will fail. Existing product image URLs in the database still display fine (they are stored absolute URLs).

### Email (Resend)

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | For email | Resend API key |
| `RESEND_FROM_EMAIL` | For production email | Verified sender address. Falls back to `PermSite <onboarding@resend.dev>` (only works in Resend sandbox) |
| `NOTIFICATION_EMAIL` | No | Fallback recipient for order/contact notifications. If unset, the admin's contact email from `SiteSettings` is used |

### AI / Ollama

| Variable | Required | Purpose |
|---|---|---|
| `OLLAMA_HOST` | For AI feature | URL of the Ollama server, e.g. `http://localhost:11434`. Default: `http://golem:11434` |
| `OLLAMA_MODEL` | For AI feature | Ollama model name. Default: `gpt-oss:20b` |

---

## Known Constraints

### Product images live in Cloudflare R2

Image files are never stored locally or in MongoDB. Only the public URL (`image_url`) is stored in the `ProductImage` collection. The browser loads images directly from R2 — the Express server never proxies them. If R2 credentials are absent, image uploads fail, but existing listing images continue to display.

### Orders are created through Stripe, not directly

The admin has no "create order" UI. Orders are always the result of a completed Stripe Checkout session. The `Order` and `OrderItem` documents are only created inside `fulfillOrderFromStripeSession` after payment is confirmed.

### Inventory decrements only after confirmed payment

`Product.quantity_available` is decremented inside the MongoDB transaction in `fulfillOrderFromStripeSession`, which runs only when `payment_status === 'paid'`. Nothing decrements stock at cart-add time or at checkout session creation — the `resolveCheckoutLines` function in `checkoutService.js` checks stock availability before creating the Stripe session, but does not reserve it.

### Dual order fulfillment triggers — both are idempotent

The order can be created from two paths: the Stripe webhook (`POST /api/webhooks/stripe`) and the order success page's API call (`GET /api/orders/checkout-session/:sessionId`). Both call `recordCompletedStoreOrder` which delegates to `fulfillOrderFromStripeSession`. That function performs a duplicate check (by `stripe_checkout_session_id`) before opening a transaction, and handles the 11000 duplicate-key error if both paths race. Do not break the idempotency logic.

### Admin authentication is session-only (cookie)

There are no API keys, JWTs, or bearer tokens. All admin API calls rely on the `express-session` cookie (`credentials: 'include'` in `fetchJson`). The session is stored in MongoDB via `connect-mongo`. Sessions TTL is 7 days.

### AI generation requires a running Ollama instance

`POST /api/admin/ai/generate-ig` calls out to `OLLAMA_HOST` at request time. If Ollama is not running, the endpoint will hang or error. The default host (`http://golem:11434`) is a private machine — set `OLLAMA_HOST` to your local Ollama instance for development.

### Stripe webhook must receive a raw body

`app.js` registers `express.raw({ type: 'application/json' })` on `/api/webhooks/stripe` **before** `express.json()`. If you reorder middleware mounts in `app.js`, the webhook signature verification will break.

### Product soft deletes

Products are never hard-deleted. `DELETE /api/admin/products/:id` sets `deleted_at` to the current timestamp (`softDeleteAdminProduct`). Active public queries always filter `{ deleted_at: null, is_active: true }`. Do not change this without updating every query that reads products.

---

## Safe Development Workflow

1. **Create a feature branch.** Never commit directly to `main`.

2. **Backend changes:** Routes live in `server/routes/`, handlers in `server/controllers/`, logic in `server/services/`. Keep this layering — do not put DB queries in controllers or route files.

3. **Adding a new API endpoint:**
   - Add a route in the appropriate file in `server/routes/`
   - Add a controller function in `server/controllers/`
   - Add service logic in `server/services/`
   - Mount the router in `server/app.js` if it's a new router module
   - Export a corresponding function from `frontend/src/services/api.js`

4. **Frontend changes:** Pages import only from `api.js` — no inline `fetch` anywhere in page components. Shared money formatting uses `frontend/src/utils/money.js`. Cart logic goes through `frontend/src/utils/cart.js`.

5. **After any change, run:**
   ```bash
   npm test && npm run build
   ```
   Both must pass before committing. Tests run in under 15 seconds. The build runs in under 2 seconds.

6. **Never modify `tests/setup.js` unless changing the test harness itself.** It sets fake Stripe keys and mocks the Stripe client globally for all test files.

---

## Testing Expectations

- Tests live in `tests/` and run with `jest`. There are **no frontend tests** — all 55 tests are backend integration tests.
- `mongodb-memory-server` starts a real in-memory MongoDB for each test suite. No external DB is needed.
- `tests/setup.js` runs `beforeAll` for every suite:
  - Sets `NODE_ENV=test`, `SKIP_DB_AUTO_CONNECT=1`
  - Provides fake `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CLIENT_URL`, `SESSION_SECRET`
  - Globally mocks `server/utils/stripeClient` → `tests/helpers/stripeMock.js`
- Test files: `cart.test.js`, `checkout.test.js`, `orderSuccessApi.test.js`, `webhook.test.js`, `ai.test.js`
- Timeout per test: 60 seconds (set for slow in-memory MongoDB startup, actual tests are fast)
- A `console.error` about `"Invalid signature"` in `webhook.test.js` output is expected — it is testing the error path.

To run a single test file:
```bash
npx jest tests/checkout.test.js
```

---

## What Not to Change Casually

| File / Pattern | Risk if changed carelessly |
|---|---|
| `server/app.js` — middleware order | Moving `express.raw` below `express.json` breaks Stripe webhook signature verification |
| `server/services/fulfillOrderFromStripeSession.js` | Core transaction logic — idempotency, stock decrement, order creation. Bugs here cause duplicate orders or lost inventory |
| `server/services/checkoutService.js` — price resolution | Always loads price from DB. If client-supplied prices are ever trusted, this is a security hole |
| `server/middleware/adminAuth.js` | The only auth gate for all admin routes. Weakening this exposes all admin endpoints |
| `server/db.js` — model imports | All model access should go through this file. Direct-requiring models creates import inconsistency |
| `frontend/src/services/api.js` — `fetchJson` | Used by all API calls. `credentials: 'include'` must stay for session cookies. Error shape is consumed by many pages |
| `frontend/src/router/index.js` — admin guard | Removing the `getAdminSession()` check exposes the admin panel to unauthenticated users |
| `frontend/src/utils/cart.js` | Shared between `useCart.js` composable and the checkout page — changes affect both |
| `SiteSettings` model / `key: 'default'` | The site-wide settings document uses a singleton pattern (`key: 'default'`). The admin settings service upserts this document. Adding a second `SiteSettings` document will not be read by anything |
| `PaidCheckoutNotification` collection | Used purely as a deduplication guard for notification emails. Do not drop this collection or remove the duplicate check |
