# Performance Optimization — Astro

Best practices for 60fps animations in Astro. Vanilla JS patterns, no React overhead.

## Table of Contents
1. [Core Principles](#core-principles)
2. [GPU Acceleration](#gpu-acceleration)
3. [ScrollTrigger Optimization](#scrolltrigger-optimization)
4. [Memory Management & Cleanup](#memory-management--cleanup)
5. [Lazy Loading](#lazy-loading)
6. [Mobile Optimization](#mobile-optimization)
7. [Monitoring & Debugging](#monitoring--debugging)

---

## Core Principles

### The Golden Rules

1. **Only animate `transform` and `opacity`** — GPU-accelerated, no layout recalculation
2. **Avoid animating layout properties** — `width`, `height`, `top`, `left`, `margin` trigger reflow
3. **Use `will-change` sparingly** — Apply before animation, remove after
4. **Batch DOM reads/writes** — Avoid forced synchronous layouts
5. **Clean up on `astro:before-swap`** — Kill ScrollTriggers, cancel RAF, destroy renderers

### What Triggers What

| Property | Paint | Layout | Composite |
|----------|-------|--------|-----------|
| `transform` | No | No | Yes ✓ |
| `opacity` | No | No | Yes ✓ |
| `filter` | Yes | No | Yes |
| `width/height` | Yes | Yes | Yes |
| `top/left` | Yes | Yes | Yes |
| `background-color` | Yes | No | Yes |

---

## GPU Acceleration

### Prefer transform over position

```js
// ✓ GPU-accelerated
gsap.to(element, { x: 100, y: 50 })

// ✗ Triggers layout
gsap.to(element, { top: 100, left: 50 })
```

### will-change

```js
// Set before animation
gsap.set(element, { willChange: 'transform' })

gsap.to(element, {
  x: 100,
  duration: 1,
  onComplete: () => {
    // Remove after — don't leave it on permanently
    gsap.set(element, { willChange: 'auto' })
  },
})
```

### CSS GPU Layer

```css
/* Force GPU for frequently animated elements */
.animated-element {
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

---

## ScrollTrigger Optimization

### Global Config (once, in layout script)

```js
ScrollTrigger.config({
  limitCallbacks: true,
  ignoreMobileResize: true,
})
ScrollTrigger.normalizeScroll(true)
```

### Batch Similar Animations

```js
// ✗ Individual ScrollTriggers (expensive)
document.querySelectorAll('.item').forEach(item => {
  gsap.from(item, { opacity: 0, scrollTrigger: { trigger: item } })
})

// ✓ Batch them
ScrollTrigger.batch('.item', {
  onEnter: (elements) => {
    gsap.from(elements, { opacity: 0, y: 50, stagger: 0.1 })
  },
})
```

### Lazy ScrollTrigger (near-viewport only)

```astro
---
---
<section id="lazy-section">
  <div class="lazy-item opacity-0 p-8">Content</div>
</section>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  let triggered = false

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !triggered) {
      triggered = true
      observer.disconnect()

      const ctx = gsap.context(() => {
        gsap.from('.lazy-item', {
          opacity: 0,
          y: 50,
          scrollTrigger: {
            trigger: '#lazy-section',
            start: 'top 80%',
          },
        })
      }, '#lazy-section')

      document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
    }
  }, { rootMargin: '200px' })

  const section = document.getElementById('lazy-section')
  if (section) observer.observe(section)
</script>
```

### Disable Markers in Production

```js
const isDev = import.meta.env.DEV  // Astro/Vite env

gsap.to('.element', {
  scrollTrigger: {
    markers: isDev,
  },
})
```

---

## Memory Management & Cleanup

### The Astro Cleanup Pattern

Every component with animations should clean up on `astro:before-swap`:

```astro
<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  // Collect everything to clean up
  const ctx = gsap.context(() => {
    // All animations here
    gsap.from('.element', { opacity: 0, scrollTrigger: { trigger: '.element' } })
  }, '#my-section')

  // Single cleanup handler
  document.addEventListener('astro:before-swap', () => {
    ctx.revert()  // Kills all tweens, ScrollTriggers, and reverts DOM
  }, { once: true })
</script>
```

### Manual ScrollTrigger Cleanup

```js
// Kill all ScrollTriggers globally
document.addEventListener('astro:before-swap', () => {
  ScrollTrigger.getAll().forEach((t) => t.kill())
})
```

### SplitText Cleanup

```js
import gsap from 'gsap'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(SplitText)

const heading = document.querySelector('h1')!
const split = new SplitText(heading, { type: 'chars' })

gsap.from(split.chars, { opacity: 0, stagger: 0.02 })

document.addEventListener('astro:before-swap', () => {
  split.revert()  // Restore original DOM
}, { once: true })
```

### Cancel requestAnimationFrame

```js
let rafId: number

function loop() {
  // ... animation logic
  rafId = requestAnimationFrame(loop)
}

rafId = requestAnimationFrame(loop)

document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(rafId)
}, { once: true })
```

### Dispose Three.js / WebGL

```js
document.addEventListener('astro:before-swap', () => {
  cancelAnimationFrame(rafId)
  renderer.dispose()
  geometry.dispose()
  material.dispose()
  texture?.dispose()
  ScrollTrigger.getAll().forEach((t) => t.kill())
}, { once: true })
```

### Remove Event Listeners

```js
function onMouseMove(e: MouseEvent) { /* ... */ }
function onResize() { /* ... */ }

window.addEventListener('mousemove', onMouseMove)
window.addEventListener('resize', onResize)

document.addEventListener('astro:before-swap', () => {
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('resize', onResize)
}, { once: true })
```

---

## Lazy Loading

### Images with Reveal

```astro
---
interface Props { src: string; alt: string }
const { src, alt } = Astro.props
---
<div class="img-reveal overflow-hidden">
  <img
    class="img-inner w-full h-full object-cover scale-110 opacity-0"
    src={src}
    alt={alt}
    loading="lazy"
  />
</div>

<script>
  import gsap from 'gsap'

  document.querySelectorAll<HTMLImageElement>('.img-inner').forEach((img) => {
    const container = img.closest('.img-reveal')!

    const onLoad = () => {
      const ctx = gsap.context(() => {
        gsap.from(container, {
          clipPath: 'inset(100% 0% 0% 0%)',
          duration: 1.2,
          ease: 'power4.inOut',
        })
        gsap.to(img, {
          opacity: 1,
          scale: 1,
          duration: 1.5,
          ease: 'power2.out',
        })
      })
      document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
    }

    if (img.complete) {
      onLoad()
    } else {
      img.addEventListener('load', onLoad, { once: true })
    }
  })
</script>
```

### Dynamic Import Heavy Libraries

```astro
<script>
  // Load Three.js only when needed
  const canvas = document.getElementById('three-canvas')

  if (canvas) {
    const { default: THREE } = await import('three')
    // Initialize Three.js scene
  }
</script>
```

---

## Mobile Optimization

### Detect Low-End Devices

```js
function isLowEndDevice(): boolean {
  const memory = (navigator as any).deviceMemory
  const cores = navigator.hardwareConcurrency

  if (memory && memory < 4) return true
  if (cores && cores < 4) return true
  return false
}
```

### Reduce Motion

```js
// Always check before animating
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const lowEnd = isLowEndDevice()
const shouldSimplify = reduced || lowEnd

if (shouldSimplify) {
  gsap.from('.element', { opacity: 0, duration: 0.3 })
} else {
  gsap.from('.element', {
    opacity: 0,
    y: 50,
    rotation: 10,
    duration: 0.8,
    ease: 'back.out(1.7)',
  })
}
```

### Disable Lenis on Low-End

```js
import Lenis from 'lenis'

const lowEnd = isLowEndDevice()
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

if (!lowEnd && !reduced) {
  const lenis = new Lenis({ lerp: 0.1 })
  // ... setup
}
```

### Touch-Friendly Timing

```js
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
const duration = isMobile ? 0.3 : 0.5
const staggerDelay = isMobile ? 0.05 : 0.1
```

---

## Monitoring & Debugging

### FPS Monitor

```astro
---
// Only show in dev
---
{import.meta.env.DEV && (
  <div id="fps-counter" class="fixed top-4 right-4 bg-black text-white text-xs p-2 z-[9999] font-mono"></div>
)}

<script>
  if (import.meta.env.DEV) {
    const counter = document.getElementById('fps-counter')
    if (counter) {
      let frameCount = 0
      let lastTime = performance.now()

      const loop = () => {
        frameCount++
        const now = performance.now()
        if (now - lastTime >= 1000) {
          counter.textContent = `${frameCount} FPS`
          frameCount = 0
          lastTime = now
        }
        requestAnimationFrame(loop)
      }
      requestAnimationFrame(loop)
    }
  }
</script>
```

### Astro Dev Mode Checks

```js
// Conditionally enable GSAP markers in dev
const isDev = import.meta.env.DEV

ScrollTrigger.create({
  trigger: '.element',
  markers: isDev,
  // ...
})
```

---

## Performance Checklist

- [ ] Only animating `transform` / `opacity`
- [ ] ScrollTriggers killed on `astro:before-swap`
- [ ] RAF canceled on `astro:before-swap`
- [ ] Event listeners removed on `astro:before-swap`
- [ ] Three.js/WebGL disposed on `astro:before-swap`
- [ ] Batch animations where possible
- [ ] Lazy load heavy components
- [ ] Tested on real mobile devices
- [ ] ScrollTrigger markers disabled in production (`import.meta.env.DEV`)
- [ ] Respects `prefers-reduced-motion`
- [ ] Tested on low-end devices
- [ ] No layout shifts (CLS)
