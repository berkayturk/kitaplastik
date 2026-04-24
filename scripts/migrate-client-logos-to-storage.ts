/**
 * One-shot migration: public/references/c1.svg ... c8.svg → client-logos bucket.
 * Idempotent — DB'de logo_path zaten `client-logos/` ile başlıyorsa skip.
 */
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const svc = createClient<Database>(SUPABASE_URL, SERVICE_KEY);
const PUBLIC_REF_DIR = path.resolve(process.cwd(), "public", "references");

async function main() {
  const { data: clients, error } = await svc
    .from("clients")
    .select("id, key, logo_path")
    .order("key");
  if (error) {
    console.error("Fetch clients failed:", error.message);
    process.exit(1);
  }

  for (const client of clients ?? []) {
    if (client.logo_path.startsWith("client-logos/")) {
      console.log(`[skip] ${client.key} already migrated → ${client.logo_path}`);
      continue;
    }

    if (!client.logo_path.startsWith("/references/")) {
      console.warn(`[warn] ${client.key} unexpected path: ${client.logo_path}`);
      continue;
    }

    const localFile = path.join(PUBLIC_REF_DIR, path.basename(client.logo_path));
    const ext = path.extname(localFile).slice(1).toLowerCase() || "svg";
    const mimeMap: Record<string, string> = {
      svg: "image/svg+xml",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    };
    const contentType = mimeMap[ext] ?? "application/octet-stream";

    const fileBuffer = await readFile(localFile);
    const newPath = `${randomUUID()}.${ext}`;

    const { error: uploadErr } = await svc.storage
      .from("client-logos")
      .upload(newPath, fileBuffer, { contentType, upsert: false });
    if (uploadErr) {
      console.error(`[fail upload] ${client.key}: ${uploadErr.message}`);
      continue;
    }

    const fullPath = `client-logos/${newPath}`;
    const { error: updateErr } = await svc
      .from("clients")
      .update({ logo_path: fullPath })
      .eq("id", client.id);
    if (updateErr) {
      console.error(`[fail db update] ${client.key}: ${updateErr.message}`);
      // rollback upload
      await svc.storage
        .from("client-logos")
        .remove([newPath])
        .catch(() => {});
      continue;
    }

    console.log(`[ok] ${client.key}: ${client.logo_path} → ${fullPath}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
