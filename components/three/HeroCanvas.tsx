"use client";

import { Canvas } from "@react-three/fiber";
import { AtmosphericMesh } from "./AtmosphericMesh";

interface HeroCanvasProps {
  reduced?: boolean;
}

export function HeroCanvas({ reduced = false }: HeroCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      className="absolute inset-0"
      camera={{ position: [0, 0, 1], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: false,
        powerPreference: "low-power",
        alpha: false,
      }}
      frameloop={reduced ? "never" : "always"}
    >
      <AtmosphericMesh reduced={reduced} />
    </Canvas>
  );
}

export default HeroCanvas;
