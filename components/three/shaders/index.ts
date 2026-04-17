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
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  // 2D Simplex noise — Ashima Arts / Ian McEwan
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
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

  void main() {
    vec2 uv = vUv;
    vec2 parallax = uMouse * 0.1;
    uv += parallax;

    // Flow field — two noise layers at different speeds
    float flow1 = snoise(uv * 2.0 + vec2(uTime * 0.05, 0.0));
    float flow2 = snoise(uv * 3.5 + vec2(0.0, uTime * 0.03));
    float mixed = (flow1 + flow2) * 0.5;

    // Gradient color mix
    float t = smoothstep(-0.5, 0.5, mixed);
    vec3 color = mix(uColorA, uColorB, t);

    // Light particles — noise threshold
    float sparkle = smoothstep(0.75, 0.85, snoise(uv * 30.0 + uTime * 0.2));
    color += sparkle * 0.15;

    gl_FragColor = vec4(color, 1.0);
  }
`;

// Industrial Precision palette — spec §5.2
export const ATMOSPHERIC_COLOR_A = new Color("#0b1220"); // deep navy
export const ATMOSPHERIC_COLOR_B = new Color("#1e3a5f"); // industrial blue
