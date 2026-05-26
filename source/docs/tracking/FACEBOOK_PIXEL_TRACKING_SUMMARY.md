# Integración Meta Pixel - Porsche Reunions

**Pixel ID:** `430862088142952`

## Implementación técnica

El píxel se inicializa **una sola vez** en el `<head>` del layout base (`Head.astro`), por lo que carga en todas las páginas del sitio (ES y EN). No se usa ninguna librería de terceros; todo es el script estándar de Meta con vanilla JS.

## Eventos configurados

| # | Evento | Cuándo se dispara | Dónde vive el código | Parámetros |
|---|--------|-------------------|----------------------|------------|
| 1 | **PageView** | Automático, en cada carga de página | `Head.astro` | Ninguno (estándar). Incluye fallback `<noscript>` para navegadores sin JS. |
| 2 | **ViewContent** | Cuando el usuario abre el modal "Escribe tu historia" / "Submit my story" | `SubmitModal.astro` | Ninguno. |
| 3 | **Lead** | Cuando el usuario **completa** el envío del formulario de Storystream y aparece el mensaje de confirmación ("Gracias por compartir tu historia") | `SubmitModal.astro` | `content_category: "story_submission"`, `content_name: "es"` o `"en"` según el idioma de la página. |

## Qué debería ver el cliente en Meta Events Manager

- **PageView:** un evento por cada visita a cualquier página del sitio (ES o EN).
- **ViewContent:** un evento cada vez que alguien pulsa el botón para abrir el formulario de envío de historia (ya sea desde el header o desde el CTA de la sección Stories).
- **Lead:** un evento cada vez que un usuario completa el formulario dentro del modal y Storystream muestra la pantalla de confirmación. El parámetro `content_name` permite **filtrar por idioma** (`es` / `en`) directamente en Meta.

## Consideraciones importantes

- **El formulario es un embed de Storystream**, no un formulario nativo del sitio. No usa iframe, sino que monta nodos directamente en el DOM de la página. El botón "Enviar" del embed es `type="button"` (no `type="submit"`), por lo que el evento `Lead` **no** se basa en el `submit` del formulario, sino en un `MutationObserver` que detecta cuándo aparece el módulo de confirmación (`.stry-confirmation-module`) dentro del modal.
- **No hay duplicados:** cada apertura del modal resetea el flag, de modo que si el usuario cierra y vuelve a enviar, se registra un nuevo Lead.
- **Los modales de video de Reunions** (YouTube) y el modal de detalle de persona (mobile) **no están trackeados** actualmente con el Pixel. Si se desea medir esas interacciones, se puede agregar en el futuro.
