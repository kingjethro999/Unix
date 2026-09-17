import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { query } from "@/lib/db";

export const ALLOWED_IMAGE_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
function uploadRoot() {
  return path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads"),
  );
}

export async function storeImage(input: {
  workspaceId: string;
  ownerId: string;
  documentId?: string | null;
  bytes: Uint8Array;
  mimeType: string;
  originalName: string;
  altText?: string;
  source: "upload" | "generated";
}) {
  const extension = ALLOWED_IMAGE_TYPES.get(input.mimeType);
  if (!extension) throw new Error("Unsupported image type");
  if (!input.bytes.byteLength || input.bytes.byteLength > MAX_IMAGE_BYTES)
    throw new Error("Image must be between 1 byte and 10 MB");
  const id = randomUUID();
  const storageKey = `${id}.${extension}`;
  const root = uploadRoot();
  await mkdir(root, { recursive: true });
  await writeFile(path.join(root, storageKey), input.bytes, { flag: "wx" });
  await query(
    `INSERT INTO assets (id, workspace_id, owner_id, document_id, storage_key, original_name, mime_type, byte_size, source, alt_text)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      input.workspaceId,
      input.ownerId,
      input.documentId || null,
      storageKey,
      input.originalName.slice(0, 255),
      input.mimeType,
      input.bytes.byteLength,
      input.source,
      input.altText?.slice(0, 500) || "",
    ],
  );
  return {
    id,
    url: `/api/assets/${id}`,
    alt: input.altText || "",
    mimeType: input.mimeType,
  };
}
export async function readImage(storageKey: string) {
  if (!/^[a-f0-9-]+\.(png|jpg|webp|gif)$/.test(storageKey))
    throw new Error("Invalid asset key");
  return readFile(path.join(uploadRoot(), storageKey));
}
