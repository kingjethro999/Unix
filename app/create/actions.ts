"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { UNIXRC_TEMPLATE } from "@/lib/unixrc";

const schema = z.object({ name: z.string().trim().min(1).max(120) });

export async function createFolderAction(input: z.infer<typeof schema>) {
  const user = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "A workspace name is required." };
  const folder = await transaction(async (client) => {
    const created = await client.query(
      "INSERT INTO workspaces (owner_id, name) VALUES ($1, $2) RETURNING id, owner_id AS user_id, name, created_at, updated_at",
      [user.id, parsed.data.name],
    );
    await client.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'owner')",
      [created.rows[0].id, user.id],
    );
    await client.query(
      "INSERT INTO documents (workspace_id, owner_id, title) VALUES ($1, $2, 'Untitled Page')",
      [created.rows[0].id, user.id],
    );
    await client.query(
      "INSERT INTO documents (workspace_id, owner_id, title, document_type, content_json, content_text) VALUES ($1, $2, '.unixrc', 'unixrc', $3, $4)",
      [
        created.rows[0].id,
        user.id,
        JSON.stringify(UNIXRC_TEMPLATE),
        "## Rules\nWrite clearly and preserve the author’s voice.\n\n## Focused rules\nAdd a focused rule here.",
      ],
    );
    await client.query(
      "INSERT INTO writing_rules (workspace_id, owner_id, name, instruction, enabled) VALUES ($1, $2, '.unixrc', $3, true)",
      [
        created.rows[0].id,
        user.id,
        "Write clearly and preserve the author's voice. Keep names, facts, point of view, tense, and established terminology consistent unless I explicitly request a change.",
      ],
    );
    return created.rows[0];
  });
  revalidatePath("/create");
  return { folder };
}

export async function getFolders() {
  const user = await requireUser();
  return (
    await query(
      `SELECT w.id, w.owner_id AS user_id, w.name, w.created_at, w.updated_at, wm.role
       FROM workspaces w JOIN workspace_members wm ON wm.workspace_id = w.id
      WHERE wm.user_id = $1 ORDER BY w.updated_at DESC`,
      [user.id],
    )
  ).rows;
}
