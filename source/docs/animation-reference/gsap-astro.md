# GSAP + Astro Patterns

Complete GSAP patterns for Astro using `<script>` tags and `gsap.context()`. No hooks required.

## Table of Contents
1. [Core Setup](#core-setup)
2. [gsap.context() — Scope & Cleanup](#gsapcontext--scope--cleanup)
3. [ScrollTrigger in Astro](#scrolltrigger-in-astro)
4. [Context Methods (replaces contextSafe)](#context-methods)
5. [Timeline Orchestration](#timeline-orchestration)
6. [Text Animations](#text-animations)
7. [Pin Sections](#pin-sections)
8. [Batch Animations](#batch-animations)
9. [SVG Animations](#svg-animations)
10. [View Transitions Integration](#view-transitions-integration)

---

## Core Setup

### Shared Plugin Registration

```ts
// src/lib/gsap.ts
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
```

### Basic Astro Component

```astro
---
// server-side: nothing animation-related here
---
<div id="section">
  <div class="box w-20 h-20 bg-white"></div>
</div>

<script>
  import gsap from 'gsap'

  const ctx = gsap.context(() => {
    gsap.to('.box', { x: 360, rotation: 360, duration: 1 })
  }, '#section') // scope limits selectors to #section

  document.addEventListener('astro:before-swap', () => ctx.revert())
</script>
```

---

## gsap.context() — Scope & Cleanup

`gsap.context()` replaces `useGSAP`. It:
- Scopes all CSS selectors to a container element
- Collects all tweens/timelines for batch cleanup
- Returns a `revert()` method to undo everything

### Pattern

```js
// Always follow this structure in Astro scripts
const ctx = gsap.context(() => {
  // All GSAP code here
}, scopeElement) // string selector, element, or ref

// Cleanup on Astro View Transitions
document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
```

### Scoping Options

```js
// Scope to element
const ctx = gsap.context(fn, document.getElementById('hero'))

// Scope to CSS selector string
const ctx = gsap.context(fn, '#hero')

// No scope (global — use carefully)
const ctx = gsap.context(fn)
```

### Multiple Animations

```astro
---
---
<section id="showcase">
  <h1 class="title">Title</h1>
  <p class="subtitle">Subtitle</p>
  <button class="cta">CTA</button>
</section>

<script>
  import gsap from 'gsap'

  const ctx = gsap.context(() => {
    gsap.from('.title', { opacity: 0, y: 50, duration: 0.6 })
    gsap.from('.subtitle', { opacity: 0, y: 30, duration: 0.5, delay: 0.1 })
    gsap.from('.cta', { opacity: 0, scale: 0.9, duration: 0.4, delay: 0.2 })
  }, '#showcase')

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## ScrollTrigger in Astro

### Basic ScrollTrigger

```astro
---
---
<section id="reveal-section">
  <div class="content p-20 text-white">Scroll to reveal</div>
</section>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.from('.content', {
      opacity: 0,
      y: 50,
      duration: 1,
      scrollTrigger: {
        trigger: '.content',
        start: 'top 80%',
        end: 'top 30%',
        toggleActions: 'play none none reverse',
        // markers: true, // Debug only
      },
    })
  }, '#reveal-section')

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

### Scrub Animation

```astro
---
---
<div id="scrub-section" class="h-[300vh]">
  <div class="progress fixed top-0 left-0 h-1 w-full bg-blue-500 origin-left scale-x-0"></div>
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.to('.progress', {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '#scrub-section',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

### Multiple ScrollTriggers

```astro
---
const sections = [1, 2, 3, 4]
---
<div id="multi-section">
  {sections.map(i => (
    <div class={`section-${i} h-screen flex items-center justify-center`}>
      Section {i}
    </div>
  ))}
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.utils.toArray<HTMLElement>('[class^="section-"]').forEach((section) => {
      gsap.from(section, {
        opacity: 0,
        y: 50,
        duration: 0.8,
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      })
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## Context Methods

`gsap.context()` can register named methods, callable from outside (event handlers, etc.).

```astro
---
---
<div id="card-section">
  <div class="card w-40 h-40 bg-white"></div>
  <button id="rotate-btn">Rotate</button>
</div>

<script>
  import gsap from 'gsap'

  const ctx = gsap.context((self) => {
    // Register method for external use
    self.add('spin', () => {
      gsap.to('.card', { rotation: '+=360', duration: 0.5, ease: 'power2.out' })
    })

    self.add('reset', () => {
      gsap.to('.card', { rotation: 0, duration: 0.3 })
    })
  }, '#card-section')

  document.getElementById('rotate-btn')?.addEventListener('click', () => {
    ctx.spin()
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

### Hover Handlers

```astro
---
---
<div id="hover-card" class="w-40 h-40 bg-gray-800 cursor-pointer">
  <div class="card-content p-4 text-white">Hover me</div>
</div>

<script>
  import gsap from 'gsap'

  const card = document.getElementById('hover-card')!
  const ctx = gsap.context((self) => {
    self.add('enter', () => gsap.to('.card-content', { y: -10, duration: 0.3 }))
    self.add('leave', () => gsap.to('.card-content', { y: 0, duration: 0.3 }))
  }, '#hover-card')

  card.addEventListener('mouseenter', () => ctx.enter())
  card.addEventListener('mouseleave', () => ctx.leave())

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## Timeline Orchestration

### Basic Timeline

```astro
---
---
<section id="hero-section">
  <h1 class="title text-6xl font-black">Title</h1>
  <p class="subtitle text-xl">Subtitle</p>
  <a class="cta px-8 py-4 bg-white text-black">CTA</a>
</section>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#hero-section',
        start: 'top center',
      },
    })

    tl.from('.title', { opacity: 0, y: 50, duration: 0.6 })
      .from('.subtitle', { opacity: 0, y: 30, duration: 0.5 }, '-=0.3')
      .from('.cta', { opacity: 0, scale: 0.9, duration: 0.4 }, '-=0.2')
  }, '#hero-section')

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

### Controlled Timeline (Play/Pause)

```astro
---
---
<div id="controlled">
  <div class="box w-20 h-20 bg-white"></div>
  <div class="controls flex gap-2 mt-4">
    <button id="btn-play">Play</button>
    <button id="btn-reverse">Reverse</button>
    <button id="btn-restart">Restart</button>
  </div>
</div>

<script>
  import gsap from 'gsap'

  let tl: gsap.core.Timeline

  const ctx = gsap.context(() => {
    tl = gsap.timeline({ paused: true })
      .to('.box', { x: 200, duration: 0.5 })
      .to('.box', { y: 100, duration: 0.5 })
      .to('.box', { rotation: 360, duration: 0.5 })
  }, '#controlled')

  document.getElementById('btn-play')?.addEventListener('click', () => tl?.play())
  document.getElementById('btn-reverse')?.addEventListener('click', () => tl?.reverse())
  document.getElementById('btn-restart')?.addEventListener('click', () => tl?.restart())

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## Text Animations

### Line Mask Reveal

```astro
---
interface Props { lines: string[] }
const { lines } = Astro.props
---
<div id="text-reveal">
  {lines.map((line) => (
    <div class="overflow-hidden">
      <div class="line-inner text-4xl font-black">{line}</div>
    </div>
  ))}
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.from('.line-inner', {
      yPercent: 100,
      duration: 0.8,
      ease: 'power4.out',
      stagger: 0.1,
      scrollTrigger: {
        trigger: '#text-reveal',
        start: 'top 80%',
      },
    })
  }, '#text-reveal')

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

### SplitText (Club GSAP)

```astro
---
---
<h1 id="split-heading" class="text-6xl font-black">Animated Headline</h1>

<script>
  import gsap from 'gsap'
  import { SplitText } from 'gsap/SplitText'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(SplitText, ScrollTrigger)

  const heading = document.getElementById('split-heading')!
  const split = new SplitText(heading, { type: 'chars,words,lines', linesClass: 'overflow-hidden' })

  const ctx = gsap.context(() => {
    gsap.from(split.chars, {
      opacity: 0,
      y: 100,
      rotateX: -90,
      stagger: 0.02,
      duration: 0.8,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: heading,
        start: 'top 80%',
      },
    })
  })

  document.addEventListener('astro:before-swap', () => {
    split.revert()
    ctx.revert()
  }, { once: true })
</script>
```

---

## Pin Sections

### Horizontal Scroll

```astro
---
const panels = ['Panel 1', 'Panel 2', 'Panel 3', 'Panel 4']
---
<div id="h-scroll-container">
  <div id="h-scroll-wrapper" class="flex w-[400vw]">
    {panels.map((p, i) => (
      <div class="panel w-screen h-screen flex-shrink-0 flex items-center justify-center text-4xl font-black">
        {p}
      </div>
    ))}
  </div>
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const wrapper = document.getElementById('h-scroll-wrapper')!
  const panels = gsap.utils.toArray<HTMLElement>('.panel')

  const ctx = gsap.context(() => {
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: wrapper,
        pin: true,
        scrub: 1,
        snap: 1 / (panels.length - 1),
        end: () => '+=' + wrapper.offsetWidth,
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## Batch Animations

```astro
---
const items = Array.from({ length: 16 })
---
<div id="batch-grid" class="grid grid-cols-4 gap-4 p-8">
  {items.map((_, i) => (
    <div class="grid-item aspect-square bg-gray-800"></div>
  ))}
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    ScrollTrigger.batch('.grid-item', {
      onEnter: (elements) => {
        gsap.from(elements, {
          opacity: 0,
          y: 60,
          stagger: 0.1,
          duration: 0.6,
          ease: 'power3.out',
        })
      },
      start: 'top 85%',
    })
  }, '#batch-grid')

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## SVG Animations

### DrawSVG (Club GSAP)

```astro
---
---
<svg id="draw-svg" viewBox="0 0 100 100" class="w-64 h-64">
  <path class="draw-path" d="M10,50 Q50,10 90,50" fill="none" stroke="white" stroke-width="2" />
</svg>

<script>
  import gsap from 'gsap'
  import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(DrawSVGPlugin, ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.from('.draw-path', {
      drawSVG: '0%',
      duration: 2,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: '#draw-svg',
        start: 'top 70%',
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## View Transitions Integration

### Full Page Transition Setup

```astro
---
// src/layouts/Layout.astro
import { ViewTransitions } from 'astro:transitions'
---
<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <slot />
  </body>
</html>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  // Runs after every page load/transition
  document.addEventListener('astro:page-load', () => {
    ScrollTrigger.refresh()

    gsap.from('main', {
      opacity: 0,
      y: 15,
      duration: 0.4,
      ease: 'power2.out',
      clearProps: 'all',
    })
  })

  // Cleanup before page swap
  document.addEventListener('astro:before-swap', () => {
    ScrollTrigger.getAll().forEach((t) => t.kill())
  })
</script>
```

### Animated Page Overlay Transition

```astro
---
// src/layouts/Layout.astro
---
<div id="page-overlay" class="fixed inset-0 bg-black z-[9998] pointer-events-none origin-bottom scale-y-0"></div>

<script>
  import gsap from 'gsap'

  document.addEventListener('astro:before-preparation', async (e) => {
    // Animate overlay in before new page loads
    await gsap.to('#page-overlay', {
      scaleY: 1,
      duration: 0.4,
      ease: 'power4.inOut',
      transformOrigin: 'bottom',
    })
  })

  document.addEventListener('astro:page-load', () => {
    // Animate overlay out after new page loads
    gsap.to('#page-overlay', {
      scaleY: 0,
      duration: 0.4,
      ease: 'power4.inOut',
      transformOrigin: 'top',
      clearProps: 'transform',
    })
  })
</script>
```

---

## Important Notes

### ScrollTrigger Refresh

Always refresh after dynamic content or page transitions:

```js
document.addEventListener('astro:page-load', () => {
  ScrollTrigger.refresh()
})
```

### SSR Safety

All animation code lives in `<script>` tags — always client-side. No SSR concerns. No `'use client'` needed.

### `{ once: true }` on cleanup listeners

When using View Transitions, `astro:before-swap` fires on every navigation. Use `{ once: true }` only if the component is unique per page. For persistent components (navbar, cursor), omit `once`.
