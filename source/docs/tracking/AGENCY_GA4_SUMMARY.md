# GA4 — Resumen para agencia (Porsche Reunions)

Documento orientado a validación en **GA4 DebugView** / **Tag Assistant**. Implementación técnica detallada: `GA4_EVENTS_IMPLEMENTATION_SUMMARY.md`.

---

## Configuración

| Campo | Valor |
|-------|--------|
| **Measurement ID GA4** | `G-VDKT3GY3Z3` |
| **Idiomas** | ES por defecto (`/`), EN (`/en`) |
| **Floodlight** | Cada evento GA4 custom va acompañado de un hit Floodlight en el mismo momento (mismo handler). |

**`page_view`:** automático vía `gtag('config')` en carga de página (no es un evento custom del sitio).

---

## Eventos custom GA4 — cuándo y dónde esperarlos

| Evento GA4 | Cuándo / dónde |
|------------|----------------|
| **`nav_click`** | Click en un ítem del **menú lateral** (Inicio, Reuniones, Galería, Historias, email). Parámetro `click_element`: `nav_hero`, `nav_reunions`, `nav_gallery`, `nav_stories`, `nav_email`. |
| **`locale_change`** | Click en el **cambio de idioma** (ES ↔ EN). Parámetro `language`. |
| **`section_view`** | **Primera vez** que el usuario entra en una sección al hacer **scroll** o al navegar por **anclas** del menú. Parámetro `section_name`: `hero`, `reunions`, `testimonials`, `gallery`, `stories`. Una vez por sección por carga de página. |
| **`open_modal`** | Click en **“Escribe tu historia”** (header) o **“Comparte tu historia”** (sección Historias). `click_element`: `modal_submit_story`. |
| **`cta_click`** | Mismo click que `open_modal` (mismo `click_element`). **Duplicado intencional** para alinear con la nomenclatura `cta_click` de la agencia. |
| **`story_slide_change`** | Flechas del **carrusel Storystream** en la sección Historias. Parámetro `direction`: `prev` / `next`. |
| **`video_open`** | Abrir el **modal de video** en la sección Reuniones. |
| **`video_progress`** | Progreso del **video de Reuniones** (YouTube en modal). Parámetro `video_milestone`: `25%`, `50%`, `75%`, `complete` (una vez por milestone por apertura de modal). |
| **`video_close`** | Cerrar el modal de video en Reuniones. |
| **`person_audio_play`** | Audio de una persona en Reuniones: **play manual** o **inicio al hacer click en un capítulo** (I–IV). `click_element`: `audio_[id_normalizado]` (nombre de persona). |
| **`change_slide`** | Flechas del **slider de Galería**. `direction`: `prev` / `next`. |
| **`scroll_depth`** | Scroll vertical de la **landing completa**: hitos **25, 50, 75 y 90%** del documento. Parámetro `percent_scrolled`. Una vez por hito por carga. |
| **`submit_success`** | **Envío del formulario Storystream** completado: pantalla de confirmación visible en el modal. `click_element`: `story_submission`, `language`: `es` / `en`. |

---

## Notas para validación

1. Probar **`/`** (ES) y **`/en`** (EN).
2. **`section_view`** debe verse tanto haciendo **scroll** como al usar el **menú lateral** (navegación por anclas).
3. **`cta_click`** y **`open_modal`** salen **juntos** en el mismo click de los dos CTAs de historia (header + sección Stories).
4. **`story_progress`** como evento GA4 del widget Storystream **no está implementado**; el engagement en Historias se cubre con `story_slide_change`, `section_view` (stories) y `scroll_depth` de la página.

---

## Checklist rápido (DebugView)

- [ ] `nav_click`, `locale_change`, `section_view`
- [ ] `open_modal`, `cta_click`, `story_slide_change`
- [ ] `video_open`, `video_progress`, `video_close`
- [ ] `person_audio_play` (play manual y por capítulo)
- [ ] `change_slide`
- [ ] `scroll_depth` (25 / 50 / 75 / 90)
- [ ] `submit_success` (tras envío exitoso del form Storystream)

Confirmar en Network / Tag Assistant que cada hit GA4 tenga su par Floodlight asociado según el plan del cliente.
