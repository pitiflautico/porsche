// HomePage section navigation — three modes:
//
//   "quotes"   — Hero / Interlude / Quotes scroll naturally. Reunions,
//                Gallery and Stories are fixed full-viewport layers OUT
//                of the flow, so the document ends at Quotes and the
//                scroll clamps there. Overscroll DOWN at the end →
//                curtain → Reunions (car 0).
//
//   "reunions" — A locked fixed layer: the car slider. Overscroll DOWN
//                advances cars; past the last → curtain → Gallery.
//                Overscroll UP retreats; before car 0 → curtain → back
//                to Quotes (at its end).
//
//   "gallery"  — Gallery + Stories scroll naturally DOWN (Gallery is a
//                normal 100vh section, Stories below it). Quotes and
//                Reunions are fixed layers OUT of flow. The TOP of
//                Gallery is clamped: wheel-UP there feeds an overscroll
//                bar → curtain → Reunions (last car). Downward is free.
//
// Validated in isolation at /test-3. Gallery is in the natural flow
// (not a fixed layer), and its on-screen position is read live with
// getBoundingClientRect — robust against the Hero/Interlude pin
// spacers, which make offsetTop unreliable.

import { BlobTransition } from "./blob-transition";

type ReunionsSlider = {
  slideCount: number;
  setSlideInstant: (idx: number) => void;
  revealPanelText?: () => void;
};
type Lenis = {
  scrollTo?: (t: number | HTMLElement, o?: { immediate?: boolean }) => void;
  stop?: () => void;
  start?: () => void;
  on?: (e: string, cb: () => void) => void;
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

  type Mode = "quotes" | "reunions" | "gallery";

  // setFlow recomposes which sections live in the document flow.
  // Reunions is always a layer (shown only when active). Gallery and
  // Stories are layers EXCEPT in gallery mode, where they return to the
  // natural flow so the user can scroll Gallery → Stories.
  function setFlow(m: Mode) {
    quotesEl!.classList.toggle("slider-layer", m !== "quotes");
    reunionsEl!.classList.add("slider-layer");
    galleryEl!.classList.toggle("slider-layer", m !== "gallery");
    storiesEl?.classList.toggle("slider-layer", m !== "gallery");
    // In gallery mode, pull Hero + Interlude (and their pin-spacers) out
    // of the flow so Gallery becomes the first in-flow element at the top
    // (offsetTop ≈ 0) — exactly like /test-3. Otherwise the Hero/Interlude
    // pins re-pin on scroll and shift Gallery's position out from under us.
    document.body.classList.toggle("ss-gallery", m === "gallery");
  }
  setFlow("quotes");

  function ready(cb: () => void, tries = 0) {
    if (w.reunionsSlider) cb();
    else if (tries < 200) setTimeout(() => ready(cb, tries + 1), 50);
    else console.warn("[section-slider] reunionsSlider never ready");
  }

  ready(() => {
    const slider = w.reunionsSlider!;
    const LAST_CAR = slider.slideCount - 1;
    // Guard the WebGL curtain: if it throws (no GPU / context limit hit),
    // fall back to instant swaps so section changes still WORK — never
    // let a curtain failure freeze navigation.
    let blob: BlobTransition | null = null;
    try {
      blob = new BlobTransition({
        canvas: canvasEl!,
        color: "#000000",
        duration: 1400,
      });
    } catch (e) {
      console.warn("[section-slider] curtain unavailable, instant swaps", e);
      blob = null;
    }

    let mode: Mode = "quotes";
    let car = 0;
    let overscroll = 0;
    let animating = false;
    let cooldown = 0;
    const OVERSCROLL_MAX = () => Math.round(window.innerHeight * 0.4);

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
    function resetBar() { overscroll = 0; setBar(0); }

    // Live, pin-proof positions.
    function maxScrollQuotes(): number {
      return window.scrollY + quotesEl!.getBoundingClientRect().bottom
        - window.innerHeight;
    }
    function galleryTop(): number {
      return galleryEl!.offsetTop;
    }

    function showReunions(on: boolean) {
      reunionsEl!.classList.toggle("slider-layer--active", on);
    }

    async function curtainSwap(apply: () => void) {
      if (!blob) { apply(); return; } // no curtain → instant swap
      canvasEl!.style.opacity = "1";
      blob.setProgress(0);
      apply();
      await blob.play("out");
      canvasEl!.style.opacity = "0";
    }
    const nextFrame = () =>
      new Promise<void>((r) => requestAnimationFrame(() => r()));

    // Fire the panel typing partway through the ~1400ms curtain (not at
    // the end) so the city/model/VIN start writing as the panel is
    // revealed, instead of sitting empty until the curtain fully clears.
    const REVEAL_TEXT_AT = 550; // ms after the curtain starts
    function scheduleTextReveal() {
      setTimeout(() => slider.revealPanelText?.(), REVEAL_TEXT_AT);
    }

    // ---- Mode transitions -------------------------------------------------
    async function quotesToReunions() {
      animating = true; resetBar(); lockScroll(true);
      car = 0;
      const swap = curtainSwap(() => {
        setFlow("reunions");
        showReunions(true);
        slider.setSlideInstant(0);
      });
      scheduleTextReveal();
      await swap;
      mode = "reunions"; animating = false; cooldown = performance.now() + 300;
    }
    async function reunionsToQuotes() {
      animating = true; resetBar();
      await curtainSwap(() => {
        showReunions(false);
        setFlow("quotes");
        lockScroll(false);
        scrollToY(maxScrollQuotes());
      });
      mode = "quotes"; animating = false; cooldown = performance.now() + 300;
    }
    async function reunionsCarTo(next: number) {
      animating = true; resetBar();
      const swap = curtainSwap(() => { car = next; slider.setSlideInstant(car); });
      scheduleTextReveal();
      await swap;
      animating = false; cooldown = performance.now() + 220;
    }
    async function reunionsToGallery() {
      animating = true; resetBar();
      // Cover in black, recompose the flow, then LAND Gallery at the top
      // of the viewport before revealing. Lenis's immediate scroll only
      // applies on its next rAF tick, so we re-assert across two frames.
      if (blob) { canvasEl!.style.opacity = "1"; blob.setProgress(0); }
      showReunions(false);
      setFlow("gallery");
      lockScroll(false);
      await nextFrame();              // let the new flow reflow
      scrollToY(galleryEl!.offsetTop);
      await nextFrame();
      scrollToY(galleryEl!.offsetTop); // re-assert after Lenis ticks
      await nextFrame();
      if (blob) { await blob.play("out"); canvasEl!.style.opacity = "0"; }
      mode = "gallery"; animating = false; cooldown = performance.now() + 300;
    }
    async function galleryToReunions() {
      animating = true; resetBar(); lockScroll(true);
      car = LAST_CAR;
      const swap = curtainSwap(() => {
        setFlow("reunions");   // restores Hero/Interlude into the flow
        showReunions(true);
        slider.setSlideInstant(LAST_CAR);
      });
      scheduleTextReveal();
      await swap;
      mode = "reunions"; animating = false; cooldown = performance.now() + 300;
    }

    // ---- Natural-scroll clamps -------------------------------------------
    function onScroll() {
      if (animating) return;
      if (mode === "quotes") {
        const max = maxScrollQuotes();
        if (window.scrollY > max) scrollToY(max);
      } else if (mode === "gallery") {
        const top = galleryTop();
        if (window.scrollY < top) scrollToY(top); // block scrolling up
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    getLenis()?.on?.("scroll", onScroll);

    // Block the event from reaching Lenis (which listens in the bubble
    // phase). preventDefault alone doesn't stop Lenis's smoothWheel from
    // running its own programmatic scroll.
    function block(e: WheelEvent) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }

    // ---- Wheel / touch handoff -------------------------------------------
    function onWheel(e: WheelEvent) {
      if (animating || performance.now() < cooldown) {
        // During a transition / cooldown, freeze everything (Lenis too).
        if (mode !== "quotes") block(e);
        return;
      }
      const max = OVERSCROLL_MAX();

      if (mode === "quotes") {
        if (e.deltaY > 0 && window.scrollY >= maxScrollQuotes() - 1) {
          block(e);
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
        if (e.deltaY < 0 && window.scrollY <= galleryTop() + 1) {
          block(e);
          scrollToY(galleryTop());
          overscroll += -e.deltaY;
          if (overscroll >= max) galleryToReunions();
          else setBar(overscroll);
        } else if (e.deltaY > 0 && overscroll > 0) {
          overscroll = Math.max(0, overscroll - e.deltaY);
          setBar(overscroll);
        }
        // Downward / mid-section → native (Lenis) scroll into Stories. Free.
        return;
      }

      // reunions: fully locked. Bar drives car nav + crossings.
      block(e);
      overscroll += e.deltaY;
      if (overscroll >= max) {
        resetBar();
        if (car < LAST_CAR) reunionsCarTo(car + 1);
        else reunionsToGallery();
      } else if (overscroll <= -max) {
        resetBar();
        if (car > 0) reunionsCarTo(car - 1);
        else reunionsToQuotes();
      } else setBar(Math.abs(overscroll));
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

    console.log("[section-slider] ready", { lastCar: LAST_CAR });
  });
}
