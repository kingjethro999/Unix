"use server";

import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";

const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
async function owner(workspaceId: string) {
  const user = await requireUser();
  const result = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role='owner'",
    [workspaceId, user.id],
  );
  if (!result.rows[0])
    throw new Error("Only the workspace owner can manage members");
  return user;
}

export async function listWorkspaceMembers(workspaceId: string) {
  const user = await requireUser();
  const access = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
    [workspaceId, user.id],
  );
  if (!access.rows[0]) throw new Error("Access denied");
  const members = (
    await query(
      `SELECT u.id,u.email,u.full_name,wm.role,wm.created_at FROM workspace_members wm JOIN users u ON u.id=wm.user_id WHERE wm.workspace_id=$1 ORDER BY CASE wm.role WHEN 'owner' THEN 0 WHEN 'editor' THEN 1 ELSE 2 END,u.email`,
      [workspaceId],
    )
  ).rows;
  const invitations = (
    await query(
      `SELECT id,email,role,expires_at,created_at FROM workspace_invitations WHERE workspace_id=$1 AND accepted_at IS NULL AND expires_at>now() ORDER BY created_at DESC`,
      [workspaceId],
    )
  ).rows;
  return { members, invitations };
}

export async function createWorkspaceInvitation(input: {
  workspaceId: string;
  email: string;
  role: "editor" | "viewer";
}) {
  const data = z
    .object({
      workspaceId: z.string().uuid(),
      email: z.string().email(),
      role: z.enum(["editor", "viewer"]),
    })
    .parse(input);
  const user = await owner(data.workspaceId);
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + 7 * 86400000);
  await query(
    `INSERT INTO workspace_invitations(workspace_id,email,role,token_hash,invited_by,expires_at) VALUES($1,lower($2),$3,$4,$5,$6)`,
    [data.workspaceId, data.email, data.role, hash(token), user.id, expires],
  );
  return { token, expiresAt: expires.toISOString() };
}

export async function acceptWorkspaceInvitation(token: string) {
  const user = await requireUser();
  const tokenHash = hash(token);
  return transaction(async (client) => {
    const invite = await client.query<{
      id: string;
      workspace_id: string;
      email: string;
      role: string;
    }>(
      `SELECT id,workspace_id,email,role FROM workspace_invitations WHERE token_hash=$1 AND accepted_at IS NULL AND expires_at>now() FOR UPDATE`,
      [tokenHash],
    );
    const row = invite.rows[0];
    if (!row) throw new Error("This invitation is invalid or has expired");
    if (row.email.toLowerCase() !== user.email.toLowerCase())
      throw new Error(`Sign in as ${row.email} to accept this invitation`);
    await client.query(
      `INSERT INTO workspace_members(workspace_id,user_id,role) VALUES($1,$2,$3) ON CONFLICT(workspace_id,user_id) DO UPDATE SET role=EXCLUDED.role`,
      [row.workspace_id, user.id, row.role],
    );
    await client.query(
      "UPDATE workspace_invitations SET accepted_at=now() WHERE id=$1",
      [row.id],
    );
    return { workspaceId: row.workspace_id };
  });
}

export async function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: "editor" | "viewer",
) {
  await owner(workspaceId);
  await query(
    "UPDATE workspace_members SET role=$3 WHERE workspace_id=$1 AND user_id=$2 AND role<>'owner'",
    [workspaceId, userId, role],
  );
}
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string,
) {
  await owner(workspaceId);
  await query(
    "DELETE FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role<>'owner'",
    [workspaceId, userId],
  );
}
export async function revokeWorkspaceInvitation(
  workspaceId: string,
  invitationId: string,
) {
  await owner(workspaceId);
  await query(
    "DELETE FROM workspace_invitations WHERE id=$1 AND workspace_id=$2 AND accepted_at IS NULL",
    [invitationId, workspaceId],
  );
}
