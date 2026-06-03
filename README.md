# Art Shop — Full-stack gallery, admin & AI content assistant

Full-stack web application for an independent artist: a **public product gallery**, a **password-protected admin** area for listing management, and a **LangGraph + Ollama assistant** for **Instagram-style copy** (hooks, captions, CTAs, hashtags).

*Academic project — Vue 3 + Express + MongoDB.*

---

## Highlights

- **Public site** — Browse products by slug; product detail with title, description, images, price, and stock.
- **Admin workspace** — Session-based authentication; product CRUD (images on create); soft-delete and visibility toggles.
- **Stripe-ready catalog** — Products store `stripe_product_id` / `stripe_price_id` and `currency` for a future Checkout integration (prices always loaded from the database server-side).
- **AI-assisted captions** — LangGraph workflow: normalize input, inject user-“hearted” example lines (in-memory), call Ollama, **validate** structured JSON with **Zod**, retry on recoverable failures.

---

## Tech stack

| Layer | Technologies |
|--------|----------------|
| Frontend | Vue 3, Vue Router, Vite |
| Backend | Node.js, Express 5 |
| Data | MongoDB, Mongoose |
| Auth | express-session (cookie), salted password hashing (Node `crypto` / scrypt) |
| AI | LangGraph, LangChain tools, Ollama client, Zod |

---

## Getting started

**Prerequisites:** Node.js, MongoDB, and for AI features an **Ollama** runtime reachable from the server (defaults are overridable via environment variables).

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Configure environment variables (e.g. `.env`): **MongoDB connection string**, **session secret**, **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`**, **`CLIENT_URL`** (e.g. `http://localhost:5173`), and optionally **`OLLAMA_HOST`** / **`OLLAMA_MODEL`**.

   For local Stripe webhooks: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` and use the printed signing secret as `STRIPE_WEBHOOK_SECRET`.

3. If upgrading from the old artwork/product-type schema, run the one-time migration:

   ```bash
   node server/scripts/migrate-to-simple-catalog.js
   ```

4. Run services:

   | Command | Purpose |
   |---------|---------|
   | `npm run server` | API only (`server/server.js`) |
   | `npm run dev` | Vite dev server (frontend) |
   | `npm run dev:all` | API + frontend concurrently |
   | `npm run build` | Production build of the Vue app |

---

## Domain model

- **Product** — Sellable listing: title, slug, description, price (cents), currency, inventory, optional format/size/year, Stripe IDs, visibility, soft-delete.
- **Product image** — Image URL, sort order, primary flag, alt text.
- **Order** — Checkout/payment record (customer, Stripe session/intent IDs, status, totals, addresses).
- **Order item** — Snapshot of purchased line (title, slug, image, size, unit price, quantity, line total).
- **Admin user** — Username and password hash for back-office access.
- **Preferred copy (AI)** — Up to five “liked” hooks, captions, and CTAs per category, stored **in server memory**; cleared on server restart.

---

## API overview

All routes under **`/api/admin/*`** except session login require an authenticated session (session cookie).

### Public (no login)

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/products` | Product gallery (active, not deleted) |
| `GET` | `/api/product/:slug` | Single product with images |
| `POST` | `/api/checkout/create-session` | Create Stripe Checkout Session (body: `items[]` with `product_id`, `quantity` only) |
| `POST` | `/api/webhooks/stripe` | Stripe webhook (raw body; `checkout.session.completed`) |

### Session

| Method | Route | Description |
|--------|--------|-------------|
| `POST` | `/api/admin/session/login` | Login (username + password) |
| `GET` | `/api/admin/session` | Current session |
| `POST` | `/api/admin/session/logout` | Logout |

### Admin — products

| Method | Route | Description |
|--------|--------|-------------|
| `GET` | `/api/admin/products` | List products |
| `POST` | `/api/admin/products` | Create product (optional `images[]`) |
| `GET` | `/api/admin/products/:id` | Product detail |
| `PUT` | `/api/admin/products/:id` | Update product |
| `DELETE` | `/api/admin/products/:id` | Soft-delete product |
| `PATCH` | `/api/admin/products/:id/toggle-active` | Toggle visibility |

Product images are added at create time via `images[]` on `POST /api/admin/products` (no separate image admin API yet).

### Checkout (Stripe)

`POST /api/checkout/create-session` accepts:

```json
{ "items": [{ "product_id": "<ObjectId>", "quantity": 1 }] }
```

The server loads each product from MongoDB, validates active/not-deleted/stock, builds Stripe `line_items` from **database** `price_cents`, title, and image, and returns `{ "url": "<stripe checkout url>", "sessionId": "cs_..." }`.

On `checkout.session.completed`, the webhook creates an **Order** and **OrderItem** snapshots, decrements `quantity_available`, and is **idempotent** per `stripe_checkout_session_id`.

**Stripe Checkout flow (matches [Stripe’s guide](https://docs.stripe.com/checkout/quickstart)):**

1. Customer reviews order at `/checkout` (preview only — prices loaded from API for display).
2. Clicks **Checkout** → `POST /api/create-checkout-session` with `{ items: [{ product_id, quantity }] }` only.
3. Server creates a Session (`mode: payment`, `price_data` or `stripe_price_id` from DB) and returns `{ url }`.
4. Browser redirects to Stripe-hosted Checkout (`window.location.href = url`).
5. After payment, Stripe redirects to `/order-success?session_id=…`; the page loads order details from `GET /api/orders/checkout-session/:sessionId` (Stripe as source of truth). Cancel goes to `/checkout/cancel`.

Test card: `4242 4242 4242 4242`.

**Order success troubleshooting**

1. After payment, the browser URL must be `/order-success?session_id=cs_test_...` (not bare `/order-success`, not literal `{CHECKOUT_SESSION_ID}`).
2. `CLIENT_URL` in `.env` must match the Vite URL in your terminal (e.g. `http://localhost:5174` if port 5173 is in use). Restart the server after changing it.
3. On checkout, the server logs `[checkout] success_url:` in dev — confirm it ends with `session_id={CHECKOUT_SESSION_ID}`.
4. DevTools on `/order-success` should log `sessionId from URL: cs_test_...`.
5. Test the API directly: `curl http://localhost:3000/api/orders/checkout-session/cs_test_YOUR_ID`.

### Admin — Instagram helper

| Method | Route | Description |
|--------|--------|-------------|
| `POST` | `/api/admin/ai/generate-ig` | Body: product/listing description + optional voice / tone / focus |
| `POST` | `/api/admin/ai/save-preferred` | Save a “hearted” line for future prompt conditioning |

---

## Database (high level)

Models live under **`server/models/`**:

- **products** — Title, unique slug, description, `price_cents`, `currency`, `quantity_available`, optional `format`, `size_label`, `year_created`, `stripe_product_id`, `stripe_price_id`, `is_active`, `deleted_at`, timestamps.
- **product_images** — Reference product, URL, ordering, primary flag, alt text, soft-delete.
- **orders** — Customer, Stripe IDs, status enums, cent totals, address subdocs.
- **order_items** — Order reference, optional product reference, snapshot fields for fulfillment.
- **adminusers** — Admin credentials.

---

## Instagram AI pipeline

Administrators describe a piece in plain language (and optional stylistic constraints). The server:

1. Normalizes context and loads saved preferred examples from memory.
2. Builds a single structured prompt and calls **Ollama** once per attempt.
3. Parses the reply as JSON and enforces shape with **Zod**.
4. Retries up to a small cap when the failure is a recoverable parse/validation issue.

Implementation: **`server/ai/`** and **`server/routes/aiIg.js`**.

---

## Repository

[github.com/michael-d-abraham/artist-portfolio-store](https://github.com/michael-d-abraham/artist-portfolio-store)
