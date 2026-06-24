# Future Work

Backlog of deferred ideas and enhancements. Nothing here is implemented — these are candidates for future sprints. Items are grouped by concern area to make prioritisation easier.

---

## Storefront

- **Search** — full-text search over product `title`, `description`, and `tags` (none currently exists). A MongoDB text index on `Product` is the simplest starting point; Algolia or Meilisearch if the catalogue grows.
- **Categories / tags** — add a `tags` or `category` field to the `Product` model and expose filter UI on the gallery. The schema currently has no taxonomy at all.
- **Better filtering** — filter gallery by medium, size, price range, availability. Requires both a URL-query-driven API (`/api/products?category=prints&maxPrice=500`) and frontend filter controls.
- **Product variants** — support listing a single artwork in multiple sizes or finishes without creating separate products. Requires a variant model and changes to checkout line item resolution.
- **Saved carts** — carts currently persist to `localStorage` and `req.session`, but sessions expire after 7 days and are device-local. Persisting carts to MongoDB under a guest token would allow recovery across devices and after session expiry.
- **"Sold out" & waitlist** — when `quantity_available` hits zero, offer customers an email notification option rather than removing the product from view.
- **SEO / SSR** — the gallery and product detail pages are client-rendered SPA; search engines see an empty `index.html`. Migrating to Nuxt 3 (or adding `vite-ssg`) would make product pages indexable. See `DECISIONS.md §4` for trade-offs.
- **Related / recommended products** — show similar works on product detail pages based on shared tags or category.
- **Better pagination** — the gallery currently loads all active products in one request. Add cursor-based or page-based pagination for `/api/products` once the catalogue grows beyond a few dozen items.

---

## Admin

- **Analytics dashboard** — the existing `GET /api/admin/dashboard` returns basic counts. Extend with: total revenue (sum of `Order.total_cents`), revenue over time (group by month), top-selling products (aggregate `OrderItem` by `product_id`), and conversion rate (checkout sessions created vs. completed — requires logging session creation).
- **Sales metrics** — average order value, number of repeat customers (by email), and revenue per product category once categories exist.
- **Low-stock alerts** — surface a warning in the admin listings view (and optionally send an email) when a product's `quantity_available` falls below a configurable threshold (e.g. ≤ 2).
- **Bulk operations** — multi-select on the listings page to toggle active/inactive or adjust prices without opening each product individually.
- **Order CSV / export** — allow the admin to download a filtered range of orders as a CSV for accounting or fulfilment handoff.
- **Rich order detail view** — currently orders only expose list + status patch. A detail page showing all line items, customer info, Stripe payment link, and fulfilment history would be useful.
- **Inventory import** — batch-create or update products from a CSV upload rather than one-at-a-time via the form.

---

## Customer Experience

- **Customer accounts** — allow buyers to register and log in. The current architecture has no public user model at all. This would require a separate `Customer` / `User` model, registration/login routes, and a password reset flow.
- **Order tracking for customers** — after checkout, give customers a shareable URL (keyed on `order_number` + email) to see their order status and fulfilment updates without requiring an account.
- **Order history** — logged-in customers can view their past orders, re-download receipts, and see fulfilment status changes over time.
- **Transactional order emails to customers** — currently the only email sent is an internal notification to the admin. Customers receive only the Stripe receipt. Add a branded confirmation email to the buyer's address after `fulfillOrderFromStripeSession` succeeds.
- **Improved mobile checkout UX** — audit the cart drawer and checkout flow on small screens; the current layout was not designed mobile-first.
- **Wishlist** — allow unauthenticated visitors to favourite items (stored in `localStorage`) and optionally convert to a saved list if/when accounts are added.

---

## Performance

- **Image optimisation** — uploaded images are stored at original resolution with no server-side processing. Add a `sharp` transform step before `PutObjectCommand` in `r2StorageService.js` to resize to a maximum dimension, strip EXIF data, and re-encode as WebP. Keep the original for print-quality use.
- **Cloudflare Image Resizing / CDN** — enable Cloudflare's image resizing transform URL syntax (`/cdn-cgi/image/width=800,format=webp/...`) in front of R2 to serve correctly-sized images per viewport without any server-side change.
- **Response caching** — product listings and site settings change infrequently. Add cache headers (`Cache-Control: public, max-age=60, stale-while-revalidate=300`) to `GET /api/products` and the `/api/site/*` endpoints, and optionally an in-process LRU cache for the MongoDB queries backing them.
- **Frontend code splitting** — the admin bundle (LangGraph dependencies, cropperjs, all admin pages) is loaded by all visitors. Route-level lazy imports (`defineAsyncComponent` / dynamic `import()`) would split admin code into a separate chunk that public visitors never download.
- **API-level pagination** — paginate `GET /api/admin/orders` and `GET /api/admin/products` to avoid loading unbounded collections into memory as the dataset grows.
- **MongoDB indexes** — audit queries on `Order`, `OrderItem`, and `Product` for missing indexes. At minimum: compound index on `Product({ is_active: 1, deleted_at: 1 })` and `Order({ customer_email: 1 })`.

---

## Security Hardening

- **Rate limiting** — no rate limiting exists anywhere. At minimum apply limits to: `POST /api/contact` (contact form spam), `POST /api/admin/session/login` (brute force), and `POST /api/create-checkout-session`. The `express-rate-limit` package is a natural fit.
- **Security headers** — add `helmet` (or manual `res.setHeader` calls) for: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` that allowlists only R2 and Stripe.
- **CSRF hardening** — the `sameSite: lax` cookie provides baseline CSRF protection. For state-mutating admin requests, a double-submit CSRF token or `Origin`-header validation would add defence in depth, particularly if the cookie ever needs to be `sameSite: none`.
- **Input sanitisation on contact form** — the contact form validates field presence and length but does not strip or escape HTML before passing content to Resend. Sanitise HTML in the email template or use a library like `sanitize-html` to prevent stored XSS payloads from reaching the admin's inbox.
- **`scrypt` parameter hardening** — the current `crypto.scryptSync` call uses Node's defaults, which have not been explicitly tuned. Document and pin explicit `N`, `r`, `p` parameters in `adminPassword.js`. Consider migrating to `argon2` if the number of admin accounts increases (`DECISIONS.md §5`).
- **Admin account management UI** — currently the only way to change admin credentials is via environment variables and a server restart. An in-app password change flow would reduce exposure of credentials in deployment config.
- **Audit log** — log admin actions (product create/update/delete, order status changes, login events) to a MongoDB collection with timestamp and actor for post-incident review.

---

## Tech Debt

- **TypeScript** — the entire codebase is plain JavaScript. Vite and Jest support `.ts` with minimal configuration. Migrating incrementally (starting with `server/services/` and `frontend/src/utils/`) would catch type errors earlier. See `DECISIONS.md §4`.
- **Frontend tests** — there are zero frontend tests. Add Vitest + Vue Testing Library coverage for composables (`useCart`, `useAdminNav`), utility functions (`money.js`, `cart.js`), and at minimum smoke tests for key pages.
- **Email retry / outbox** — if Resend's API is down when an order comes in, the notification email is silently dropped. Implement a simple outbox: persist pending emails to MongoDB, attempt delivery, mark as sent. See `DECISIONS.md §7`.
- **R2 image deletion** — soft-deleting a product leaves its image objects orphaned in R2 indefinitely. Add a cleanup job (cron or admin-triggered) that calls `DeleteObjectCommand` for `ProductImage` records where `deleted_at` is set and the product is soft-deleted. See `DECISIONS.md §2`.
- **Ollama circuit breaker / timeout** — `POST /api/admin/ai/generate-ig` will hang until the HTTP client times out if `OLLAMA_HOST` is unreachable. Add a configurable request timeout and a circuit breaker so the endpoint fails fast instead of hanging. See `DECISIONS.md §8`.
- **Resend email templating** — order and contact notification emails are composed with inline HTML strings. Extract these into proper template files or a lightweight component system to make copy changes and styling consistent.
- **Admin-only dependency isolation** — `cropperjs`, `@langchain/*`, and all admin-specific modules are bundled into the main SPA entry point and sent to every visitor. Isolate admin routes into a lazy-loaded chunk so the public storefront bundle stays small.
- **Centralised error handling middleware** — Express error propagation is inconsistent across controllers. Add a global Express error handler (`app.use((err, req, res, next) => …)`) and normalise error response shapes.
- **Consistent response envelope** — public API responses use ad-hoc shapes. Standardising on `{ data, error }` or a similar envelope would simplify frontend error handling and future API versioning.
- **Admin pagination** — `GET /api/admin/orders` and `GET /api/admin/products` return all records. Paginatedresponses are needed before the collection grows large enough to cause slow page loads.

---

## AI / Instagram Feature

- **Generation history read UI** — `AiGeneration` documents are persisted on every successful run but there is no UI to browse them. Add an admin page (or a section on `/admin/ai`) that lists past generations with their inputs, tone, focus, and outputs, searchable by date or listing title.
- **Per-generation rating / approval** — allow the admin to star or reject individual generations. Feed approved outputs back as `AiPreferredExample` records automatically, rather than requiring a manual "save as preferred" step.
- **Bulk generation from listings** — allow the admin to select multiple products and queue IG copy generation for all of them, rather than generating one at a time.
- **More copy types** — extend the output schema beyond `hooks / captions / ctas / hashtags` to include: email newsletter blurbs, website product descriptions, and Pinterest pin descriptions.
- **Cloud AI provider fallback** — the current implementation is exclusively `ChatOllama`. The graph, tools, and Zod schemas are provider-agnostic; `modelProvider.js` is the only touch point. Add a configurable `AI_PROVIDER` env var that switches to `ChatOpenAI` (or `ChatAnthropic`) without code changes. See `DECISIONS.md §8`.
- **Tone presets** — add a small library of saved tone configurations (e.g. "whimsical", "minimal", "collector-focused") that the admin can pick from rather than typing a free-form tone string each time.
- **Generation quality metrics** — track which preferred examples are used most often by the model and surface that in the UI so the admin knows which examples are driving output quality.

---

## Deferred Cleanup

- **Remove legacy redirect routes** — `/art/:slug → /gallery`, `/admin/social-links → /admin/customize`, `/admin/display-pictures → /admin/customize`, and `/admin/instagram-ai → /admin/ai` were added for backwards compatibility. Once any inbound links or bookmarks have aged out, these routes can be removed.
- **`node_modules` in production image** — `devDependencies` (`vue`, `vite`, `cropperjs`, Babel, Jest) are installed in production because the repo uses a single `package.json`. Splitting into `npm workspaces` or using `npm ci --omit=dev` in the production Dockerfile would reduce the deployed footprint. See `DECISIONS.md §9`.
- **Dependency audit** — run `npm audit` and `npx depcheck` on a schedule. Several packages (`@langchain/langgraph`, `@aws-sdk/client-s3`) have frequent minor releases. Pin exact versions or use Renovate to automate updates with test gating.
- **`console.log` / `console.error` hygiene** — scattered `console.log` and `console.error` calls in services and controllers should be replaced with a structured logger (e.g. `pino`) that can be suppressed in test and formatted as JSON in production.
- **`SiteSettings` schema documentation** — the `home_page`, `social_links`, and `contact_hero_image_url` fields on the `SiteSettings` model are documented only implicitly through controller code. Add explicit Mongoose schema definitions with `required`/`default` values so the shape is machine-readable.
- **Stripe Checkout metadata hardening** — the `items_json` fallback in `fulfillOrderFromStripeSession` (used when `product.metadata.product_id` is missing) is a recovery path that should not be needed for new orders. Add an assertion that logs a warning if the metadata path is taken, so the fallback does not silently mask a product metadata misconfiguration.
