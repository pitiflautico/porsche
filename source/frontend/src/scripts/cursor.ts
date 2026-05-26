// ============================================
// CUSTOM CURSOR
// ============================================

export interface CursorOptions {
  /** Selectors that trigger the hover expand (default: "a, button, [data-cursor]") */
  hoverSelectors?: string;
  /** Lerp factor for ring movement — controls lag/inertia (default: 0.15) */
  lerpFactor?: number;
  /** Lerp factor for radius expand on hover (default: 0.12) */
  radiusLerpFactor?: number;
  /** Ring radius in px at normal state (default: 19) */
  radiusNormal?: number;
  /** Ring radius in px at hover state (default: 48) */
  radiusHover?: number;
  /** Enables mix-blend-mode: difference on the ring (default: true) */
  blendMode?: boolean;
  /** Ring stroke color — overrides --cursor-ring-color (any valid CSS value) */
  ringColor?: string;
  /** Dot fill color — overrides --cursor-dot-color (any valid CSS value) */
  dotColor?: string;
  /** When true: hide custom dot and show native pointer (default: false) */
  pointer?: boolean;
}

const DEFAULT_HOVER_SELECTORS = "a, button, [data-cursor], div[role='button']";

// Threshold below which DOM writes stop (cursor considered idle)
const IDLE_EPSILON = 0.01;

export function initCursor(options: CursorOptions = {}): () => void {
  if (typeof window === "undefined") return () => { };

  const {
    hoverSelectors = DEFAULT_HOVER_SELECTORS,
    lerpFactor = 0.15,
    radiusLerpFactor = 0.12,
    radiusNormal = 19,
    radiusHover = 48,
    blendMode = true,
    ringColor,
    dotColor,
    pointer = false,
  } = options;

  const root = document.documentElement;
  if (ringColor) root.style.setProperty("--cursor-ring-color", ringColor);
  if (dotColor) root.style.setProperty("--cursor-dot-color", dotColor);
  if (pointer) document.body.classList.add("cursor-pointer-mode");

  // ── DOM ──────────────────────────────────────────────────────────────────
  // Ring is a fixed SVG — only translated, never CSS-scaled.
  // Expand is animated by lerping the circle `r` attribute directly.
  // Stroke stays 1px at all sizes: no CSS scale to distort it.
  const SVG_SIZE = (radiusHover + 2) * 2; // tight container for max radius
  const CX = SVG_SIZE / 2;

  const ring = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  ring.setAttribute("class", "custom-cursor");
  ring.setAttribute("viewBox", `0 0 ${SVG_SIZE} ${SVG_SIZE}`);
  ring.setAttribute("aria-hidden", "true");
  ring.style.width = `${SVG_SIZE}px`;
  ring.style.height = `${SVG_SIZE}px`;
  ring.style.top = `-${CX}px`;
  ring.style.left = `-${CX}px`;
  if (!blendMode) ring.style.mixBlendMode = "normal";

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", String(CX));
  circle.setAttribute("cy", String(CX));
  circle.setAttribute("r", String(radiusNormal));
  ring.appendChild(circle);

  const dot: HTMLDivElement | null = pointer
    ? null
    : (() => {
      const d = document.createElement("div");
      d.setAttribute("class", "custom-cursor__dot");
      d.setAttribute("aria-hidden", "true");
      return d;
    })();

  // Player cursor: blurred circle that replaces the ring in play mode
  const playerEl = document.createElement("div");
  playerEl.className = "custom-cursor__player";
  playerEl.setAttribute("aria-hidden", "true");
  playerEl.style.width = `${radiusHover * 1.175}px`;
  playerEl.style.height = `${radiusHover * 1.175}px`;
  playerEl.style.top = `-${radiusHover - 10}px`;
  playerEl.style.left = `-${radiusHover - 10}px`;
  playerEl.innerHTML = `
    <svg class="custom-cursor__player-icon custom-cursor__player-icon--play" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="9,6 20,12 9,18"/>
    </svg>
    <svg class="custom-cursor__player-icon custom-cursor__player-icon--pause" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
    </svg>`;

  // Cursor label: snaps to mouse, appears just outside the ring in play mode
  const labelEl = document.createElement("div");
  labelEl.className = "custom-cursor__label";
  labelEl.setAttribute("aria-hidden", "true");

  document.body.appendChild(ring);
  if (dot) document.body.appendChild(dot);
  document.body.appendChild(playerEl);
  document.body.appendChild(labelEl);

  // ── Estado ───────────────────────────────────────────────────────────────
  let mouseX = -200; // Off-screen on init — prevents flash at center
  let mouseY = -200;
  let ringX = mouseX;
  let ringY = mouseY;
  let currentR = radiusNormal;
  let targetR = radiusNormal;
  let rafId = 0;
  let hasFirstMove = false;
  let isIdle = false;

  // ── Position events ───────────────────────────────────────────────────────
  const onMouseMove = (e: MouseEvent) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!hasFirstMove) {
      // First move: snap ring to real position, then reveal
      ringX = mouseX;
      ringY = mouseY;
      hasFirstMove = true;
      ring.style.opacity = "1";
      if (dot) dot.style.opacity = "1";
    }

    // Label snaps directly to mouse — no lerp, always adjacent to ring edge
    labelEl.style.transform = `translate(${mouseX + radiusHover + 10}px, ${mouseY - 7}px)`;

    if (isIdle) {
      isIdle = false;
      rafId = requestAnimationFrame(loop);
    }
  };

  // ── Hover expand / hide ───────────────────────────────────────────────────
  // Uses capture phase to avoid bubbling through child elements,
  // which would cause flicker with standard mouseover/mouseout.
  const onMouseEnterEl = (e: MouseEvent) => {
    const el = e.target as Element;
    if (el.closest("[data-cursor='hide']")) {
      ring.style.opacity = "0";
      if (dot) dot.style.opacity = "0";
      return;
    }
    if (el.closest("[data-cursor='play']")) {
      ring.style.opacity = "0";
      playerEl.classList.add("is-visible");
      targetR = radiusHover;
      if (dot) dot.style.opacity = "0";
      const playEl = el.closest<HTMLElement>("[data-cursor='play']");
      if (playEl?.dataset.cursorLabel) {
        labelEl.textContent = playEl.dataset.cursorLabel;
        labelEl.classList.add("is-visible");
      }
      return;
    }
    const target = el.closest(hoverSelectors);
    if (target) {
      targetR = radiusHover;
      if (dot) dot.style.opacity = "0";
    }
  };

  const onMouseLeaveEl = (e: MouseEvent) => {
    const el = e.target as Element;
    if (el.closest("[data-cursor='hide']")) {
      ring.style.opacity = "1";
      if (dot) dot.style.opacity = "1";
      targetR = radiusNormal;
      return;
    }
    if (el.closest("[data-cursor='play']")) {
      ring.style.opacity = "1";
      playerEl.classList.remove("is-visible");
      targetR = radiusNormal;
      if (dot) dot.style.opacity = "1";
      labelEl.classList.remove("is-visible");
      return;
    }
    const target = el.closest(hoverSelectors);
    if (target) {
      targetR = radiusNormal;
      if (dot) dot.style.opacity = "1";
    }
  };

  document.addEventListener("mouseover", onMouseEnterEl, { capture: true });
  document.addEventListener("mouseout", onMouseLeaveEl, { capture: true });

  // ── Viewport visibility ───────────────────────────────────────────────────
  const onDocLeave = () => {
    ring.style.opacity = "0";
    if (dot) dot.style.opacity = "0";
  };

  const onDocEnter = () => {
    if (hasFirstMove) {
      ring.style.opacity = "1";
      if (dot) dot.style.opacity = "1";
    }
  };

  document.addEventListener("mouseleave", onDocLeave);
  document.addEventListener("mouseenter", onDocEnter);
  document.addEventListener("mousemove", onMouseMove);

  // ── Animation loop ───────────────────────────────────────────────────────
  function loop() {
    const dRingX = mouseX - ringX;
    const dRingY = mouseY - ringY;
    const dR = targetR - currentR;

    ringX += dRingX * lerpFactor;
    ringY += dRingY * lerpFactor;
    currentR += dR * radiusLerpFactor;

    const moving =
      Math.abs(dRingX) > IDLE_EPSILON ||
      Math.abs(dRingY) > IDLE_EPSILON ||
      Math.abs(dR) > IDLE_EPSILON * 0.1;

    // Translate only — no CSS scale, stroke stays sharp
    const tX = Math.round(ringX * 2) / 2;
    const tY = Math.round(ringY * 2) / 2;
    const ringTransform = `translate(${tX}px, ${tY}px)`;

    ring.style.transform = ringTransform;
    playerEl.style.transform = ringTransform;
    circle.setAttribute("r", currentR.toFixed(2));
    if (dot) dot.style.transform = `translate(${Math.round(mouseX * 2) / 2}px, ${Math.round(mouseY * 2) / 2}px)`;

    if (moving) {
      rafId = requestAnimationFrame(loop);
    } else {
      const idleTransform = `translate(${Math.round(mouseX * 2) / 2}px, ${Math.round(mouseY * 2) / 2}px)`;
      ring.style.transform = idleTransform;
      playerEl.style.transform = idleTransform;
      circle.setAttribute("r", String(targetR));
      isIdle = true;
    }
  }

  rafId = requestAnimationFrame(loop);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  return function destroy() {
    cancelAnimationFrame(rafId);
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseover", onMouseEnterEl, { capture: true } as EventListenerOptions);
    document.removeEventListener("mouseout", onMouseLeaveEl, { capture: true } as EventListenerOptions);
    document.removeEventListener("mouseleave", onDocLeave);
    document.removeEventListener("mouseenter", onDocEnter);
    document.body.classList.remove("cursor-pointer-mode");
    ring.remove();
    dot?.remove();
    playerEl.remove();
    labelEl.remove();
  };
}
