import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

gsap.registerPlugin(ScrollTrigger);

// ============================================
// CUSTOM CURSOR
// ============================================

const cursor = document.createElement('div');
cursor.className = 'custom-cursor';
const cursorDot = document.createElement('div');
cursorDot.className = 'custom-cursor__dot';
document.body.appendChild(cursor);
document.body.appendChild(cursorDot);

let cursorX = window.innerWidth / 2;
let cursorY = window.innerHeight / 2;
let dotX = cursorX;
let dotY = cursorY;
let cursorScale = 1;
let targetScale = 1;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
});

// Hover states: grow on interactive elements
document.addEventListener('mouseover', (e) => {
  const target = e.target.closest('a, button, .btn, .galeria__card, .ooh__chapter, .input');
  if (target) targetScale = 2.5;
});
document.addEventListener('mouseout', (e) => {
  const target = e.target.closest('a, button, .btn, .galeria__card, .ooh__chapter, .input');
  if (target) targetScale = 1;
});

function animateCursor() {
  // Smooth follow with lag
  dotX += (cursorX - dotX) * 0.15;
  dotY += (cursorY - dotY) * 0.15;
  cursorScale += (targetScale - cursorScale) * 0.12;

  cursor.style.transform = `translate(${dotX}px, ${dotY}px) scale(${cursorScale})`;
  cursorDot.style.transform = `translate(${cursorX}px, ${cursorY}px)`;
  requestAnimationFrame(animateCursor);
}
animateCursor();

// Hide on mouse leave
document.addEventListener('mouseleave', () => {
  cursor.style.opacity = '0';
  cursorDot.style.opacity = '0';
});
document.addEventListener('mouseenter', () => {
  cursor.style.opacity = '1';
  cursorDot.style.opacity = '1';
});

// ============================================
// PRELOADER
// ============================================

document.body.classList.add('is-loading');

function runPreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return initPage();

  const tl = gsap.timeline({
    defaults: { ease: 'power3.out' },
    onComplete: () => {
      // Exit: dramatic wipe
      const exitTl = gsap.timeline({
        onComplete: () => {
          preloader.remove();
          document.body.classList.remove('is-loading');
          initPage();
        },
      });

      exitTl.to('.preloader__tagline-word', {
        y: '-120%',
        skewY: -4,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power3.in',
      });

      exitTl.to('.preloader__line', {
        scaleX: 0,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.2');

      exitTl.to('.preloader__logo', {
        y: -40,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
      }, '-=0.3');

      exitTl.to(['.preloader__strip--left', '.preloader__strip--right'], {
        opacity: 0,
        duration: 0.3,
        ease: 'power2.in',
      }, '-=0.3');

      // Wipe out with clip-path from center
      exitTl.to('.preloader__bg', {
        clipPath: 'inset(0 50% 0 50%)',
        duration: 0.9,
        ease: 'power4.inOut',
      }, '-=0.1');
    },
  });

  // Logo fades in with slight scale
  tl.fromTo('.preloader__logo', {
    opacity: 0, scale: 0.9, y: 20,
  }, {
    opacity: 1, scale: 1, y: 0,
    duration: 1,
  });

  // Gold line draws out
  tl.to('.preloader__line', {
    width: 'clamp(120px, 30vw, 280px)',
    duration: 1.2,
    ease: 'power3.inOut',
  }, '-=0.5');

  // Photo strips slide in with staggered images
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

  // Images inside strips reveal with clip-path
  tl.fromTo('.preloader__strip img', {
    clipPath: 'inset(100% 0 0 0)',
    scale: 1.2,
  }, {
    clipPath: 'inset(0% 0 0 0)',
    scale: 1,
    duration: 0.8,
    stagger: 0.12,
    ease: 'power3.out',
  }, '-=0.8');

  // Tagline words with skew entrance
  tl.fromTo('.preloader__tagline-word', {
    y: '120%', skewY: 6,
  }, {
    y: '0%', skewY: 0,
    duration: 0.7,
    stagger: 0.08,
    ease: 'power3.out',
  }, '-=0.5');

  // Hold
  tl.to({}, { duration: 0.8 });
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

// Hero title — split reveal from preloader exit
gsap.fromTo('.hero__title', {
  opacity: 0, y: 50, clipPath: 'inset(0 0 100% 0)', skewY: 3,
}, {
  opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)', skewY: 0,
  duration: 1.5,
  ease: 'power3.out',
  delay: 0.2,
});

// Hero overlay pulse
gsap.fromTo('.hero__overlay', {
  opacity: 0.8,
}, {
  opacity: 0.4,
  duration: 2,
  ease: 'power2.out',
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

// Photos reveal with clip-path wipe + scale zoom
document.querySelectorAll('.mf-block__photo').forEach((photo, i) => {
  const img = photo.querySelector('img');
  const isEven = i % 2 === 0;

  // Clip-path directional wipe
  gsap.fromTo(photo, {
    clipPath: isEven ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)',
  }, {
    clipPath: 'inset(0 0% 0 0%)',
    duration: 1.4,
    ease: 'power3.inOut',
    scrollTrigger: {
      trigger: photo,
      start: 'top 85%',
    },
  });

  // Inner image counter-scale for zoom reveal
  if (img) {
    gsap.fromTo(img, {
      scale: 1.3,
    }, {
      scale: 1,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: photo,
        start: 'top 85%',
      },
    });

    // Parallax on scroll
    gsap.to(img, {
      yPercent: -10,
      ease: 'none',
      scrollTrigger: {
        trigger: photo,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }
});

// Caption photos — vertical wipe
document.querySelectorAll('.mf-caption__photo').forEach((photo) => {
  const img = photo.querySelector('img');

  gsap.fromTo(photo, {
    clipPath: 'inset(100% 0 0 0)',
  }, {
    clipPath: 'inset(0% 0 0 0)',
    duration: 1.3,
    ease: 'power3.inOut',
    scrollTrigger: {
      trigger: photo,
      start: 'top 85%',
    },
  });

  if (img) {
    gsap.fromTo(img, { scale: 1.2 }, {
      scale: 1,
      duration: 1.5,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: photo,
        start: 'top 85%',
      },
    });
  }
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

// Cinematic section — clip-path reveal + parallax
const cinematicBlock = document.querySelector('.cinematic__block');
if (cinematicBlock) {
  gsap.fromTo(cinematicBlock, {
    clipPath: 'inset(15% 5% 15% 5%)',
  }, {
    clipPath: 'inset(0% 0% 0% 0%)',
    ease: 'none',
    scrollTrigger: {
      trigger: '.section--cinematic',
      start: 'top 80%',
      end: 'top 20%',
      scrub: true,
    },
  });
}

gsap.from('.cinematic__img', {
  scale: 1.15,
  ease: 'none',
  scrollTrigger: {
    trigger: '.section--cinematic',
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
  },
});

gsap.fromTo('.cinematic__quote', {
  opacity: 0, y: 40, clipPath: 'inset(0 0 100% 0)',
}, {
  opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)',
  duration: 1.2,
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
  // Set initial clip states
  oohSlides.forEach((slide, i) => {
    if (i > 0) {
      gsap.set(slide, { clipPath: 'inset(0 100% 0 0)', opacity: 1 });
    } else {
      gsap.set(slide, { clipPath: 'inset(0 0% 0 0%)', opacity: 1 });
    }
    // Set initial image scale for Ken Burns
    const bg = slide.querySelector('.ooh__bg');
    if (bg) gsap.set(bg, { scale: 1.1 });
  });

  const oohTl = gsap.timeline({
    scrollTrigger: {
      trigger: oohSection,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.8,
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
    const prevBg = prev.querySelector('.ooh__bg');
    const nextBg = slide.querySelector('.ooh__bg');

    // Previous slide: Ken Burns zoom
    if (prevBg) {
      oohTl.to(prevBg, {
        scale: 1,
        duration: 1,
        ease: 'none',
      }, (i - 1));
    }

    // New slide wipes in from right
    oohTl.to(slide, {
      clipPath: 'inset(0 0% 0 0%)',
      duration: 1,
      ease: 'power2.inOut',
    }, (i - 0.4));

    // New slide image starts zoomed, settles
    if (nextBg) {
      oohTl.fromTo(nextBg, { scale: 1.15 }, {
        scale: 1.1,
        duration: 1,
        ease: 'power2.out',
      }, (i - 0.4));
    }

    // Fade text of previous
    oohTl.to(prev.querySelectorAll('.ooh__text, .ooh__meta'), {
      opacity: 0,
      x: -30,
      duration: 0.5,
      ease: 'power2.in',
    }, (i - 0.4));

    // Reveal text of new
    oohTl.fromTo(slide.querySelectorAll('.ooh__text, .ooh__meta'), {
      opacity: 0, x: 40,
    }, {
      opacity: 1, x: 0,
      duration: 0.6,
      ease: 'power3.out',
    }, (i));
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

// Gallery cards — staggered clip-path reveal
document.querySelectorAll('.galeria__card').forEach((card, i) => {
  gsap.fromTo(card, {
    clipPath: 'inset(100% 0 0 0)',
    y: 60,
  }, {
    clipPath: 'inset(0% 0 0 0)',
    y: 0,
    duration: 1,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: card,
      start: 'top 90%',
    },
    delay: (i % 2) * 0.15,
  });
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

console.log('Porsche TINS — loaded');

} // end initPage()
