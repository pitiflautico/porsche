# Agent Skills (Cursor / Claude / Codex)

How to supply skills (`.md`) and where to put them in this project. Based on the [Agent Skills](https://agentskills.io/) standard and [Cursor docs](https://cursor.com/docs/context/skills).

---

## 1. What are skills

A **skill** is a versioned package that teaches the agent (Cursor, Claude, etc.) how to do specific tasks: project conventions, workflows (commits, deploy), or script usage. They are applied when the agent decides the task matches the skill description, or manually via `/skill-name` in Agent chat.

---

## 2. Where to put skills

This project uses **`.agents/skills/`** only. Cursor and other agents that support the standard load from this directory (Cursor also reads `.cursor/skills/`; we use `.agents/` so one folder works for Cursor and Claude).

| Location | Scope |
|----------|--------|
| **`.agents/skills/`** | Project (use this) |
| `~/.cursor/skills/` or `~/.agents/skills/` | User (global) |

Run `npx add-skill` or `npx skills add` from the **repo root**; the CLI will install into `.agents/skills/` or the appropriate agent folder.

---

## 3. Skill structure

Each skill is a **folder** with a required **`SKILL.md`** file:

```
.agents/skills/
└── skill-name/
    └── SKILL.md
```

Optionally:

```
.agents/skills/
└── skill-name/
    ├── SKILL.md
    ├── scripts/      # Executables the agent can run
    ├── references/    # Extra docs (loaded on demand)
    └── assets/       # Templates, configs, etc.
```

The **folder name** must match the frontmatter `name` (lowercase, numbers, hyphens only).

---

## 4. `SKILL.md` format

The file must have **YAML frontmatter** with at least `name` and `description`:

```markdown
---
name: skill-name
description: Short description of what this skill does and when to use it. The agent uses this to decide relevance.
---

# Skill name

Detailed instructions for the agent.

## When to Use

- Use this skill when...
- Helpful for...

## Instructions

- Step-by-step guidance
- Project conventions
- Best practices
```

### Frontmatter fields (Cursor)

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Identifier. Lowercase, numbers, hyphens. Must match the folder name. |
| `description` | Yes | What the skill does and when to use it; used by the agent for relevance. |
| `disable-model-invocation` | No | If `true`, the skill is only applied when you explicitly invoke `/skill-name`. |
| `license`, `compatibility`, `metadata` | No | Optional. |

---

## 5. Adding a skill in this project

1. Create the folder under **`.agents/skills/`** (at repo root).
2. Add **`SKILL.md`** with frontmatter and markdown content.
3. Optionally add `scripts/`, `references/`, or `assets/`.
4. Commit the skill folder so the whole team and agents have it.

Example layout:

```
app/
├── .agents/
│   └── skills/
│       └── tins-commit-style/
│           └── SKILL.md
├── docs/
│   └── AGENT_SKILLS.md
└── ...
```

---

## 6. Viewing skills in Cursor

In Cursor: **Settings** (Cmd+Shift+J / Ctrl+Shift+J) → **Rules** → **Agent Decides**. Installed skills appear there. You can also invoke a skill by typing **`/skill-name`** in Agent chat.

---

## 7. References

- [Agent Skills | Cursor Docs](https://cursor.com/docs/context/skills)
- [agentskills.io](https://agentskills.io/) — open standard

## Usage Guidelines (Important)

- Do not chain multiple skills in the same task unless strictly necessary.
- Prefer a single skill per task to reduce context size and improve response quality.
- Skills should be used for execution, not general thinking.