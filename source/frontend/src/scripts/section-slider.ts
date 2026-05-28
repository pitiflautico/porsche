// HomePage hybrid section navigation. Three modes:
//
//   "quotes"   — Hero/Interlude/Quotes scroll naturally. Reunions,
//                Gallery and Stories are pulled out of the flow (fixed),
//                so the document ends at Quotes and the scroll clamps
//                there. Overscroll DOWN at the end → curtain → reunions.
//
//   "reunions" — Reunions is a locked, fixed slider: car 0/1/2 with the
//                pixelvault curtain between them (overscroll bar drives
//                each crossing). Overscroll DOWN past the last car →
//                curtain → gallery. Overscroll UP before car 0 →
//                curtain → quotes.
//
//   "gallery"  — Gallery + Stories scroll NATURALLY downward (Quotes and
//                Reunions are out of the flow). The TOP of Gallery is
//                clamped: overscroll UP there → curtain → back to the
//                last Reunions car. Downward into Stories is free.

import { BlobTransition } from "./blob-transition";

type ReunionsSlider = {
  slideCount: number;
  setSlideInstant: (idx: number) => void;
};
type Lenis = {
  scrollTo?: (t: number | HTMLElement, o?: { immediate?: boolean }) => void;
  stop?: () => void;
  start?: () => void;
};
type SliderWin = Window &
  typeof globalThis & { reunionsSlider?: ReunionsSlider; lenis?: Lenis };

export function initSectionSlider() {
  const quotesEl = document.getElementById("testimonials");
  const reunionsEl = document.getElementById("reunions");
  const galleryEl = document.getElementById("gallery");
  const storiesEl = document.getElementById("stories");
  const canvasEl = document.getElementById(
    "section-blob-canvas",
  ) as HTMLCanvasElement | null;
  const barEl = document.getElementById("section-overscroll-bar");
  const fillEl = document.getElementById("section-overscroll-fill");

  if (!quotesEl || !reunionsEl || !galleryEl || !canvasEl) {
    console.warn("[section-slider] missing elements");
    return;
  }

  const w = window as SliderWin;
  const getLenis = () => w.lenis;

  // Mode "quotes" is the initial flow: Reunions/Gallery/Stories out of
  // the flow so the document ends at Quotes.
  reunionsEl.classList.add("slider-layer");
  galleryEl.classList.add("slider-layer");
  storiesEl?.classList.add("slider-layer");

  function ready(cb: () => void, tries = 0) {
    if (w.reunionsSlider) cb();
    else if (tries < 200) setTimeout(() => ready(cb, tries + 1), 50);
    else console.warn("[section-slider] reunionsSlider never ready");
  }

  ready(() => {
    const slider = w.reunionsSlider!;
    const blob = new BlobTransition({
      canvas: canvasEl!,
      color: "#000000",
      duration: 1400,
    });
    const LAST_CAR = slider.slideCount - 1;

    type Mode = "quotes" | "reunions" | "gallery";
    let mode: Mode = "quotes";
    let car = 0; // active reunions car while in "reunions" mode
    let overscroll = 0;
    let animating = false;
    let cooldown = 0;
    const OVERSCROLL_MAX = () => Math.round(window.innerHeight * 0.4);

    // ── flow layout per mode ─────────────────────────────────────────
    function setFlow(m: Mode) {
      // Which sections are OUT of the document flow (fixed layers).
      quotesEl!.classList.toggle("slider-layer", m === "gallery");
      reunionsEl!.classList.toggle("slider-layer", true); // always fixed
      galleryEl!.classList.toggle("slider-layer", m !== "gallery");
      storiesEl?.classList.toggle("slider-layer", m !== "gallery");
    }
    function showReunionsCar(idx: number | null) {
      const active = idx !== null;
      reunionsEl!.classList.toggle("slider-layer--active", active);
      if (active) {
        slider.setSlideInstant(idx);
        car = idx;
      }
    }
    function showGallery(active: boolean) {
      galleryEl!.classList.toggle("slider-layer--active", active);
      storiesEl?.classList.toggle("slider-layer--active", active);
    }

    function lockScroll(lock: boolean) {
      document.documentElement.style.overflow = lock ? "hidden" : "";
      document.body.style.overflow = lock ? "hidden" : "";
      const lenis = getLenis();
      if (lock) lenis?.stop?.();
      else lenis?.start?.();
    }
    function scrollToY(y: number) {
      const lenis = getLenis();
      if (lenis?.scrollTo) lenis.scrollTo(y, { immediate: true });
      else window.scrollTo({ top: y, behavior: "auto" });
    }
    function setBar(v: number) {
      const pct = Math.max(0, Math.min(1, v / OVERSCROLL_MAX()));
      if (fillEl) fillEl.style.width = pct * 100 + "%";
      barEl?.classList.toggle("is-visible", pct > 0.001);
    }

    function maxScrollQuotes(): number {
      return quotesEl!.offsetTop + quotesEl!.offsetHeight - window.innerHeight;
    }
    function galleryTop(): number {
      return galleryEl!.offsetTop;
    }

    async function curtainSwap(apply: () => void) {
      canvasEl!.style.opacity = "1";
      blob.setProgress(0);
      apply();
      await blob.play("out");
      canvasEl!.style.opacity = "0";
    }
    function resetOverscroll() {
      overscroll = 0;
      setBar(0);
    }

    // ── transitions between modes / cars ─────────────────────────────
    async function quotesToReunions() {
      animating = true;
      resetOverscroll();
      lockScroll(true);
      await curtainSwap(() => {
        setFlow("reunions");
        showGallery(false);
        showReunionsCar(0);
      });
      mode = "reunions";
      animating = false;
      cooldown = performance.now() + 300;
    }

    async function reunionsToQuotes() {
      animating = true;
      resetOverscroll();
      await curtainSwap(() => {
        showReunionsCar(null);
        setFlow("quotes");
        lockScroll(false);
        scrollToY(maxScrollQuotes());
      });
      mode = "quotes";
      animating = false;
      cooldown = performance.now() + 300;
    }

    async function reunionsCarTo(idx: number) {
      animating = true;
      resetOverscroll();
      await curtainSwap(() => showReunionsCar(idx));
      animating = false;
      cooldown = performance.now() + 200;
    }

    async function reunionsToGallery() {
      animating = true;
      resetOverscroll();
      await curtainSwap(() => {
        showReunionsCar(null);
        setFlow("gallery"); // Gallery + Stories back into the flow
        showGallery(true);
        lockScroll(false);
        scrollToY(galleryTop());
      });
      mode = "gallery";
      animating = false;
      cooldown = performance.now() + 300;
    }

    async function galleryToReunions() {
      animating = true;
      resetOverscroll();
      lockScroll(true);
      await curtainSwap(() => {
        showGallery(false);
        setFlow("reunions");
        showReunionsCar(LAST_CAR);
      });
      mode = "reunions";
      animating = false;
      cooldown = performance.now() + 300;
    }

    // ── scroll clamps (natural modes) ────────────────────────────────
    function onScroll() {
      if (animating) return;
      if (mode === "quotes") {
        const max = maxScrollQuotes();
        if (window.scrollY > max) scrollToY(max);
      } else if (mode === "gallery") {
        const top = galleryTop();
        if (window.scrollY < top) scrollToY(top); // can't go above Gallery
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    const lenisAny = getLenis() as unknown as {
      on?: (e: string, cb: () => void) => void;
    };
    lenisAny?.on?.("scroll", onScroll);

    // ── wheel (capture phase to beat Lenis) ──────────────────────────
    function onWheel(e: WheelEvent) {
      if (animating || performance.now() < cooldown) {
        if (mode === "reunions") e.preventDefault();
        return;
      }
      const max = OVERSCROLL_MAX();

      if (mode === "quotes") {
        // Only act at the very end of Quotes (down → reunions).
        if (e.deltaY > 0 && window.scrollY >= maxScrollQuotes() - 1) {
          e.preventDefault();
          scrollToY(maxScrollQuotes());
          overscroll += e.deltaY;
          if (overscroll >= max) quotesToReunions();
          else setBar(overscroll);
        } else if (e.deltaY < 0 && overscroll > 0) {
          overscroll = Math.max(0, overscroll + e.deltaY);
          setBar(overscroll);
        }
        return;
      }

      if (mode === "gallery") {
        // Free scroll down into Stories. At the TOP of Gallery, wheeling
        // UP fills the bar and crosses back to Reunions.
        if (e.deltaY < 0 && window.scrollY <= galleryTop() + 1) {
          e.preventDefault();
          scrollToY(galleryTop());
          overscroll += -e.deltaY;
          if (overscroll >= max) galleryToReunions();
          else setBar(overscroll);
        } else if (e.deltaY > 0 && overscroll > 0) {
          overscroll = Math.max(0, overscroll - e.deltaY);
          setBar(overscroll);
        }
        return;
      }

      // reunions mode — fully locked; bar drives car nav + edges.
      e.preventDefault();
      overscroll += e.deltaY;
      if (overscroll >= max) {
        overscroll = 0;
        setBar(0);
        if (car < LAST_CAR) reunionsCarTo(car + 1);
        else reunionsToGallery();
      } else if (overscroll <= -max) {
        overscroll = 0;
        setBar(0);
        if (car > 0) reunionsCarTo(car - 1);
        else reunionsToQuotes();
      } else {
        setBar(Math.abs(overscroll));
      }
    }
    window.addEventListener("wheel", onWheel, { passive: false, capture: true });

    let lastTouchY: number | null = null;
    window.addEventListener(
      "touchstart",
      (e: TouchEvent) => { lastTouchY = e.touches[0]?.clientY ?? null; },
      { passive: true },
    );
    window.addEventListener(
      "touchmove",
      (e: TouchEvent) => {
        if (lastTouchY === null) return;
        const y = e.touches[0]?.clientY ?? lastTouchY;
        const delta = lastTouchY - y;
        lastTouchY = y;
        onWheel({ deltaY: delta, preventDefault: () => e.preventDefault() } as WheelEvent);
      },
      { passive: false },
    );

    console.log("[section-slider] ready (3-mode)", { cars: slider.slideCount });
  });
}
