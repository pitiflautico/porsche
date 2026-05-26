/**
 * WebGL canvas renderer for the Reunions section.
 *
 * Handles:
 * - Loading reunion images (bg + person snapshots) as GPU textures
 * - Compositing each reunion scene into an FBO (bg + persons at variable opacity)
 * - Pluggable transition between reunions (default: noise dissolve) driven by scroll progress
 * - Per-person opacity control for hover/click highlight effects
 */

import { RippleEffect } from '../gl-transitions/ripple-effect';
import { DissolveEffect } from './dissolve-effect';
import type { ParamDef, TransitionEffect, TransitionUniforms } from './transition-effect';
import { createProgram, FULLSCREEN_VERT } from './webgl-program';

/** Built-in transition effects for Reunions (debug selector + `createReunionsTransitionEffect`). */
export const REUNIONS_TRANSITION_EFFECT_OPTIONS = [
  { id: 'Dissolve' as const, create: () => new DissolveEffect() },
  { id: 'Ripple' as const, create: () => new RippleEffect() },
] as const;

export type ReunionsTransitionEffectId = (typeof REUNIONS_TRANSITION_EFFECT_OPTIONS)[number]['id'];

export function createReunionsTransitionEffect(id: string): TransitionEffect {
  const row = REUNIONS_TRANSITION_EFFECT_OPTIONS.find((o) => o.id === id);
  return row ? row.create() : new DissolveEffect();
}

/**
 * Transition debug UI (sliders). Set to `true` in this file to show the panel;
 * Reunions.astro only calls `createDebugPanel()` when this is `true`.
 */
export const ENABLE_REUNIONS_EFFECTS_DEBUG = false;

/** DOM id for `createDebugPanel()`; must match cleanup in `setEffect` / `destroy`. */
const REUNIONS_EFFECTS_DEBUG_PANEL_ID = 'reunions-effects-debug';
const REUNIONS_EFFECTS_DEBUG_BODY_CLASS = 'reunions-effects-debug__body';

/** Full-canvas layer behind the framed reunion stack (same asset as modal photo area). */
export const REUNIONS_SLIDE_AMBIENT_BG_URL = '/images/reunions/bg-reunions.jpg';

export type { ParamDef, TransitionEffect, TransitionUniforms } from './transition-effect';
export { DissolveEffect } from './dissolve-effect';
export { RippleEffect } from '../gl-transitions/ripple-effect';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReunionImageSet {
  bg: string;
  images: string[];
  /** Horizontal anchor for object-fit:cover crop (0.5 = center) */
  anchorX?: number;
  /** Custom z-order for person compositing (indices into images[]) — lower index renders first (behind) */
  renderOrder?: number[];
}

export interface ReunionsCanvasInitOptions {
  /** Default true. When false, next reunion’s people stay visible during WebGL blend (see Reunions.astro). */
  staggerPersonEntrance?: boolean;
}

interface LoadedTexture {
  texture: WebGLTexture;
  width: number;
  height: number;
}

interface SceneData {
  bg: LoadedTexture | null;
  persons: (LoadedTexture | null)[];
  anchorX: number;
  renderOrder: number[];
  loaded: boolean;
}

interface FBO {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
  width: number;
  height: number;
}

export interface ScrollState {
  activeReunion: number;
  nextReunion: number | null;
  dissolveProgress: number;
  /** Normalized section scroll 0–1; enables Ken Burns when set (pass from ScrollTrigger `progress`). */
  scrollProgress?: number;
}

// ── Shader sources (composite + passthrough only) ─────────────────────────────

const COMPOSITE_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform float uOpacity;
uniform vec2 uScale;
uniform vec2 uOffset;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec2 uv = vUv * uScale + uOffset;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    fragColor = vec4(0.0);
    return;
  }
  vec4 color = texture(uTexture, uv);
  fragColor = color * uOpacity;
}`;

const PASSTHROUGH_FRAG = `#version 300 es
precision highp float;
uniform sampler2D uTexture;
uniform vec3 uBgColor;
in vec2 vUv;
out vec4 fragColor;
void main() {
  vec4 scene = texture(uTexture, vUv);
  vec3 finalColor = scene.rgb + uBgColor * (1.0 - scene.a);
  fragColor = vec4(finalColor, 1.0);
}`;

// ── Scroll: transition window (fraction of each reunion's scroll segment) ─────

let TRANSITION_ZONE = 0.55;

function syncScrollTransitionZone(zone: number): void {
  TRANSITION_ZONE = zone;
}

export function getScrollState(scrollProgress: number, count: number): ScrollState {
  const perReunion = 1 / count;
  let active = Math.floor(scrollProgress / perReunion);
  active = Math.min(active, count - 1);

  const localStart = active * perReunion;
  const local = (scrollProgress - localStart) / perReunion;
  const settledEnd = 1 - TRANSITION_ZONE;

  if (local > settledEnd && active < count - 1) {
    const dp = (local - settledEnd) / TRANSITION_ZONE;
    return { activeReunion: active, nextReunion: active + 1, dissolveProgress: dp };
  }
  return { activeReunion: active, nextReunion: null, dissolveProgress: 0 };
}

// ── Ken Burns on composite UVs ──────────────────────────────────────────────

/** >1 = tighter crop vs neutral 1. */
const KEN_BURNS_MAX_ZOOM = 1.05;
/** Fraction of the settled segment (before transition zone) used for Ken, every reunion. */
const KEN_BURNS_SETTLED_FRACTION = 0.5;
/**
 * false: 1.4 → ease → 1, then hold 1 (zoom out / settle).
 * true: 1 → ease → 1.4, then hold 1.4 (zoom in).
 */
const KEN_BURNS_ZOOM_IN_OVER_TIME = false;

/** Reunion index 0: no Ken Burns (neutral 1). Slides 1+ keep normal Ken / rest zoom. */
const KEN_BURNS_SKIP_FIRST_SLIDE = true;

/** Matches Astro / hitbox gating: dissolve blocks interaction above this progress. */
export const REUNIONS_INTERACTION_DISSOLVE_EPS = 0.02;

/** True when WebGL transition is not blocking hitboxes/audio (dissolve settled). */
export function isReunionsInteractionReady(
  state: Pick<ScrollState, 'nextReunion' | 'dissolveProgress'>,
): boolean {
  if (
    state.nextReunion !== null &&
    state.dissolveProgress > REUNIONS_INTERACTION_DISSOLVE_EPS
  ) {
    return false;
  }
  return true;
}

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

/** `t` in [0,1] over the Ken segment; respects {@link KEN_BURNS_ZOOM_IN_OVER_TIME}. */
function kenBurnsZoomAtUnitProgress(t: number): number {
  const e = easeOutCubic(t);
  if (KEN_BURNS_ZOOM_IN_OVER_TIME) {
    return 1 + (KEN_BURNS_MAX_ZOOM - 1) * e;
  }
  return KEN_BURNS_MAX_ZOOM + (1 - KEN_BURNS_MAX_ZOOM) * e;
}

/** Zoom-in factor k>1, centered on current cover crop. */
function applyKenBurnsToCoverUv(
  scale: [number, number],
  offset: [number, number],
  kenK: number,
): { scale: [number, number]; offset: [number, number] } {
  if (kenK <= 1.00001) return { scale, offset };
  const sx = scale[0] / kenK;
  const sy = scale[1] / kenK;
  const ox = offset[0] + scale[0] * (0.5 - 0.5 / kenK);
  const oy = offset[1] + scale[1] * (0.5 - 0.5 / kenK);
  return { scale: [sx, sy], offset: [ox, oy] };
}

// ── Cover UV helpers ─────────────────────────────────────────────────────────

function coverScaleOffset(
  canvasW: number,
  canvasH: number,
  imgW: number,
  imgH: number,
  anchorX: number,
  anchorY = 0.5,
): { scale: [number, number]; offset: [number, number] } {
  const canvasAspect = canvasW / canvasH;
  const imgAspect = imgW / imgH;
  let sx = 1,
    sy = 1;
  if (canvasAspect > imgAspect) {
    sy = imgAspect / canvasAspect;
  } else {
    sx = canvasAspect / imgAspect;
  }
  const ox = (1 - sx) * anchorX;
  const oy = (1 - sy) * anchorY;
  return { scale: [sx, sy], offset: [ox, oy] };
}

function createFBO(gl: WebGL2RenderingContext, width: number, height: number): FBO {
  const framebuffer = gl.createFramebuffer()!;
  const texture = gl.createTexture()!;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  return { framebuffer, texture, width, height };
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function uploadTexture(gl: WebGL2RenderingContext, img: HTMLImageElement): LoadedTexture {
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return { texture, width: img.naturalWidth, height: img.naturalHeight };
}

// ── Main class ───────────────────────────────────────────────────────────────

const CANVAS_TRANSITION_PARAM_DEFS: ParamDef[] = [
  { key: 'transitionZone', label: 'Transition Zone', min: 0.15, max: 0.6, step: 0.01 },
];

export class ReunionsCanvas {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private width = 0;
  private height = 0;

  private quadVAO: WebGLVertexArrayObject;

  private compositeProgram: { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> };
  private passthroughProgram: { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> };

  private _effect: TransitionEffect;

  private scenes: SceneData[];
  private sceneFBOs: FBO[] = [];
  private needsComposite: boolean[];
  private personOpacities: number[][];

  private _activeReunion = 0;
  private _nextReunion: number | null = null;
  private _dissolveProgress = 0;
  private _bgColor: [number, number, number] = [0.075, 0.075, 0.063];
  private _renderScheduled = false;
  private _destroyed = false;

  /**
   * Fraction of each reunion's local scroll segment used for A→B transition.
   * Drives `getScrollState` via internal sync (scroll handler does not read this property).
   */
  transitionZone = 0.55;

  /**
   * When true, persons of the next reunion are hidden until slide switch, then stagger in.
   * When false, they stay visible during the transition. Toggled from the debug panel when enabled.
   */
  staggerPersonEntrance = true;

  /**
   * When set, scene layers use object-fit:cover math for this pixel rect only
   * (canvas buffer coords, top-left origin). Matches `.reunion__people` in CSS.
   */
  private _compositeRect: { x: number; y: number; w: number; h: number } | null = null;

  private _ambientTexture: LoadedTexture | null = null;

  private _scrollProgress = 0;
  /** When false, Ken Burns is off (no `scrollProgress` passed to `setScrollState`). */
  private _kenScrollProgressActive = false;
  /** Previous-frame Ken zoom per scene; NaN forces composite. */
  private _prevKen: number[] = [];

  /**
   * @param effect — omit for default `DissolveEffect`. Swap at runtime with `setEffect`.
   * @param options — e.g. `staggerPersonEntrance` (default false).
   */
  constructor(
    canvas: HTMLCanvasElement,
    data: ReunionImageSet[],
    effect: TransitionEffect = new DissolveEffect(),
    options: ReunionsCanvasInitOptions = {},
  ) {
    this.canvas = canvas;
    this.staggerPersonEntrance = options.staggerPersonEntrance !== false;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      premultipliedAlpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('WebGL2 not available');
    this.gl = gl;

    this.scenes = data.map((d) => ({
      bg: null,
      persons: d.images.map(() => null),
      anchorX: d.anchorX ?? 0.5,
      renderOrder: d.renderOrder ?? d.images.map((_, i) => i),
      loaded: false,
    }));

    this.personOpacities = data.map((d) => d.images.map(() => 0));
    this.needsComposite = data.map(() => true);
    this._prevKen = data.map(() => Number.NaN);

    this.quadVAO = this.createFullscreenQuad();
    this.compositeProgram = createProgram(gl, FULLSCREEN_VERT, COMPOSITE_FRAG);
    this.passthroughProgram = createProgram(gl, FULLSCREEN_VERT, PASSTHROUGH_FRAG);

    this._effect = effect;
    this._effect.init(gl, FULLSCREEN_VERT);
    syncScrollTransitionZone(this.transitionZone);

    this.resize();
    this.loadAllTextures(data);
    void this.loadAmbientBackground();
  }

  /** Live-tuning object for the default dissolve (same shape as pre-refactor `dissolveParams` minus `transitionZone`). */
  get dissolveParams(): Record<string, number> {
    return this._effect.params;
  }

  setEffect(effect: TransitionEffect): void {
    if (this._destroyed) return;
    this._effect.destroy(this.gl);
    this._effect = effect;
    this._effect.init(this.gl, FULLSCREEN_VERT);
    if (ENABLE_REUNIONS_EFFECTS_DEBUG) {
      document.getElementById(REUNIONS_EFFECTS_DEBUG_PANEL_ID)?.remove();
      this.createDebugPanel();
    }
    this.scheduleRender();
  }

  get transitionEffect(): TransitionEffect {
    return this._effect;
  }

  private async loadAmbientBackground() {
    try {
      const img = await loadImage(REUNIONS_SLIDE_AMBIENT_BG_URL);
      if (this._destroyed) return;
      this._ambientTexture = uploadTexture(this.gl, img);
      this.needsComposite.fill(true);
      this.scheduleRender();
    } catch {
      /* optional asset */
    }
  }

  // ── Geometry ─────────────────────────────────────────────────────────────

  private createFullscreenQuad(): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const posLoc = 0;
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
    return vao;
  }

  // ── Texture loading ──────────────────────────────────────────────────────

  private async loadAllTextures(data: ReunionImageSet[]) {
    await this.loadReunionTextures(0, data[0]);
    this.scheduleRender();

    for (let i = 1; i < data.length; i++) {
      this.loadReunionTextures(i, data[i]).then(() => this.scheduleRender());
    }
  }

  private async loadReunionTextures(index: number, data: ReunionImageSet) {
    const gl = this.gl;
    if (this._destroyed) return;

    try {
      const bgImg = await loadImage(data.bg);
      if (this._destroyed) return;
      this.scenes[index].bg = uploadTexture(gl, bgImg);
      this.needsComposite[index] = true;
    } catch {
      /* bg load failed */
    }

    const personPromises = data.images.map(async (url, i) => {
      try {
        const img = await loadImage(url);
        if (this._destroyed) return;
        this.scenes[index].persons[i] = uploadTexture(gl, img);
        this.needsComposite[index] = true;
      } catch {
        /* person load failed */
      }
    });

    await Promise.all(personPromises);
    if (!this._destroyed) {
      this.scenes[index].loaded = true;
      this.needsComposite[index] = true;
    }
  }

  // ── Resize ───────────────────────────────────────────────────────────────

  resize() {
    const dpr = Math.min(window.devicePixelRatio, 2);
    const w = Math.round(this.canvas.clientWidth * dpr);
    const h = Math.round(this.canvas.clientHeight * dpr);
    if (w === this.width && h === this.height) return;

    this.canvas.width = w;
    this.canvas.height = h;
    this.width = w;
    this.height = h;

    const gl = this.gl;
    for (const fbo of this.sceneFBOs) {
      gl.deleteFramebuffer(fbo.framebuffer);
      gl.deleteTexture(fbo.texture);
    }
    this.sceneFBOs = this.scenes.map(() => createFBO(gl, w, h));
    this.needsComposite.fill(true);
    this._prevKen = this.scenes.map(() => Number.NaN);
    this.scheduleRender();
  }

  setCompositeRect(rect: { x: number; y: number; w: number; h: number } | null) {
    if (
      !rect ||
      !Number.isFinite(rect.w) ||
      !Number.isFinite(rect.h) ||
      rect.w < 2 ||
      rect.h < 2
    ) {
      this._compositeRect = null;
    } else {
      this._compositeRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    }
    this.needsComposite.fill(true);
    this.scheduleRender();
  }

  syncCompositeRectToElement(el: Element | null) {
    if (!el) {
      this.setCompositeRect(null);
      return;
    }
    const r = ReunionsCanvas.measureCompositeRect(this.canvas, el);
    if (!r) {
      this.setCompositeRect(null);
      return;
    }
    const p = this._compositeRect;
    const eps = 2;
    if (
      p &&
      Math.abs(r.x - p.x) < eps &&
      Math.abs(r.y - p.y) < eps &&
      Math.abs(r.w - p.w) < eps &&
      Math.abs(r.h - p.h) < eps
    ) {
      return;
    }
    this.setCompositeRect(r);
  }

  static measureCompositeRect(
    canvas: HTMLCanvasElement,
    el: Element,
  ): { x: number; y: number; w: number; h: number } | null {
    if (!canvas.isConnected || !el.isConnected) return null;
    const c = canvas.getBoundingClientRect();
    const s = el.getBoundingClientRect();
    if (s.width < 1 || s.height < 1) return null;
    const cw = Math.max(1, canvas.clientWidth);
    const ch = Math.max(1, canvas.clientHeight);
    const sx = canvas.width / cw;
    const sy = canvas.height / ch;
    return {
      x: (s.left - c.left) * sx,
      y: (s.top - c.top) * sy,
      w: s.width * sx,
      h: s.height * sy,
    };
  }

  private getCompositeViewport(): {
    vpX: number;
    vpY: number;
    vpW: number;
    vpH: number;
    cw: number;
    ch: number;
  } {
    if (!this._compositeRect || this._compositeRect.w < 2 || this._compositeRect.h < 2) {
      return {
        vpX: 0,
        vpY: 0,
        vpW: this.width,
        vpH: this.height,
        cw: this.width,
        ch: this.height,
      };
    }
    let x = Math.round(this._compositeRect.x);
    let y = Math.round(this._compositeRect.y);
    let w = Math.round(this._compositeRect.w);
    let h = Math.round(this._compositeRect.h);
    x = Math.max(0, Math.min(x, this.width - 1));
    y = Math.max(0, Math.min(y, this.height - 1));
    w = Math.max(1, Math.min(w, this.width - x));
    h = Math.max(1, Math.min(h, this.height - y));
    const vpY = this.height - y - h;
    return { vpX: x, vpY, vpW: w, vpH: h, cw: w, ch: h };
  }

  /**
   * Zoom factor for scene `sceneIndex` composite (>1 = tighter crop).
   * Slide 0: Ken only if {@link KEN_BURNS_SKIP_FIRST_SLIDE} is false; else always 1.
   * Slides 1+: Ken runs in sync with WebGL dissolve (`next`, dp 0→1); settled holds rest zoom.
   * During dissolve: `active` uses rest zoom (outgoing), except slide 0 when skip-first is on.
   * Direction: {@link KEN_BURNS_ZOOM_IN_OVER_TIME}.
   */
  private getKenBurnsZoom(sceneIndex: number): number {
    if (!this._kenScrollProgressActive) return 1;

    const count = this.scenes.length;
    if (count < 1) return 1;

    const zone = this.transitionZone;
    const settledEnd = 1 - zone;
    const per = 1 / count;
    const active = this._activeReunion;
    const next = this._nextReunion;
    const dp = this._dissolveProgress;
    const sp = this._scrollProgress;

    const kenRestZoom = KEN_BURNS_ZOOM_IN_OVER_TIME ? KEN_BURNS_MAX_ZOOM : 1;

    if (next !== null && dp > 0 && sceneIndex === next) {
      return kenBurnsZoomAtUnitProgress(dp);
    }
    if (next !== null && dp > 0 && sceneIndex === active) {
      if (KEN_BURNS_SKIP_FIRST_SLIDE && sceneIndex === 0) return 1;
      return kenRestZoom;
    }

    const local = (sp - sceneIndex * per) / per;
    if (local < 0 || local >= 1) return 1;

    const kenEnd = settledEnd * KEN_BURNS_SETTLED_FRACTION;
    if (sceneIndex === 0) {
      if (KEN_BURNS_SKIP_FIRST_SLIDE) return 1;
      if (local >= kenEnd) return kenRestZoom;
      return kenBurnsZoomAtUnitProgress(local / kenEnd);
    }

    return kenRestZoom;
  }

  // ── Scene compositing ────────────────────────────────────────────────────

  private compositeScene(index: number) {
    const gl = this.gl;
    const scene = this.scenes[index];
    const fbo = this.sceneFBOs[index];
    if (!fbo) return;

    const comp = this.getCompositeViewport();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.framebuffer);
    gl.viewport(0, 0, fbo.width, fbo.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const prog = this.compositeProgram;
    gl.useProgram(prog.program);
    gl.bindVertexArray(this.quadVAO);

    const kenK = this.getKenBurnsZoom(index);

    const amb = this._ambientTexture;
    const partialFrame = comp.vpW < this.width - 1 || comp.vpH < this.height - 1;
    if (amb && partialFrame) {
      gl.viewport(0, 0, this.width, this.height);
      const { scale, offset } = coverScaleOffset(
        this.width,
        this.height,
        amb.width,
        amb.height,
        0.5,
      );
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, amb.texture);
      gl.uniform1i(prog.uniforms.uTexture, 0);
      gl.uniform1f(prog.uniforms.uOpacity, 1);
      gl.uniform2f(prog.uniforms.uScale, scale[0], scale[1]);
      gl.uniform2f(prog.uniforms.uOffset, offset[0], offset[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    gl.viewport(comp.vpX, comp.vpY, comp.vpW, comp.vpH);

    const drawLayer = (tex: LoadedTexture | null, opacity: number) => {
      if (!tex || opacity <= 0) return;
      const base = coverScaleOffset(
        comp.cw,
        comp.ch,
        tex.width,
        tex.height,
        scene.anchorX,
      );
      const { scale, offset } = applyKenBurnsToCoverUv(base.scale, base.offset, kenK);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex.texture);
      gl.uniform1i(prog.uniforms.uTexture, 0);
      gl.uniform1f(prog.uniforms.uOpacity, opacity);
      gl.uniform2f(prog.uniforms.uScale, scale[0], scale[1]);
      gl.uniform2f(prog.uniforms.uOffset, offset[0], offset[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    drawLayer(scene.bg, 1);

    const opacities = this.personOpacities[index];
    for (const i of scene.renderOrder) {
      drawLayer(scene.persons[i], opacities[i]);
    }

    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  // ── Rendering ────────────────────────────────────────────────────────────

  render() {
    if (this._destroyed) return;
    const gl = this.gl;

    syncScrollTransitionZone(this.transitionZone);

    for (let i = 0; i < this.scenes.length; i++) {
      const k = this.getKenBurnsZoom(i);
      const prev = this._prevKen[i];
      if (!Number.isFinite(prev) || Math.abs(k - prev) > 0.0005) {
        this.needsComposite[i] = true;
      }
      this._prevKen[i] = k;
    }

    for (let i = 0; i < this.needsComposite.length; i++) {
      if (this.needsComposite[i]) {
        this.compositeScene(i);
        this.needsComposite[i] = false;
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.width, this.height);
    gl.clearColor(this._bgColor[0], this._bgColor[1], this._bgColor[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.quadVAO);

    const fboA = this.sceneFBOs[this._activeReunion];
    if (!fboA) return;

    if (this._nextReunion !== null && this._dissolveProgress > 0) {
      const fboB = this.sceneFBOs[this._nextReunion];
      if (!fboB) return;

      const u: TransitionUniforms = {
        sceneA: fboA.texture,
        sceneB: fboB.texture,
        progress: this._dissolveProgress,
        time: performance.now() / 1000,
        aspect: this.width / this.height,
        bgColor: this._bgColor,
      };
      this._effect.render(gl, u);
    } else {
      const prog = this.passthroughProgram;
      gl.useProgram(prog.program);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fboA.texture);
      gl.uniform1i(prog.uniforms.uTexture, 0);
      gl.uniform3f(prog.uniforms.uBgColor, this._bgColor[0], this._bgColor[1], this._bgColor[2]);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  // ── Public API ───────────────────────────────────────────────────────────

  setScrollState(state: ScrollState) {
    const sp = state.scrollProgress;
    const spChanged = sp !== undefined && sp !== this._scrollProgress;
    if (sp !== undefined) {
      this._scrollProgress = sp;
      this._kenScrollProgressActive = true;
    }

    const changed =
      this._activeReunion !== state.activeReunion ||
      this._nextReunion !== state.nextReunion ||
      this._dissolveProgress !== state.dissolveProgress;

    this._activeReunion = state.activeReunion;
    this._nextReunion = state.nextReunion;
    this._dissolveProgress = state.dissolveProgress;

    if (state.dissolveProgress > 0) {
      const t = Math.sin(state.dissolveProgress * Math.PI);
      this._bgColor = [0.075 + t * 0.04, 0.075 + t * 0.025, 0.063 + t * 0.015];
    } else {
      this._bgColor = [0.075, 0.075, 0.063];
    }

    if (changed || spChanged) this.scheduleRender();
  }

  get activeReunion() {
    return this._activeReunion;
  }

  setPersonOpacity(reunionIndex: number, personIndex: number, opacity: number) {
    if (this.personOpacities[reunionIndex]?.[personIndex] === opacity) return;
    this.personOpacities[reunionIndex][personIndex] = opacity;
    this.needsComposite[reunionIndex] = true;
    this.scheduleRender();
  }

  getPersonOpacity(reunionIndex: number, personIndex: number): number {
    return this.personOpacities[reunionIndex]?.[personIndex] ?? 0;
  }

  setAllPersonOpacities(reunionIndex: number, opacity: number) {
    const arr = this.personOpacities[reunionIndex];
    if (!arr) return;
    let changed = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== opacity) {
        arr[i] = opacity;
        changed = true;
      }
    }
    if (changed) {
      this.needsComposite[reunionIndex] = true;
      this.scheduleRender();
    }
  }

  isReunionLoaded(index: number): boolean {
    return this.scenes[index]?.loaded ?? false;
  }

  scheduleRender() {
    if (this._renderScheduled || this._destroyed) return;
    this._renderScheduled = true;
    requestAnimationFrame(() => {
      this._renderScheduled = false;
      if (this._destroyed) return;
      this.render();
      if (this._dissolveProgress > 0) this.scheduleRender();
    });
  }

  createDebugPanel(): HTMLElement {
    const panel = document.createElement('div');
    panel.id = REUNIONS_EFFECTS_DEBUG_PANEL_ID;
    Object.assign(panel.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: '99999',
      background: 'rgba(0,0,0,0.15)',
      color: '#eee',
      padding: '10px 14px 14px',
      borderRadius: '10px',
      fontFamily: 'monospace',
      fontSize: '11px',
      width: 'min(400px, calc(100vw - 24px))',
      maxWidth: '400px',
      maxHeight: '90vh',
      overflowX: 'hidden',
      overflowY: 'auto',
      boxSizing: 'border-box',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
    });

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex; align-items:center; justify-content:space-between; gap:8px;';

    const title = document.createElement('div');
    title.textContent = `${this._effect.name} · Reunions`;
    Object.assign(title.style, {
      fontWeight: 'bold',
      fontSize: '13px',
      lineHeight: '1',
      color: '#ffa',
    });

    const minBtn = document.createElement('button');
    minBtn.type = 'button';
    minBtn.setAttribute('aria-expanded', 'true');
    minBtn.setAttribute('aria-label', 'Minimize panel');
    minBtn.textContent = '−';
    Object.assign(minBtn.style, {
      flexShrink: '0',
      width: '28px',
      height: '28px',
      padding: '0',
      lineHeight: '26px',
      cursor: 'pointer',
      background: 'rgba(255,255,255,0.12)',
      color: '#ffa',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '6px',
      fontSize: '18px',
      fontFamily: 'monospace',
    });

    header.append(title, minBtn);
    panel.appendChild(header);

    const body = document.createElement('div');
    body.className = REUNIONS_EFFECTS_DEBUG_BODY_CLASS;

    const progressLabel = document.createElement('div');
    progressLabel.style.cssText = 'color:#888; margin-bottom:8px;';
    progressLabel.textContent = 'progress: 0.00';
    body.appendChild(progressLabel);

    const effectRow = document.createElement('div');
    effectRow.style.cssText =
      'display:flex; align-items:center; gap:8px; margin-bottom:10px; width:100%; min-width:0;';
    const effectLbl = document.createElement('span');
    effectLbl.textContent = 'Effect';
    effectLbl.style.cssText = 'width:118px; flex-shrink:0; color:#ccc;';
    const effectSelect = document.createElement('select');
    effectSelect.setAttribute('aria-label', 'Transition effect');
    Object.assign(effectSelect.style, {
      flex: '1',
      minWidth: '0',
      padding: '6px 8px',
      borderRadius: '6px',
      background: 'rgba(255,255,255,0.1)',
      color: '#ffa',
      border: '1px solid rgba(255,255,255,0.2)',
      fontFamily: 'inherit',
      fontSize: '11px',
      cursor: 'pointer',
    });
    for (const opt of REUNIONS_TRANSITION_EFFECT_OPTIONS) {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.id;
      effectSelect.appendChild(o);
    }
    const currentId = REUNIONS_TRANSITION_EFFECT_OPTIONS.some((o) => o.id === this._effect.name)
      ? (this._effect.name as ReunionsTransitionEffectId)
      : 'Dissolve';
    effectSelect.value = currentId;
    effectSelect.addEventListener('change', () => {
      const id = effectSelect.value as ReunionsTransitionEffectId;
      const next = createReunionsTransitionEffect(id);
      if (next.name === this._effect.name) return;
      this.setEffect(next);
    });
    effectRow.append(effectLbl, effectSelect);
    body.appendChild(effectRow);

    const staggerRow = document.createElement('div');
    staggerRow.style.cssText =
      'display:flex; align-items:center; gap:8px; margin-bottom:10px; width:100%; min-width:0;';
    const staggerLbl = document.createElement('label');
    staggerLbl.style.cssText =
      'display:flex; align-items:center; gap:8px; flex:1; min-width:0; cursor:pointer; color:#ccc; font-size:11px;';
    const staggerCb = document.createElement('input');
    staggerCb.type = 'checkbox';
    staggerCb.checked = this.staggerPersonEntrance;
    staggerCb.setAttribute('aria-label', 'Stagger person entrance');
    Object.assign(staggerCb.style, { width: '14px', height: '14px', accentColor: '#ffa', cursor: 'pointer' });
    const staggerTxt = document.createElement('span');
    staggerTxt.textContent = 'Stagger person entrance';
    staggerLbl.append(staggerCb, staggerTxt);
    staggerCb.addEventListener('change', () => {
      this.staggerPersonEntrance = staggerCb.checked;
      this.scheduleRender();
    });
    staggerRow.appendChild(staggerLbl);
    body.appendChild(staggerRow);

    const addSliderRow = (def: ParamDef, read: () => number, write: (v: number) => void) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex; align-items:center; gap:8px; margin-bottom:6px; width:100%; min-width:0;';

      const lbl = document.createElement('span');
      lbl.style.cssText = 'width:118px; flex-shrink:0; color:#ccc;';
      lbl.textContent = def.label;

      const input = document.createElement('input');
      input.type = 'range';
      input.min = String(def.min);
      input.max = String(def.max);
      input.step = String(def.step);
      input.value = String(read());
      input.style.cssText = 'flex:1; min-width:0; width:0; accent-color:#ffa;';

      const val = document.createElement('span');
      val.style.cssText =
        'width:54px; flex-shrink:0; text-align:right; color:#ffa; font-size:10px; tabular-nums;';
      val.textContent = read().toFixed(def.step < 0.01 ? 3 : 2);

      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        write(v);
        val.textContent = v.toFixed(def.step < 0.01 ? 3 : 2);
        this.scheduleRender();
      });

      row.append(lbl, input, val);
      body.appendChild(row);
    };

    for (const def of CANVAS_TRANSITION_PARAM_DEFS) {
      addSliderRow(
        def,
        () => this.transitionZone,
        (v) => {
          this.transitionZone = v;
          syncScrollTransitionZone(v);
        },
      );
    }

    for (const def of this._effect.paramDefs) {
      addSliderRow(
        def,
        () => this._effect.params[def.key] ?? 0,
        (v) => {
          this._effect.params[def.key] = v;
        },
      );
    }

    const copyBtn = document.createElement('button');
    copyBtn.textContent = 'Copy Values';
    Object.assign(copyBtn.style, {
      marginTop: '10px',
      width: '100%',
      padding: '6px',
      cursor: 'pointer',
      background: '#ffa',
      color: '#000',
      border: 'none',
      borderRadius: '5px',
      fontFamily: 'monospace',
      fontWeight: 'bold',
      fontSize: '11px',
    });
    copyBtn.addEventListener('click', () => {
      const payload = {
        effect: this._effect.name,
        staggerPersonEntrance: this.staggerPersonEntrance,
        transitionZone: this.transitionZone,
        ...this._effect.params,
      };
      const out = JSON.stringify(payload, null, 2);
      void navigator.clipboard.writeText(out);
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy Values';
      }, 1500);
    });
    body.appendChild(copyBtn);
    panel.appendChild(body);

    let minimized = false;
    const setMinimized = (m: boolean) => {
      minimized = m;
      body.style.display = m ? 'none' : 'block';
      panel.style.maxHeight = m ? 'none' : '90vh';
      minBtn.textContent = m ? '+' : '−';
      minBtn.setAttribute('aria-expanded', m ? 'false' : 'true');
      minBtn.setAttribute('aria-label', m ? 'Expand panel' : 'Minimize panel');
    };
    minBtn.addEventListener('click', () => setMinimized(!minimized));

    const tickProgress = () => {
      if (!panel.isConnected) return;
      progressLabel.textContent = `progress: ${this._dissolveProgress.toFixed(3)}`;
      requestAnimationFrame(tickProgress);
    };
    requestAnimationFrame(tickProgress);

    document.body.appendChild(panel);
    return panel;
  }

  destroy() {
    this._destroyed = true;
    document.getElementById(REUNIONS_EFFECTS_DEBUG_PANEL_ID)?.remove();
    const gl = this.gl;
    this._effect.destroy(gl);
    for (const fbo of this.sceneFBOs) {
      gl.deleteFramebuffer(fbo.framebuffer);
      gl.deleteTexture(fbo.texture);
    }
    for (const scene of this.scenes) {
      if (scene.bg) gl.deleteTexture(scene.bg.texture);
      for (const p of scene.persons) {
        if (p) gl.deleteTexture(p.texture);
      }
    }
    if (this._ambientTexture) gl.deleteTexture(this._ambientTexture.texture);
    gl.deleteProgram(this.compositeProgram.program);
    gl.deleteProgram(this.passthroughProgram.program);
  }
}
