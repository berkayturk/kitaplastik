"use client";

import { Canvas } from "@react-three/fiber";
import { AtmosphericMesh } from "./AtmosphericMesh";

interface SiteBackgroundCanvasProps {
  reduced?: boolean;
}

export function SiteBackgroundCanvas({ reduced = false }: SiteBackgroundCanvasProps) {
  return (
    <Canvas
      aria-hidden="true"
      className="pointer-events-none"
      style={{ position: "fixed", inset: 0, zIndex: -10 }}
      camera={{ position: [0, 0, 1], fov: 50 }}
      dpr={[1, 1.5]}
      gl={{ antialias: false, powerPreference: "low-power", alpha: false }}
      frameloop={reduced ? "never" : "always"}
    >
      <AtmosphericMesh reduced={reduced} />
    </Canvas>
  );
}

export default SiteBackgroundCanvas;
