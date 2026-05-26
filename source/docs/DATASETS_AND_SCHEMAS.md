# Sanity — Datasets and Schemas (TINS)

Reference for datasets and CMS schema. The data model is defined in [PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md §8](./PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md#8-cms--galleryphoto-schema).

---

## 1. Datasets

Datasets are created in [sanity.io/manage](https://sanity.io/manage) → your project → **Project settings** → **API** → **Datasets**.

| Dataset | Recommended use |
|---------|-----------------|
| `production` | Live content. Use for the public site and production Studio. |
| `staging` | (Optional) Testing and integration. Same schema; test data. |

For the MVP, **one dataset** (e.g. `production`) is enough. Project ID and dataset name are set in `.env`.

Datasets are not created in code; define them in the Sanity console and reference them in `.env`.

---

## 2. Document type: galleryPhoto

The only document type in this project. Displays event/reunion photos in the homepage Gallery section.

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| photo | image | Yes | Photo asset (hotspot enabled, accepts JPEG/PNG/WEBP) |
| caption | string | No | Caption in Spanish |
| caption_en | string | No | Caption in English. If empty, the Spanish caption is shown. |
| date | date | No | Photo date (defaults to today) |
| visible | boolean | No | Uncheck to hide from frontend without deleting. Defaults to `true`. |
| orderRank | string | — | Managed by `@sanity/orderable-document-list` plugin for drag-and-drop ordering |

### Studio view

The Studio shows `galleryPhoto` documents in a drag-and-drop orderable list. Each item previews:

- **Title:** caption (or caption_en, or "Untitled photo")
- **Subtitle:** "Visible" or "Hidden"
- **Thumbnail:** photo

### Frontend behavior

- Only photos with `visible != false` are fetched (`GALLERY_PHOTOS_QUERY`)
- Ordered by `orderRank`
- If `caption_en` is present and locale is `en`, the EN caption is shown; otherwise the ES caption is used
- Fetched at build time (SSG)

---

## 3. Where the schema lives in the repo

- **galleryPhoto type definition:** `cms/schemas/gallery.ts`
- **Type registration:** `cms/schemas/index.ts`
- **Studio structure:** `cms/sanity.config.ts`

Restart the Studio after changing schemas (`npm run dev:cms`).

---

## 4. What was removed

The `submission` document type (owner story submissions) has been removed from this codebase. Stories are now collected and displayed entirely via the **Storystream** external service. See `docs/services/STORYSTREAM_INTEGRATION.md`.

The `cms/scripts/seed-examples.mjs` seed script has also been removed.
