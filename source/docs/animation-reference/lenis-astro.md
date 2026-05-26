# Lenis — Astro Integration

Complete vanilla Lenis integration for Astro with GSAP ScrollTrigger.

## Table of Contents
1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [GSAP Integration](#gsap-integration)
4. [Scroll Events & Callbacks](#scroll-events--callbacks)
5. [Programmatic Control](#programmatic-control)
6. [Configuration Options](#configuration-options)
7. [Common Patterns](#common-patterns)
8. [View Transitions](#view-transitions)
9. [Troubleshooting](#troubleshooting)

---

## Installation

```bash
npm install lenis
# No /react subpath needed in Astro
```

---

## Basic Setup

```astro
---
// src/components/SmoothScroll.astro
---
<script>
  import Lenis from 'lenis'

  const lenis = new Lenis({
    lerp: 0.1,
    duration: 1.2,
    smoothWheel: true,
  })

  function raf(time: number) {
    lenis.raf(time)
    requestAnimationFrame(raf)
  }
  requestAnimationFrame(raf)
</script>
```

### Required CSS

```css
/* src/styles/global.css */
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
```

---

## GSAP Integration

### Full Integration (Recommended)

```astro
---
// src/components/SmoothScroll.astro
// Add to layout: <SmoothScroll />
---
<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  let lenis: Lenis
  let rafUpdate: (time: number) => void

  function init() {
    lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    // Connect Lenis scroll events to ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    // Drive Lenis with GSAP ticker (replaces requestAnimationFrame)
    rafUpdate = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(rafUpdate)
    gsap.ticker.lagSmoothing(0)

    // Make lenis globally accessible for other components
    ;(window as any).__lenis = lenis
  }

  function destroy() {
    lenis?.destroy()
    if (rafUpdate) gsap.ticker.remove(rafUpdate)
    ScrollTrigger.getAll().forEach((t) => t.kill())
    delete (window as any).__lenis
  }

  // View Transitions
  document.addEventListener('astro:page-load', init)
  document.addEventListener('astro:before-swap', destroy)

  // Fallback without View Transitions
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
</script>
```

### Accessing Lenis from Other Components

```astro
---
// src/components/SomeOtherComponent.astro
---
<button id="scroll-btn">Scroll to top</button>

<script>
  // Access the globally stored Lenis instance
  function getLenis() {
    return (window as any).__lenis as import('lenis').default | undefined
  }

  document.getElementById('scroll-btn')?.addEventListener('click', () => {
    getLenis()?.scrollTo(0, { duration: 1.5 })
  })
</script>
```

---

## Scroll Events & Callbacks

### Progress Indicator

```astro
---
---
<div id="scroll-progress" class="fixed top-0 left-0 h-1 bg-white z-50 w-0"></div>

<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const progressBar = document.getElementById('scroll-progress')!

  const lenis = new Lenis({ lerp: 0.1 })

  lenis.on('scroll', ({ scroll, limit }) => {
    const progress = scroll / limit
    progressBar.style.width = `${progress * 100}%`
    ScrollTrigger.update()
  })

  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
</script>
```

### Velocity-Based Skew

```astro
---
---
<h1 id="skew-title" class="text-5xl font-black">Velocity Skew</h1>

<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'

  const title = document.getElementById('skew-title')!
  const lenis = new Lenis({ lerp: 0.1 })

  lenis.on('scroll', ({ velocity }) => {
    gsap.to(title, {
      skewY: velocity * 0.05,
      duration: 0.3,
      ease: 'power2.out',
    })
  })

  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
</script>
```

### Direction-Aware Header

```astro
---
---
<header id="site-header" class="fixed top-0 w-full z-50 transition-transform duration-300">
  <nav>Navigation</nav>
</header>

<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'

  const header = document.getElementById('site-header')!
  const lenis = new Lenis({ lerp: 0.1 })

  lenis.on('scroll', ({ direction }) => {
    if (direction > 0) {
      // Scrolling down — hide header
      gsap.to(header, { yPercent: -100, duration: 0.3, ease: 'power2.out' })
    } else {
      // Scrolling up — show header
      gsap.to(header, { yPercent: 0, duration: 0.3, ease: 'power2.out' })
    }
  })

  gsap.ticker.add((time) => lenis.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
</script>
```

---

## Programmatic Control

### Scroll to Element

```astro
---
---
<nav>
  <button class="nav-link" data-target="#about">About</button>
  <button class="nav-link" data-target="#work">Work</button>
  <button class="nav-link" data-target="#contact">Contact</button>
</nav>

<script>
  function getLenis() {
    return (window as any).__lenis as import('lenis').default | undefined
  }

  document.querySelectorAll<HTMLButtonElement>('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target
      const el = target ? document.querySelector(target) : null
      getLenis()?.scrollTo(el as HTMLElement, {
        offset: -80,
        duration: 1.5,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      })
    })
  })
</script>
```

### Stop/Start for Modals

```astro
---
---
<button id="open-modal">Open Modal</button>
<div id="modal" class="hidden fixed inset-0 z-50 bg-black/80">
  <button id="close-modal">Close</button>
</div>

<script>
  function getLenis() {
    return (window as any).__lenis as import('lenis').default | undefined
  }

  document.getElementById('open-modal')?.addEventListener('click', () => {
    getLenis()?.stop()
    document.getElementById('modal')!.classList.remove('hidden')
  })

  document.getElementById('close-modal')?.addEventListener('click', () => {
    getLenis()?.start()
    document.getElementById('modal')!.classList.add('hidden')
  })
</script>
```

### Scroll to Top on Route Change

```astro
---
// Add to Layout.astro
---
<script>
  document.addEventListener('astro:page-load', () => {
    const lenis = (window as any).__lenis as import('lenis').default | undefined
    lenis?.scrollTo(0, { immediate: true })
  })
</script>
```

---

## Configuration Options

```ts
const lenis = new Lenis({
  // Smoothing
  lerp: 0.1,              // Linear interpolation factor (0–1), lower = smoother
  duration: 1.2,          // Animation duration in seconds

  // Wheel
  smoothWheel: true,      // Smooth wheel scrolling
  wheelMultiplier: 1,     // Wheel sensitivity

  // Touch
  touchMultiplier: 2,     // Touch sensitivity
  syncTouch: false,       // Sync touch with lerp (experimental)
  syncTouchLerp: 0.075,

  // Direction
  orientation: 'vertical',       // 'vertical' | 'horizontal'
  gestureOrientation: 'vertical',

  // Behavior
  infinite: false,        // Infinite scroll

  // Wrapper & content
  wrapper: window,
  content: document.documentElement,
})
```

### Common Presets

```ts
// Premium / Studio Freight style
const premium = { lerp: 0.075, duration: 1.5, smoothWheel: true, wheelMultiplier: 0.8 }

// Snappy
const snappy = { lerp: 0.15, duration: 0.8, smoothWheel: true, wheelMultiplier: 1.2 }

// Mobile-friendly
const mobile = { lerp: 0.1, duration: 1.2, touchMultiplier: 1.5, syncTouch: true }
```

---

## Common Patterns

### Prevent Smooth Scroll on Elements

```html
<!-- Prevent all smooth scroll -->
<div data-lenis-prevent>
  <textarea>Native scroll here</textarea>
</div>

<!-- Prevent only wheel events -->
<div data-lenis-prevent-wheel>
  <!-- Horizontal scroll container -->
</div>
```

### Anchor Links

```astro
---
---
<script>
  function getLenis() {
    return (window as any).__lenis as import('lenis').default | undefined
  }

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLAnchorElement
    if (target.tagName === 'A' && target.hash) {
      const el = document.querySelector(target.hash)
      if (el) {
        e.preventDefault()
        getLenis()?.scrollTo(el as HTMLElement, { offset: -100 })
      }
    }
  })
</script>
```

### Horizontal Scroll Section

```astro
---
const panels = ['One', 'Two', 'Three', 'Four']
---
<div id="h-section-container">
  <div id="h-wrapper" class="flex" data-lenis-prevent-wheel>
    {panels.map((p) => (
      <div class="h-panel w-screen h-screen flex-shrink-0 flex items-center justify-center">
        {p}
      </div>
    ))}
  </div>
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const wrapper = document.getElementById('h-wrapper')!
  const panels = gsap.utils.toArray<HTMLElement>('.h-panel')

  const ctx = gsap.context(() => {
    gsap.to(panels, {
      xPercent: -100 * (panels.length - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: wrapper,
        pin: true,
        scrub: 1,
        snap: 1 / (panels.length - 1),
        end: () => '+=' + wrapper.scrollWidth,
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## View Transitions

Full lifecycle integration for Astro's built-in View Transitions:

```astro
---
// src/components/SmoothScroll.astro
---
<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  type LenisRAF = (time: number) => void
  let lenis: Lenis
  let rafUpdate: LenisRAF

  function init() {
    lenis = new Lenis({ lerp: 0.1, duration: 1.2 })
    lenis.on('scroll', ScrollTrigger.update)
    rafUpdate = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(rafUpdate)
    gsap.ticker.lagSmoothing(0)
    ;(window as any).__lenis = lenis

    // Scroll to top on new page
    lenis.scrollTo(0, { immediate: true })
    ScrollTrigger.refresh()
  }

  function destroy() {
    ScrollTrigger.getAll().forEach((t) => t.kill())
    if (rafUpdate) gsap.ticker.remove(rafUpdate)
    lenis?.destroy()
    delete (window as any).__lenis
  }

  document.addEventListener('astro:page-load', init)
  document.addEventListener('astro:before-swap', destroy)

  // Initial load (no view transition fires)
  init()
</script>
```

---

## Troubleshooting

### ScrollTrigger out of sync

Always connect Lenis to ScrollTrigger:
```js
lenis.on('scroll', ScrollTrigger.update)
```
And use GSAP ticker instead of `requestAnimationFrame`:
```js
gsap.ticker.add((time) => lenis.raf(time * 1000))
gsap.ticker.lagSmoothing(0)
```

### Jerky scroll on mobile

```ts
new Lenis({ syncTouch: true, syncTouchLerp: 0.075, touchMultiplier: 1.5 })
```

### Scroll not working in modal / overlay

```js
getLenis()?.stop()   // on modal open
getLenis()?.start()  // on modal close
```

### `__lenis` not available

The global is set after `init()`. Components that need Lenis should read it lazily (in event handlers, not immediately at script load):

```js
// ✗ Too early — may run before SmoothScroll.astro
const lenis = window.__lenis

// ✓ Lazy access — safe
btn.addEventListener('click', () => {
  const lenis = window.__lenis
  lenis?.scrollTo(0)
})
```
