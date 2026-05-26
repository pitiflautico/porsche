// ============================================
// GSAP TEXT RANDOM BLUR
//
// Splits an element's text into per-char spans and animates them
// in/out with randomized y, opacity and blur — each char independent.
//
// Requires GSAP. No other dependencies.
//
// Exports:
//   animateTextRandomBlur(el, options?)      — animate chars IN
//   animateTextRandomBlurOut(el, onComplete, options?)  — animate chars OUT
// ============================================

import gsap from "gsap";

// Per-char timing arrays — non-uniform so stagger doesn't feel mechanical
const ENTER_SPEEDS = [0.45, 0.55, 0.38, 0.50, 0.62, 0.42, 0.52, 0.47, 0.58, 0.44];
const ENTER_DELAYS = [0, 0.06, 0.03, 0.10, 0.05, 0.12, 0.02, 0.08, 0.09, 0.04];
const EXIT_SPEEDS = [0.28, 0.35, 0.22, 0.30, 0.38, 0.25, 0.32, 0.27, 0.36, 0.26];
const EXIT_DELAYS = [0, 0.04, 0.02, 0.07, 0.03, 0.09, 0.01, 0.05, 0.06, 0.02];

// Blur resolves slower than movement — char lands, then clears
const BLUR_ENTER_DURATION = 0.9;
const BLUR_EXIT_DURATION = 0.4;

export interface TextRandomBlurOptions {
  /** Vertical offset in px for each char during animation (default: 70) */
  yOffset?: number;
  /** Blur amount in px at start/end state (default: 8) */
  blur?: number;
}

const CHAR_CLASS = "text-random-blur__char";
const WORD_CLASS = "text-random-blur__word";

// Splits el.textContent into per-char spans, grouped in per-word wrappers
// so the browser only breaks lines between words (fixes mid-word wrap on narrow viewports).
// Idempotent: if already split, returns existing char spans.
function getSpans(el: HTMLElement): HTMLElement[] {
  const existing = el.querySelectorAll<HTMLElement>(`.${CHAR_CLASS}`);
  if (existing.length) return Array.from(existing);

  const text = (el.textContent || "").trim();
  if (!text) return [];

  el.innerHTML = "";
  const spans: HTMLElement[] = [];
  const words = text.split(/\s+/);

  words.forEach((word, wordIndex) => {
    const wordSpan = document.createElement("span");
    wordSpan.className = WORD_CLASS;
    wordSpan.style.display = "inline-block";
    wordSpan.style.whiteSpace = "nowrap";

    for (let i = 0; i < word.length; i++) {
      const span = document.createElement("span");
      span.className = CHAR_CLASS;
      span.textContent = word[i];
      span.style.display = "inline-block";
      wordSpan.appendChild(span);
      spans.push(span);
    }

    el.appendChild(wordSpan);

    // Space between words (so line can break here)
    if (wordIndex < words.length - 1) {
      const spaceSpan = document.createElement("span");
      spaceSpan.className = CHAR_CLASS;
      spaceSpan.textContent = " ";
      spaceSpan.style.display = "inline-block";
      spaceSpan.style.whiteSpace = "pre";
      el.appendChild(spaceSpan);
      spans.push(spaceSpan);
    }
  });

  return spans;
}

/**
 * Splits el text into spans and animates each char IN
 * with randomized y, opacity and blur.
 * Alternating y direction per char index (even up, odd down).
 */
export function animateTextRandomBlur(
  el: HTMLElement,
  options: TextRandomBlurOptions = {}
): void {
  const { yOffset = 100, blur = 10 } = options;
  const spans = getSpans(el);

  spans.forEach((span, i) => {
    const dir = i % 2 === 0 ? 1 : -1;
    const delay = ENTER_DELAYS[i % ENTER_DELAYS.length];
    gsap.set(span, { y: yOffset * dir, opacity: 0, filter: `blur(${blur}px)` });

    // Movement + opacity snap into place
    gsap.to(span, {
      y: 0,
      opacity: 1,
      duration: ENTER_SPEEDS[i % ENTER_SPEEDS.length],
      ease: "expo.out",
      delay,
    });

    // Blur trails behind — resolves after char has landed
    gsap.to(span, {
      filter: "blur(0px)",
      duration: BLUR_ENTER_DURATION,
      ease: "power1.out",
      delay,
    });
  });
}

/**
 * Animates each char OUT with randomized y, opacity and blur.
 * Calls onComplete when the last char finishes — use it to
 * update textContent and call animateTextRandomBlur().
 */
export function animateTextRandomBlurOut(
  el: HTMLElement,
  onComplete: () => void,
  options: TextRandomBlurOptions = {}
): void {
  const { yOffset = 70, blur = 8 } = options;
  const spans = getSpans(el);

  if (!spans.length) {
    onComplete();
    return;
  }

  // Track which char finishes last (delay + duration)
  const lastCharIndex = spans.reduce((maxI, _, i) => {
    const total = EXIT_DELAYS[i % EXIT_DELAYS.length] + EXIT_SPEEDS[i % EXIT_SPEEDS.length];
    const max = EXIT_DELAYS[maxI % EXIT_DELAYS.length] + EXIT_SPEEDS[maxI % EXIT_SPEEDS.length];
    return total > max ? i : maxI;
  }, 0);

  spans.forEach((span, i) => {
    const dir = i % 2 === 0 ? -1 : 1;
    const delay = EXIT_DELAYS[i % EXIT_DELAYS.length];

    gsap.to(span, {
      y: yOffset * dir,
      opacity: 0,
      duration: EXIT_SPEEDS[i % EXIT_SPEEDS.length],
      ease: "expo.in",
      delay,
      onComplete: i === lastCharIndex ? onComplete : undefined,
    });

    // Blur leads the exit — starts blurring before char moves away
    gsap.to(span, {
      filter: `blur(${blur}px)`,
      duration: BLUR_EXIT_DURATION,
      ease: "power2.in",
      delay,
    });
  });
}
