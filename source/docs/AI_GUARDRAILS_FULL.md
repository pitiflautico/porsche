# Porsche Reunions MVP — AI Agent Guardrails

Version 1.0
Status: Frozen for Sprint Execution

This document defines non-negotiable constraints for AI agents working on the Porsche Reunions MVP.

It overrides any optimization, simplification, or best-practice suggestion that conflicts with it.

---

# 1. Language

All documentation, commit messages, and source code comments must be in **English**. AI agents must not produce or suggest content in another language for these artifacts.

**Exception:** `docs/DELIVERY_LOG.md` is kept in **Spanish** for client/agency; when creating or updating that file, write its content in Spanish.

**Indentation:** Use **2 spaces** only (no tabs) for all code. Tab size = 2.

---

# 2. Project Identity

This project is:

A moderated campaign-based platform. Story submissions are collected by the **Storystream** external widget (embedded on the homepage and via a modal). Published stories are displayed by Storystream's own widget. The agency manually uploads gallery photos into Sanity CMS. Sanity is the only data source for the frontend (gallery photos only).

It is NOT:

- A registry
- A social network
- A marketplace
- A login system
- A dashboard application
- A user account platform

There are NO user accounts.
There is NO authentication for public users.
There is NO profile editing.

---

# 3. Architecture Is Fixed

Do NOT introduce alternative stacks.

Approved stack:

- Astro (frontend, SSG only)
- Sanity (CMS — `galleryPhoto` only)
- Netlify (hosting)
- Cloudflare (rate limiting at edge)
- Storystream (external widget for story submission and display; no in-app form; no submission API)

No transactional email. This platform does not send emails.

Do NOT introduce:

- Additional frameworks
- Alternative CMS
- ORM layers
- SQL databases
- Auth systems
- Third-party analytics
- Extra background workers

Architecture must remain minimal.

---

# 4. Non-Negotiable Business Rules

Submissions are not processed by this application. They are collected externally by Storystream. AI agents must NOT introduce submission APIs or frontend submission processing.

For content in Sanity (`galleryPhoto`):

1. No auto-publish.
2. Publication requires manual upload by the agency in Sanity Studio.
3. Photo visibility is controlled via the `visible` field only.

---

# 5. Security Layer

- Rate limiting (Cloudflare at edge) where applicable.
- No submission API; no in-app form that processes submissions. Submission collection is handled entirely by the Storystream external widget.

---

# 6. No Email Sending

This platform does not send transactional or notification emails. AI agents must not introduce email-sending logic or Resend (or any email provider).

---

# 7. Moderation Is Manual Only

AI agents must NOT introduce:

- Auto-publish logic
- Auto-approval
- User self-publication
- Workflow automation beyond webhook

All content requires human moderation.

---

# 8. Gallery and Stories Constraints

The homepage Gallery section (`#gallery`) displays `galleryPhoto` documents from Sanity. Do NOT introduce:

- Submission-based story cards
- Filter by country (removed — no longer needed)
- VIN logic
- Ranking or sorting by popularity
- Comments, likes, or user interaction

The homepage Stories section (`#stories`) displays the Storystream embed. Do NOT replace or wrap the Storystream widget with custom-built story display logic.

---

# 9. What AI Must Never Introduce

Do NOT introduce:

- Login systems
- JWT tokens
- Sessions
- User profiles
- Account management
- Social features
- Engagement metrics
- Gamification
- Marketplace logic
- Background cron jobs
- Queue systems
- Microservices

Keep the system simple and linear.

---

# 10. Performance Philosophy

Prefer:

- Simplicity
- Clarity
- Deterministic logic
- Explicit validation

Do NOT:

- Over-abstract
- Over-engineer
- Introduce premature optimization
- Refactor architecture

This is a 2-week MVP.

---

# 11. Scope Freeze Rule

During MVP sprint:

AI agents must NOT suggest:

- New filters
- Export systems
- Backup systems
- Analytics dashboards
- UI redesign
- Additional states
- Schema expansion

If a feature is not explicitly defined in the Master Technical Specification,
it must not be added.

---

End of AI Guardrails.
