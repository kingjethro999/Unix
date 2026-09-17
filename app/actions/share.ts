"use server";

import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

async function requireOwner(workspaceId: string, userId: string) {
  const result = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role='owner'",
    [workspaceId, userId],
  );
  if (!result.rows[0])
    throw new Error("Only the workspace owner can change sharing.");
}

export async function getShareState(workspaceId: string) {
  const user = await requireUser();
  await requireOwner(workspaceId, user.id);
  const result = await query<{ enabled: boolean }>(
    "SELECT enabled FROM workspace_shares WHERE workspace_id=$1",
    [workspaceId],
  );
  return { enabled: result.rows[0]?.enabled || false };
}

export async function setShareState(workspaceId: string, enabled: boolean) {
  const user = await requireUser();
  await requireOwner(workspaceId, user.id);
  await query(
    `INSERT INTO workspace_shares (workspace_id,enabled,created_by) VALUES ($1,$2,$3)
     ON CONFLICT (workspace_id) DO UPDATE SET enabled=EXCLUDED.enabled,updated_at=now()`,
    [workspaceId, enabled, user.id],
  );
  return { enabled };
}
