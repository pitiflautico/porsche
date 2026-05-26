# Anime.js 4.0 — Astro Patterns

Vanilla Anime.js 4.0 patterns for Astro `<script>` tags. No createScope needed unless managing multiple instances.

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [Basic Animations](#basic-animations)
3. [Timeline](#timeline)
4. [Stagger](#stagger)
5. [Scroll Animations](#scroll-animations)
6. [Text Animations](#text-animations)
7. [SVG Animations](#svg-animations)
8. [Draggable](#draggable)
9. [View Transitions Cleanup](#view-transitions-cleanup)

---

## Installation & Setup

```bash
npm install animejs
```

```js
// v4 named imports
import {
  animate,
  createTimeline,
  createScope,
  createSpring,
  createDraggable,
  stagger,
  svg,
  utils,
} from 'animejs'
```

---

## Basic Animations

### Simple Animation

```astro
---
---
<div class="box w-20 h-20 bg-white"></div>

<script>
  import { animate } from 'animejs'

  animate('.box', {
    translateX: 250,
    rotate: '1turn',
    duration: 800,
    ease: 'out(3)',
  })
</script>
```

### From/To Values

```js
animate('.element', {
  translateX: [0, 250],
  opacity: [0, 1],
  scale: [0.5, 1],
  duration: 800,
})
```

### Keyframes

```js
animate('.element', {
  keyframes: [
    { translateX: 0, scale: 1 },
    { translateX: 100, scale: 1.2 },
    { translateX: 200, scale: 1 },
    { translateX: 250, scale: 0.8 },
  ],
  duration: 2000,
  ease: 'inOut(2)',
})
```

### Callbacks

```js
animate('.element', {
  translateX: 250,
  duration: 1000,
  onBegin: () => console.log('Started'),
  onUpdate: (anim) => console.log(anim.progress),
  onComplete: () => console.log('Done'),
}).then(() => {
  console.log('Promise resolved')
})
```

### Playback Controls

```js
const anim = animate('.element', { translateX: 250, autoplay: false })

anim.play()
anim.pause()
anim.resume()
anim.reverse()
anim.restart()
anim.seek(500)  // Seek to 500ms
anim.reset()
```

---

## Timeline

### Basic Timeline

```astro
---
---
<section id="intro">
  <h1 class="tl-title opacity-0 text-6xl font-black">Title</h1>
  <p class="tl-sub opacity-0 text-xl">Subtitle</p>
  <a class="tl-cta opacity-0 px-8 py-4 bg-white text-black">CTA</a>
</section>

<script>
  import { createTimeline } from 'animejs'

  const tl = createTimeline({
    defaults: { duration: 500, ease: 'out(3)' },
  })

  tl.add('.tl-title', { opacity: [0, 1], translateY: [30, 0] })
    .add('.tl-sub',   { opacity: [0, 1], translateY: [20, 0] }, '-=300')
    .add('.tl-cta',   { opacity: [0, 1], scale: [0.9, 1] }, '-=200')
</script>
```

### Scroll-triggered Timeline with IntersectionObserver

```astro
---
---
<section id="reveal-tl" class="p-20">
  <h2 class="rtl-heading opacity-0 text-5xl font-black">Heading</h2>
  <p class="rtl-body opacity-0 mt-4">Body copy goes here.</p>
</section>

<script>
  import { createTimeline } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const tl = createTimeline({ defaults: { ease: 'out(4)', duration: 700 } })
        tl.add('.rtl-heading', { opacity: [0, 1], translateY: [40, 0] })
          .add('.rtl-body',    { opacity: [0, 1], translateY: [20, 0] }, '-=400')
        observer.disconnect()
      }
    })
  }, { threshold: 0.3 })

  const section = document.getElementById('reveal-tl')
  if (section) observer.observe(section)
</script>
```

---

## Stagger

### Basic Stagger

```astro
---
const items = Array.from({ length: 8 })
---
<ul id="stagger-list">
  {items.map((_, i) => (
    <li class="stagger-item opacity-0 p-4 bg-gray-800 mb-2">Item {i + 1}</li>
  ))}
</ul>

<script>
  import { animate, stagger } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animate('.stagger-item', {
        opacity: [0, 1],
        translateY: [50, 0],
        delay: stagger(100),
        duration: 600,
      })
      observer.disconnect()
    }
  }, { threshold: 0.2 })

  const list = document.getElementById('stagger-list')
  if (list) observer.observe(list)
</script>
```

### Grid Stagger

```astro
---
const items = Array.from({ length: 16 })
---
<div id="stagger-grid" class="grid grid-cols-4 gap-4 p-8">
  {items.map(() => (
    <div class="grid-item aspect-square bg-gray-800 opacity-0"></div>
  ))}
</div>

<script>
  import { animate, stagger } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animate('.grid-item', {
        scale: [0, 1],
        opacity: [0, 1],
        delay: stagger(50, {
          grid: [4, 4],
          from: 'center',
        }),
        duration: 600,
        ease: 'out(3)',
      })
      observer.disconnect()
    }
  }, { threshold: 0.2 })

  const grid = document.getElementById('stagger-grid')
  if (grid) observer.observe(grid)
</script>
```

---

## Scroll Animations

Anime.js v4 uses IntersectionObserver for scroll triggers (no built-in ScrollTrigger equiv). For complex scroll pinning, combine with GSAP ScrollTrigger.

### Reveal on Scroll

```astro
---
const sections = ['Section 1', 'Section 2', 'Section 3']
---
<div id="reveal-wrapper">
  {sections.map((s) => (
    <div class="reveal-section opacity-0 h-screen flex items-center justify-center text-5xl font-black">
      {s}
    </div>
  ))}
</div>

<script>
  import { animate } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target, {
          opacity: [0, 1],
          translateY: [60, 0],
          duration: 800,
          ease: 'out(3)',
        })
        observer.unobserve(entry.target)
      }
    })
  }, { threshold: 0.2 })

  document.querySelectorAll('.reveal-section').forEach((el) => observer.observe(el))
</script>
```

---

## Text Animations

### Character Reveal

```astro
---
interface Props { text: string }
const { text } = Astro.props
---
<div class="text-chars overflow-hidden">
  {text.split('').map((char) => (
    <span class="char inline-block opacity-0">
      {char === ' ' ? '\u00A0' : char}
    </span>
  ))}
</div>

<script>
  import { animate, stagger } from 'animejs'
  import type { AnimeAnimParams } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animate('.char', {
        opacity: [0, 1],
        translateY: [50, 0],
        rotateX: [-90, 0],
        delay: stagger(30),
        duration: 600,
        ease: 'out(3)',
      })
      observer.disconnect()
    }
  }, { threshold: 0.5 })

  const container = document.querySelector('.text-chars')
  if (container) observer.observe(container)
</script>
```

### Word Reveal

```astro
---
interface Props { text: string }
const { text } = Astro.props
---
<p class="word-reveal-wrap">
  {text.split(' ').map((word) => (
    <span class="inline-block overflow-hidden mr-2">
      <span class="word inline-block opacity-0">{word}</span>
    </span>
  ))}
</p>

<script>
  import { animate, stagger } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animate('.word', {
        opacity: [0, 1],
        translateY: ['100%', '0%'],
        delay: stagger(80),
        duration: 800,
        ease: 'out(4)',
      })
      observer.disconnect()
    }
  }, { threshold: 0.3 })

  const wrap = document.querySelector('.word-reveal-wrap')
  if (wrap) observer.observe(wrap)
</script>
```

---

## SVG Animations

### Path Drawing

```astro
---
---
<svg id="draw-svg" viewBox="0 0 100 100" class="w-64 h-64">
  <path class="draw-path" d="M10,50 Q50,10 90,50 T90,90" fill="none" stroke="white" stroke-width="2" />
</svg>

<script>
  import { animate, svg } from 'animejs'

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      const drawable = svg.createDrawable('.draw-path')
      animate(drawable, {
        draw: ['0 0', '0 1'],
        duration: 2000,
        ease: 'inOut(2)',
      })
      observer.disconnect()
    }
  }, { threshold: 0.3 })

  const svgEl = document.getElementById('draw-svg')
  if (svgEl) observer.observe(svgEl)
</script>
```

### SVG Morphing

```astro
---
---
<svg viewBox="0 0 100 100" class="w-64 h-64">
  <path id="morph-path" d="M50,10 L90,90 L10,90 Z" fill="white" />
</svg>
<button id="morph-btn" class="mt-4 px-6 py-2 bg-white text-black font-mono">Morph</button>

<script>
  import { animate, svg } from 'animejs'

  const pathEl = document.getElementById('morph-path') as SVGPathElement
  const btn = document.getElementById('morph-btn')!

  const shapes = [
    'M50,10 L90,90 L10,90 Z',                                        // Triangle
    'M50,10 A40,40 0 1,1 50,90 A40,40 0 1,1 50,10',                  // Circle
    'M10,10 L90,10 L90,90 L10,90 Z',                                  // Square
  ]
  let current = 0

  btn.addEventListener('click', () => {
    current = (current + 1) % shapes.length
    const morph = svg.createMorph(pathEl)
    animate(morph, {
      to: shapes[current],
      duration: 1000,
      ease: 'inOut(2)',
    })
  })
</script>
```

### Motion Path

```astro
---
---
<div class="relative h-64 w-full">
  <svg class="absolute inset-0 w-full h-full">
    <path id="motion-path" d="M0,100 Q250,0 500,100" fill="none" stroke="rgba(255,255,255,0.1)" />
  </svg>
  <div id="motion-dot" class="absolute w-4 h-4 bg-white rounded-full"></div>
</div>

<script>
  import { animate, svg } from 'animejs'

  const dot = document.getElementById('motion-dot')!
  const motionPath = svg.createMotionPath('#motion-path')

  animate(dot, {
    translateX: motionPath.x,
    translateY: motionPath.y,
    rotate: motionPath.angle,
    duration: 3000,
    ease: 'linear',
    loop: true,
  })
</script>
```

---

## Draggable

```astro
---
---
<div id="drag-container" class="relative w-full h-64 bg-gray-900 overflow-hidden">
  <div id="drag-box" class="absolute top-8 left-8 w-20 h-20 bg-white cursor-grab font-mono text-black text-xs flex items-center justify-center">
    Drag me
  </div>
</div>

<script>
  import { createDraggable } from 'animejs'

  const draggable = createDraggable('#drag-box', {
    container: '#drag-container',
    releaseEase: 'out(3)',
    releaseStiffness: 50,
  })

  document.addEventListener('astro:before-swap', () => draggable.revert(), { once: true })
</script>
```

---

## View Transitions Cleanup

When using Anime.js with Astro View Transitions, clean up ongoing animations:

```astro
---
---
<script>
  import { animate } from 'animejs'

  const animations: ReturnType<typeof animate>[] = []

  function init() {
    const anim = animate('.box', {
      translateX: [0, 200],
      loop: true,
      duration: 1000,
    })
    animations.push(anim)
  }

  function destroy() {
    animations.forEach((a) => a.pause())
    animations.length = 0
  }

  document.addEventListener('astro:page-load', init)
  document.addEventListener('astro:before-swap', destroy)
  init()
</script>
```

---

## Easing Reference (v4)

```js
ease: 'linear'
ease: 'in(2)'       // Power in
ease: 'out(2)'      // Power out (default)
ease: 'inOut(2)'    // Power in-out
ease: 'out(4)'      // Stronger ease out
ease: 'cubicBezier(0.76, 0, 0.24, 1)'
```

### Spring Easing

```js
import { createSpring } from 'animejs'

const spring = createSpring({ mass: 1, stiffness: 100, damping: 10 })

animate('.element', { translateX: 250, ease: spring })
```

---

## v3 → v4 Migration

| v3 | v4 |
|----|----|
| `anime({ targets, ...props })` | `animate(targets, { ...props })` |
| `easing: 'easeOutQuad'` | `ease: 'out(2)'` |
| `direction: 'alternate'` | `alternate: true` |
| `direction: 'reverse'` | `reversed: true` |
| `update` callback | `onUpdate` callback |
| `complete` callback | `onComplete` callback |
| `.finished.then()` | `.then()` |
| `anime.timeline()` | `createTimeline()` |
| `anime.stagger()` | `stagger()` |
