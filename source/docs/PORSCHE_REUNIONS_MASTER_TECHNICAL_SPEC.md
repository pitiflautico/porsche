# Porsche Reunions Platform — Master Technical Specification

Version 4.0
Status: Final Approved Architecture
Single Source of Technical Truth

---

# 1. Overview

The Porsche Reunions Platform is a moderated campaign-based platform. Submissions are **not** collected or processed by this application: the **Storystream** widget (embedded on the homepage) collects them externally. The agency manually uploads selected submissions into Sanity CMS. **Sanity is the only data source for the frontend.** Theme:

"There Is No Substitute."

The platform includes:

- Campaign Landing Page
- Stories section with Storystream embed (submission widget + published stories display)
- Gallery section with event/reunion photos from Sanity
- Admin content management (Sanity Studio — `galleryPhoto` documents only)

**No email sending:** This platform does not send transactional or notification emails at any time.

This is NOT:

- A registry
- A social network
- A marketplace
- A login system

All content requires manual moderation before publication.

---

# 2. Core Stack

| Layer                  | Solution                |
| ---------------------- | ----------------------- |
| Frontend + SSG         | Astro                   |
| CMS                    | Sanity (Content Lake + Studio) |
| Hosting                | Netlify                        |
| Story submission intake | Storystream (external widget JS) |

No in-app form that processes submissions; no submission API. Submission collection is handled entirely by Storystream externally.

---

# 3. Rendering Strategy

Landing (all pages):

- Static Site Generation (SSG)

Images:

- Sanity CDN

---

# 4. Submission Flow

There are two Storystream widgets on the site, each with a different script token:

**Widget A — Submission (modal)**
Triggered when the user clicks "Escribe tu historia" (nav button or Stories section CTA). Opens `SubmitModal`, which lazy-loads the Storystream submission widget on first open.

**Widget B — Published stories (Stories section embed)**
Embedded directly in the `#stories` section on the homepage. Loads via IntersectionObserver when the section enters the viewport. Displays published stories from Storystream.

Neither widget processes data in this application. See `docs/services/STORYSTREAM_INTEGRATION.md` for full implementation details.

---

# 5. Business Rules (Non-Negotiable)

For content in Sanity (`galleryPhoto`):

1. No auto-publish.
2. Publication requires manual upload by the agency in Sanity Studio.
3. Photo visibility is controlled via the `visible` boolean field.

---

# 6. API / Security

No submission API exists. Rate limiting (Cloudflare at edge) applies where applicable.

---

# 7. Email Workflows

**No email sending.** This platform does not send transactional or notification emails.

---

# 8. CMS — galleryPhoto Schema

The only Sanity document type is `galleryPhoto`. It displays event/reunion photos in the homepage Gallery section.

Fields:

| Field | Type | Description |
|-------|------|-------------|
| photo | image | The photo (hotspot enabled) |
| caption | string | Caption in Spanish |
| caption_en | string | Caption in English (fallback to ES if empty) |
| date | date | Photo date |
| visible | boolean | Toggle visibility without deleting |
| orderRank | string | Drag-and-drop ordering via `@sanity/orderable-document-list` |

Studio features:

- Drag-and-drop ordering
- Visibility toggle (hide without deleting)
- Caption in both languages

---

# 9. Public Gallery Section (homepage)

The homepage Gallery section (`#gallery`) displays `galleryPhoto` documents from Sanity:

- Only visible photos (`visible != false`)
- Ordered by `orderRank` (drag-and-drop in Studio)
- Caption shown in EN or ES depending on locale
- Fetched at build time (SSG)

There is no standalone `/gallery` page.

---

# 10. Stories Section (homepage)

The homepage Stories section (`#stories`) contains:

- Copy (subtitle, tagline)
- CTA button → opens the Storystream submission modal
- Storystream published stories embed (`#stry-wrapper`)

The embed is loaded via `IntersectionObserver` when the section enters the viewport.

See `docs/services/STORYSTREAM_INTEGRATION.md` for script tokens and implementation details.

---

# 11. Error Handling

System must log critical failures where applicable (e.g. Sanity SSG fetch). No submission API in this codebase.

---

# 12. Constraints

This platform must remain:

- Moderated
- Editorial
- Non-social
- Non-commercial
- Login-free

No additional features during MVP.

---

End of Master Technical Specification.
