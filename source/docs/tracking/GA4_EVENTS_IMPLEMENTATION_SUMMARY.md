# GA4 Event Tracking — Implementación (Porsche Reunions)

> **Resumen corto para agencia / QA:** ver [`AGENCY_GA4_SUMMARY.md`](./AGENCY_GA4_SUMMARY.md).

## Contexto
- Sitio one-page bilingüe: ES por defecto (`/`) y EN (`/en`).
- Measurement ID GA4: `G-VDKT3GY3Z3`.
- Regla aplicada: cada evento nuevo dispara **GA4 (`gtag`) + Floodlight (`window.floodlight`) en el mismo handler**.
- `page_view` no se implementó manualmente (lo maneja `gtag('config')` en `Head.astro`).

## Archivos modificados
- `frontend/src/components/Header/Header.astro`
- `frontend/src/layouts/BaseLayout.astro`
- `frontend/src/components/sections/Stories/Stories.astro`
- `frontend/src/components/sections/Reunions/Reunions.astro`
- `frontend/src/components/sections/Gallery/Gallery.astro`
- `frontend/src/components/SubmitModal/SubmitModal.astro`

---

## Eventos implementados

### 1) `nav_click`
- **Ubicación:** `Header.astro`
- **Trigger:** click en links del menú lateral (`.nav-side__link`), excluyendo selector de idioma.
- **GA4:** `event: 'nav_click'`, `click_element: 'nav_[item]'`
- **Floodlight:** `trackClick('nav_[item]')`
- **Detalle:** `item` se deriva del hash (`#reunions`, `#gallery`, etc.) o de `data-label` (email).

### 2) `locale_change`
- **Ubicación:** `Header.astro`
- **Trigger:** click en `.nav-side__link--language`
- **GA4:** `event: 'locale_change'`, `language: 'en'|'es'` (desde `hreflang`)
- **Floodlight:** `trackClick('locale_change')`

### 3) `section_view`
- **Ubicación:** `BaseLayout.astro`
- **Trigger:** `IntersectionObserver` con `{ threshold: 0, rootMargin: "0px 0px -40% 0px" }` sobre elementos `[data-section]`
- **GA4:** `event: 'section_view'`, `section_name: '[value]'`
- **Floodlight:** `trackClick('section_view_[value]')`
- **Control de duplicados:** se usa `unobserve()` tras el primer disparo por sección.
- **Nota:** el `rootMargin` garantiza que secciones muy altas (como Reunions) también disparen al hacer scroll, sin depender de que un % del elemento sea visible.

### 4) `open_modal` + `cta_click`
- **Ubicación:** `Header.astro` y `Stories.astro`
- **Trigger:** botones con `data-open-submit-modal` (Header CTA "Escribe tu historia" y Stories CTA "Comparte tu historia")
- **GA4:** dispara dos eventos en el mismo handler: `open_modal` y `cta_click`, ambos con `click_element: 'modal_submit_story'`
- **Floodlight:** `trackClick('modal_submit_story')` y `trackClick('cta_click_modal_submit_story')`
- **Nota:** `cta_click` es un alias de `open_modal` para compatibilidad con la nomenclatura de la agencia.

### 5) `story_slide_change`
- **Ubicación:** `Stories.astro`
- **Trigger:** flechas de Storystream (`#stry-hub-carousel-left` / `#stry-hub-carousel-right`)
- **Implementación async:** `MutationObserver` sobre `#stry-wrapper`, porque Storystream inyecta DOM después.
- **GA4:** `event: 'story_slide_change'`, `direction: 'prev'|'next'`
- **Floodlight:** `trackClick('story_slide_change_prev'|'story_slide_change_next')`
- **Control de listeners:** observer se desconecta al encontrar ambas flechas.

### 6) `video_open`
- **Ubicación:** `Reunions.astro` (`openModal()`)
- **Trigger:** click del CTA que abre modal de video
- **GA4:** `event: 'video_open'`, `click_element: 'video_reunions'`
- **Floodlight:** `trackVideo('video_reunions', 'start')`
- **Reset de sesión de video:** se limpian milestones al abrir.

### 7) `video_progress`
- **Ubicación:** `Reunions.astro`
- **Trigger:** progreso del player YouTube (polling en loop + estado `ENDED`)
- **GA4:** `event: 'video_progress'`, `click_element: 'video_reunions'`, `video_milestone`
- **Floodlight:** `trackVideo('video_reunions', milestone)`
- **Milestones:** `25%`, `50%`, `75%`, `complete`
- **Control de duplicados:** cada milestone dispara una sola vez por apertura de modal.

### 8) `video_close`
- **Ubicación:** `Reunions.astro` (`closeModal()`)
- **Trigger:** cierre del modal de video
- **GA4:** `event: 'video_close'`, `click_element: 'video_reunions'`
- **Floodlight:** `trackClick('video_reunions_close')`
- **Comportamiento adicional:** el player se pausa al cerrar.

### 9) `person_audio_play`
- **Ubicación:** `Reunions.astro`
- **Trigger:** (a) click en botón play del tooltip/modal de persona; (b) autoplay al hacer click en un capítulo
- **GA4:** `event: 'person_audio_play'`, `click_element: 'audio_[person_id]'`
- **Floodlight:** `trackClick('audio_[person_id]')`
- **Derivación de ID:** se toma nombre de persona (`data-name`) y se normaliza:
  - Unicode NFD + remoción de diacríticos (ej. `ó` → `o`, `ñ` → `n`)
  - Minúsculas, separadores reemplazados por `_`
  - Ejemplo: `Abdón Hernández` → `audio_abdon_hernandez`
- **Nota:** el evento dispara tanto en click manual del botón play como en autoplay por click de capítulo.

### 10) `change_slide` (Gallery)
- **Ubicación:** `Gallery.astro`
- **Trigger:** click en flechas `[data-slider="button-prev"]` / `[data-slider="button-next"]`
- **GA4:** `event: 'change_slide'`, `direction: 'prev'|'next'`
- **Floodlight:** `trackClick('gallery_slide_prev'|'gallery_slide_next')`

### 11) `scroll_depth`
- **Ubicación:** `BaseLayout.astro`
- **Trigger:** scroll nativo del usuario a los hitos 25%, 50%, 75%, 90% del total de la página
- **GA4:** `event: 'scroll_depth'`, `percent_scrolled: 25 | 50 | 75 | 90`
- **Floodlight:** `trackClick('scroll_depth_25'|'scroll_depth_50'|'scroll_depth_75'|'scroll_depth_90')`
- **Control de duplicados:** cada hito dispara una sola vez por sesión de página; listener se elimina al completar los 4
- **Implementación:** `window.addEventListener('scroll', ..., { passive: true })` — compatible con Lenis (scroll nativo)

### 12) `submit_success` (Storystream form)
- **Ubicación:** `SubmitModal.astro` (bloque `<script is:inline>`)
- **Trigger:** `MutationObserver` detecta que `.stry-confirmation-module` aparece visible dentro del modal
- **GA4:** `event: 'submit_success'`, `click_element: 'story_submission'`, `language: 'es'|'en'`
- **Floodlight:** `trackClick('story_submission_success')`
- **Facebook Pixel:** también dispara `fbq('track', 'Lead')` en el mismo handler
- **Control de duplicados:** flag `leadFired` evita doble disparo; se resetea en cada apertura del modal

---

## Convenciones y reglas cumplidas
- `send_to` fijo en todos los eventos: `G-VDKT3GY3Z3`.
- `click_element` con underscores.
- `direction` solo `prev` / `next`.
- `video_milestone` solo `start`, `25%`, `50%`, `75%`, `complete`.
- Sin librerías de analytics de terceros.
- Scripts co-localizados por componente con `<script>` de Astro.
- Sin `document.write`.

## Validación recomendada (rápida)
- Verificar en GA4 DebugView:
  - `nav_click`, `locale_change`, `section_view`, `open_modal`, `cta_click`, `story_slide_change`
  - `video_open`, `video_progress` (25/50/75/complete), `video_close`
  - `person_audio_play` (click manual y autoplay por capítulo), `change_slide`
  - `scroll_depth` (25/50/75/90%), `submit_success`
- Confirmar en Network/Tag Assistant que cada evento de GA4 tiene su par Floodlight.
- Probar en ES (`/`) y EN (`/en`) para validar `locale_change` y `section_view`.

## Nota técnica
- Si en algún entorno `window.gtag` no estuviera disponible al momento del click, el código usa optional chaining (`?.`) para evitar errores de runtime y mantener estable la experiencia del usuario.

---

## Caller Map

| Evento | Archivo | Elemento / Método |
|--------|---------|-------------------|
| nav_click | Header.astro | .nav-side__link |
| locale_change | Header.astro | .nav-side__link--language |
| section_view | BaseLayout.astro | IntersectionObserver `{ threshold: 0, rootMargin: "0px 0px -40% 0px" }` sobre [data-section] |
| open_modal | Header.astro, Stories.astro | [data-open-submit-modal] |
| cta_click | Header.astro, Stories.astro | [data-open-submit-modal] (alias de open_modal) |
| story_slide_change | Stories.astro | MutationObserver → #stry-hub-carousel-left/right |
| video_open | Reunions.astro | openModal() |
| video_progress | Reunions.astro | YouTube IFrame API polling |
| video_close | Reunions.astro | closeModal() |
| person_audio_play | Reunions.astro | botón play manual + autoplay por click de capítulo |
| change_slide | Gallery.astro | [data-slider="button-prev/next"] |
| scroll_depth | BaseLayout.astro | scroll event → hitos 25/50/75/90% |
| submit_success | SubmitModal.astro | MutationObserver → .stry-confirmation-module |
