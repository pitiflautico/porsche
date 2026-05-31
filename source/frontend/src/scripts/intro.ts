import { ScrollTrigger } from "gsap/ScrollTrigger";

type W = Window &
  typeof globalThis & {
    lenis?: { stop?: () => void; start?: () => void };
  };

function setImp(el: HTMLElement, prop: string, value: string) {
  el.style.setProperty(prop, value, "important");
}

function clamp(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function easeExpoOut(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function runIntro() {
  const intro = document.querySelector<HTMLElement>("[data-intro]");
  if (!intro) {
    window.dispatchEvent(new CustomEvent("intro:complete"));
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    intro.remove();
    window.dispatchEvent(new CustomEvent("intro:complete"));
    return;
  }

  const brand = intro.querySelector<HTMLElement>(".intro__brand");
  const brandImg = intro.querySelector<HTMLElement>(".intro__brand-img");
  const curtainTop = intro.querySelector<HTMLElement>(".intro__curtain--top");
  const curtainBot = intro.querySelector<HTMLElement>(".intro__curtain--bottom");
  const edges = intro.querySelectorAll<HTMLElement>(".intro__curtain-edge");

  if (!brand || !brandImg || !curtainTop || !curtainBot || edges.length === 0) {
    intro.remove();
    window.dispatchEvent(new CustomEvent("intro:complete"));
    return;
  }

  intro.classList.add("is-active");

  const w = window as W;
  w.lenis?.stop?.();

  // Initial state
  setImp(brand, "opacity", "0");
  setImp(brand, "transform", "translate(-50%, -50%) scale(0.15)");
  setImp(brandImg, "mask-size", "8% 100%");
  setImp(brandImg, "-webkit-mask-size", "8% 100%");
  edges.forEach((edge) => {
    setImp(edge, "width", "0%");
    setImp(edge, "opacity", "0");
  });

  const GROW_MS = 1200;
  const SCALE_FROM = 0.15;
  const SCALE_TO = 1;
  const MASK_FROM = 8;
  const MASK_TO = 260;

  const start = performance.now();

  function growFrame(now: number) {
    let t = (now - start) / GROW_MS;
    if (t > 1) t = 1;

    const opacityT = Math.min(t / 0.12, 1);
    setImp(brand!, "opacity", opacityT.toFixed(3));

    const scale = lerp(SCALE_FROM, SCALE_TO, easeExpoOut(t));
    setImp(brand!, "transform", `translate(-50%, -50%) scale(${scale.toFixed(4)})`);

    const maskSize = lerp(MASK_FROM, MASK_TO, easeInOut(t));
    setImp(brandImg!, "mask-size", `${maskSize.toFixed(1)}% 100%`);
    setImp(brandImg!, "-webkit-mask-size", `${maskSize.toFixed(1)}% 100%`);

    if (t < 1) {
      requestAnimationFrame(growFrame);
    } else {
      // Wait for EVERYTHING to be ready BEFORE the lines + curtains run.
      // The lines reveal is the user-visible "loaded" cue, so it must
      // never play while assets/textures/scripts are still warming up.
      setTimeout(() => waitForFullReady(runEdgeReveal), 100);
    }
  }

  // PHASE 2 — Edges (one in each curtain) grow from center to both sides (0.7s)
  function runEdgeReveal() {
    const LINE_MS = 700;
    const t0 = performance.now();
    edges.forEach((edge) => setImp(edge, "opacity", "1"));

    function lineFrame(now: number) {
      const t = clamp((now - t0) / LINE_MS);
      const e = easeInOutCubic(t);
      const w = (100 * e).toFixed(2) + "%";
      edges.forEach((edge) => setImp(edge, "width", w));
      if (t < 1) requestAnimationFrame(lineFrame);
      else runOpenCurtains();
    }
    requestAnimationFrame(lineFrame);
  }

  // PHASE 2b — real preloader. Don't open the curtains until everything
  // the user will see/touch immediately is actually ready: every
  // sub-resource of the HTML (window.load), Reunions' init has exposed
  // its controller (window.reunionsSlider), the WebGL texture pool
  // (.s5-img-pool + .s5-people-layer imgs) is fully decoded, AND the
  // hero video is playing. Each gate has its own safety; the whole
  // thing is capped at MAX_MS so a single hang never blocks the intro.
  function waitForFullReady(cb: () => void) {
    const MAX_MS = 8000;
    const gates = { load: false, reunions: false, textures: false, hero: false };
    let done = false;

    function finish() {
      // Force ScrollTrigger to recompute every pin/scrub against the
      // FINAL layout (now that all imgs/textures are decoded). Without
      // this, Hero/Interlude pins were getting baked at start-up — when
      // Sanity/local imgs were still 0-sized — and the user saw broken
      // scroll effects on first load (only a manual reload "fixed" them
      // because the second pass came from cache with images sized).
      try { ScrollTrigger.refresh(); } catch { /* gsap not loaded yet */ }
      setTimeout(cb, 60);
    }
    function maybeFinish() {
      if (done) return;
      if (gates.load && gates.reunions && gates.textures && gates.hero) {
        done = true;
        finish();
      }
    }
    function release() {
      if (done) return;
      done = true;
      finish();
    }
    window.setTimeout(release, MAX_MS);

    // 1. window.load — every <img>, <link>, <script> resolved.
    if (document.readyState === "complete") {
      gates.load = true;
      maybeFinish();
    } else {
      window.addEventListener(
        "load",
        () => { gates.load = true; maybeFinish(); },
        { once: true },
      );
    }

    // 2. window.reunionsSlider — Reunions' init has run and exposed its
    //    API (so the section-slider can drive it the moment we reveal).
    (function pollReunions(i: number) {
      if (done) return;
      const rs = (window as unknown as { reunionsSlider?: unknown }).reunionsSlider;
      if (rs) { gates.reunions = true; maybeFinish(); return; }
      if (i >= 80) { gates.reunions = true; maybeFinish(); return; } // ~8s
      window.setTimeout(() => pollReunions(i + 1), 100);
    })(0);

    // 3. WebGL texture pool decoded — the imgs Reunions will upload to
    //    its canvas. If they aren't ready when the curtain opens you see
    //    a frame with no car.
    (function preloadTextures() {
      const imgs = Array.from(
        document.querySelectorAll<HTMLImageElement>(
          ".s5-img-pool img, .s5-people-layer img",
        ),
      );
      if (imgs.length === 0) { gates.textures = true; maybeFinish(); return; }
      let remaining = imgs.length;
      const tick = () => {
        remaining--;
        if (remaining <= 0) { gates.textures = true; maybeFinish(); }
      };
      imgs.forEach((img) => {
        if (img.complete && img.naturalWidth > 0) { tick(); return; }
        img.addEventListener("load", tick, { once: true });
        img.addEventListener("error", tick, { once: true });
      });
    })();

    // 4. Hero video actually playing (existing behavior).
    waitForHeroPlaying(() => { gates.hero = true; maybeFinish(); });
  }

  // Gate PHASE 3 (curtain open) on the hero video actually playing —
  // so the reveal can never land on a poster freeze. If the video is
  // already playing we proceed immediately; otherwise we wait for the
  // `playing` event with a 1.5s safety fallback.
  function waitForHeroPlaying(cb: () => void) {
    const sel = window.matchMedia("(max-width: 767px)").matches
      ? ".video--mobile"
      : ".video--desktop";
    const v = document.querySelector<HTMLVideoElement>(sel);
    if (!v) {
      setTimeout(cb, 100);
      return;
    }
    const isPlaying = !v.paused && v.currentTime > 0 && v.readyState >= 3;
    if (isPlaying) {
      setTimeout(cb, 100);
      return;
    }
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      v.removeEventListener("playing", finish);
      clearTimeout(timer);
      setTimeout(cb, 100);
    };
    v.addEventListener("playing", finish, { once: true });
    const timer = window.setTimeout(finish, 3000);
  }

  // PHASE 3 — Curtains separate vertically; logo migrates to the header
  function runOpenCurtains() {
    // Drop the dark backdrop NOW — the curtains (z-index 5) are about to
    // split, and behind them sits intro__bg (z-index 1, solid dark)
    // which would otherwise keep the hero video hidden through the
    // whole curtain animation. The curtains themselves still cover the
    // viewport at t=0 of this phase, so killing the bg is safe.
    const introBg = intro!.querySelector<HTMLElement>(".intro__bg");
    if (introBg) setImp(introBg, "opacity", "0");

    const navLogo =
      document.querySelector<HTMLElement>("header.nav .nav__logo img:last-child") ||
      document.querySelector<HTMLElement>("header.nav .nav__logo");
    const brandRect = brand!.getBoundingClientRect();
    const navRect = navLogo ? navLogo.getBoundingClientRect() : null;

    const startCX = brandRect.left + brandRect.width / 2;
    const startCY = brandRect.top + brandRect.height / 2;
    const endW = navRect && navRect.width > 1 ? navRect.width : 84;
    const endCX = navRect && navRect.width > 1 ? navRect.left + navRect.width / 2 : window.innerWidth / 2;
    const endCY = navRect && navRect.width > 1 ? navRect.top + navRect.height / 2 : 36;
    const endScale = endW / brandRect.width;
    const dx = endCX - startCX;
    const dy = endCY - startCY;

    const curtainTravelPx = window.innerHeight * 0.5;
    const logoVerticalPx = Math.abs(dy);
    const OPEN_MS = 1500;
    const brandMoveStart = 0;
    const brandMoveEnd = OPEN_MS * Math.min(1, logoVerticalPx / curtainTravelPx);
    const clipStart = 0;
    const clipDuration = OPEN_MS;

    // Hide the site header until the migrating logo reaches its final slot
    const siteHeader = document.querySelector<HTMLElement>("header.nav");
    if (siteHeader) {
      siteHeader.style.setProperty("opacity", "0", "important");
      siteHeader.style.setProperty("transition", "opacity 0.35s ease", "important");
    }

    // Fire intro:complete now so the hero video starts loading/playing behind
    window.dispatchEvent(new CustomEvent("intro:complete"));
    const heroVideoWrap = document.querySelector<HTMLElement>(".hero__video");
    if (heroVideoWrap) heroVideoWrap.classList.add("is-ready");

    const t0 = performance.now();
    let finished = false;

    function exitFrame(now: number) {
      const el = now - t0;

      if (el >= brandMoveStart) {
        const bp = clamp((el - brandMoveStart) / (brandMoveEnd - brandMoveStart));
        const bEase = easeInOutCubic(bp);
        const sc = 1 + (endScale - 1) * bEase;
        setImp(
          brand!,
          "transform",
          `translate(calc(-50% + ${(dx * bEase).toFixed(1)}px), calc(-50% + ${(dy * bEase).toFixed(1)}px)) scale(${sc.toFixed(4)})`,
        );
      }

      if (el >= clipStart) {
        const cp = clamp((el - clipStart) / clipDuration);
        const cE = easeInOutCubic(cp);
        setImp(curtainTop!, "transform", `translateY(${(-100 * cE).toFixed(2)}%)`);
        setImp(curtainBot!, "transform", `translateY(${(100 * cE).toFixed(2)}%)`);

        // Edges fade out near the end so they never touch header/footer
        const EDGE_FADE_START = 0.55;
        const EDGE_FADE_END = 0.9;
        let edgeOp = 1;
        if (cE >= EDGE_FADE_END) edgeOp = 0;
        else if (cE > EDGE_FADE_START)
          edgeOp = 1 - (cE - EDGE_FADE_START) / (EDGE_FADE_END - EDGE_FADE_START);
        edges.forEach((edge) => setImp(edge, "opacity", edgeOp.toFixed(3)));
      }

      if (el < clipDuration + 100) {
        requestAnimationFrame(exitFrame);
      } else if (!finished) {
        finished = true;
        w.lenis?.start?.();
        if (siteHeader) siteHeader.style.removeProperty("opacity");
        intro.remove();
      }
    }
    requestAnimationFrame(exitFrame);
  }

  requestAnimationFrame(growFrame);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runIntro, { once: true });
} else {
  runIntro();
}
