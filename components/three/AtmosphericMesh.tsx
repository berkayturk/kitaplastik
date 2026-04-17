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

  // Hold stable references to uniform objects so we can update their .value
  // without going through ShaderMaterial.uniforms (indexed record under
  // noUncheckedIndexedAccess).
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: [0, 0] as [number, number] },
      uResolution: { value: [size.width, size.height] as [number, number] },
      uColorA: { value: ATMOSPHERIC_COLOR_A },
      uColorB: { value: ATMOSPHERIC_COLOR_B },
      uColorC: { value: ATMOSPHERIC_COLOR_C },
    }),
    // size is intentionally read once; updates go through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Keep uResolution in sync when the canvas resizes
  useEffect(() => {
    const res = uniforms.uResolution.value;
    res[0] = size.width;
    res[1] = size.height;
  }, [size.width, size.height, uniforms.uResolution]);

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
    if (reduced || pausedRef.current) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    const current = uniforms.uMouse.value;
    current[0] += (x - current[0]) * 0.04;
    current[1] += (y - current[1]) * 0.04;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={atmosphericVertexShader}
        fragmentShader={atmosphericFragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}
