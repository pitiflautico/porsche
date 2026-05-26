# Advanced Animation Patterns — Astro

Three.js, WebGL shaders, Canvas effects, and SVG advanced patterns for Astro. No React Three Fiber — pure vanilla Three.js with GSAP.

## Table of Contents
1. [Three.js + GSAP](#threejs--gsap)
2. [WebGL Shaders](#webgl-shaders)
3. [Canvas Particle System](#canvas-particle-system)
4. [Image Sequences](#image-sequences)
5. [SVG Advanced](#svg-advanced)
6. [Astro View Transitions + WebGL](#astro-view-transitions--webgl)

---

## Three.js + GSAP

### Setup

```bash
npm install three gsap
npm install --save-dev @types/three
```

### Basic Three.js Scene in Astro

```astro
---
---
<div id="three-container" class="h-[300vh]">
  <canvas id="three-canvas" class="fixed inset-0 w-full h-full"></canvas>
</div>

<script>
  import * as THREE from 'three'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  // Scene setup
  const canvas = document.getElementById('three-canvas') as HTMLCanvasElement
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 5

  // Mesh
  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshNormalMaterial()
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.5)
  scene.add(ambient)
  const point = new THREE.PointLight(0xffffff, 1)
  point.position.set(10, 10, 10)
  scene.add(point)

  // GSAP + ScrollTrigger on Three.js object
  gsap.to(mesh.rotation, {
    x: Math.PI * 2,
    y: Math.PI * 2,
    scrollTrigger: {
      trigger: '#three-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })

  gsap.to(mesh.position, {
    z: 2,
    scrollTrigger: {
      trigger: '#three-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })

  // Render loop
  let rafId: number
  function render() {
    rafId = requestAnimationFrame(render)
    renderer.render(scene, camera)
  }
  render()

  // Resize
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)

  // Cleanup
  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', onResize)
    ScrollTrigger.getAll().forEach((t) => t.kill())
    renderer.dispose()
    geometry.dispose()
    material.dispose()
  }, { once: true })
</script>
```

### Camera Scroll Animation

```js
// Animate camera position with scroll
gsap.to(camera.position, {
  x: 5,
  y: 2,
  z: 3,
  scrollTrigger: {
    trigger: '#scene-container',
    start: 'top top',
    end: 'bottom bottom',
    scrub: 1,
    onUpdate: () => camera.lookAt(0, 0, 0),
  },
})
```

### Scroll-Linked Mesh with RAF

```js
// Track scroll progress
let scrollProgress = 0

ScrollTrigger.create({
  trigger: '#container',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => { scrollProgress = self.progress },
})

// Use in render loop
function render() {
  rafId = requestAnimationFrame(render)
  mesh.rotation.y = scrollProgress * Math.PI * 2
  mesh.position.y = Math.sin(scrollProgress * Math.PI) * 2
  renderer.render(scene, camera)
}
```

---

## WebGL Shaders

### Custom Shader Material + GSAP

```astro
---
---
<div id="shader-container" class="h-[300vh]">
  <canvas id="shader-canvas" class="fixed inset-0 w-full h-full"></canvas>
</div>

<script>
  import * as THREE from 'three'
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const canvas = document.getElementById('shader-canvas') as HTMLCanvasElement
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 2

  const uniforms = {
    uTime: { value: 0 },
    uProgress: { value: 0 },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uProgress;

      void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 10.0 + uTime) * 0.1 * uProgress;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      uniform float uProgress;

      void main() {
        vec3 color = mix(vec3(0.05), vec3(1.0, 0.5, 0.0), vUv.x * uProgress);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  })

  const geometry = new THREE.PlaneGeometry(4, 4, 32, 32)
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  // Animate uniform via GSAP scroll
  gsap.to(uniforms.uProgress, {
    value: 1,
    scrollTrigger: {
      trigger: '#shader-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  })

  const clock = new THREE.Clock()
  let rafId: number

  function render() {
    rafId = requestAnimationFrame(render)
    uniforms.uTime.value = clock.getElapsedTime()
    renderer.render(scene, camera)
  }
  render()

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(rafId)
    ScrollTrigger.getAll().forEach((t) => t.kill())
    renderer.dispose()
    geometry.dispose()
    material.dispose()
  }, { once: true })
</script>
```

### Image Distortion Shader

```js
// Fragment shader for image distortion
const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float distortion = sin(uv.y * 10.0 + uTime) * 0.1 * uProgress;
    uv.x += distortion;
    vec4 color = texture2D(uTexture, uv);
    gl_FragColor = color;
  }
`

// Load texture
const textureLoader = new THREE.TextureLoader()
textureLoader.load('/path/to/image.jpg', (texture) => {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: texture },
      uProgress: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader,
  })
  // ...
})
```

---

## Canvas Particle System

```astro
---
---
<div id="particle-section" class="h-[300vh]">
  <canvas id="particle-canvas" class="fixed inset-0 w-full h-full"></canvas>
</div>

<script>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const canvas = document.getElementById('particle-canvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!

  interface Particle {
    x: number; y: number; vx: number; vy: number; size: number
  }

  const particles: Particle[] = []
  let scrollProgress = 0
  let rafId: number

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
    })
  }

  ScrollTrigger.create({
    trigger: '#particle-section',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => { scrollProgress = self.progress },
  })

  function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    particles.forEach((p) => {
      p.x += p.vx * (1 + scrollProgress * 5)
      p.y += p.vy * (1 + scrollProgress * 5)
      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0

      ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + scrollProgress * 0.5})`
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * (1 + scrollProgress), 0, Math.PI * 2)
      ctx.fill()
    })

    rafId = requestAnimationFrame(animate)
  }
  animate()

  document.addEventListener('astro:before-swap', () => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resize)
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }, { once: true })
</script>
```

---

## Image Sequences

### Scroll-Driven Image Sequence

```astro
---
interface Props { frameCount?: number; basePath: string }
const { frameCount = 120, basePath } = Astro.props
---
<div id="sequence-container" class="h-[500vh]">
  <div class="fixed inset-0 flex items-center justify-center">
    <div id="loading-msg" class="text-white">Loading frames...</div>
    <canvas id="sequence-canvas" class="hidden max-w-full max-h-full object-contain"></canvas>
  </div>
</div>

<script define:vars={{ frameCount, basePath }}>
  import gsap from 'gsap'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(ScrollTrigger)

  const canvas = document.getElementById('sequence-canvas')
  const ctx = canvas.getContext('2d')
  const loadingMsg = document.getElementById('loading-msg')
  const images = []
  let loadedCount = 0

  for (let i = 0; i < frameCount; i++) {
    const img = new Image()
    img.src = `${basePath}/frame_${i.toString().padStart(4, '0')}.jpg`
    img.onload = () => {
      loadedCount++
      if (loadedCount === frameCount) onLoaded()
    }
    images.push(img)
  }

  function onLoaded() {
    loadingMsg.style.display = 'none'
    canvas.style.display = 'block'
    canvas.width = images[0].width
    canvas.height = images[0].height
    ctx.drawImage(images[0], 0, 0)

    const frameObj = { frame: 0 }
    gsap.to(frameObj, {
      frame: frameCount - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        trigger: '#sequence-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        pin: true,
      },
      onUpdate: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(images[Math.round(frameObj.frame)], 0, 0)
      },
    })
  }

  document.addEventListener('astro:before-swap', () => {
    ScrollTrigger.getAll().forEach((t) => t.kill())
  }, { once: true })
</script>
```

---

## SVG Advanced

### Motion Path (GSAP MotionPathPlugin)

```astro
---
---
<div id="motion-container" class="relative h-[200vh]">
  <svg class="fixed top-0 left-0 w-full h-screen pointer-events-none">
    <path id="motion-path" d="M100,300 Q400,50 700,300 T1300,300" fill="none" stroke="rgba(255,255,255,0.2)" />
  </svg>
  <div id="motion-ball" class="fixed w-10 h-10 bg-white rounded-full pointer-events-none"></div>
</div>

<script>
  import gsap from 'gsap'
  import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
  import { ScrollTrigger } from 'gsap/ScrollTrigger'

  gsap.registerPlugin(MotionPathPlugin, ScrollTrigger)

  const ctx = gsap.context(() => {
    gsap.to('#motion-ball', {
      motionPath: {
        path: '#motion-path',
        align: '#motion-path',
        alignOrigin: [0.5, 0.5],
        autoRotate: true,
      },
      scrollTrigger: {
        trigger: '#motion-container',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1,
      },
    })
  })

  document.addEventListener('astro:before-swap', () => ctx.revert(), { once: true })
</script>
```

---

## Astro View Transitions + WebGL

WebGL/Canvas scenes need special handling with View Transitions because the canvas persists and the renderer must be recreated.

```astro
---
---
<canvas id="gl-canvas" class="fixed inset-0 w-full h-full pointer-events-none"></canvas>

<script>
  import * as THREE from 'three'

  let renderer: THREE.WebGLRenderer | null = null
  let rafId: number

  function init() {
    const canvas = document.getElementById('gl-canvas') as HTMLCanvasElement
    if (!canvas) return

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.z = 5

    // ... scene setup ...

    function render() {
      rafId = requestAnimationFrame(render)
      renderer!.render(scene, camera)
    }
    render()
  }

  function destroy() {
    cancelAnimationFrame(rafId)
    renderer?.dispose()
    renderer = null
  }

  document.addEventListener('astro:page-load', init)
  document.addEventListener('astro:before-swap', destroy)
  init()
</script>
```

### Tips for WebGL + View Transitions

1. **Always dispose**: `renderer.dispose()`, `geometry.dispose()`, `material.dispose()` on `astro:before-swap`
2. **Cancel RAF**: Store `requestAnimationFrame` ID and cancel it
3. **Remove resize listeners**: Store references and remove on cleanup
4. **Kill ScrollTriggers**: `ScrollTrigger.getAll().forEach(t => t.kill())`
5. **Null checks**: After disposal, guard against stale references in closures
