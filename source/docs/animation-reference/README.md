---
name: awwwards-animations-astro
description: Professional Astro animation skill for creating Awwwards/FWA-level animations using GSAP (gsap.context), vanilla Motion, Anime.js, and Lenis. Use when building premium scroll experiences, custom cursors, page transitions, text animations, parallax effects, micro-interactions, or any animation that needs to be 60fps and award-worthy. Triggers on requests for smooth scroll, ScrollTrigger, magnetic effects, reveal animations, horizontal scroll, pin sections, stagger effects, Three.js/WebGL, algorithmic art, generative art, fractals, L-systems, flow fields, strange attractors, sacred geometry, geometric puzzles, Dudeney dissections, tangram, tessellations, Penrose tiles, kinetic typography, glitch effects, text explosion, morphing text, circular text, brutalist design, minimalist animation, neo-brutalism, or design philosophy mixing. Astro-first approach using <script> tags, gsap.context(), vanilla Lenis, and Astro View Transitions.
---

# Awwwards Animations — Astro

Create premium web animations at Awwwards/FWA quality level. **Astro-first approach**. 60fps non-negotiable.

## Astro Animation Fundamentals

Astro components are server-rendered. All animation lives in `<script>` tags, which Vite bundles automatically. No hooks, no JSX state. Use DOM APIs + library vanilla interfaces.

```astro
---
// Frontmatter: server only. No animation here.
---

<div class="box">I animate</div>

<script>
  // This runs in the browser. Vite handles imports.
  import gsap from 'gsap'
  gsap.to('.box', { x: 100, duration: 1 })
</script>
```

### Astro View Transitions (Critical)

When using `<ViewTransitions />`, scripts don't re-run on navigation. Use lifecycle events:

```js
// astro:page-load  → runs after every navigation (replaces DOMContentLoaded)
// astro:before-swap → runs before old DOM is replaced (cleanup point)

document.addEventListener('astro:page-load', () => {
  // Init animations here
})

document.addEventListener('astro:before-swap', () => {
  // Cleanup: kill ScrollTriggers, stop Lenis, etc.
})
```

If NOT using View Transitions, `DOMContentLoaded` or direct script execution works fine.

---

## Decision Matrix

| Task | Library | Why |
|------|---------|-----|
| Scroll-driven animations | GSAP + ScrollTrigger | Industry standard, best control |
| Smooth scroll | Lenis (vanilla) | Best performance, works with ScrollTrigger |
| Vanilla scroll animations | Motion (`scroll`, `inView`) | Clean API, no framework needed |
| Simple/lightweight effects | Anime.js 4.0 | Small footprint, clean API |
| Complex timelines | GSAP | Unmatched timeline control |
| SVG morphing | GSAP MorphSVG or Anime.js | Both excellent |
| 3D + animation | Three.js + GSAP | GSAP controls Three.js objects |
| Page transitions | Astro View Transitions + GSAP | Native Astro, GSAP for complex |
| Geometric shapes (vector) | SVG + GSAP/Anime.js | Native, animable |
| Geometric shapes (canvas) | Canvas 2D API | Programmatic, performant |
| Pseudo-3D shapes | Zdog | Flat design 3D, ~2kb |
| Creative coding/generative | p5.js | Rich ecosystem |
| Audio reactive | Tone.js | Web Audio, synths, effects |
| Physics 2D | Matter.js | Gravity, collisions, constraints |
| Algorithmic/generative art | Canvas 2D + p5.js | Math-driven visuals |
| Fractals/L-systems | Canvas 2D recursivo | Recursive rendering |
| Tessellations/geometric puzzles | SVG + GSAP | Precise animated transforms |
| Kinetic typography advanced | GSAP SplitText + Canvas | Per-char control |
| Glitch effects | CSS + GSAP | Layered RGB split, clip-path |
| Brutalist animation | CSS + GSAP (no ease) | Hard cuts, no easing |
| Minimalist animation | Motion or GSAP springs | Subtle, purposeful motion |

---

## Installation

```bash
# GSAP (v3.14+)
npm install gsap

# Lenis (v1.3+) — vanilla, no /react subpath needed
npm install lenis

# Motion (vanilla JS, no React)
npm install motion

# Anime.js (v4.0)
npm install animejs

# Optional: Physics & Audio
npm install matter-js tone
```

---

## Setup

### 1. GSAP — lib/gsap.ts (shared config)

```ts
// src/lib/gsap.ts
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Register once — import this file wherever GSAP is used
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
```

### 2. Lenis + GSAP ScrollTrigger (Critical Integration)

```astro
---
// src/components/SmoothScroll.astro
---
<script>
  import Lenis from 'lenis'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  let lenis: Lenis

  function initLenis() {
    lenis = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    })

    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add((time) => lenis.raf(time * 1000))
    gsap.ticker.lagSmoothing(0)
  }

  function destroyLenis() {
    lenis?.destroy()
    gsap.ticker.remove(lenis?.raf)
  }

  // View Transitions support
  document.addEventListener('astro:page-load', initLenis)
  document.addEventListener('astro:before-swap', destroyLenis)

  // Fallback if not using View Transitions
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLenis)
  } else {
    initLenis()
  }
</script>
```

Use in layout:
```astro
---
// src/layouts/Layout.astro
import SmoothScroll from '../components/SmoothScroll.astro'
---
<html>
  <body>
    <SmoothScroll />
    <slot />
  </body>
</html>
```

### 3. CSS for Lenis

```css
/* src/styles/global.css */
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-stopped {
  overflow: hidden;
}

.lenis.lenis-scrolling iframe {
  pointer-events: none;
}
```

---

## Core Patterns (Astro)

Detailed implementations in references:
- **GSAP + gsap.context**: See [references/gsap-astro.md](references/gsap-astro.md)
- **Motion (vanilla)**: See [references/motion-astro.md](references/motion-astro.md)
- **Anime.js 4.0**: See [references/animejs-astro.md](references/animejs-astro.md)
- **Lenis (vanilla)**: See [references/lenis-astro.md](references/lenis-astro.md)
- **Geometric Shapes**: See [references/geometric-shapes.md](references/geometric-shapes.md)
- **Audio Reactive**: See [references/audio-reactive.md](references/audio-reactive.md)
- **Physics 2D**: See [references/physics-2d.md](references/physics-2d.md)
- **Advanced (Three.js, WebGL)**: See [references/advanced-patterns.md](references/advanced-patterns.md)
- **Algorithmic & Generative Art**: See [references/algorithmic-art.md](references/algorithmic-art.md)
- **Advanced Text Effects**: See [references/text-effects.md](references/text-effects.md)
- **Geometric Puzzles**: See [references/geometric-puzzles.md](references/geometric-puzzles.md)
- **Design Philosophy**: See [references/design-philosophy.md](references/design-philosophy.md)
- **Performance**: See [references/performance.md](references/performance.md)

---

## Quick Patterns (Astro)

### 1. Magnetic Cursor (GSAP)

```astro
---
---
<div id="cursor" class="fixed w-10 h-10 border border-white rounded-full pointer-events-none mix-blend-difference z-[9999] -translate-x-1/2 -translate-y-1/2"></div>

<script>
  import gsap from 'gsap'

  const cursor = document.getElementById('cursor')!
  const pos = { x: 0, y: 0, cx: 0, cy: 0 }

  window.addEventListener('mousemove', (e) => {
    pos.x = e.clientX
    pos.y = e.clientY
  })

  gsap.ticker.add(() => {
    pos.cx += (pos.x - pos.cx) * 0.15
    pos.cy += (pos.y - pos.cy) * 0.15
    gsap.set(cursor, { x: pos.cx, y: pos.cy })
  })
</script>
```

### 2. Magnetic Button (vanilla Motion)

```astro
---
---
<button class="magnetic-btn px-8 py-4 bg-white text-black rounded-full">
  <slot />
</button>

<script>
  import { animate } from 'motion'

  document.querySelectorAll<HTMLButtonElement>('.magnetic-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = btn.getBoundingClientRect()
      const x = (e.clientX - left - width / 2) * 0.3
      const y = (e.clientY - top - height / 2) * 0.3
      animate(btn, { x, y }, { type: 'spring', stiffness: 150, damping: 15 })
    })

    btn.addEventListener('mouseleave', () => {
      animate(btn, { x: 0, y: 0 }, { type: 'spring', stiffness: 150, damping: 15 })
    })
  })
</script>
```

### 3. Parallax Hero (GSAP + ScrollTrigger)

```astro
---
---
<section id="hero" class="relative h-screen overflow-hidden">
  <div class="parallax-bg absolute inset-0 bg-cover bg-center bg-gray-900"></div>
  <h1 class="hero-title absolute inset-0 flex items-center justify-center text-6xl text-white">
    Hero Title
  </h1>
</section>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.to('.parallax-bg', {
      yPercent: 50,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    })

    gsap.to('.hero-title', {
      yPercent: 100,
      opacity: 0,
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: '50% top',
        scrub: true,
      },
    })
  }, '#hero')

  // Cleanup for View Transitions
  document.addEventListener('astro:before-swap', () => ctx.revert())
</script>
```

### 4. Text Reveal (GSAP + Scroll)

```astro
---
const text = "Award-winning motion"
---
<div class="text-reveal overflow-hidden">
  <div class="text-inner text-5xl font-black translate-y-full">
    {text}
  </div>
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.to('.text-inner', {
      y: 0,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: '.text-reveal',
        start: 'top 80%',
        toggleActions: 'play none none reverse',
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert())
</script>
```

### 5. Stagger Grid (Anime.js)

```astro
---
const items = Array.from({ length: 12 }, (_, i) => i)
---
<div class="grid grid-cols-4 gap-4 p-8">
  {items.map((i) => (
    <div class="grid-item aspect-square bg-gray-800 opacity-0" data-index={i} />
  ))}
</div>

<script>
  import { animate, stagger } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate('.grid-item', {
          opacity: [0, 1],
          translateY: [40, 0],
          delay: stagger(60),
          duration: 600,
          ease: 'out(3)',
        })
        observer.disconnect()
      }
    })
  }, { threshold: 0.2 })

  const grid = document.querySelector('.grid-item')
  if (grid) observer.observe(grid)
</script>
```

### 6. Glitch Text (CSS + GSAP)

```astro
---
interface Props { text: string }
const { text } = Astro.props
---
<div class="glitch relative font-mono text-5xl font-black select-none">
  <span class="relative z-10">{text}</span>
  <span class="g-layer absolute inset-0 text-cyan-400 mix-blend-multiply" aria-hidden="true">{text}</span>
  <span class="g-layer absolute inset-0 text-red-400 mix-blend-multiply" aria-hidden="true">{text}</span>
</div>

<script>
  import gsap from 'gsap'

  const layers = document.querySelectorAll('.g-layer')

  const tl = gsap.timeline({ repeat: -1, repeatDelay: 3 })
  tl.to(layers[0], { x: -5, duration: 0.05, ease: 'none' }, 0)
    .to(layers[0], { x: 5, duration: 0.05 }, 0.05)
    .to(layers[0], { x: 0, duration: 0.05 }, 0.1)
    .to(layers[1], { x: 5, duration: 0.05 }, 0.02)
    .to(layers[1], { x: -5, duration: 0.05 }, 0.07)
    .to(layers[1], { x: 0, duration: 0.05 }, 0.12)

  document.addEventListener('astro:before-swap', () => tl.kill())
</script>
```

### 7. Fractal Tree (Canvas 2D)

```astro
---
interface Props { depth?: number; angle?: number }
const { depth = 10, angle = 25 } = Astro.props
---
<canvas id="fractal-canvas" class="w-full h-full bg-gray-950"></canvas>

<script define:vars={{ depth, angle }}>
  const canvas = document.getElementById('fractal-canvas')
  const ctx = canvas.getContext('2d')
  canvas.width = canvas.offsetWidth * 2
  canvas.height = canvas.offsetHeight * 2
  ctx.scale(2, 2)

  let progress = 0
  let raf = 0

  function branch(x, y, len, a, d) {
    if (d > depth || len < 2) return
    const dp = Math.max(0, Math.min(1, progress * depth - d))
    if (dp <= 0) return
    const ex = x + Math.cos(a * Math.PI / 180) * len * dp
    const ey = y - Math.sin(a * Math.PI / 180) * len * dp
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey)
    ctx.strokeStyle = `hsl(${120 + d * 15}, 60%, ${30 + d * 5}%)`
    ctx.lineWidth = Math.max(1, (depth - d) * 1.5); ctx.stroke()
    branch(ex, ey, len * 0.72, a + angle, d + 1)
    branch(ex, ey, len * 0.72, a - angle, d + 1)
  }

  function animate() {
    progress = Math.min(1, progress + 0.008)
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
    branch(canvas.offsetWidth / 2, canvas.offsetHeight, canvas.offsetHeight * 0.28, 90, 0)
    if (progress < 1) raf = requestAnimationFrame(animate)
  }

  animate()

  document.addEventListener('astro:before-swap', () => cancelAnimationFrame(raf))
</script>
```

### 8. Geometric Dissection (SVG + GSAP)

```astro
---
---
<div class="flex flex-col items-center gap-4">
  <svg id="dissection-svg" viewBox="-10 -10 220 200" class="w-64 h-64">
    <path id="d-A" d="M 0,173 L 50,87 L 100,173 Z" fill="#f43f5e" stroke="#000" stroke-width="1.5" />
    <path id="d-B" d="M 50,87 L 100,0 L 150,87 Z" fill="#8b5cf6" stroke="#000" stroke-width="1.5" />
    <path id="d-C" d="M 100,173 L 150,87 L 200,173 Z" fill="#06b6d4" stroke="#000" stroke-width="1.5" />
    <path id="d-D" d="M 50,87 L 100,173 L 150,87 L 100,0 Z" fill="#f59e0b" stroke="#000" stroke-width="1.5" />
  </svg>
  <button id="dissection-btn" class="px-6 py-2 bg-white text-black font-mono text-sm">△</button>
</div>

<script>
  import gsap from 'gsap'

  const pieces = [
    { id: 'A', tri: 'M 0,173 L 50,87 L 100,173 Z', sq: 'M 0,0 L 100,0 L 100,87 L 0,87 Z' },
    { id: 'B', tri: 'M 50,87 L 100,0 L 150,87 Z', sq: 'M 100,0 L 200,0 L 200,87 L 100,87 Z' },
    { id: 'C', tri: 'M 100,173 L 150,87 L 200,173 Z', sq: 'M 0,87 L 100,87 L 100,173 L 0,173 Z' },
    { id: 'D', tri: 'M 50,87 L 100,173 L 150,87 L 100,0 Z', sq: 'M 100,87 L 200,87 L 200,173 L 100,173 Z' },
  ]

  const btn = document.getElementById('dissection-btn')!
  let isSquare = false

  btn.addEventListener('click', () => {
    isSquare = !isSquare
    pieces.forEach((p, i) => {
      const el = document.getElementById(`d-${p.id}`)
      if (el) gsap.to(el, { attr: { d: isSquare ? p.sq : p.tri }, duration: 1.5, ease: 'power2.inOut', delay: i * 0.15 })
    })
    btn.textContent = isSquare ? '□' : '△'
  })
</script>
```

### 9. Brutalist Grid (vanilla Motion + IntersectionObserver)

```astro
---
interface Props { items: string[] }
const { items } = Astro.props
---
<div class="grid grid-cols-3 border-2 border-black">
  {items.map((item, i) => (
    <div
      class="brutalist-cell border-2 border-black p-6 font-mono font-black uppercase text-2xl opacity-0 cursor-pointer"
      data-index={i}
    >
      {item}
    </div>
  ))}
</div>

<script>
  import { animate, inView } from 'motion'

  inView('.brutalist-cell', ({ target }) => {
    const i = Number((target as HTMLElement).dataset.index)
    animate(target, { opacity: 1 }, { duration: 0.01, delay: i * 0.1 })
  })

  document.querySelectorAll<HTMLElement>('.brutalist-cell').forEach((cell, i) => {
    cell.addEventListener('mouseenter', () => {
      animate(cell, { backgroundColor: '#000', color: '#BAFF39' }, { duration: 0 })
    })
    cell.addEventListener('mouseleave', () => {
      animate(cell, { backgroundColor: 'transparent', color: '#000' }, { duration: 0 })
    })
  })
</script>
```

---

## Astro-specific Patterns

### Pass Frontmatter Data to Scripts

```astro
---
const config = { speed: 1.5, color: '#BAFF39' }
---
<canvas id="canvas"></canvas>

<script define:vars={{ config }}>
  // config is available here as a plain JS object
  console.log(config.speed) // 1.5
</script>
```

### Scoped Animations with gsap.context()

Always scope to a container to avoid targeting elements on other pages:

```astro
---
---
<section id="my-section">
  <div class="box"></div>
</section>

<script>
  import gsap from 'gsap'

  // Scope all selectors to #my-section
  const ctx = gsap.context(() => {
    gsap.to('.box', { x: 100, duration: 1 })
  }, '#my-section')

  document.addEventListener('astro:before-swap', () => ctx.revert())
</script>
```

### Astro View Transitions + GSAP Page Transitions

```astro
---
// src/layouts/Layout.astro
---
<html>
  <head>
    <ViewTransitions />
  </head>
  <body>
    <div id="page-wrapper">
      <slot />
    </div>
  </body>
</html>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  document.addEventListener('astro:page-load', () => {
    // Reveal on enter
    gsap.from('#page-wrapper', {
      opacity: 0,
      y: 20,
      duration: 0.5,
      ease: 'power2.out',
      clearProps: 'all',
    })
    ScrollTrigger.refresh()
  })

  document.addEventListener('astro:before-swap', () => {
    ScrollTrigger.getAll().forEach(t => t.kill())
  })
</script>
```

### React Islands (when needed)

If a component truly needs React state, use Astro Islands:

```astro
---
import ReactAnimation from '../components/ReactAnimation.tsx'
---

<!-- client:load → hydrate immediately -->
<ReactAnimation client:load />

<!-- client:visible → hydrate when in viewport -->
<ReactAnimation client:visible />

<!-- client:idle → hydrate when browser is idle -->
<ReactAnimation client:idle />
```

Note: For React islands, use the React-specific patterns (useGSAP, useLenis, etc.) from the original skill. Prefer vanilla Astro scripts where possible.

---

## Design Philosophy (Quick Reference)

| Style | Motion Feel | Easing | Typography | Key Trait |
|-------|------------|--------|------------|-----------|
| Brutalist | Hard, instant, jarring | `none` / `steps()` | Mono, 15-30vw | Raw honesty |
| Minimalist | Smooth, subtle, slow | `power2.out` | Sans-serif light | Purposeful restraint |
| Abstract | Noise-driven, parametric | Organic/sine | Varies | Mathematical beauty |
| Neo-Brutalist | Bold but controlled | `power1.out` | Mono + color | Brutalism + restraint |

See [references/design-philosophy.md](references/design-philosophy.md) for full guide with color palettes.

---

## Easing Reference

| Feel | GSAP | Motion (vanilla) |
|------|------|--------|
| Smooth | `power2.out` | `{ ease: [0.16, 1, 0.3, 1] }` |
| Snappy | `power4.out` | `{ ease: [0.87, 0, 0.13, 1] }` |
| Bouncy | `back.out(1.7)` | `{ type: 'spring', stiffness: 300, damping: 20 }` |
| Dramatic | `power4.inOut` | `{ ease: [0.76, 0, 0.24, 1] }` |

## Timing

- Micro-interactions: 150–300ms
- UI transitions: 300–500ms
- Page transitions: 500–800ms
- Stagger: 0.02–0.1s per item

---

## Accessibility

```js
// Check prefers-reduced-motion before animating
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!reduced) {
  gsap.to('.element', { x: 100, duration: 0.8 })
}
```

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Performance Rules

1. Only animate `transform` and `opacity`
2. Use `will-change` sparingly — set before animation, remove after
3. Always cleanup: `ctx.revert()` + `document.addEventListener('astro:before-swap', ...)`
4. Scope GSAP selectors with `gsap.context(fn, scopeElement)`
5. Use `ScrollTrigger.refresh()` after DOM changes
6. Kill all ScrollTriggers on `astro:before-swap`

---

## Common Pitfalls

1. **Not connecting Lenis to ScrollTrigger** — ScrollTrigger won't track smooth scroll position
2. **Missing `astro:before-swap` cleanup** — animations and events leak between pages
3. **Not scoping `gsap.context()`** — selectors match elements on wrong pages
4. **Using `DOMContentLoaded` with View Transitions** — fires only once on first load; use `astro:page-load`
5. **Not calling `ScrollTrigger.refresh()`** after layout changes or page transitions
6. **Forgetting `define:vars` for dynamic data** — frontmatter values aren't accessible in `<script>` without it

---

## Testing Checklist

- [ ] 60fps on scroll (Chrome DevTools Performance)
- [ ] Keyboard navigation works
- [ ] Respects `prefers-reduced-motion`
- [ ] No layout shifts (CLS)
- [ ] Mobile touch works
- [ ] ScrollTrigger markers removed in production
- [ ] No memory leaks — animations cleaned up on `astro:before-swap`
- [ ] View Transitions work on back/forward navigation

---

## Inspiration

Active Theory, Studio Freight, Locomotive, Resn, Aristide Benoist, Immersive Garden
