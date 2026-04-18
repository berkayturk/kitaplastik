"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import {
  atmosphericVertexShader,
  atmosphericFragmentShader,
  ATMOSPHERIC_COLOR_A,
  ATMOSPHERIC_COLOR_B,
  ATMOSPHERIC_COLOR_C,
} from "./shaders";

interface AtmosphericMeshProps {
  reduced?: boolean;
}

export function AtmosphericMesh({ reduced = false }: AtmosphericMeshProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const { viewport, size } = useThree();
  const pausedRef = useRef(false);

  // Initial uniforms handed to the material on mount. After mount, updates
  // must go through materialRef.current.uniforms because R3F's reconciler
  // clones the uniforms object when applying props, so mutating this local
  // object no longer propagates to the GPU.
  const initialUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: [0, 0] as [number, number] },
      uResolution: { value: [size.width, size.height] as [number, number] },
      uColorA: { value: ATMOSPHERIC_COLOR_A },
      uColorB: { value: ATMOSPHERIC_COLOR_B },
      uColorC: { value: ATMOSPHERIC_COLOR_C },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep uResolution in sync when the canvas resizes
  useEffect(() => {
    const mat = materialRef.current;
    if (!mat) return;
    const u = mat.uniforms as typeof initialUniforms;
    const res = u.uResolution.value;
    res[0] = size.width;
    res[1] = size.height;
  }, [size.width, size.height, initialUniforms]);

  // Pause animation when the tab is hidden to save CPU/GPU
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
    if (!mat || reduced || pausedRef.current) return;
    const u = mat.uniforms as typeof initialUniforms;
    u.uTime.value = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    const mouse = u.uMouse.value;
    mouse[0] += (x - mouse[0]) * 0.04;
    mouse[1] += (y - mouse[1]) * 0.04;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphericVertexShader}
        fragmentShader={atmosphericFragmentShader}
        uniforms={initialUniforms}
      />
    </mesh>
  );
}
