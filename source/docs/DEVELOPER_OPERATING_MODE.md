# Porsche Reunions MVP — Developer Operating Mode

Version 1.0
Status: Active During Sprint
Duration: 2 Weeks
Scope: Strict MVP

This document defines how the development team must operate during the MVP sprint.

It protects timeline, architecture, and delivery integrity.

---

# 1. Sprint Objective

Deliver a fully functional, moderated campaign platform in 2 weeks. Submissions are collected by a third-party SaaS form (iframe); the agency manually uploads selected submissions into Sanity. Sanity is the only data source for the frontend.

Not feature-complete. Not optimized. Not scalable for millions. Stable and correct.

Success is defined as:

- Content is manually entered in Sanity; moderation works
- Gallery displays approved items
- System is secure

No email sending. This platform does not send transactional or notification emails.

Nothing else defines success.

---

# 1.1 Language (English only)

All of the following must be in **English**:

- **Documentation** (all `.md` files in `docs/` and the repo)
- **Commit messages** (see §5.1 for style)
- **Source code comments** (in-code comments, JSDoc, docstrings)

**Exception:** `docs/DELIVERY_LOG.md` is kept in **Spanish** for client and agency readability. All other docs remain in English.

---

# 1.2 Indentation (spaces only)

Use **2 spaces** for indentation. No tabs.

- Applies to all source code (e.g. TypeScript, JavaScript, Astro, SCSS, JSON, YAML) and to any generated or edited code in this repo.
- Editors and formatters should be set to **Insert spaces: yes**, **Tab size: 2**.

---

# 2. Scope Discipline

During MVP sprint:

- No new features are added.
- No improvements are made unless they fix blockers.
- No architectural refactors are allowed.
- No speculative optimizations.
- No UX polishing beyond functionality.

If it is not in the Sprint Plan, it does not exist.

---

# 3. Decision Rule

If a decision arises that is not defined:

Choose the simplest implementation that:

- Respects the AI Guardrails
- Respects the Master Technical Spec
- Does not expand scope
- Does not introduce new dependencies

Avoid elegant complexity.
Prefer explicit simplicity.

---

# 4. Architecture Freeze

The following are frozen:

- Astro
- Sanity
- Vercel or Cloudflare Pages
- Cloudflare (rate limiting)
(No in-app submission form. No Resend or email sending.)

Do not introduce:

- New libraries
- State managers
- ORMs
- Background workers
- Extra infra services

No stack changes mid-sprint.

---

# 5. Code Philosophy

During MVP:

Prefer:

- Explicit logic
- Clear conditionals
- Straightforward functions
- Minimal abstraction

Avoid:

- Generic reusable frameworks
- Complex hooks
- Premature optimization
- “Future proof” patterns

Clarity > Cleverness.

---

# 5.1 Git commit messages

Applies to both humans and AI agents when committing to this repo:

- **Language:** Always write commit messages in English.
- **Style:** Be concise and to the point; no need for long prose.
- **Summary line:** Short, professional subject (imperative), e.g. `Update gallery filter logic`.
- **Body (optional):** If needed, use 1–3 bullet points rather than paragraphs to explain key changes.
- **Focus:** Describe what changed and why at a high level, not step‑by‑step implementation details.

---

# 6. Security Is Mandatory

Security measures are not optional.

Even in MVP:

- Rate limiting (Cloudflare at edge) stays for public endpoints (e.g. gallery SSR, webhooks).
- Server-side validation stays where applicable (e.g. gallery SSR, any server routes).
- File validation stays where applicable (e.g. any server-side file handling).

Security is not considered “polish”.

---

# 7. Testing Approach

We are not building full test coverage.

But we must manually validate:

- Publish webhook (if used for gallery revalidation)
- Gallery rendering from Sanity

If a rule is not tested, it is considered broken.

---

# 8. Communication Protocol

During sprint:

- Daily 10-minute sync
- Blockers identified immediately
- No silent refactors
- No undocumented changes

If a rule is modified, it must be documented.

---

# 9. Definition of Done (MVP)

Feature is considered done only if:

- It works end-to-end
- It respects business rules
- It does not break security
- It does not introduce scope creep
- It does not degrade performance

---

# 10. Anti-Scope-Creep Rule

If someone says:

“While we are here, we could also…”

The answer is:

“After MVP.”

---

# 11. Post-MVP Improvements (Not Now)

The following are explicitly postponed:

- Airtable backup
- CSV export
- Advanced filters
- Premium VIN UI
- Monitoring systems
- Hardening beyond MVP

These will be evaluated in Phase 2.

---

# 12. MVP Mindset

This sprint is about:

- Delivery
- Stability
- Control
- Discipline

Not perfection.

Not elegance.

Not expansion.

---

End of Developer Operating Mode.
