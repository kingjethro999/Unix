import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { createPresenceToken } from "@/lib/presence-token";

export async function POST(request: Request) {
  const user = await requireUser();
  const { workspaceId } = await request.json();
  const access = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
    [workspaceId, user.id],
  );
  if (!access.rows[0])
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  return NextResponse.json({
    token: createPresenceToken({
      userId: user.id,
      workspaceId,
      name: user.fullName || user.email,
    }),
    url: process.env.REALTIME_URL || "ws://127.0.0.1:3001",
  });
}
