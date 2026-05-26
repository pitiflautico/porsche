# Storystream — Integration Reference

## What is Storystream

[Storystream](https://storystream.ai) is an external SaaS service that handles story collection and display. It is integrated via JavaScript widgets that the provider serves from their own CDN. This repository **does not process submissions** — the widgets deliver submissions directly to the Storystream platform. The agency reviews them there, then manually uploads approved stories to Sanity if needed for other uses.

---

## Two widgets, two purposes

There are two separate Storystream widgets integrated in this project, each with a different script token:

| Widget | Script token | Location | Loads when |
|--------|-------------|----------|------------|
| **Submission** | `MjM1MTlmY2RjODg2NmU1MTI5` | `SubmitModal.astro` | User opens the modal ("Escribe tu historia") |
| **Published stories** | `NTU2NmUyMDU2YzMxYTQ3NTZm` | `Stories.astro` | Stories section enters the viewport |

Both widgets render inside a `<div id="stry-wrapper"></div>` mount point. Storystream initializes and mounts into that element automatically when the script runs.

---

## Widget A — Submission modal

### Flow

```
User clicks "Escribe tu historia" (nav or Stories section CTA)
  → SubmitModal opens (GSAP animation)
  → Storystream submission script injected into <body> (first time only)
  → Widget mounts inside #stry-wrapper in the modal
  → User submits story directly to Storystream
```

### Files involved

| File | Role |
|------|------|
| `frontend/src/components/SubmitModal/SubmitModal.astro` | Modal container with `#stry-wrapper` + lazy load logic |
| `frontend/src/components/SubmitModal/submit-modal.scss` | Modal dimensions and `#stry-wrapper` sizing |
| `frontend/src/layouts/BaseLayout.astro` | Mounts `<SubmitModal>` on every page |
| `frontend/src/components/Header/Header.astro` | "Escribe tu historia" button (`data-open-submit-modal`) |
| `frontend/src/components/sections/Stories/Stories.astro` | CTA button (`data-open-submit-modal`) |

### Lazy load logic (SubmitModal.astro)

The script is injected **only on first modal open**:

```js
let storyStreamLoaded = false;

function loadStoryStream() {
  if (storyStreamLoaded) return;
  storyStreamLoaded = true;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://apps.storystream.ai/app/js/ZGNiZDg4ZTdkMjI1ZjgxY2Y4.js";
  document.body.appendChild(script);
}
```

### Modal dimensions

| Device | Modal size |
|--------|------------|
| Desktop | `min(95vw, 880px)` × `min(85vh, 780px)` |
| Mobile (`< $bp-sm`) | `100vw` × `100dvh` (full screen) |

`#stry-wrapper` fills 100% of the modal container via `submit-modal.scss`.

### Triggers

Any element with `data-open-submit-modal` opens the modal on click. Current triggers:

1. **Header nav** — `Header.astro`: "Escribe tu historia" button
2. **Stories section CTA** — `Stories.astro`: "Comparte tu historia" / "Submit my story" button

To add a new trigger anywhere on the page:

```html
<button type="button" data-open-submit-modal>Escribe tu historia</button>
```

---

## Widget B — Published stories section

### Flow

```
User scrolls to the Stories section (#stories)
  → IntersectionObserver detects section entering viewport (200px margin)
  → Storystream published stories script injected into <body> (first time only)
  → Widget mounts inside #stry-wrapper in the Stories section
  → Published stories are displayed inline on the homepage
```

### Files involved

| File | Role |
|------|------|
| `frontend/src/components/sections/Stories/Stories.astro` | Section container with `#stry-wrapper` + IntersectionObserver lazy load |
| `frontend/src/components/sections/Stories/stories.scss` | Section layout and `#stry-wrapper` sizing |

### Lazy load logic (Stories.astro)

```js
let loaded = false;

function loadStoryStream() {
  if (loaded) return;
  loaded = true;
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.src = "https://apps.storystream.ai/app/js/NTU2NmUyMDU2YzMxYTQ3NTZm.js";
  document.body.appendChild(script);
}

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadStoryStream();
      observer.disconnect();
    }
  },
  { rootMargin: "200px" }
);
observer.observe(wrapper);
```

---

## Updating a script token

If Storystream changes a URL or the client changes account, update the token in one place per widget:

**Submission widget** → `frontend/src/components/SubmitModal/SubmitModal.astro`, `loadStoryStream()`:
```js
script.src = "https://apps.storystream.ai/app/js/ZGNiZDg4ZTdkMjI1ZjgxY2Y4.js";
```

**Published stories widget** → `frontend/src/components/sections/Stories/Stories.astro`, `loadStoryStream()`:
```js
script.src = "https://apps.storystream.ai/app/js/NTU2NmUyMDU2YzMxYTQ3NTZm.js";
```

No environment variables control these URLs — they are hardcoded intentionally because they do not vary between environments.

---

## Environments

No environment variables are required for either Storystream integration. Both scripts are identical in local, staging, and production.

---

## What this repository does NOT do

- Does not send submissions to any internal backend.
- Does not process form data.
- Does not authenticate users.
- Does not store anything related to story submissions.
- Does not read stories from Sanity — stories are displayed by Storystream itself.

All submission collection and story display is managed externally by Storystream. See `docs/PORSCHE_REUNIONS_MASTER_TECHNICAL_SPEC.md` §4 for the full flow.
