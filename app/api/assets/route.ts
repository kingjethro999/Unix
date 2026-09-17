import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, storeImage } from "@/lib/assets";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const form = await request.formData();
  const file = form.get("file");
  const workspaceId = String(form.get("workspaceId") || "");
  const documentId = String(form.get("documentId") || "") || null;
  if (!(file instanceof File) || !workspaceId)
    return NextResponse.json(
      { error: "Image and workspace are required" },
      { status: 400 },
    );
  if (
    !ALLOWED_IMAGE_TYPES.has(file.type) ||
    file.size > MAX_IMAGE_BYTES ||
    file.size === 0
  )
    return NextResponse.json(
      { error: "Use a PNG, JPEG, WebP, or GIF image up to 10 MB." },
      { status: 415 },
    );
  const access = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role IN ('owner','editor')",
    [workspaceId, user.id],
  );
  if (!access.rows[0])
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  if (
    documentId &&
    !(
      await query("SELECT 1 FROM documents WHERE id=$1 AND workspace_id=$2", [
        documentId,
        workspaceId,
      ])
    ).rows[0]
  )
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  try {
    const asset = await storeImage({
      workspaceId,
      documentId,
      ownerId: user.id,
      bytes: new Uint8Array(await file.arrayBuffer()),
      mimeType: file.type,
      originalName: file.name,
      altText: String(form.get("altText") || ""),
      source: "upload",
    });
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 },
    );
  }
}
