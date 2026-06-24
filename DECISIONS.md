# Architectural Decisions

Record of significant choices made in this project, with rationale and trade-offs. These are not aspirational — they reflect what is actually in use.

---

## 1. MongoDB / Mongoose

**Decision:** MongoDB as the primary database, accessed through Mongoose 8.

**Why:**

The data in this project is not deeply relational. Products have a virtual `product_images` join, orders have order items, and everything else (site settings, AI profiles, sessions) is document-shaped. MongoDB's flexible schema suited the evolving `SiteSettings` document in particular — it holds heterogeneous sections (social links, home page content, contact page config) that would require multiple relational tables or wide, sparse columns.

Mongoose was chosen over the raw driver for schema enforcement, virtuals (the `product_images` virtual on `Product`), and middleware hooks. The `connect-mongo` package reuses the same MongoDB connection for session storage, avoiding a second infrastructure dependency.

**Trade-offs:**

- No joins — `product_images` are loaded via a virtual populate or a separate query; the `OrderItem` documents reference `product_id` but the product snapshot is also embedded at order time to avoid broken references if a product is later soft-deleted.
- Transactions are available and used in `fulfillOrderFromStripeSession` (stock decrement + order creation), but require a replica set or Atlas — a plain single-node local MongoDB does not support transactions without configuration.
- Mongoose's model caching pattern (`mongoose.models.X || mongoose.model('X', schema)`) is used throughout to support test resets with `mongodb-memory-server`.

**Reconsideration:** If the product catalogue grows large and complex reporting is needed (e.g. joining orders to products for analytics), a relational database would be easier to query. For the current scale — dozens of listings, hundreds of orders — MongoDB is sufficient.

---

## 2. Cloudflare R2 via S3-Compatible SDK

**Decision:** Product images are uploaded to Cloudflare R2 using `@aws-sdk/client-s3` (`PutObjectCommand`). The server never stores image files locally.

**Why:**

R2 is S3-compatible, so the existing `@aws-sdk/client-s3` SDK works without any R2-specific client library. The critical cost difference: **R2 charges no egress fees** for data read from a bucket. For a site where images are the primary content and are served on every product page, the absence of per-GB download charges is significant.

Images are stored under `products/{uuid}.{ext}` with a UUID filename to prevent collisions and path guessing. The public URL is stored as an absolute URL in `ProductImage.image_url` — the Express server is never in the request path for image delivery. Browsers load images directly from R2.

The upload flow uses Multer memory storage: the image buffer is held in memory only for the duration of the upload request, then passed to `PutObjectCommand` and discarded. No temporary files touch disk.

**Trade-offs:**

- If R2 credentials are missing, the upload endpoint throws immediately (`assertR2Config` is called on every upload). This is a deliberate hard failure — it is better to surface a configuration error than to silently accept images that will never be accessible.
- Image deletion is not implemented. Removing a product listing soft-deletes the `ProductImage` records in MongoDB but does not delete the file from R2. The URL becomes unreachable in the storefront but the object remains in the bucket. A future cleanup job would be needed for long-term storage hygiene.
- No image resizing or CDN optimisation is applied server-side. The raw uploaded file is stored as-is. If large files become a problem, a transform step (sharp, Cloudflare Image Resizing) could be inserted before `PutObjectCommand`.

**Reconsideration:** Any S3-compatible storage (AWS S3, Backblaze B2) could replace R2 with only a credential swap. The `getS3Client()` singleton in `r2StorageService.js` is the only touch point.

---

## 3. Session Authentication over JWT

**Decision:** Admin authentication uses `express-session` with a MongoDB-backed session store (`connect-mongo`). No JWTs are issued.

**Why:**

There is exactly one type of authenticated user in this application: a single admin. There is no public user registration, no mobile app, and no external API consumer. A session cookie is simpler, more appropriate, and safer for this use case:

- **Revocation is immediate.** Deleting or disabling an `AdminUser` document, or calling `req.session.destroy()`, invalidates access instantly. A JWT cannot be revoked before its expiry without a denylist — which adds the same server-side storage complexity sessions already have.
- **No token exposure in JavaScript.** The session cookie is `httpOnly`, so it is never readable by client-side code. A JWT stored in `localStorage` or a non-`httpOnly` cookie is accessible to any XSS payload.
- **`sameSite: lax`** prevents the cookie from being sent on cross-origin form submissions (CSRF mitigation) while still allowing it on normal navigation. In production the cookie is also `secure`.
- **No expiry edge cases.** The `maxAge` is 7 days. The session document in MongoDB is the single source of truth — no refresh token dance.

The session lookup is one MongoDB query per protected request (`AdminUser.findById(req.session.userId)` in `attachAdminUser`). At the scale of a single-admin application this is not a concern.

**Trade-offs:**

- Sessions require sticky sessions or a shared session store in a multi-process deployment. The MongoDB store handles this — any process can read the same session document. `trust proxy: 1` is set in production for correct behaviour behind a reverse proxy on Render/Heroku.
- If this application were ever extended to serve mobile clients or expose a public API consumed by third parties, a JWT or API key approach would be more appropriate.

**Reconsideration:** Only warranted if a native mobile admin app or external API integration is added.

---

## 4. Vue 3 + Vite

**Decision:** Vue 3 (Composition API, `<script setup>`) for the SPA; Vite 8 for development and production builds.

**Why:**

Vue 3's Composition API allows all component logic to be co-located in `<script setup>`, making pages and composables easy to read without the Options API ceremony. The project uses no global state plugin (no Pinia or Vuex) — reactive state lives in composables (`useCart`, `useAdminNav`) backed by `localStorage` and the server session, which is appropriate for the small amount of client state involved.

Vite's development server proxies `/api/*` to the Express backend at `http://localhost:3000`, eliminating all CORS configuration during development. In production, Express serves the compiled `frontend/dist` directly — no separate static hosting service is required.

The `root: 'frontend/'` setting in `vite.config.mjs` means the frontend source is cleanly separated from the server source within the same repository. `@` is aliased to `frontend/src/` for clean imports.

**Trade-offs:**

- Vue Router 4 (v5 in package.json) does not support server-side rendering out of the box. All routing is client-side; the Express catch-all (`/{*splat}`) serves `index.html` for any unmatched path. SEO for product pages depends on the Stripe-hosted checkout not needing indexing — the public gallery and product pages could benefit from SSR if SEO were a priority.
- No TypeScript. The project uses plain JavaScript throughout. This reduces tooling friction but means there is no compile-time type checking.

**Reconsideration:** SSR (via Nuxt 3) would improve SEO on product and gallery pages if organic search traffic matters. TypeScript could be adopted incrementally — Vite supports `.ts` files with no configuration change.

---

## 5. Password Hashing with Node.js `crypto.scrypt`

**Decision:** Admin passwords are hashed with Node's built-in `crypto.scryptSync` with a random 16-byte salt, producing a 64-byte key. Comparison uses `crypto.timingSafeEqual`. No external hashing library (`bcrypt`, `argon2`) is used.

**Why:**

`scrypt` is a memory-hard KDF (key derivation function) resistant to GPU-based brute force — the same properties that make `bcrypt` and `argon2` preferable to plain `sha256`. Node's `crypto` module has included `scrypt`/`scryptSync` since Node 10, so this decision adds **zero external dependencies**.

`crypto.timingSafeEqual` prevents timing attacks by comparing hashes in constant time regardless of where the first difference occurs.

The stored format is `{saltHex}:{hashHex}` — a portable, self-contained string with no library-specific encoding.

**Trade-offs:**

- `scrypt` work factors (`N`, `r`, `p`) are using Node's defaults, which are lower than production-hardened `bcrypt` or `argon2` configurations. The defaults are still meaningfully slow but have not been explicitly tuned.
- Only one admin account (or two: primary + master) ever exists. The security threat model is not a leaked database of thousands of user passwords — it is a single admin credential. The current approach is adequate for this threat model.
- If password hashing is ever needed for public user accounts, `argon2` via the `argon2` package would be the preferred choice for its stronger memory-hardness guarantees and explicit tunability.

**Reconsideration:** Upgrade to explicit `scrypt` parameters or switch to `argon2` if the number of accounts or the sensitivity of those accounts increases.

---

## 6. Stripe Webhooks Drive Order Creation and Inventory

**Decision:** `Order` documents are created and `Product.quantity_available` is decremented only inside `fulfillOrderFromStripeSession`, which runs only after a `checkout.session.completed` webhook event (or the equivalent call from the order success page) confirms `payment_status === 'paid'`.

**Why:**

This is the correct Stripe integration pattern for a store. The alternatives are wrong:

- **Decrement stock at cart-add time:** stock is never reserved; a customer could add an item and never pay, blocking it for others indefinitely.
- **Decrement at checkout session creation:** a session is created speculatively; payment may not complete. This would require a reconciliation job to re-add stock for abandoned sessions.
- **Decrement on order success page redirect:** the redirect is client-side. A user could close the browser tab or lose connectivity before the redirect fires. The order would not be recorded and stock would not decrement.

The webhook is the authoritative payment confirmation. The `fulfillOrderFromStripeSession` runs in a **Mongoose transaction** with an atomic `{ $gte: quantity }` stock guard, so a race between two simultaneous purchases of the same last unit is handled correctly — one will succeed, the other will throw.

**Dual triggers:** The order success page also calls `GET /api/orders/checkout-session/:sessionId`, which calls the same `recordCompletedStoreOrder → fulfillOrderFromStripeSession` path. This handles the case where the webhook fires before the user returns (normal) or after (delayed/failed delivery). `fulfillOrderFromStripeSession` is idempotent: it checks for an existing `Order` with the same `stripe_checkout_session_id` before doing any work, and handles a duplicate-key `11000` error as a safe no-op.

**Trade-offs:**

- Webhook delivery can be delayed or retried by Stripe. In the delay window between payment confirmation and webhook delivery, the order does not appear in the admin panel. The order success page's own call to `recordCompletedStoreOrder` mitigates this for most cases.
- The Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) must be correctly configured or the endpoint returns 503. In development, the Stripe CLI `stripe listen` command is required to receive webhook events locally.
- Stock is decremented at fulfillment time, not pre-authorisation. If an item sells out between checkout session creation and webhook receipt (extremely unlikely for a small-volume store), the fulfillment transaction will throw `Insufficient stock` — the payment will have been captured but the order will not be created. A Stripe refund would need to be issued manually. At the current scale this is an acceptable edge case.

**Reconsideration:** For high-volume or limited-edition drops, a proper inventory reservation system (hold at session creation, confirm at webhook, release on expiry) would be appropriate.

---

## 7. Resend for Email

**Decision:** Transactional email (contact form notifications, order receipts) is sent via the Resend API using the `resend` npm package.

**Why:**

Resend provides a simple REST API with an official Node.js client. Setup requires one API key and one verified sender domain — no SMTP configuration, no TLS setup, no MX records beyond domain verification. For a project with two email use cases (contact form forwarding, order notifications), the overhead of configuring and maintaining an SMTP provider or self-hosted mail server was not justified.

**Trade-offs:**

- In Resend's sandbox (without a verified sending domain), the only available `from` address is `onboarding@resend.dev`. This means the `RESEND_FROM_EMAIL` env var must be set correctly in production or emails will either fail or arrive from a Resend-owned address.
- `NOTIFICATION_EMAIL` is the fallback recipient for order and contact notifications. If this is not set and the `SiteSettings.contact_email` field is also empty, notification emails will fail silently (the error is logged but does not surface to the user).
- There is no email queue or retry logic. If Resend's API is unavailable at the moment of sending, the email is lost. For order notifications this is an acceptable risk — the order is already stored in MongoDB.

**Reconsideration:** Adding a simple outbox/retry pattern (store pending emails in MongoDB, attempt delivery, mark sent) would improve reliability. Warranted if missed order notifications become a recurring issue.

---

## 8. LangGraph + Ollama for AI Copy Generation

**Decision:** The Instagram copy generator uses a LangGraph agentic loop (`@langchain/langgraph`) with `ChatOllama` (`@langchain/ollama`) pointing at a self-hosted Ollama instance. No cloud AI API (OpenAI, Anthropic, Google) is used.

**Why:**

**Self-hosted inference:** The artist's listing descriptions and brand voice profile are the input to the model. Routing this data through a third-party cloud API raises privacy and data retention concerns. Running inference locally via Ollama keeps all data on infrastructure the operator controls.

**LangGraph over a simple LLM call:** The generation task requires the model to consult two data sources before writing — the artist's voice profile (`AiVoiceProfile`) and approved copy examples (`AiPreferredExample`). Expressing this as a tool-calling agent loop (rather than pre-fetching and concatenating everything into a prompt) lets the model decide which examples are relevant and when it has enough context. The repair loop (up to 3 re-prompts on invalid JSON output) handles models that add markdown fences or deviate from the required output schema, without crashing the endpoint.

**Zod output validation:** The model's output is parsed and validated with `modelIgOutputSchema` (Zod) before being returned. If validation fails, the `repairAgent` node appends the specific validation error to the message thread and lets the model try again, with the full conversation history intact.

**Trade-offs:**

- The default `OLLAMA_HOST` is `http://golem:11434` — a private machine name specific to the original development environment. Any deployment requires setting `OLLAMA_HOST` explicitly.
- The default model (`gpt-oss:20b`) is also private. A new deployment needs a compatible Ollama-served model and must update `OLLAMA_MODEL` accordingly.
- If Ollama is not running, `POST /api/admin/ai/generate-ig` will hang until the HTTP client times out or return a connection error. There is no circuit breaker or timeout on the model invocation.
- The AI feature is **admin-only**. It has no effect on the public storefront. If the Ollama host is unavailable, only the AI tab in the admin panel is broken — the rest of the site is unaffected.

**Reconsideration:** Switching `modelProvider.js` to use a cloud provider (e.g. `ChatOpenAI` from `@langchain/openai`) requires changing only that one file — the graph, tools, and schema are provider-agnostic. This is the correct migration path if self-hosted inference becomes impractical.

---

## 9. Single Root `package.json` (Collocated Monorepo)

**Decision:** The Express backend and Vue frontend share one `package.json` at the repository root. There is no workspace or sub-package configuration.

**Why:**

For a project with one developer, one deployment target, and tightly coupled frontend/backend development, a single package file reduces tooling overhead significantly. There is one `npm install`, one test command, one build command. The Vite config (`vite.config.mjs`) sets `root: 'frontend/'` so the frontend source is cleanly separated without needing its own package.

In production, `npm start` runs Express, which serves the pre-built SPA from `frontend/dist`. A single process handles both the API and the SPA — no separate static hosting, no separate deploy pipeline.

The backend is `"type": "commonjs"` — all server files use `require`/`module.exports`. Frontend files use ESM (`import`/`export`), which Vite handles at build time. The Jest tests transpile frontend ESM through `@babel/plugin-transform-modules-commonjs` so they can import frontend utility files without changing production code.

**Trade-offs:**

- All dependencies (frontend and backend) are in the same `node_modules`. `vue`, `vite`, and `cropperjs` ship to the production server install even though they are only needed at build time. In practice this adds negligible disk space but is not ideal for minimal production images.
- The frontend and backend cannot be versioned or deployed independently. If they ever need to be hosted separately (e.g. SPA on a CDN, API on a server), the repository would need to be split or converted to a proper workspace (npm workspaces, Turborepo).
- Running `npm run dev` starts only the Vite dev server. `npm run dev:all` (via `concurrently`) starts both. New developers must know to use `dev:all`.

**Reconsideration:** If the project is ever split into separate frontend and backend deployments, converting to npm workspaces with shared devDependencies at the root would be the natural next step.
