/**
 * Radial ripple transition between two pre-composited scenes (Reunions FBO textures).
 * Pluggable via ReunionsCanvas third arg, setEffect(), or the reunions-effects-debug panel effect selector.
 */

import { createProgram } from '../reunions/webgl-program';
import type { ParamDef, TransitionEffect, TransitionUniforms } from '../reunions/transition-effect';

const RIPPLE_FRAG = `#version 300 es
precision highp float;

uniform sampler2D uSceneA;
uniform sampler2D uSceneB;
uniform float uProgress;
uniform float uTime;
uniform float uAspect;
uniform vec3 uBgColor;

uniform vec2 uCenter;
uniform float uReach;
uniform float uSoftness;
uniform float uWaveFreq;
uniform float uWaveAmp;
uniform float uTimeScale;
uniform float uDistort;

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 uv = vUv;
  vec2 c = uv - uCenter;
  float r = length(c * vec2(uAspect, 1.0));

  float env = sin(3.14159265 * uProgress);
  float wave =
    sin(r * uWaveFreq - uTime * uTimeScale + uProgress * 6.28318) * uWaveAmp * env;

  float edge = uProgress * uReach - r + wave;
  float w = smoothstep(-uSoftness, uSoftness, edge);
  w = clamp(w, 0.0, 1.0);

  vec2 dir = c;
  float len = length(dir);
  dir = len > 1e-5 ? dir / len : vec2(1.0, 0.0);
  float d = wave * uDistort;
  vec2 uvA = clamp(uv + dir * d * (1.0 - uProgress), 0.0, 1.0);
  vec2 uvB = clamp(uv - dir * d * uProgress, 0.0, 1.0);

  vec4 a = texture(uSceneA, uvA);
  vec4 b = texture(uSceneB, uvB);
  vec4 scene = mix(a, b, w);

  vec3 finalColor = scene.rgb + uBgColor * (1.0 - scene.a);
  fragColor = vec4(finalColor, 1.0);
}
`;

const DEFAULT_PARAMS: Record<string, number> = {
  centerX: 0.59,
  centerY: 0.47,
  reach: 0.91,
  softness: 0.225,
  waveFreq: 33.5,
  waveAmp: 0.062,
  timeScale: 2.4,
  distort: 0.04
};

const PARAM_DEFS: ParamDef[] = [
  { key: 'centerX', label: 'Ripple center X', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'centerY', label: 'Ripple center Y', min: 0.0, max: 1.0, step: 0.01 },
  { key: 'reach', label: 'Reach (coverage)', min: 0.8, max: 2.2, step: 0.01 },
  { key: 'softness', label: 'Edge softness', min: 0.02, max: 0.35, step: 0.005 },
  { key: 'waveFreq', label: 'Wave frequency', min: 8.0, max: 48.0, step: 0.5 },
  { key: 'waveAmp', label: 'Wave amplitude', min: 0.0, max: 0.12, step: 0.002 },
  { key: 'timeScale', label: 'Motion speed', min: 0.0, max: 6.0, step: 0.1 },
  { key: 'distort', label: 'UV distort', min: 0.0, max: 0.04, step: 0.001 },
];

export class RippleEffect implements TransitionEffect {
  readonly name = 'Ripple';

  params: Record<string, number> = { ...DEFAULT_PARAMS };

  paramDefs = PARAM_DEFS;

  private program: { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation> } | null =
    null;

  init(gl: WebGL2RenderingContext, vertSrc: string): void {
    this.destroy(gl);
    this.program = createProgram(gl, vertSrc, RIPPLE_FRAG);
  }

  render(gl: WebGL2RenderingContext, u: TransitionUniforms): void {
    const prog = this.program;
    if (!prog) return;

    gl.useProgram(prog.program);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, u.sceneA);
    gl.uniform1i(prog.uniforms.uSceneA, 0);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, u.sceneB);
    gl.uniform1i(prog.uniforms.uSceneB, 1);

    const p = this.params;
    gl.uniform1f(prog.uniforms.uProgress, u.progress);
    gl.uniform1f(prog.uniforms.uTime, u.time);
    gl.uniform1f(prog.uniforms.uAspect, u.aspect);
    gl.uniform3f(prog.uniforms.uBgColor, u.bgColor[0], u.bgColor[1], u.bgColor[2]);
    gl.uniform2f(prog.uniforms.uCenter, p.centerX, p.centerY);
    gl.uniform1f(prog.uniforms.uReach, p.reach);
    gl.uniform1f(prog.uniforms.uSoftness, p.softness);
    gl.uniform1f(prog.uniforms.uWaveFreq, p.waveFreq);
    gl.uniform1f(prog.uniforms.uWaveAmp, p.waveAmp);
    gl.uniform1f(prog.uniforms.uTimeScale, p.timeScale);
    gl.uniform1f(prog.uniforms.uDistort, p.distort);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  destroy(gl: WebGL2RenderingContext): void {
    if (this.program) {
      gl.deleteProgram(this.program.program);
      this.program = null;
    }
  }
}
