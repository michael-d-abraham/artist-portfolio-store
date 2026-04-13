# Art shop (midterm project)

A simple online gallery where people browse **products** (each tied to an **artwork**). There is a **login area** for the artist to add or edit listings. An extra page helps write **Instagram-style text** (hooks, captions, etc.) using a **local AI** setup.

The app is a Vue website talking to a Node server, with data stored in **MongoDB**.

## Wireframes

![Wireframe 1](images/Screenshot%202026-04-13%20at%209.49.48%E2%80%AFAM.png)

![Wireframe 2](images/Screenshot%202026-04-13%20at%209.50.18%E2%80%AFAM.png)

---

## Main “things” in the app

- **Artwork** — The piece itself: name, web-friendly link name, description, year, whether it’s shown or hidden, and a “deleted” flag (delete doesn’t wipe the row; it hides it).
- **Product type** — What kind of item it is (e.g. poster): name, description, materials, bullet features.
- **Product** — The actual thing for sale: links to an artwork and a type, price, how many are in stock, size info, photos (via images below), and show/hide + deleted flag.
- **Product image** — Picture URL for a product, sort order, which one is the “main” image, alt text.
- **Admin user** — Login name and a hashed password for the back office.
- **Saved caption lines (AI)** — Not in the database: up to a few “liked” hooks/captions/CTAs kept in server memory to steer the AI. Resets if the server restarts.

---

## API routes (short list)

Anything under **`/api/admin/...`** (except login) needs you to **log in first** so the browser sends the session cookie.

**Visitors (no login)**  
`GET /api/artworks` — list artworks on the site.  
`GET /api/artworks/:slug` — one artwork.  
`GET /api/products` — list products (the gallery).  
`GET /api/product/:slug` — one product’s detail.

**Login**  
`POST /api/admin/session/login` — body: username + password.  
`GET /api/admin/session` — who am I (after login).  
`POST /api/admin/session/logout` — sign out.

**Admin — artworks**  
`GET/POST /api/admin/artworks` — list or create.  
`GET/PUT/DELETE /api/admin/artworks/:id` — read, edit, or soft-delete.  
`PATCH /api/admin/artworks/:id/toggle-active` — show/hide.

**Admin — product types**  
`GET/POST /api/admin/product-types` — list or create.  
`GET/PUT /api/admin/product-types/:id` — read or update.

**Admin — products**  
`GET/POST /api/admin/products` — list or create.  
`GET/PUT /api/admin/products/:id` — read or update.  
`GET /api/admin/products/:productId/images` — images for that product.  
`PUT .../images/:imageId/primary` — pick the main image.  
`PUT .../inventory` — update stock.

**Admin — product images**  
`POST /api/admin/product-images` — add an image.  
`PUT/DELETE /api/admin/product-images/:id` — change or remove.

**Admin — quick “new listing”**  
`POST /api/admin/catalog-items` — creates the bundle your app expects in one go.

**Admin — Instagram helper**  
`POST /api/admin/ai/generate-ig` — send a rough description; get back suggested hooks, captions, CTAs, hashtags.  
`POST /api/admin/ai/save-preferred` — save a line you liked for future suggestions.

---

## What’s stored in the database (big picture)

![Database schema diagram](images/databaseschema.png)

All of this is spelled out in the **`server/models`** files. In words:

- **Artworks** hold title, unique slug, description, optional year, active flag, optional deleted-at date, and auto dates for created/updated.
- **Product types** hold name, unique slug, optional description, feature list, material, active flag, dates.
- **Products** point to an artwork and a type; they have a unique slug, price (in cents), stock counts, optional size fields, active + deleted-at, dates. Images are linked separately.
- **Product images** point to a product; they store the image URL, ordering, primary flag, alt text, active + deleted-at, dates.
- **Admin users** store username, password hash, enabled flag, admin flag, dates.

The Instagram endpoints also use small **request checks** in code (for example: required text, allowed tone/focus choices, and making sure the AI answer has the right number of hooks/captions/etc.).

---

## How the Instagram AI flow works

You type a rough idea of the piece (and optional style notes). The server runs a **step-by-step workflow** (LangGraph): tidy the text, pull any saved “heart” examples, build a prompt, call the **local model** (Ollama), then **check** that the reply is valid JSON in the right shape. If the reply is badly formed, it **tries again** a few times. Two helper **tools** in code (with clear inputs) handle loading examples and calling the model—the workflow decides when to use them; the model does not pick its own tools.

![Agentic workflow graph](images/AgenticGraph.png)

You need MongoDB running, a `.env` with your DB string and session secret, and (for captions) Ollama running where the code expects it—or set host/model in the environment.

**Run:** `npm run server` for the API, `npm run dev` for the website, or `npm run dev:all` for both.
