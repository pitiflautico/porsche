# Floodlight Tracking (Porsche Reunions)

## Scope
- Se implementaron 3 tags Floodlight en `frontend/src/components/Head/Head.astro`.
- Source/Pixel ID: `12161656`.

## Implemented Tags
- `PageView` (`type=latam`, `cat=lat_p00-`): dispara automáticamente en page load.
- `Clicks AllElements` (`type=button`, `cat=lat_p007`): manual vía `window.floodlight.trackClick(clickElement)`.
- `VideoPlays` (`type=button`, `cat=lat_p008`): manual vía `window.floodlight.trackVideo(clickElement, videoMilestone)`.

## Technical Decisions
- Todo vive en un único bloque `<script is:inline>` dentro de `Head.astro`.
- No se usa `document.write`; cada hit crea un `iframe` 1x1 oculto y lo agrega al `document.body`.
- Se expone un objeto global `window.floodlight` con:
  - `_fire(url)`
  - `trackClick(clickElement)`
  - `trackVideo(clickElement, videoMilestone)`
- `ord` se genera por disparo con `Math.random() * 10000000000000`.
- `u3` usa `window.location.href`.
- `gdpr` y `gdpr_consent` quedan vacíos (sitio sin CMP).
- Sin `<noscript>` fallback (sitio depende de JS).

## Parameter Mapping
- `u1`: `document.documentElement.lang.toUpperCase()` (best guess actual: `ES`/`EN`).
- `u2`: nombre del elemento clicado (string enviado por caller).
- `u6`: milestone de video (`start`, `25%`, `50%`, `75%`, `complete`).

## Important Note
- `u1` está derivado del idioma de la página como aproximación.
- Pendiente confirmación de Porsche Central por si requiere market/country u otro formato.
- `cat=lat_p00-` mantiene el guión final intencionalmente (valor oficial de Campaign Manager).

## Caller Map
Dónde se llama cada función en el codebase:
- `trackClick("cta_submit_story_header")` → `Header.astro` línea X
- `trackVideo("video_reunions", milestone)` → `VideoModal.astro` línea X

## Caller Map

| Función | Archivo | Evento GA4 asociado |
|---------|---------|---------------------|
| _fire() (PageView) | Head.astro | page_view |
| trackClick('nav_[item]') | Header.astro | nav_click |
| trackClick('locale_change') | Header.astro | locale_change |
| trackClick('section_view_[value]') | BaseLayout.astro | section_view |
| trackClick('modal_submit_story') | Header.astro, Stories.astro | open_modal |
| trackClick('story_slide_change_prev/next') | Stories.astro | story_slide_change |
| trackVideo('video_reunions', 'start') | Reunions.astro | video_open |
| trackVideo('video_reunions', milestone) | Reunions.astro | video_progress |
| trackClick('video_reunions_close') | Reunions.astro | video_close |
| trackClick('audio_[person_id]') | Reunions.astro | person_audio_play |
| trackClick('gallery_slide_prev/next') | Gallery.astro | change_slide |