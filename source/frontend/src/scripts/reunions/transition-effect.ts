/**
 * Pluggable scroll-driven transition between two pre-composited scene textures.
 * Implementations live alongside this file (e.g. dissolve-effect.ts).
 */

export interface TransitionUniforms {
  sceneA: WebGLTexture;
  sceneB: WebGLTexture;
  progress: number;
  time: number;
  aspect: number;
  bgColor: [number, number, number];
}

export interface ParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

export interface TransitionEffect {
  readonly name: string;
  /** Mutable; debug UI and `render` read the same object. */
  params: Record<string, number>;
  paramDefs: ParamDef[];

  init(gl: WebGL2RenderingContext, vertSrc: string): void;
  render(gl: WebGL2RenderingContext, u: TransitionUniforms): void;
  destroy(gl: WebGL2RenderingContext): void;
}
