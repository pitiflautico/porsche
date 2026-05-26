# Porsche Reunions MVP — AI Guardrails (Core)

Status: Active for Sprint Execution

These rules override any optimization or suggestion from the AI.

---

## 1. Language

- Code, comments, and commits → English
- `docs/DELIVERY_LOG.md` → Spanish only
- Indentation → 2 spaces (no tabs)

---

## 2. Core Architecture (Fixed)

Allowed stack only:

- Astro (SSG)
- Sanity (galleryPhoto only)
- Netlify
- Cloudflare (rate limiting)
- Storystream (external widget)

Do NOT introduce:

- Auth systems
- APIs for submissions
- Databases / ORM
- Additional frameworks
- Email systems
- Background jobs

---

## 3. Business Rules

- No user accounts
- No authentication
- No submission logic (handled by Storystream)
- No auto-publish
- Manual moderation only
- Sanity controls gallery visibility via `visible`

---

## 4. Content Constraints

Gallery (`#gallery`):

- Source → Sanity only
- No filters, ranking, or interactions

Stories (`#stories`):

- Use Storystream embed only
- Do not replace or extend

---

## 5. Forbidden Features

Never introduce:

- Login / sessions / JWT
- Profiles or user data
- Comments, likes, engagement
- Analytics dashboards
- Marketplace features
- Cron jobs / queues / microservices

---

## 6. Development Philosophy

Prefer:

- Simplicity
- Explicit logic
- Minimal code

Avoid:

- Over-engineering
- Abstractions
- Architecture changes

---

## 7. Scope Freeze

Do NOT add:

- New features not in spec
- Filters, exports, backups
- UI redesigns
- Schema changes

If not defined → do not build

---

End of Guardrails