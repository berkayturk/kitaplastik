"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import {
  atmosphericVertexShader,
  atmosphericFragmentShader,
  ATMOSPHERIC_COLOR_A,
  ATMOSPHERIC_COLOR_B,
} from "./shaders";

interface AtmosphericMeshProps {
  reduced?: boolean;
}

export function AtmosphericMesh({ reduced = false }: AtmosphericMeshProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();

  // Hold stable references to uniform objects so we can update their .value
  // without going through ShaderMaterial.uniforms (which is typed as an
  // indexed record and is `undefined`-wide under noUncheckedIndexedAccess).
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: [0, 0] as [number, number] },
      uColorA: { value: ATMOSPHERIC_COLOR_A },
      uColorB: { value: ATMOSPHERIC_COLOR_B },
    }),
    [],
  );

  useFrame((state) => {
    if (!materialRef.current || reduced) return;
    uniforms.uTime.value = state.clock.elapsedTime;
    const { x, y } = state.pointer;
    const current = uniforms.uMouse.value;
    current[0] += (x - current[0]) * 0.05;
    current[1] += (y - current[1]) * 0.05;
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
