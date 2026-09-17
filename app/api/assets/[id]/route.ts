import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { readImage } from "@/lib/assets";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  const result = await query<{ storage_key: string; mime_type: string }>(
    `SELECT DISTINCT a.storage_key,a.mime_type FROM assets a
       LEFT JOIN workspace_members wm ON wm.workspace_id=a.workspace_id AND wm.user_id=$2
       LEFT JOIN workspace_shares ws ON ws.workspace_id=a.workspace_id
      WHERE a.id=$1 AND (wm.user_id IS NOT NULL OR ws.enabled=true)`,
    [(await params).id, user?.id || null],
  );
  const asset = result.rows[0];
  if (!asset)
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  try {
    const file = await readImage(asset.storage_key);
    const body = file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength,
    ) as ArrayBuffer;
    return new NextResponse(body, {
      headers: {
        "Content-Type": asset.mime_type,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Image file is unavailable" },
      { status: 404 },
    );
  }
}
