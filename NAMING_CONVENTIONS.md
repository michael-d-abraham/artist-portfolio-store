# Naming Conventions

Conventions observed in and enforced for this codebase. Where the project is inconsistent, the preferred going-forward convention is stated and the existing deviation is noted.

---

## Vue Components

**File names:** PascalCase `.vue` files.

```
AdminSidebar.vue
CartDrawer.vue
HomeHero.vue
ProductImageGallery.vue
QuantityStepper.vue
```

**Prefix rule:** Component names are prefixed by their domain/area.

| Prefix | Domain |
|---|---|
| `Admin` | Admin panel UI |
| `Cart` | Cart drawer / cart UI |
| `Home` | Homepage sections |
| `Product` | Product detail / gallery cards |
| `Social` | Social links / icons |

**Folder structure:** Components live in `frontend/src/components/` under a lowercase folder named after their domain:

```
components/
  admin/
  cart/
  home/
  mobile/
  product/
  social/
```

A small number of components with no obvious sub-grouping sit directly in `components/` (e.g. `BagIcon.vue`, `SizeDropdown.vue`).

---

## Pages (Route Components)

**File names:** PascalCase `.vue` files. Admin pages always carry the `Admin` prefix.

```
Home.vue
Gallery.vue
ProductDetail.vue
Contact.vue
Checkout.vue
OrderSuccess.vue
CheckoutCancel.vue
AdminLogin.vue
AdminCreate.vue
AdminForm.vue
```

**Folder structure:** Pages live in `frontend/src/pages/`. Admin pages that are nested under `AdminLayout.vue` (i.e. all `/admin/*` routes except login) should live in `pages/admin/`. Admin pages in `pages/` root are a legacy deviation.

| Current location | Convention going forward |
|---|---|
| `pages/AdminCreate.vue` | `pages/admin/AdminCreate.vue` |
| `pages/AdminForm.vue` | `pages/admin/AdminForm.vue` |
| `pages/AdminLogin.vue` | stays at root — it is not nested under `AdminLayout` |
| `pages/AdminInstagramAi.vue` | `pages/admin/AdminInstagramAi.vue` |
| `pages/AdminDisplayPictures.vue`, `AdminSocialLinks.vue`, `AdminHomePage.vue` | `pages/admin/` subdirectory |

Do not move these files without updating the router imports in `frontend/src/router/index.js`.

---

## Composables

**File names:** `use` + PascalCase, `.js` extension.

```
useCart.js
useAdminNav.js
useMobileNav.js
useMediaQuery.js
```

**Exports:** Named export, same name as the file.

```js
export function useCart() { ... }
export function useAdminNav() { ... }
```

**Note on `adminNavItems.js`:** This file lives in `composables/` but does not follow the `use` prefix pattern — it exports a static constant (`ADMIN_NAV_ITEMS`) and a helper function, not reactive state. It belongs conceptually in `constants/`. Do not model new files after it; if adding constants data to `composables/`, move it to `constants/` instead.

---

## Constants

**File names:** `camelCase.js` describing what the constants represent.

```
contactPageDefaults.js
socialPlatformIcons.js
```

**Exported constant values:** `SCREAMING_SNAKE_CASE` for plain constants.

```js
export const DEFAULT_CONTACT_PAGE = { ... };
export const SOCIAL_ICON_DISPLAY_PX = 36;
export const ADMIN_NAV_ITEMS = [ ... ];
export const FULFILLMENT_STATUS_LABELS = { ... };
export const ORDER_SORT_OPTIONS = [ ... ];
```

**Helper functions that pair with constants:** `camelCase`, exported from the same file.

```js
export function applyContactPageDefaults(data) { ... }
export function isAdminNavActive(currentPath, path) { ... }
```

---

## Utility Functions

**File names:** `camelCase.js`, named after the domain they cover (not generic names like `helpers.js` or `utils.js`).

```
money.js              → dollarsToCents, formatMoneyFromCents
cart.js               → addToCart, removeFromCart, getCheckoutItems, ...
storefrontProduct.js  → primaryProductImage, displayProductName, ...
orderFulfillmentStatus.js
adminListSort.js
adminLoginErrors.js
```

**Exported function names:** `camelCase`, verb-first where the function does something, noun-first where it reads/gets a value.

```js
export function dollarsToCents(d) { ... }
export function formatMoneyFromCents(cents) { ... }
export function addToCart(product) { ... }
export function getCart() { ... }
export function hydrateCartFromServer() { ... }
export function fulfillmentStatusClass(value) { ... }
```

Frontend utils live in `frontend/src/utils/`. Server utils live in `server/utils/`. Cross-stack constants and pure helpers (e.g. fulfillment status values, email validation, cart quantity bounds, CMS page defaults, AI tone/focus enums, product display names/image URLs, money formatting) live in top-level `shared/` as CommonJS modules. Stack-specific utils may re-export from `shared/` or wrap UI-only helpers (e.g. `fulfillmentStatusClass` stays frontend-only). Frontend `constants/` may wrap shared modules for UI-only fields (e.g. contact hero image URL). Use `formatMoneyFromCents` from `shared/money.js` as the only money display helper — templates must not prepend `$` manually.

---

## API Service (`frontend/src/services/api.js`)

All HTTP calls from the SPA go through this single file. Do not add `fetch` calls anywhere else.

**Function names:** `camelCase`, verb + scope + resource.

| HTTP operation | Verb prefix | Example |
|---|---|---|
| Read (GET) | `get` | `getProducts`, `getAdminOrders`, `getCartSession` |
| Create (POST) | `create` | `createAdminProduct`, `createCheckoutSession` |
| Update (PUT) | `update` | `updateAdminProduct`, `updateVoiceProfile` |
| Delete (DELETE) | `delete` | `deleteAdminProduct` |
| Partial update (PATCH) | action verb | `toggleAdminProductActive`, `updateAdminOrderFulfillmentStatus` |
| Auth actions | verb only | `loginAdmin`, `logoutAdmin` |
| Upload | `upload` | `uploadAdminImage` |
| Generation / AI | action verb | `generateIgContent`, `savePreferredExample` |
| Contact | `submit` | `submitContactForm` |

**Scope in name:** Public API functions have no scope qualifier. Admin API functions include `Admin` in the name.

```js
getProducts()              // public
getAdminProducts()         // admin
getProductBySlug(slug)     // public
getAdminProductById(id)    // admin
```

---

## Express Routes (File Names)

**File names:** `camelCase.js`, prefixed by the domain they cover.

```
adminProducts.js
adminOrders.js
adminDashboard.js
adminSession.js
adminSiteSettings.js
adminUpload.js
aiIg.js
cartSession.js
catalog.js
contact.js
orders.js
site.js
stripeWebhook.js
```

Route files contain only `express.Router()` wiring — no business logic.

---

## Express Route Paths

**URL segments:** `kebab-case` for multi-word paths.

```
/social-links
/display-pictures
/home-page
/contact-hero
/contact-email
/toggle-active
/fulfillment-status
/upload-image
/generate-ig
/save-preferred
/voice-profile
/checkout-session/:sessionId
/create-checkout-session
```

**Route parameters:** `camelCase` — `:id`, `:sessionId`, `:slug`.

**Resource collections:** plural noun — `/api/products`, `/api/admin/orders`, `/api/admin/products`.

**Singleton resources:** singular noun — `/api/product/:slug`, `/api/admin/session`, `/api/contact`.

---

## Controllers

**File names:** `camelCase + Controller.js`.

```
adminProductController.js
adminOrderController.js
adminUploadController.js
adminDashboardController.js
checkoutController.js
contactFormController.js
orderController.js
productController.js
siteSettingsController.js
stripeWebhookController.js
```

**Exported function names:** `camelCase`, descriptive verb + scope + noun.

Standard CRUD pattern:
```js
listAdminProducts         // GET collection
getAdminProductById       // GET by id
createAdminProduct        // POST
updateAdminProduct        // PUT
softDeleteAdminProduct    // DELETE (soft)
toggleAdminProductActive  // PATCH
listPublicProducts        // GET public collection
getPublicProductBySlug    // GET public by slug
```

Non-CRUD endpoints and all functions in `siteSettingsController.js` append a `Handler` suffix:
```js
getAdminDashboardHandler
postContactFormHandler
createCheckoutSessionHandler
getCheckoutSessionSummaryHandler
stripeWebhookHandler
getPublicSocialLinksHandler
getAdminSocialSettingsHandler
updateAdminSocialSettingsHandler
```

**Preferred going forward:** Use the `Handler` suffix for all controller exports to distinguish them from service functions of similar names. The CRUD functions in `adminProductController.js` (no suffix) are a deviation from this pattern.

---

## Services

**File names:** two patterns exist.

1. `camelCase + Service.js` — domain service modules that group related operations:

```
checkoutService.js
checkoutSessionSummaryService.js
adminOrdersService.js
adminDashboardService.js
r2StorageService.js
resendMailService.js
contactFormService.js
siteSettingsService.js
```

2. `camelCase` named after the primary exported function — single-purpose modules:

```
fulfillOrderFromStripeSession.js
recordCompletedStoreOrder.js
ensureAdminUserFromEnv.js
orderNotificationEmailService.js
```

**Preferred going forward:** Use the `*Service.js` suffix for new domain service files. Use the function-named form only for genuinely single-purpose modules that export one primary function.

**Exported function names:** `camelCase`, verb-first.

```js
createCheckoutSession(body)
fulfillOrderFromStripeSession(session)
listPaidOrdersForAdmin()
updateOrderFulfillmentStatus(orderId, status)
getCheckoutSessionSummary(sessionId)
submitContactForm(body)
sendPaidTransactionNotification(sessionId)
ensureAdminUserFromEnv()
```

---

## Models

**File names:** PascalCase, no suffix, singular noun.

```
Product.js
ProductImage.js
Order.js
OrderItem.js
AdminUser.js
SiteSettings.js
PaidCheckoutNotification.js
AiGeneration.js
AiPreferredExample.js
AiVoiceProfile.js
```

**Mongoose model name:** PascalCase, same as the filename (minus `.js`).

```js
mongoose.model('Product', productSchema)
mongoose.model('AdminUser', adminUserSchema)
mongoose.model('AiVoiceProfile', aiVoiceProfileSchema)
```

**Schema variable name:** `camelCase + Schema`.

```js
const productSchema = new mongoose.Schema({ ... });
const orderItemSchema = new mongoose.Schema({ ... });
const aiVoiceProfileSchema = new mongoose.Schema({ ... });
```

**Schema field names:** `snake_case` throughout.

```js
price_cents, quantity_available, size_label, is_active,
deleted_at, stripe_product_id, stripe_price_id,
customer_email, fulfillment_status, order_number
```

**Timestamp field names:** always aliased to `snake_case`.

```js
timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
```

**Importing models:** always import from `server/db.js`, never directly from `server/models/`.

```js
// Correct
const { Product, Order } = require('../db');

// Wrong — do not do this
const Product = require('../models/Product');
```

---

## Middleware

**File names:** `camelCase.js`, named after what the middleware does.

```
adminAuth.js       → attachAdminUser, requireAdminRole
uploadProductImage.js → uploadProductImage (multer instance)
```

**Exported function names:** `camelCase`, action verb + noun.

```js
attachAdminUser    // loads user from session onto req.user
requireAdminRole   // gates on req.user.isAdmin
```

The combined guard used in `app.js`:

```js
const requireAdmin = [attachAdminUser, requireAdminRole];
```

---

## Database Collections

Collection names are explicitly set in each schema's options (`{ collection: '...' }`). Always `snake_case`, plural.

| Model | Collection |
|---|---|
| `Product` | `products` |
| `ProductImage` | `product_images` |
| `Order` | `orders` |
| `OrderItem` | `order_items` |
| `SiteSettings` | `site_settings` |
| `PaidCheckoutNotification` | `paid_checkout_notifications` |
| `AiGeneration` | `ai_generations` |
| `AiPreferredExample` | `ai_preferred_examples` |
| `AiVoiceProfile` | `ai_voice_profiles` |
| `AdminUser` | not explicitly set — Mongoose defaults to `adminusers` |

The `sessions` collection is managed by `connect-mongo` (named in `sessionStore.js`).

---

## Environment Variables

`SCREAMING_SNAKE_CASE`. Prefixed by vendor or service when the variable belongs to a specific external service.

| Prefix | Service |
|---|---|
| `STRIPE_` | Stripe |
| `R2_` | Cloudflare R2 |
| `RESEND_` | Resend |
| `OLLAMA_` | Ollama |
| `ADMIN_` | Admin user bootstrap |
| `MONGO_` | MongoDB |

Variables without a vendor prefix are infrastructure-level: `NODE_ENV`, `PORT`, `SESSION_SECRET`, `CLIENT_URL`, `DB_NAME`, `NOTIFICATION_EMAIL`.

All variables are documented in `.env.example` at the repository root. Any new variable must be added there.

---

## CSS Class Naming

**Casing:** `kebab-case` throughout. No camelCase or PascalCase class names.

**Methodology:** [BEM](https://getbem.com/) — Block, Element, Modifier.

```
block
block__element
block__element--modifier
block--modifier
```

**Examples from this project:**

```css
.cart-drawer                    /* block */
.cart-drawer__header            /* element */
.cart-drawer__title             /* element */
.admin-sidebar                  /* block */
.admin-sidebar__link            /* element */
.admin-sidebar__link--active    /* element + modifier */
.admin-data-table__btn--danger  /* element + modifier */
.admin-float--padded            /* block + modifier */
.home-hero                      /* block */
.home-hero__image               /* element */
.home-hero__image--placeholder  /* element + modifier */
```

**Block naming:** blocks are named after the component or page section they style, using the same `kebab-case` version of the component name.

```
AdminSidebar.vue  →  .admin-sidebar
CartDrawer.vue    →  .cart-drawer
HomeHero.vue      →  .home-hero
```

**Utility/base classes:** a small set of non-BEM utility classes exist in `base.css` for shared form and layout primitives:

```
.field
.help
.error
.field-error
.actions
.label-text
.btn-ghost
```

These are only for base/generic use. Page- and component-specific styles must follow BEM and belong in the component's `<style>` block or the matching CSS file in `frontend/src/styles/`.

**Global style files:** named `kebab-case`, one file per major layout area:

```
base.css
admin-data-table.css
contact-page-layout.css
gallery-product-grid.css
hero-display.css
home-page-layout.css
mobile.css
```
