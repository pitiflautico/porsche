// Cross-section transition mask. Shader ported VERBATIM from
// pixelvault.fit's loader curtain: 3D Perlin noise (cnoise) with UV
// displacement + a radial hole driven by uProgress. The result is an
// organic, turbulent reveal that opens from the center outward.
//
// Two textures aren't needed here: the canvas paints a SOLID color
// (the curtain) with per-pixel alpha = strength, so wherever the
// curtain has dissolved the real section behind the canvas shows
// through.
//
// API:
//   const blob = new BlobTransition({ canvas, color: '#000' });
//   blob.setProgress(0);      // fully covered (curtain)
//   await blob.play('out');   // dissolve from center → reveal
//   // or play('in') to cover again

export type BlobDirection = "in" | "out";

export interface BlobTransitionOptions {
  canvas: HTMLCanvasElement;
  /** Curtain color. Defaults to black. */
  color?: string;
  /** Animation length in ms. Defaults to 1500. */
  duration?: number;
}

const VERT = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = aPos * 0.5 + 0.5;
    gl_Position = vec4(aPos, 0.0, 1.0);
  }
`;

// Fragment shader — exact port of pixelvault.fit's curtain pass.
const FRAG = `
  precision highp float;
  uniform float uProgress;
  uniform vec3 uColor;
  uniform vec2 uResolution;
  uniform float uTime;
  varying vec2 vUv;

  vec4 permute(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
  vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }
  vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

  float cnoise(vec3 P) {
    vec3 Pi0 = floor(P); vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod(Pi0, 289.0); Pi1 = mod(Pi1, 289.0);
    vec3 Pf0 = fract(P); vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz; vec4 iz1 = Pi1.zzzz;
    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0); vec4 ixy1 = permute(ixy + iz1);
    vec4 gx0 = ixy0 / 7.0; vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
    gx0 = fract(gx0); vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5); gy0 -= sz0 * (step(0.0, gy0) - 0.5);
    vec4 gx1 = ixy1 / 7.0; vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
    gx1 = fract(gx1); vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5); gy1 -= sz1 * (step(0.0, gy1) - 0.5);
    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x); vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z); vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x); vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z); vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
    float n000 = dot(g000, Pf0); float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z)); float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z)); float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz)); float n111 = dot(g111, Pf1);
    vec3 fade_xyz = fade(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    return 2.2 * mix(n_yz.x, n_yz.y, fade_xyz.x);
  }

  void main() {
    // Fix aspect ratio for noise so it doesn't look stretched.
    vec2 aspectUv = vUv;
    aspectUv.x *= uResolution.x / uResolution.y;

    // Displaced noise → turbulent organic field.
    vec2 displacedUv = aspectUv + cnoise(vec3(aspectUv * 3.0, uTime * 0.1));
    float strength = cnoise(vec3(displacedUv * 3.0, uTime * 0.2));

    // Radial mask (0 in center, grows outwards). uProgress pushes the
    // hole open from the center.
    float dist = distance(vUv, vec2(0.5));
    float hole = dist * 10.0 - (uProgress * 12.0) + 2.5;

    strength += hole;
    strength = clamp(strength, 0.0, 1.0);

    // strength 1.0 = curtain color (opaque), strength 0.0 = transparent
    // (the section behind the canvas shows through).
    gl_FragColor = vec4(uColor, strength);
  }
`;

function parseHexColor(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const x = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [
    parseInt(x.slice(0, 2), 16) / 255,
    parseInt(x.slice(2, 4), 16) / 255,
    parseInt(x.slice(4, 6), 16) / 255,
  ];
}

export class BlobTransition {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private uProgress: WebGLUniformLocation | null;
  private uResolution: WebGLUniformLocation | null;
  private uColor: WebGLUniformLocation | null;
  private uTime: WebGLUniformLocation | null;
  private duration: number;
  private color: [number, number, number];

  constructor(opts: BlobTransitionOptions) {
    this.canvas = opts.canvas;
    this.duration = opts.duration ?? 1500;
    this.color = parseHexColor(opts.color ?? "#000000");

    const gl = this.canvas.getContext("webgl", {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
    });
    if (!gl) throw new Error("BlobTransition: WebGL not available");
    this.gl = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    const compile = (type: number, src: string): WebGLShader => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        throw new Error("BlobTransition shader: " + gl.getShaderInfoLog(s));
      }
      return s;
    };
    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(program);
    this.program = program;
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.uProgress = gl.getUniformLocation(program, "uProgress");
    this.uResolution = gl.getUniformLocation(program, "uResolution");
    this.uColor = gl.getUniformLocation(program, "uColor");
    this.uTime = gl.getUniformLocation(program, "uTime");
  }

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth * dpr;
    const h = this.canvas.clientHeight * dpr;
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
  }

  private render(progress: number, time: number): void {
    this.resize();
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.uniform1f(this.uProgress, progress);
    gl.uniform2f(this.uResolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.uTime, time);
    gl.uniform3f(this.uColor, this.color[0], this.color[1], this.color[2]);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  setColor(hex: string): void {
    this.color = parseHexColor(hex);
  }

  /**
   * 'out' = reveal: uProgress 0 → 1, the curtain dissolves from the
   *          center outward, exposing what's behind the canvas.
   * 'in'  = cover: uProgress 1 → 0, the curtain closes back over.
   * Easing is circ.inOut (same as pixelvault.fit).
   */
  play(direction: BlobDirection = "out"): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const t0 = start / 1000;
      const ease = (t: number) =>
        t < 0.5
          ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
          : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
      const tick = (now: number) => {
        const raw = Math.min(1, (now - start) / this.duration);
        const e = ease(raw);
        const progress = direction === "out" ? e : 1 - e;
        this.render(progress, now / 1000 - t0);
        if (raw < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  /** Force a specific progress (0 = covered, 1 = revealed). */
  setProgress(progress: number, time: number = 0): void {
    this.render(progress, time);
  }
}
