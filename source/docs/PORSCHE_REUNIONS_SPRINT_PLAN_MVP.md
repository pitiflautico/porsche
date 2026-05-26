# Porsche Reunions — MVP Sprint Plan

Duration: 2 Weeks (10 Working Days)
Status: Soft Launch Scope

---

# Sprint Objective

Deliver a fully functional, moderated campaign platform in 2 weeks. Submissions are collected by a third-party SaaS form (iframe); the agency manually uploads selected submissions into Sanity. Sanity is the only data source for the frontend.

Success means:

- Moderation works (content entered manually in Sanity)
- Gallery displays approved content
- Security active

No email sending. This platform does not send transactional or notification emails.

Nothing beyond this defines success.

---

# EPIC 1 — Setup & Infrastructure

## Ticket 1 — Initialize Astro Project

- Setup Astro project (SSG + SSR adapter for gallery SSR)
- Configure environment variables
- Deploy staging (Vercel or Cloudflare Pages)

## Ticket 2 — Setup Sanity CMS

- Create project
- Configure schema base
- Deploy Studio

(No Resend/email setup. This platform does not send emails. No submission API; submissions are external and manually entered in Sanity.)

---

# EPIC 2 — CMS & Schema

## Ticket 4 — Implement Submission Schema

Fields defined in Master Spec.

## Ticket 5 — CMS Moderation View

- List submissions
- Filter by status
- Filter by vin_duplicate_flag
- Search by VIN/email

---

# EPIC 3–4 — Submit page: iframe/embed only (no API)

The **Submit page** (`/submit/`, `/en/submit/`) displays the external SaaS form via `<iframe>`. No submission API, no in-app form. The page URL and file are retained; only its content was changed to embed the external form. The agency manually uploads selected submissions into Sanity.

---

# EPIC 5 — Email Workflows (out of scope)

No email sending. If a publish webhook is used, it is only for gallery revalidation, not for sending emails.

---

# EPIC 6 — Public Gallery

## Ticket 14 — Gallery Page

- Show published only
- Card layout

## Ticket 15 — Country Filter

- Filter via URL param

## Ticket 16 — VIN Connection (Simple)

- If duplicate VIN published
- Show simple link block

---

# EPIC 7 — QA & Deploy

## Ticket 17 — Functional QA

Test:

- Publish flow (if webhook used for revalidation)
- Gallery rendering from Sanity
- Security checks

## Ticket 18 — Production Deploy

- Environment setup
- Final validation
- Go live

---

# Scope Freeze Rules

During sprint:

- No new features
- No additional filters
- No export systems
- No backup systems
- No UI expansion
- No architectural changes

If not in this document, it is out of scope.

---

# Definition of Done

The MVP is done when:

- Moderation works (content in Sanity)
- Gallery renders correctly from Sanity
- Security is active

(No email sending. No submission API.)

---

End of Sprint Plan.
