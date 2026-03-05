import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// PRELOADER
// ============================================

document.body.classList.add('is-loading');

function runPreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return initPage();

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.classList.remove('is-loading');
      initPage();
    },
  });

  tl.to('.preloader__logo', {
    opacity: 1,
    duration: 0.8,
    ease: 'power2.out',
  });

  tl.to('.preloader__line', {
    width: 'clamp(120px, 30vw, 280px)',
    duration: 1.2,
    ease: 'power3.inOut',
  }, '-=0.3');

  tl.to('.preloader__strip--left', {
    left: 'clamp(20px, 5vw, 80px)',
    opacity: 1,
    duration: 1.4,
    ease: 'power2.inOut',
  }, '-=0.8');

  tl.to('.preloader__strip--right', {
    right: 'clamp(20px, 5vw, 80px)',
    opacity: 1,
    duration: 1.4,
    ease: 'power2.inOut',
  }, '<');

  tl.to('.preloader__tagline-word', {
    y: '0%',
    duration: 0.6,
    stagger: 0.1,
    ease: 'power3.out',
  }, '-=0.6');

  tl.to({}, { duration: 0.6 });

  tl.to('.preloader__content', {
    opacity: 0,
    duration: 0.5,
    ease: 'power2.in',
  });

  tl.to('.preloader__bg', {
    clipPath: 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)',
    duration: 0.8,
    ease: 'power3.inOut',
  });
}

runPreloader();

// ============================================
// PAGE INIT
// ============================================

function initPage() {

// ============================================
// LENIS — Smooth scroll
// ============================================

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

// ============================================
// S1: HERO
// ============================================

gsap.from('.hero__title', {
  opacity: 0,
  y: 30,
  duration: 1.5,
  ease: 'power3.out',
  delay: 0.3,
});

gsap.to('.hero__video', {
  yPercent: 15,
  ease: 'none',
  scrollTrigger: {
    trigger: '.section--hero',
    start: 'top top',
    end: 'bottom top',
    scrub: true,
  },
});

// ============================================
// S2: INTRO — Character split reveal
// ============================================

const introText = document.querySelector('.intro__text');
if (introText) {
  gsap.from(introText, {
    opacity: 0,
    y: 20,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.section--intro',
      start: 'top 80%',
    },
  });
}

// ============================================
// S3: MANIFIESTO — Scroll-triggered reveals
// ============================================

// Photos reveal with scale + translate
document.querySelectorAll('.mf-block__photo').forEach((photo) => {
  gsap.from(photo, {
    opacity: 0,
    y: 60,
    scale: 0.95,
    duration: 1.2,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: photo,
      start: 'top 85%',
    },
  });

  // Subtle parallax on scroll
  gsap.to(photo.querySelector('img'), {
    yPercent: -8,
    ease: 'none',
    scrollTrigger: {
      trigger: photo,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  });
});

// Caption photos too
document.querySelectorAll('.mf-caption__photo').forEach((photo) => {
  gsap.from(photo, {
    opacity: 0,
    y: 50,
    scale: 0.96,
    duration: 1.1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: photo,
      start: 'top 85%',
    },
  });
});

// Words — clip-path reveal per character
document.querySelectorAll('.mf-block__word').forEach((word) => {
  gsap.from(word, {
    clipPath: 'inset(0 0 100% 0)',
    y: 30,
    skewY: 2,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: word,
      start: 'top 85%',
    },
  });
});

// Captions
document.querySelectorAll('.mf-caption__text').forEach((caption) => {
  gsap.from(caption, {
    opacity: 0,
    y: 25,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: caption,
      start: 'top 85%',
    },
  });
});

// ============================================
// S4: CINEMATIC
// ============================================

gsap.from('.cinematic__img', {
  scale: 1.08,
  ease: 'none',
  scrollTrigger: {
    trigger: '.section--cinematic',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});

gsap.from('.cinematic__quote', {
  opacity: 0,
  y: 25,
  duration: 1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.cinematic__quote',
    start: 'top 85%',
  },
});

// ============================================
// PRESENTS
// ============================================

gsap.from('.presents__logo', {
  opacity: 0,
  y: 20,
  duration: 0.8,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--presents',
    start: 'top 80%',
  },
});

gsap.from('.presents__sub', {
  opacity: 0,
  y: 15,
  duration: 0.8,
  delay: 0.15,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--presents',
    start: 'top 80%',
  },
});

// ============================================
// S5: OOH — Slide transitions
// ============================================

const oohSlides = document.querySelectorAll('.ooh__slide');
const oohChapters = document.querySelectorAll('.ooh__chapter');
const oohSection = document.querySelector('.section--ooh');

if (oohSlides.length > 1) {
  const oohTl = gsap.timeline({
    scrollTrigger: {
      trigger: oohSection,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const activeIndex = Math.min(
          Math.floor(progress * oohSlides.length),
          oohSlides.length - 1
        );
        oohChapters.forEach((ch, i) => {
          ch.classList.toggle('ooh__chapter--active', i === activeIndex);
        });
      },
    },
  });

  oohSlides.forEach((slide, i) => {
    if (i === 0) return;
    const prev = oohSlides[i - 1];

    oohTl.to(prev, {
      opacity: 0,
      scale: 1.02,
      duration: 0.8,
      ease: 'power2.inOut',
    }, i - 0.5);

    oohTl.fromTo(slide, {
      opacity: 0,
      scale: 0.98,
    }, {
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power2.inOut',
    }, i - 0.3);
  });
}

// ============================================
// S6: COMUNIDAD + GALERÍA
// ============================================

gsap.from('.comunidad__title', {
  opacity: 0,
  x: -30,
  duration: 1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--comunidad',
    start: 'top 70%',
  },
});

gsap.from('.comunidad__desc', {
  opacity: 0,
  y: 20,
  duration: 0.8,
  delay: 0.2,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--comunidad',
    start: 'top 70%',
  },
});

gsap.from('.comunidad__join-btn', {
  opacity: 0,
  y: 20,
  duration: 0.8,
  delay: 0.4,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.section--comunidad',
    start: 'top 70%',
  },
});

gsap.from('.galeria__title', {
  opacity: 0,
  y: 20,
  duration: 0.9,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.comunidad__right',
    start: 'top 75%',
  },
});

gsap.from('.galeria__card', {
  opacity: 0,
  y: 40,
  duration: 0.8,
  stagger: 0.1,
  ease: 'power3.out',
  scrollTrigger: {
    trigger: '.galeria__grid',
    start: 'top 80%',
  },
});

// Form toggle
const joinBtn = document.querySelector('.comunidad__join-btn');
const form = document.querySelector('.comunidad__form');

if (joinBtn && form) {
  joinBtn.addEventListener('click', () => {
    joinBtn.style.display = 'none';
    form.classList.add('is-visible');
    gsap.from(form, { opacity: 0, y: 20, duration: 0.6, ease: 'power2.out' });
  });
}

// ============================================
// NAV — Hide/show on scroll
// ============================================

const nav = document.querySelector('.nav');
let lastScroll = 0;

lenis.on('scroll', ({ scroll }) => {
  if (scroll > lastScroll && scroll > 100) {
    nav.style.transform = 'translateY(-100%)';
    nav.style.transition = 'transform 0.4s cubic-bezier(0.65,0,0.35,1)';
  } else {
    nav.style.transform = 'translateY(0)';
  }
  lastScroll = scroll;
});

// ============================================
// Fallback images
// ============================================

document.querySelectorAll('img').forEach((img) => {
  img.addEventListener('error', () => {
    const w = img.width || 400;
    const h = img.height || 300;
    img.src = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect fill="#2d2318" width="100%" height="100%"/>
        <text fill="#5a5550" font-size="14" font-family="sans-serif" x="50%" y="50%" text-anchor="middle" dominant-baseline="middle">
          ${img.alt || 'IMG'}
        </text>
      </svg>`
    )}`;
  });
});

// ============================================
// DEV: Slide label overlay (remove for production)
// ============================================
const devLabel = document.createElement('div');
devLabel.style.cssText = 'position:fixed;top:8px;left:8px;z-index:99999;background:red;color:white;font:bold 14px monospace;padding:5px 12px;border-radius:4px;pointer-events:none;opacity:0.9;';
document.body.appendChild(devLabel);

const sectionMap = [
  { sel: '.section--hero', label: '01 HERO' },
  { sel: '.section--intro', label: '02 INTRO' },
  { sel: '.mf-block--there', label: '03 THERE' },
  { sel: '.mf-block--is', label: '04 IS' },
  { sel: '.mf-block--no', label: '05 NO' },
  { sel: '.mf-block--substitute', label: '06 SUBSTITUTE' },
  { sel: '.section--cinematic', label: '07 CINEMATIC' },
  { sel: '.section--presents', label: '08 PRESENTS' },
  { sel: '.section--ooh', label: '09 OOH' },
  { sel: '.section--comunidad', label: '10 COMMUNITY' },
  { sel: '.footer', label: '11 FOOTER' },
];

function updateDevLabel() {
  const mid = window.innerHeight / 2;
  let current = sectionMap[0].label;
  for (const s of sectionMap) {
    const el = document.querySelector(s.sel);
    if (el && el.getBoundingClientRect().top <= mid) current = s.label;
  }
  devLabel.textContent = current;
  requestAnimationFrame(updateDevLabel);
}
updateDevLabel();

console.log('Porsche TINS — loaded');

} // end initPage()
