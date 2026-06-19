# Artist Portfolio Store

**Live site:** [artist-portfolio-store.onrender.com](https://artist-portfolio-store.onrender.com/)

> Hosted on Render. If the site has been idle, the first load can take about **20 seconds** while the server spins up — then it runs normally.

A **complete ecommerce platform** for independent artists — gallery, checkout, order management, and an **AI-powered content assistant**, all in one codebase.

The app is built as **two separate sides** that share the same backend:

| | **Front face** (public) | **Admin side** (private) |
|---|---|---|
| **Who sees it** | Visitors, buyers, collectors | The artist / shop owner |
| **Purpose** | Browse, buy, contact | Manage the entire business |
| **URL** | `/`, `/gallery`, `/checkout`, … | `/admin/*` (login required) |

The **front face** is the customer-facing storefront. The **admin side** is a full back-office: listings, orders, site customization, settings, and AI tools. The admin is **completely customizable** — swap branding, copy, and layout and you can reuse this same build for other artist shops, small galleries, or similar portfolio-and-store sites without starting from scratch.

Built as an academic project using **Vue 3**, **Express**, and **MongoDB**.

---

## Two sides, one platform

### Front face — the storefront

This is what the public sees: a polished ecommerce site end to end.

- Product gallery and detail pages
- Shopping cart and **Stripe Checkout** (real payments, inventory, order records)
- Contact form and order confirmation
- Fully styled public pages — home, gallery, product, checkout, contact

Everything needed to **sell online** is wired up: prices and stock live in the database, checkout goes through Stripe, and paid orders land in MongoDB for fulfillment.

### Admin side — run the business

Hidden behind login (`/admin/login`), the admin is a separate workspace for the owner:

- **Dashboard** — earnings, active listings, recent orders
- **Listings** — create, edit, upload images (Cloudflare R2), toggle visibility
- **Orders** — paid orders with fulfillment workflow (New Order → Shipped → Completed → Cancelled)
- **Customize** — site content and presentation
- **Settings** — links, contact details, and configuration
- **AI** — Instagram caption generator (see below)

The admin panel is designed to be **adaptable**. The same architecture supports different brands, product types, and site copy — making it a practical starting point for other similar ecommerce sites, not just this one artist.

---

## AI assistant — the standout feature

The admin includes a built-in **AI content assistant** for social media. It is not a generic chatbot — it is trained on *your* brand over time.

**How it learns your voice**
- Set brand identity, what to emphasize, and what to avoid — saved in MongoDB and injected into every generation
- Heart lines you like (hooks, captions, CTAs) — stored as few-shot examples the agent pulls on future runs
- The more you refine preferences, the closer output gets to your actual writing style

**What it generates per post**
- Opening hooks
- Full captions
- Calls to action
- Hashtag sets

**Per-post controls:** tone (Poetic, Simple, Luxury, …) and focus (Engagement, Sell, Story, …) on top of your saved voice profile.

**Under the hood:** a LangGraph agent calls Ollama, returns structured JSON, validates with Zod, and retries on recoverable failures. The agent fetches your voice profile and preferred examples via tool calls — you do not paste the same context every time.

Admin → **AI** · Code: `server/ai/`, `server/routes/aiIg.js`

---

## What you get (summary)

**Complete ecommerce**
- Browse → cart → Stripe payment → order stored → admin fulfillment
- Prices and inventory always from MongoDB (never trusted from the browser)
- Idempotent order recording via Stripe webhook and/or order-success page

**Customizable admin template**
- Reusable back-office for similar portfolio/store sites
- Product CRUD, image uploads, order management, site customization

**AI-powered marketing**
- Brand-aware caption generation with learning from saved preferences and hearted examples

---

## Tech stack

| Layer | Stack |
|--------|--------|
| Frontend | Vue 3, Vue Router, Vite |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Auth | Cookie sessions (`express-session`), scrypt password hashing |
| Payments | Stripe Checkout |
| Images | Cloudflare R2 |
| Email | Resend |
| AI | **LangGraph agent**, Ollama, Zod — brand-aware caption generation |

---

## Quick start

**You need:** Node.js, MongoDB, and (for **AI features**) a running Ollama instance.

```bash
git clone https://github.com/michael-d-abraham/artist-portfolio-store.git
cd artist-portfolio-store
npm install
cp .env.example .env   # then fill in values
npm run dev:all        # API on :3000 + frontend on :5173
```

| Command | What it does |
|---------|----------------|
| `npm run dev:all` | Run API + frontend together (best for local dev) |
| `npm run server` | API only |
| `npm run dev` | Frontend only |
| `npm run build` | Production build of the Vue app |
| `npm start` | Production API (serves built frontend if present) |
| `npm test` | Run Jest tests |

**Admin login:** open `/admin/login`. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` — they sync to MongoDB on server start. An optional master admin (`ADMIN_MASTER_USERNAME` / `ADMIN_MASTER_PASSWORD`) can be configured the same way.

---

## Environment variables

Copy `.env.example` and fill in what you need. Grouped by feature:

**Core**
- `MONGO_STRING`, `DB_NAME` — MongoDB connection
- `SESSION_SECRET` — session cookie signing
- `CLIENT_URL` — frontend URL (e.g. `http://localhost:5173`); must match Vite in dev

**Admin**
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`
- `ADMIN_MASTER_USERNAME`, `ADMIN_MASTER_PASSWORD` (optional backup account)

**Stripe**
- `STRIPE_SECRET_KEY` — secret key (`sk_test_...`), not publishable
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or dashboard

Local webhooks:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Test card: `4242 4242 4242 4242`.

**Image uploads (admin)**
- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_PUBLIC_URL`

**Contact form**
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NOTIFICATION_EMAIL` (optional)

**AI captions (required for Admin → AI)**
- `OLLAMA_HOST`, `OLLAMA_MODEL` — defaults work if Ollama runs locally

---

## How checkout works (ecommerce flow)

This is a **full checkout pipeline**, not a demo cart.

1. Customer adds items on `/checkout` (prices loaded from the API for display only).
2. Frontend calls `POST /api/checkout/create-session` with `{ items: [{ product_id, quantity }] }`.
3. Server validates stock and builds Stripe line items from **database** prices.
4. Customer pays on Stripe-hosted Checkout.
5. After payment, the order is saved to MongoDB via:
   - Stripe webhook (`checkout.session.completed`), and/or
   - `GET /api/orders/checkout-session/:sessionId` on the order-success page

Both paths use the same idempotent logic — safe to run twice. Admin orders are read from MongoDB only.

**Local dev tip:** if webhooks are awkward, the order-success page alone can record orders after each test checkout. Make sure `CLIENT_URL` matches your Vite port.

---

## Project layout

```
frontend/src/
  pages/               Public storefront (front face)
  pages/admin/         Admin workspace (dashboard, listings, orders, AI, …)
server/
  models/              Mongoose schemas (Product, Order, AiVoiceProfile, …)
  routes/              Express route handlers
  services/            Business logic (orders, checkout, dashboard)
  ai/                  LangGraph workflow, tools, schemas — AI caption engine
tests/                 Jest API tests
```

**Main data models**
- **Product** — listing with price, stock, Stripe IDs, images, visibility
- **Order / OrderItem** — paid checkout with customer snapshot and line items
- **AiVoiceProfile** — brand preferences the AI agent uses on every run
- **AiPreferredExample** — hearted hooks, captions, CTAs (up to 5 per type)

---

## API reference

All `/api/admin/*` routes require a logged-in session except `POST /api/admin/session/login`.

<details>
<summary><strong>Public routes</strong></summary>

| Method | Route | Purpose |
|--------|--------|---------|
| `GET` | `/api/products` | Active product gallery |
| `GET` | `/api/product/:slug` | Single product + images |
| `POST` | `/api/checkout/create-session` | Start Stripe Checkout |
| `POST` | `/api/webhooks/stripe` | Stripe webhook handler |
| `POST` | `/api/contact` | Contact form → email |
| `GET` | `/api/orders/checkout-session/:sessionId` | Order summary + persist to DB |

</details>

<details>
<summary><strong>Admin — products & orders</strong></summary>

| Method | Route | Purpose |
|--------|--------|---------|
| `GET` | `/api/admin/dashboard` | Stats (earnings, listings, recent orders) |
| `GET/POST/PUT/DELETE` | `/api/admin/products` | Product CRUD |
| `PATCH` | `/api/admin/products/:id/toggle-active` | Show/hide listing |
| `POST` | `/api/admin/upload-image` | Upload image → R2 |
| `GET` | `/api/admin/orders` | List paid orders |
| `PATCH` | `/api/admin/orders/:id/fulfillment-status` | Update status |

Fulfillment statuses: `new_order`, `shipped`, `completed`, `cancelled`.

</details>

<details>
<summary><strong>Admin — AI (caption assistant)</strong></summary>

| Method | Route | Purpose |
|--------|--------|---------|
| `POST` | `/api/admin/ai/generate-ig` | Generate hooks, captions, CTAs, hashtags |
| `POST` | `/api/admin/ai/save-preferred` | Save a hearted line for future generations |
| `GET/PUT` | `/api/admin/ai/voice-profile` | Read/update brand voice preferences |

The agent loads voice profile and preferred examples automatically via tool calls during generation.

</details>

---

## Migration

If upgrading from an older artwork/product-type schema:

```bash
npm run migrate:catalog
```

---

## Repository

[github.com/michael-d-abraham/artist-portfolio-store](https://github.com/michael-d-abraham/artist-portfolio-store)
