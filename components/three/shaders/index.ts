import { Color } from "three";

export const atmosphericVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphericFragmentShader = /* glsl */ `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

  // Simplex noise (Ashima Arts)
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz; x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // FBM — 5 octaves with rotated basis to break grid alignment
  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += amp * snoise(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return v;
  }

  // Ordered dither — kills banding on 8-bit displays
  float ditherPattern(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Aspect-correct UV so patterns don't stretch on wide/tall viewports
    vec2 uv = vUv;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    uv.x *= aspect;

    // Subtle mouse parallax
    uv += uMouse * 0.05;

    float t = uTime * 0.03;

    // Domain warping — 2 layers of FBM drive a second FBM lookup
    vec2 q = vec2(
      fbm(uv + vec2(0.0, t)),
      fbm(uv + vec2(5.2, 1.3 - t))
    );

    vec2 r = vec2(
      fbm(uv + 1.5 * q + vec2(1.7, 9.2) + 0.15 * t),
      fbm(uv + 1.5 * q + vec2(8.3, 2.8) + 0.126 * t)
    );

    float f = fbm(uv + 2.0 * r);

    // Three-stop color blending for richer depth
    float n1 = smoothstep(-0.4, 0.2, f);
    float n2 = smoothstep(0.1, 0.6, f + dot(r, r) * 0.3);
    vec3 color = mix(uColorA, uColorB, n1);
    color = mix(color, uColorC, n2 * 0.6);

    // Soft highlight along warp magnitude — adds depth
    float highlight = smoothstep(0.35, 0.9, length(r));
    color += highlight * 0.08;

    // Subtle vignette
    vec2 center = vUv - 0.5;
    float vig = 1.0 - smoothstep(0.35, 0.95, dot(center, center) * 2.0);
    color *= 0.85 + vig * 0.2;

    // Dither to kill 8-bit banding
    float d = (ditherPattern(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0);
    color += d;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Industrial Precision palette — three stops for richer depth
export const ATMOSPHERIC_COLOR_A = new Color("#060b16"); // near-black navy (deep)
export const ATMOSPHERIC_COLOR_B = new Color("#12233f"); // industrial blue (mid)
export const ATMOSPHERIC_COLOR_C = new Color("#294a76"); // accent blue (rim highlight)
