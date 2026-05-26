import { createProgram } from './webgl-program';
import type { ParamDef, TransitionEffect, TransitionUniforms } from './transition-effect';

// eslint-disable-next-line no-console
console.log("🟢 [dissolve-effect.ts] MODULE LOADED — version ARLIND-SDF-v5");

// Force a full page reload when this module changes — shaders are compiled
// once at instantiation, so HMR alone doesn't re-evaluate the GLSL strings.
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    import.meta.hot!.invalidate();
  });
}

// Direct port of Arlind Aliu's Shader-Image-Transition (1st demo of
// https://tympanus.net/Tutorials/ShaderImageReveal/, src/shaders/fragment.glsl).
// Combines a central petal-blob SDF with 3 rings of satellite blobs,
// soft-min-fused into one organic shape that grows from the center.
const DISSOLVE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSceneA;
uniform sampler2D uSceneB;
uniform sampler2D uNoise; // unused
uniform float uProgress;
uniform float uTime;
uniform float uAspect;
uniform vec3 uBgColor;

uniform float uSoftnessBase;
uniform float uSoftnessPeak;
uniform float uEdgeIntensity;
uniform vec3 uEdgeColor;
uniform float uDistortStrength;
uniform float uDriftSpeed;
uniform float uSweepAmount;
uniform float uZoomOutAmount;
uniform float uZoomInAmount;

in vec2 vUv;
out vec4 fragColor;

#define PI 3.1415926538

// uSize-like canvas pseudo-resolution derived from aspect.
// Picking 1000 keeps the SDF radii close to the original's ~1000-1500 range.
const float SCREEN_BASE = 1000.0;

float angleWave(vec2 point) {
  float angle = atan(point.y, point.x) + uProgress * PI;
  float w0 = (cos(angle) + 1.0) / 2.0;
  float w1 = (sin(2.0 * angle) + 1.0) / 2.0;
  float w2 = (cos(3.0 * angle) + 1.0) / 2.0;
  return (w0 + w1 + w2) / 3.0;
}

float softMax(float a, float b, float k) {
  return log(exp(k * a) + exp(k * b)) / k;
}
float softMin(float a, float b, float k) {
  return -softMax(-a, -b, k);
}

float circleSDF(vec2 pos, float rad) {
  float a = sin(uProgress * 0.2) * 0.25;
  float amt = 0.5 + a;
  float c = length(pos);
  c += angleWave(pos) * rad * amt;
  return c;
}

float radialCircles(vec2 p, float o, float count) {
  vec2 offset = vec2(o, o);
  float angle = (2.0 * PI) / count;
  // WebGL2 has round(); use floor+0.5 fallback for safety across drivers.
  float s = floor(atan(p.y, p.x) / angle + 0.5);
  float an = angle * s;
  vec2 q = vec2(offset.x * cos(an), offset.y * sin(an));
  return circleSDF(p - q, 15.0);
}

void main() {
  vec2 vUvLocal = vUv;
  vec2 uSize = vec2(SCREEN_BASE * uAspect, SCREEN_BASE);
  vec2 coords = vUvLocal * uSize;
  vec2 o1 = vec2(0.5) * uSize;

  // Eased growth — quick early, slow at the end.
  float t = pow(uProgress, 2.5);
  float radius = uSize.x / 2.0;
  // x1.6 so the corners get covered fully at progress=1.
  float rad = t * radius * 1.6;

  // Central blob.
  float c1 = circleSDF(coords - o1, rad);

  // Three rings of satellite blobs (3 inner, 3 mid, 5 outer).
  vec2 p = (vUvLocal - 0.5) * uSize;
  float r1 = radialCircles(p, 0.20 * uSize.x, 3.0);
  float r2 = radialCircles(p, 0.25 * uSize.x, 3.0);
  float r3 = radialCircles(p, 0.45 * uSize.x, 5.0);

  // Smoothly fuse them into one continuous SDF.
  float k = 50.0 / uSize.x;
  float field = softMin(c1, r1, k);
  field = softMin(field, r2, k);
  field = softMin(field, r3, k);

  // Original used step(field, rad). We use smoothstep for a softer edge —
  // width grows with sin(progress*PI) for an organic feel mid-transition.
  float softness = uSoftnessBase * radius + uSoftnessPeak * radius * sin(uProgress * PI);
  // mask: 1 inside the blob (sceneB), 0 outside (sceneA).
  float mask = 1.0 - smoothstep(rad - softness, rad + softness, field);

  vec4 a = texture(uSceneA, vUvLocal);
  vec4 b = texture(uSceneB, vUvLocal);
  fragColor = mix(a, b, mask);

  // Silence unused-uniform warnings.
  float silenced = uTime * 0.0 + uEdgeIntensity * 0.0 + uDistortStrength * 0.0
    + uDriftSpeed * 0.0 + uSweepAmount * 0.0 + uZoomOutAmount * 0.0
    + uZoomInAmount * 0.0 + uEdgeColor.r * 0.0 + uBgColor.r * 0.0;
  if (silenced > 1.0e9) {
    fragColor.rgb += texture(uNoise, vUvLocal).rgb * 0.0;
  }
}`;

function hash(x: number, y: number): number {
  let h = x * 127.1 + y * 311.7;
  h = Math.sin(h) * 43758.5453;
  return h - Math.floor(h);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash(ix, iy);
  const b = hash(ix + 1, iy);
  const c = hash(ix, iy + 1);
  const d = hash(ix + 1, iy + 1);

  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x: number, y: number, octaves = 6): number {
  let value = 0;
  let amplitude = 0.5;
  let maxVal = 0;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x, y);
    maxVal += amplitude;
    x *= 2.0;
    y *= 2.0;
    amplitude *= 0.5;
  }
  return value / maxVal;
}

function generateNoiseData(size: number): Uint8Array {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;
      const r = fbm(nx * 4, ny * 4, 6);
      const g = fbm(nx * 8 + 37.7, ny * 8 + 91.1, 5);
      const b = fbm(nx * 16 + 73.3, ny * 16 + 59.9, 4);
      const a = fbm(nx * 6 + 113.0, ny * 6 + 227.0, 5);
      const i = (y * size + x) * 4;
      data[i] = Math.floor(r * 255);
      data[i + 1] = Math.floor(g * 255);
      data[i + 2] = Math.floor(b * 255);
      data[i + 3] = Math.floor(a * 255);
    }
  }
  return data;
}

function createNoiseTexture(gl: WebGL2RenderingContext): WebGLTexture {
  const size = 512;
  const data = generateNoiseData(size);
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
  return tex;
}

const DEFAULT_PARAMS: Record<string, number> = {
  softnessBase: 0.18,    // softer blob edge
  softnessPeak: 0.12,
  edgeIntensity: 0.25,
  edgeColorR: 0.49,
  edgeColorG: 0.34,
  edgeColorB: 0.19,
  distortStrength: 0.005,
  driftSpeed: 0.012,
  sweepAmount: 0.4,      // edge irregularity — bigger = more organic blob
  zoomOutAmount: 0.22,
  zoomInAmount: 0.1,
};

const PARAM_DEFS: ParamDef[] = [
  { key: 'softnessBase', label: 'Softness Base', min: 0.05, max: 0.6, step: 0.01 },
  { key: 'softnessPeak', label: 'Softness Peak', min: 0.0, max: 0.4, step: 0.01 },
  { key: 'edgeIntensity', label: 'Edge Intensity', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'edgeColorR', label: 'Edge R', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'edgeColorG', label: 'Edge G', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'edgeColorB', label: 'Edge B', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'distortStrength', label: 'UV Distortion', min: 0.0, max: 0.04, step: 0.001 },
  { key: 'driftSpeed', label: 'Noise Drift', min: 0.0, max: 0.05, step: 0.001 },
  { key: 'sweepAmount', label: 'Blob Edge Irregularity', min: 0.0, max: 0.8, step: 0.01 },
  { key: 'zoomOutAmount', label: 'Zoom Out (A)', min: 0.0, max: 0.3, step: 0.01 },
  { key: 'zoomInAmount', label: 'Zoom In (B)', min: 0.0, max: 0.2, step: 0.01 },
];

export class DissolveEffect implements TransitionEffect {
  readonly name = 'Dissolve';

  params: Record<string, number> = { ...DEFAULT_PARAMS };

  paramDefs = PARAM_DEFS;

  private program: { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> } | null =
    null;
  private noiseTexture: WebGLTexture | null = null;

  init(gl: WebGL2RenderingContext, vertSrc: string): void {
    this.destroy(gl);
    // eslint-disable-next-line no-console
    console.log("[DissolveEffect] init — PIXELVAULT shader v3 + RED diagnostic");
    this.program = createProgram(gl, vertSrc, DISSOLVE_FRAG);
    this.noiseTexture = createNoiseTexture(gl);
  }

  render(gl: WebGL2RenderingContext, u: TransitionUniforms): void {
    const prog = this.program;
    const noise = this.noiseTexture;
    if (!prog || !noise) return;

    gl.useProgram(prog.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, u.sceneA);
    gl.uniform1i(prog.uniforms.uSceneA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, u.sceneB);
    gl.uniform1i(prog.uniforms.uSceneB, 1);

    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, noise);
    gl.uniform1i(prog.uniforms.uNoise, 2);

    const p = this.params;
    gl.uniform1f(prog.uniforms.uProgress, u.progress);
    gl.uniform1f(prog.uniforms.uTime, u.time);
    gl.uniform1f(prog.uniforms.uAspect, u.aspect);
    gl.uniform3f(prog.uniforms.uBgColor, u.bgColor[0], u.bgColor[1], u.bgColor[2]);
    gl.uniform1f(prog.uniforms.uSoftnessBase, p.softnessBase);
    gl.uniform1f(prog.uniforms.uSoftnessPeak, p.softnessPeak);
    gl.uniform1f(prog.uniforms.uEdgeIntensity, p.edgeIntensity);
    gl.uniform3f(prog.uniforms.uEdgeColor, p.edgeColorR, p.edgeColorG, p.edgeColorB);
    gl.uniform1f(prog.uniforms.uDistortStrength, p.distortStrength);
    gl.uniform1f(prog.uniforms.uDriftSpeed, p.driftSpeed);
    gl.uniform1f(prog.uniforms.uSweepAmount, p.sweepAmount);
    gl.uniform1f(prog.uniforms.uZoomOutAmount, p.zoomOutAmount);
    gl.uniform1f(prog.uniforms.uZoomInAmount, p.zoomInAmount);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(gl: WebGL2RenderingContext): void {
    if (this.program) {
      gl.deleteProgram(this.program.program);
      this.program = null;
    }
    if (this.noiseTexture) {
      gl.deleteTexture(this.noiseTexture);
      this.noiseTexture = null;
    }
  }
}
