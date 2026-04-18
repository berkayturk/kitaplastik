// components/three/shaders/atmosphere.ts
//
// Quiet ambient shader — three soft tinted "orbs" orbiting on a 60s cycle
// over the warm paper base. Key design constraints:
//
//   • Max color deviation from paper ~4% lightness
//   • No orb moves faster than ~1% viewport per second
//   • No high-frequency noise; only large, low-contrast distance fields
//   • Dither band at 1/255 amplitude to kill 8-bit banding
//
// The shader is read-only for its uniforms — AtmosphereScene writes uTime
// and uResolution via materialRef.current.uniforms to bypass R3F's
// reconciler clone (documented in commit b9b33eb).

export const atmosphereVertexShader = /* glsl */ `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uBase;
  uniform vec3 uTintA; // cobalt-leaning paper
  uniform vec3 uTintB; // jade-leaning paper
  uniform vec3 uTintC; // warm paper highlight

  // Cheap hash for dither
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Aspect-correct centered UV, [-aspect, +aspect] × [-1, +1]
    vec2 uv = gl_FragCoord.xy / uResolution.xy * 2.0 - 1.0;
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    uv.x *= aspect;

    // 60-second orbital period; each orb has a unique frequency pair so they
    // never resync, but all frequencies are slow enough that individual motion
    // is imperceptible at the pixel level.
    float t = uTime * 0.105; // ≈ 1/60 cycles per second × 2π scalar

    vec2 orb1 = vec2(sin(t * 0.7) * 0.55, cos(t * 0.9) * 0.38);
    vec2 orb2 = vec2(cos(t * 0.5 + 1.7) * 0.72 + 0.15, sin(t * 0.6 + 0.4) * 0.45 - 0.12);
    vec2 orb3 = vec2(sin(t * 0.3 + 2.0) * 0.65 - 0.25, cos(t * 0.4 + 1.1) * 0.55 + 0.1);

    // Soft falloff kernels — generous radii so the field reads as atmosphere,
    // not as discrete spots. Peaks are deliberately capped very low (0.22-max)
    // to stay within ~4% lightness deviation from uBase.
    // Peaks 0.38 / 0.32 / 0.26 let the tint-orbs gently push the paper base
    // toward their hue in a visible but non-saturated way. Because the tint
    // colors themselves sit <5% away from the base, peak mix of ~35% still
    // means <2% actual lightness deviation on-screen.
    float i1 = smoothstep(1.30, 0.15, length(uv - orb1)) * 0.38;
    float i2 = smoothstep(1.45, 0.25, length(uv - orb2)) * 0.32;
    float i3 = smoothstep(1.20, 0.20, length(uv - orb3)) * 0.26;

    vec3 color = uBase;
    color = mix(color, uTintA, i1);
    color = mix(color, uTintB, i2);
    color = mix(color, uTintC, i3);

    // Very subtle vignette pulling corners toward uBase — reinforces the
    // "paper under soft room light" feel without adding motion.
    float vig = smoothstep(1.6, 0.4, length(uv * vec2(1.0, 1.1)));
    color = mix(uBase * 0.985, color, vig);

    // Dither to eliminate 8-bit banding on large color blends.
    float d = (hash(gl_FragCoord.xy) - 0.5) * (1.0 / 255.0);
    color += vec3(d);

    gl_FragColor = vec4(color, 1.0);
  }
`;
