# Porsche Reunions — There Is No Substitute

A moderated campaign-based platform where Porsche owners share their car and personal story under the theme **"There Is No Substitute."**

---

## What It Is

Porsche owners submit their vehicle and story through the **Storystream widget** — embedded directly on the homepage Stories section and via a modal ("Escribe tu historia") triggered from the nav and CTAs. Storystream handles collection externally; the agency manually reviews submissions and uploads approved content to Sanity Studio. The frontend reads exclusively from Sanity.

**It is not:**

- A registry
- A social network
- A marketplace
- A login system
- A form processor — this repo does not handle submissions

---

## Stack

| Layer                    | Solution                          |
| ------------------------ | --------------------------------- |
| Frontend + SSG           | Astro                             |
| CMS                      | Sanity (Content Lake + Studio)    |
| Hosting                  | Netlify                           |
| Story submission intake  | Storystream (external widget JS)  |

**No email sending:** This platform does not send transactional or notification emails.

---

## Architecture

```
Storystream widget (embedded on homepage)
  → user submits story directly to Storystream
  → agency reviews in Storystream dashboard
  → agency manually uploads approved content to Sanity Studio
  → frontend reads from Sanity (read-only)
```

The frontend has no submission API, no form handling, no image upload, and no authentication. All content is sourced from Sanity.

See [`docs/services/STORYSTREAM_INTEGRATION.md`](./docs/services/STORYSTREAM_INTEGRATION.md) for full integration details.

---

## Features

### Stories Section (homepage)

- Storystream embed (`#stry-wrapper`) displays published stories
- Loaded via IntersectionObserver for performance
- CTA opens the Storystream submission widget via a modal

### Gallery Section (homepage)

- Displays event/reunion photos from Sanity (`galleryPhoto` document type)
- Managed via drag-and-drop ordering in Sanity Studio
- Captions in ES and EN

### Admin (Sanity Studio)

- Manage `galleryPhoto` documents (upload, caption, order, visibility)
- Manual publish only — no auto-publish

---

## Rendering Strategy

| Page | Strategy                     |
| ---- | ---------------------------- |
| Home | Static Site Generation (SSG) |

---

## CMS Data Model

The only Sanity document type is `galleryPhoto`:

```
photo, caption (ES), caption_en (EN), date, visible, orderRank
```

Photos are uploaded and managed manually by the agency in Sanity Studio.

---

## Project Structure

Monorepo: frontend (Astro) and CMS (Sanity) in separate folders.

```
/
├── frontend/                  # Astro (landing page)
│   ├── src/
│   ├── astro.config.mjs
│   └── package.json
├── cms/                       # Sanity Studio (gallery photo management)
│   ├── schemas/
│   ├── sanity.config.ts
│   └── package.json
├── docs/
│   └── ...
├── .gitignore
├── package.json               # Workspaces: frontend, cms
└── README.md
```

**Scripts (from root):**

| Command | Description |
| -------- | ----------- |
| `npm run dev` / `npm run dev:web` | Astro dev server |
| `npm run dev:cms` | Sanity Studio dev |
| `npm run build` | Build both |
| `npm run build:web` | Build frontend only |
| `npm run build:cms` | Build CMS only |

---

## Environment Variables

```env
# Sanity (required)
PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=
```

> `SANITY_API_TOKEN` is only needed for CMS scripts, not by the frontend.
> `PUBLIC_SAAS_FORM_URL` has been removed — Storystream is hardcoded in the components.

For Netlify: **[docs/NETLIFY_ENV.md](./docs/NETLIFY_ENV.md)**.

---

## Documentation

All authoritative documentation lives in [`/docs`](./docs/README.md).

| Document                                                              | Purpose                                           |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| [Master Technical Spec](./docs/PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md)         | Architecture, rules, data model                  |
| [Storystream Integration](./docs/services/STORYSTREAM_INTEGRATION.md) | How the Storystream widgets are integrated        |
| [Netlify Env](./docs/NETLIFY_ENV.md)                                  | Environment variables for Netlify deploys         |
| [Sprint Plan](./docs/PORSCHE_REUNIONS_SPRINT_PLAN_MVP.md)                         | Epics, tickets, definition of done (historical)   |
| [AI Guardrails](./docs/AI_GUARDRAILS.md)                              | Constraints for AI agents working on this project |
| [Developer Operating Mode](./docs/DEVELOPER_OPERATING_MODE.md)        | Team operating rules during sprint                |

> If a conflict exists between documents, the Master Technical Specification prevails.
