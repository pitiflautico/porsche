# Motion — Vanilla Astro Patterns

Vanilla Motion animation patterns for Astro using `motion` package's DOM API. No React required.

> Motion's vanilla API (`animate`, `scroll`, `inView`, `spring`, `timeline`) works perfectly in Astro `<script>` tags.

## Table of Contents
1. [Setup](#setup)
2. [Basic Animations](#basic-animations)
3. [Scroll Animations](#scroll-animations)
4. [InView Animations](#inview-animations)
5. [Timeline](#timeline)
6. [Gestures](#gestures)
7. [Page Transitions](#page-transitions)
8. [Text Animations](#text-animations)
9. [Springs & Easing](#springs--easing)

---

## Setup

```bash
npm install motion
```

```js
// Vanilla imports — no /react subpath
import { animate, scroll, inView, timeline, spring, stagger } from 'motion'
```

---

## Basic Animations

### Simple Animation

```astro
---
---
<div class="box w-20 h-20 bg-white"></div>

<script>
  import { animate } from 'motion'

  animate('.box', { opacity: [0, 1], y: [50, 0] }, { duration: 0.6, easing: [0.16, 1, 0.3, 1] })
</script>
```

### Variants Pattern (manual)

Motion's vanilla API doesn't have built-in variants, but you can replicate the pattern:

```astro
---
const items = ['Alpha', 'Beta', 'Gamma', 'Delta']
---
<ul id="list">
  {items.map((item) => (
    <li class="list-item opacity-0">{item}</li>
  ))}
</ul>

<script>
  import { animate, stagger } from 'motion'

  animate(
    '.list-item',
    { opacity: [0, 1], y: [20, 0] },
    { delay: stagger(0.1), duration: 0.5, easing: 'ease-out' }
  )
</script>
```

### Keyframes

```js
import { animate } from 'motion'

animate('.element', {
  x: [0, 100, 200, 100, 0],
  rotate: [0, 45, 90, 45, 0],
}, { duration: 2, easing: 'ease-in-out' })
```

### Callbacks

```js
const animation = animate('.element', { x: 200 }, { duration: 0.8 })

animation.finished.then(() => {
  console.log('Done')
})
```

### Playback Controls

```js
const anim = animate('.element', { x: 200 }, { duration: 1 })

anim.pause()
anim.play()
anim.stop()
anim.cancel()
anim.finish()

// Seek
anim.currentTime = 0.5 // 500ms in
```

---

## Scroll Animations

### Scroll Progress (global)

```astro
---
---
<div id="progress-bar" class="fixed top-0 left-0 h-1 bg-white z-50 origin-left"></div>

<script>
  import { scroll, animate } from 'motion'

  scroll(
    animate('#progress-bar', { scaleX: [0, 1] }, { easing: 'linear' })
  )
</script>
```

### Scroll-Linked Element

```astro
---
---
<section id="parallax-section" class="relative h-[200vh] overflow-hidden">
  <div id="parallax-img" class="absolute inset-0 bg-cover bg-center scale-110"></div>
</section>

<script>
  import { scroll, animate } from 'motion'

  scroll(
    animate('#parallax-img', { y: ['-10%', '10%'] }, { easing: 'linear' }),
    { target: document.getElementById('parallax-section')! }
  )
</script>
```

### Scroll with Custom Range

```astro
---
---
<div id="fade-section" class="h-screen flex items-center justify-center">
  <h2 id="fade-title" class="text-5xl font-black">Fade me</h2>
</div>

<script>
  import { scroll, animate } from 'motion'

  const title = document.getElementById('fade-title')!
  const section = document.getElementById('fade-section')!

  scroll(
    animate(title, { opacity: [0, 1, 1, 0] }, { easing: 'linear' }),
    {
      target: section,
      offset: ['start end', 'center center', 'center center', 'end start'],
    }
  )
</script>
```

---

## InView Animations

### Basic Reveal

```astro
---
const cards = ['Card 1', 'Card 2', 'Card 3']
---
<div id="cards-section">
  {cards.map((card) => (
    <div class="reveal-card opacity-0 p-8 bg-gray-800 mb-4">{card}</div>
  ))}
</div>

<script>
  import { inView, animate } from 'motion'

  inView('.reveal-card', ({ target }) => {
    animate(target, { opacity: [0, 1], y: [50, 0] }, { duration: 0.6, easing: [0.16, 1, 0.3, 1] })
    // Returning nothing = animate once (no reverse on exit)
  })
</script>
```

### Toggle on Enter/Leave

```astro
---
---
<div class="toggle-box w-40 h-40 bg-gray-800 opacity-50">Scroll over me</div>

<script>
  import { inView, animate } from 'motion'

  inView('.toggle-box', ({ target }) => {
    animate(target, { opacity: 1, scale: 1.05 })

    // Return cleanup to reverse on leave
    return () => {
      animate(target, { opacity: 0.5, scale: 1 })
    }
  }, { margin: '-100px' })
</script>
```

### Stagger Grid on Enter

```astro
---
const items = Array.from({ length: 12 })
---
<div id="stagger-grid" class="grid grid-cols-4 gap-4 p-8">
  {items.map(() => (
    <div class="stagger-item aspect-square bg-gray-800 opacity-0"></div>
  ))}
</div>

<script>
  import { inView, animate, stagger } from 'motion'

  inView('#stagger-grid', () => {
    animate(
      '.stagger-item',
      { opacity: [0, 1], y: [40, 0] },
      { delay: stagger(0.05), duration: 0.5, easing: [0.16, 1, 0.3, 1] }
    )
  }, { amount: 0.2 })
</script>
```

---

## Timeline

```astro
---
---
<section id="tl-section">
  <h1 class="tl-title text-6xl font-black opacity-0">Title</h1>
  <p class="tl-sub text-xl opacity-0">Subtitle</p>
  <button class="tl-cta opacity-0 px-8 py-4 bg-white text-black">CTA</button>
</section>

<script>
  import { timeline, inView } from 'motion'

  inView('#tl-section', () => {
    timeline([
      ['.tl-title', { opacity: [0, 1], y: [30, 0] }, { duration: 0.6 }],
      ['.tl-sub',   { opacity: [0, 1], y: [20, 0] }, { duration: 0.5, at: '-0.3' }],
      ['.tl-cta',   { opacity: [0, 1], scale: [0.95, 1] }, { duration: 0.4, at: '-0.2' }],
    ])
  })
</script>
```

---

## Gestures

### Magnetic Button

```astro
---
---
<button class="magnetic-btn px-8 py-4 bg-white text-black rounded-full font-mono">
  <slot />
</button>

<script>
  import { animate } from 'motion'
  import { spring } from 'motion'

  document.querySelectorAll<HTMLElement>('.magnetic-btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = btn.getBoundingClientRect()
      const x = (e.clientX - left - width / 2) * 0.3
      const y = (e.clientY - top - height / 2) * 0.3
      animate(btn, { x, y }, { type: spring({ stiffness: 150, damping: 15 }) })
    })

    btn.addEventListener('mouseleave', () => {
      animate(btn, { x: 0, y: 0 }, { type: spring({ stiffness: 150, damping: 15 }) })
    })
  })
</script>
```

### Hover Card Tilt

```astro
---
---
<div class="tilt-card w-64 h-80 bg-gray-800 rounded-xl cursor-pointer perspective-[800px]"></div>

<script>
  import { animate } from 'motion'

  document.querySelectorAll<HTMLElement>('.tilt-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const { left, top, width, height } = card.getBoundingClientRect()
      const x = (e.clientY - top - height / 2) / height * 20
      const y = -(e.clientX - left - width / 2) / width * 20
      animate(card, { rotateX: x, rotateY: y }, { duration: 0.1 })
    })

    card.addEventListener('mouseleave', () => {
      animate(card, { rotateX: 0, rotateY: 0 }, { duration: 0.4, easing: [0.16, 1, 0.3, 1] })
    })
  })
</script>
```

### Scale on Hover

```astro
---
---
<div class="hover-item w-40 h-40 bg-white cursor-pointer"></div>

<script>
  import { animate } from 'motion'

  document.querySelectorAll<HTMLElement>('.hover-item').forEach((el) => {
    el.addEventListener('mouseenter', () => {
      animate(el, { scale: 1.05 }, { duration: 0.2, easing: 'ease-out' })
    })
    el.addEventListener('mouseleave', () => {
      animate(el, { scale: 1 }, { duration: 0.3, easing: [0.16, 1, 0.3, 1] })
    })
    el.addEventListener('mousedown', () => {
      animate(el, { scale: 0.97 }, { duration: 0.1 })
    })
    el.addEventListener('mouseup', () => {
      animate(el, { scale: 1.05 }, { duration: 0.1 })
    })
  })
</script>
```

---

## Page Transitions

### Fade Page (Astro View Transitions)

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
    <main id="page-content">
      <slot />
    </main>
  </body>
</html>

<script>
  import { animate } from 'motion'

  document.addEventListener('astro:page-load', () => {
    animate(
      '#page-content',
      { opacity: [0, 1], y: [16, 0] },
      { duration: 0.4, easing: [0.16, 1, 0.3, 1] }
    )
  })
</script>
```

### Wipe Transition

```astro
---
// src/layouts/Layout.astro
---
<div id="wipe-overlay" class="fixed inset-0 bg-black z-[9999] pointer-events-none -translate-y-full"></div>

<script>
  import { animate } from 'motion'

  document.addEventListener('astro:before-preparation', async (e) => {
    const overlay = document.getElementById('wipe-overlay')!
    await animate(overlay, { y: ['100%', '0%'] }, { duration: 0.4, easing: [0.76, 0, 0.24, 1] }).finished
  })

  document.addEventListener('astro:page-load', () => {
    const overlay = document.getElementById('wipe-overlay')!
    animate(overlay, { y: ['0%', '-100%'] }, { duration: 0.4, easing: [0.76, 0, 0.24, 1] })
  })
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
<div class="char-reveal">
  {text.split('').map((char) => (
    <span class="char inline-block opacity-0">
      {char === ' ' ? '\u00A0' : char}
    </span>
  ))}
</div>

<script>
  import { inView, animate, stagger } from 'motion'

  inView('.char-reveal', () => {
    animate(
      '.char',
      { opacity: [0, 1], y: [40, 0], rotateX: [-90, 0] },
      { delay: stagger(0.03), duration: 0.5, easing: [0.16, 1, 0.3, 1] }
    )
  })
</script>
```

### Word Reveal

```astro
---
interface Props { text: string }
const { text } = Astro.props
---
<p class="word-reveal">
  {text.split(' ').map((word) => (
    <span class="inline-block overflow-hidden mr-2">
      <span class="word inline-block opacity-0 translate-y-full">{word}</span>
    </span>
  ))}
</p>

<script>
  import { inView, animate, stagger } from 'motion'

  inView('.word-reveal', () => {
    animate(
      '.word',
      { opacity: [0, 1], y: ['100%', '0%'] },
      { delay: stagger(0.06), duration: 0.6, easing: [0.16, 1, 0.3, 1] }
    )
  })
</script>
```

---

## Springs & Easing

### Spring Configuration

```js
import { animate, spring } from 'motion'

// Method 1: spring() as type
animate('.element', { x: 200 }, {
  type: spring({ stiffness: 300, damping: 20 })
})

// Method 2: spring shorthand
animate('.element', { x: 200 }, {
  type: 'spring',
  stiffness: 300,
  damping: 20,
  mass: 1,
})
```

### Easing Reference

```js
// Smooth out (recommended for most UI)
easing: [0.16, 1, 0.3, 1]

// Snappy (dramatic entrance)
easing: [0.87, 0, 0.13, 1]

// Ease in-out
easing: [0.76, 0, 0.24, 1]

// Standard easeOut
easing: 'ease-out'

// Linear (for scroll-linked)
easing: 'linear'

// Spring (bouncy)
type: 'spring', stiffness: 300, damping: 20
```

---

## `prefers-reduced-motion`

```js
import { animate } from 'motion'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!reduced) {
  animate('.animated', { opacity: [0, 1], y: [30, 0] }, { duration: 0.6 })
} else {
  animate('.animated', { opacity: [0, 1] }, { duration: 0.2 })
}
```

---

## When to Use Motion vs GSAP

| Use Motion | Use GSAP |
|------------|----------|
| `inView` scroll reveals | Complex ScrollTrigger setups |
| Simple `animate()` calls | Pinned / horizontal scroll |
| Page fade/wipe transitions | SplitText, DrawSVG |
| Spring-based interactions | Complex timelines |
| Stagger lists | Three.js object animation |
| Hover/cursor effects | ScrollTrigger.batch |
