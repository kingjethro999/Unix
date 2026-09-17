"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

const ruleInput = z.object({
  workspaceId: z.string().uuid(),
  documentId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(80),
  instruction: z.string().trim().min(1).max(2000),
  enabled: z.boolean().default(true),
});

async function canEdit(userId: string, workspaceId: string) {
  const result = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2 AND role IN ('owner', 'editor')",
    [workspaceId, userId],
  );
  if (!result.rows[0]) throw new Error("Access denied");
}

export async function listRules(
  workspaceId: string,
  documentId?: string | null,
) {
  const user = await requireUser();
  const access = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, user.id],
  );
  if (!access.rows[0]) throw new Error("Access denied");
  return (
    await query(
      `SELECT id, workspace_id, document_id, name, instruction, enabled, created_at, updated_at
       FROM writing_rules WHERE workspace_id = $1 AND (document_id IS NULL OR document_id = $2)
      ORDER BY document_id NULLS FIRST, created_at`,
      [workspaceId, documentId || null],
    )
  ).rows;
}

export async function createRule(input: z.input<typeof ruleInput>) {
  const user = await requireUser();
  const data = ruleInput.parse(input);
  await canEdit(user.id, data.workspaceId);
  return (
    await query(
      `INSERT INTO writing_rules (workspace_id, document_id, owner_id, name, instruction, enabled)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, workspace_id, document_id, name, instruction, enabled, created_at, updated_at`,
      [
        data.workspaceId,
        data.documentId || null,
        user.id,
        data.name,
        data.instruction,
        data.enabled,
      ],
    )
  ).rows[0];
}

export async function updateRule(
  id: string,
  updates: { name?: string; instruction?: string; enabled?: boolean },
) {
  const user = await requireUser();
  const found = await query<{ workspace_id: string }>(
    "SELECT workspace_id FROM writing_rules WHERE id = $1",
    [id],
  );
  if (!found.rows[0]) throw new Error("Rule not found");
  await canEdit(user.id, found.rows[0].workspace_id);
  const name = updates.name?.trim();
  const instruction = updates.instruction?.trim();
  if (name === "" || instruction === "")
    throw new Error("Rule fields cannot be empty");
  return (
    await query(
      `UPDATE writing_rules SET name = COALESCE($2, name), instruction = COALESCE($3, instruction),
            enabled = COALESCE($4, enabled), updated_at = now() WHERE id = $1
     RETURNING id, workspace_id, document_id, name, instruction, enabled, created_at, updated_at`,
      [id, name ?? null, instruction ?? null, updates.enabled ?? null],
    )
  ).rows[0];
}

export async function deleteRule(id: string) {
  const user = await requireUser();
  const found = await query<{ workspace_id: string }>(
    "SELECT workspace_id FROM writing_rules WHERE id = $1",
    [id],
  );
  if (!found.rows[0]) return;
  await canEdit(user.id, found.rows[0].workspace_id);
  await query("DELETE FROM writing_rules WHERE id = $1", [id]);
}

export async function getUnixrc(workspaceId: string) {
  const user = await requireUser();
  const access = await query(
    "SELECT 1 FROM workspace_members WHERE workspace_id=$1 AND user_id=$2",
    [workspaceId, user.id],
  );
  if (!access.rows[0]) throw new Error("Access denied");
  return (
    (
      await query<{ id: string; instruction: string; enabled: boolean }>(
        "SELECT id,instruction,enabled FROM writing_rules WHERE workspace_id=$1 AND document_id IS NULL AND name='.unixrc' ORDER BY created_at LIMIT 1",
        [workspaceId],
      )
    ).rows[0] || null
  );
}

export async function saveUnixrc(workspaceId: string, instruction: string) {
  const user = await requireUser();
  await canEdit(user.id, workspaceId);
  const value = instruction.trim();
  if (value.length > 12000)
    throw new Error(".unixrc is limited to 12,000 characters");
  const existing = await query<{ id: string }>(
    "SELECT id FROM writing_rules WHERE workspace_id=$1 AND document_id IS NULL AND name='.unixrc' ORDER BY created_at LIMIT 1",
    [workspaceId],
  );
  if (existing.rows[0])
    return (
      await query(
        "UPDATE writing_rules SET instruction=$2,enabled=true,updated_at=now() WHERE id=$1 RETURNING id,instruction,enabled",
        [
          existing.rows[0].id,
          value || "Write clearly and preserve the author's voice.",
        ],
      )
    ).rows[0];
  return (
    await query(
      "INSERT INTO writing_rules(workspace_id,owner_id,name,instruction,enabled) VALUES($1,$2,'.unixrc',$3,true) RETURNING id,instruction,enabled",
      [
        workspaceId,
        user.id,
        value || "Write clearly and preserve the author's voice.",
      ],
    )
  ).rows[0];
}
