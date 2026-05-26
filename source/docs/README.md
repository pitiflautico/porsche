# Porsche Reunions — Documentation Index

Status: Active

This folder contains the official documentation for the Porsche Reunions platform.

Only the documents listed below are active and authoritative.

---

# Active Documents (Single Source of Truth)

1. **PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md**
   → Defines architecture, rules, CMS model, and constraints. Storystream handles submission collection and story display externally; the agency manually enters gallery photos in Sanity; no email sending.

2. **services/STORYSTREAM_INTEGRATION.md**
   → Documents both Storystream widgets (submission modal + published stories section), their script tokens, lazy load logic, and how to update them.

3. **PORSCHE_REUNIONS_SPRINT_PLAN_MVP.md**
   → Defines sprint scope, tickets, and definition of done. *(Historical — some features have since been replaced.)*

4. **AI_GUARDRAILS.md**
   → Defines constraints for AI agents (Claude, GPT, Copilot).

5. **DEVELOPER_OPERATING_MODE.md**
   → Defines how the team must operate during sprint execution.

These documents override all previous documentation.

If a conflict exists, the Master Technical Spec prevails.

---

# Setup and Reference Guides

- **NETLIFY_ENV.md**
  → Environment variables required for Netlify deploys.

- **DATASETS_AND_SCHEMAS.md**
  → Sanity datasets and `galleryPhoto` schema reference.

- **AGENT_SKILLS.md**
  → How to supply skills (`.md`) for Cursor/Claude and where to put them (`.agents/skills/`).

- **PRODUCTION_CHECKLIST.md**
  → Notes and tasks for production.

- **ai-discovery/**
  → SEO / social / structured data (JSON-LD) for crawlers and LLMs; code-side only, no user-facing FAQ UI. See `ai-discovery/README.md`.

---

# Archived Documentation

Folders:

- /\_archive
- /\_archive_registry_model

These contain historical and conceptual documents from earlier project phases.

They are preserved for context only.

They must NOT be used for:

- Architectural decisions
- Feature implementation
- Business rule interpretation
- Sprint execution

The current platform is NOT a registry.

---

# Scope Freeze Rule

If a feature is not defined in:

- PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md
- PORSCHE_REUNIONS_SPRINT_PLAN_MVP.md

It is out of scope.

---

End of Documentation Index.
