// app/api/health/route.ts
// Liveness endpoint for Docker HEALTHCHECK + Traefik readiness routing.
// Keep lightweight: no DB or external calls — only "process is responsive".
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ status: "ok" }, { status: 200 });
}
