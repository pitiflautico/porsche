# AI discovery (SEO / crawlers / LLMs)

**Purpose:** Documentación del trabajo de “AI discovery” implementado **solo en código**: metadatos, Open Graph y datos estructurados (JSON-LD). No añade UI visible para el usuario final.

**Branch de referencia:** `feat/ai-discovery-structured-data` (desde `main`).

---

## Objetivo

Mejorar cómo buscadores, redes sociales y sistemas de IA entienden la página principal de Porsche Owners Reunions sin cambiar el diseño ni el copy visible en pantalla (salvo el `<title>` y la meta description en el navegador, que sí se actualizaron por SEO).

---

## Archivos en el frontend

| Archivo | Rol |
|--------|-----|
| `frontend/src/components/Head/StructuredData.astro` | Inyecta en `<head>` los scripts `application/ld+json`: `WebPage` + `Organization`, `FAQPage`, y un `VideoObject` por cada reunión (datos de `reunions-data.ts`). |
| `frontend/src/components/Head/Head.astro` | Props opcionales `ogTitle` y `ogDescription` (distintos de `<title>` y `meta name="description"`). Incluye `meta name="author"` (Porsche Latin America). |
| `frontend/src/layouts/BaseLayout.astro` | Renderiza `StructuredData` y reenvía `ogTitle` / `ogDescription` a `Head`. |
| `frontend/src/components/pages/HomePage.astro` | Pasa `home.ogTitle` y `home.ogDescription` desde i18n. |
| `frontend/src/i18n/es.json` / `en.json` | `home.pageTitle`, `home.metaDescription`, `home.ogTitle`, `home.ogDescription`, y bloque `faq.items` (referencia; ver nota abajo). |
| `frontend/src/data/reunions-data.ts` | Fuente de verdad para modelos, países, fechas, thumbnails y IDs de YouTube usados en `VideoObject`. |

---

## Qué se emite en el HTML

1. **WebPage + Organization (schema.org)**  
   Nombre y descripción alineados al brief de discovery, URL canónica, idioma, publisher con logo.

2. **FAQPage**  
   Seis preguntas y respuestas (ES/EN) para rich results y consumo por crawlers.

3. **VideoObject (×3)**  
   Una entrada por reunión (México, Colombia, Perú): nombre localizado, descripción corta, `thumbnailUrl`, `uploadDate` (ISO desde fechas `DD.MM.YY` / `DD.MM.YYYY` en datos), `contentUrl` y `embedUrl` de YouTube.

4. **Meta / social**  
   - `<title>` y `meta description` con copy optimizado.  
   - Open Graph y Twitter Card usan `ogTitle` / `ogDescription` cuando se pasan desde la home.  
   - `meta author`.

Todo el JSON-LD se serializa en **build time** (Astro estático); no hay JS extra en runtime para esto.

---

## Nota sobre duplicación de FAQs

El texto de las FAQs para **JSON-LD** vive en `StructuredData.astro` (`faqData`).  
En `es.json` / `en.json` existe también `faq.items` con el mismo contenido como **referencia** y para un posible uso futuro en UI; si se cambia el copy, hay que mantener **ambos** alineados hasta que se refactorice para leer las FAQs desde i18n dentro de `StructuredData.astro`.

---

## Cómo validar

- **Rich Results Test (Google):** pegar la URL publicada o el HTML generado y revisar `FAQPage` / `VideoObject` / `WebPage`.  
- **Inspección local:** `npm run build` y revisar `dist/index.html` (y `/en/index.html` si aplica).

---

## Fuente de copy original

Brief interno “Copy x Funciones AI” (headings semánticos, meta description, OG, FAQs). La implementación sigue la premisa **code-side only** (sin sección FAQ visible obligatoria en la página).

---

End of AI discovery documentation.
