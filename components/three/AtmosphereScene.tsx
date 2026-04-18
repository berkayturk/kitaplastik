// components/three/AtmosphereScene.tsx
//
// Ambient 3D background — a single fullscreen plane driven by a quiet
// custom shader. Only the WebGL path; accessibility fallback is the
// static CSS mesh already painted via body::before in globals.css.
//
// The scene is mounted by `AtmosphereScene` (dynamic + ssr:false) only
// when `useShouldReduceMotion()` returns false. On a11y / weak-hardware
// / saveData paths nothing mounts, and the CSS mesh remains visible.

"use client";

import { useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, type ShaderMaterial } from "three";
import { atmosphereVertexShader, atmosphereFragmentShader } from "./shaders/atmosphere";
import { useShouldReduceMotion } from "./useReducedMotion";

// Palette tokens in linear RGB — values chosen to stay within ~4% lightness
// of the warm-paper base (#FAFAF7). Keeps the moving field visually calmer
// than the CSS mesh gradient painted by body::before.
const BASE = new Color("#fafaf7"); // warm paper — matches html bg-primary
const TINT_A = new Color("#e8edf8"); // faint cobalt leaning
const TINT_B = new Color("#e6f1eb"); // faint jade leaning
const TINT_C = new Color("#f3ece0"); // warm highlight

function AtmosphereMesh() {
  const materialRef = useRef<ShaderMaterial>(null);
  const { size } = useThree();
  const pausedRef = useRef(false);

  const initialUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: [size.width, size.height] as [number, number] },
      uBase: { value: BASE },
      uTintA: { value: TINT_A },
      uTintB: { value: TINT_B },
      uTintC: { value: TINT_C },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep resolution uniform in sync with canvas resize. Read back through
  // materialRef.current.uniforms because R3F clones the prop on apply.
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms as typeof initialUniforms;
    const res = u.uResolution.value;
    res[0] = size.width;
    res[1] = size.height;
  }, [size.width, size.height, initialUniforms]);

  // Stop updating time when the tab is backgrounded — saves CPU + GPU.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const handler = () => {
      pausedRef.current = document.hidden;
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  useFrame((state) => {
    const mat = materialRef.current;
    if (!mat || pausedRef.current) return;
    const u = mat.uniforms as typeof initialUniforms;
    u.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh scale={[2, 2, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphereVertexShader}
        fragmentShader={atmosphereFragmentShader}
        uniforms={initialUniforms}
      />
    </mesh>
  );
}

function AtmosphereCanvas() {
  return (
    <Canvas
      aria-hidden="true"
      className="pointer-events-none"
      style={{ position: "fixed", inset: 0, zIndex: -2 }}
      camera={{ position: [0, 0, 1], fov: 50, near: 0.1, far: 10 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "low-power", alpha: false }}
      frameloop="always"
    >
      <AtmosphereMesh />
    </Canvas>
  );
}

// Dynamic: ssr:false so we don't ship WebGL setup in the SSR HTML. The
// loading slot is intentionally empty — the CSS mesh painted by
// body::before already fills the viewport during the momentary hydration
// gap, so there's no visible flash.
const DynamicAtmosphereCanvas = dynamic(() => Promise.resolve(AtmosphereCanvas), {
  ssr: false,
  loading: () => null,
});

export function AtmosphereScene() {
  const reduced = useShouldReduceMotion();
  if (reduced) return null; // a11y / weak-hw / no-WebGL → CSS mesh stays visible
  return <DynamicAtmosphereCanvas />;
}
