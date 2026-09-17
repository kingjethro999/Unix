"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { query } from "@/lib/db";

const entrySchema = z.object({
  workspaceId: z.string().uuid(),
  id: z.string().uuid().optional(),
  type: z.enum(["character", "location", "organization", "event", "lore"]),
  name: z.string().trim().min(1).max(160),
  summary: z.string().max(2000).default(""),
  details: z.string().max(30000).default(""),
  category: z.string().max(120).default(""),
});

async function membership(workspaceId: string, write = false) {
  const user = await requireUser();
  const roles = write ? ["owner", "editor"] : ["owner", "editor", "viewer"];
  const result = await query<{ role: string }>(
    "SELECT role FROM workspace_members WHERE workspace_id=$1 AND user_id=$2 AND role=ANY($3::text[])",
    [workspaceId, user.id, roles],
  );
  if (!result.rows[0]) throw new Error("Workspace access denied");
  return user;
}

export async function listWikiEntries(workspaceId: string, search = "") {
  await membership(workspaceId);
  const value = search.trim();
  return (
    await query(
      `SELECT e.*, COALESCE(json_agg(json_build_object('id',l.id,'targetId',t.id,'targetName',t.name,'relationship',l.relationship)) FILTER (WHERE l.id IS NOT NULL),'[]') AS links
    FROM wiki_entries e LEFT JOIN wiki_links l ON l.source_entry_id=e.id LEFT JOIN wiki_entries t ON t.id=l.target_entry_id
    WHERE e.workspace_id=$1 AND ($2='' OR to_tsvector('simple',e.name||' '||e.summary||' '||e.details) @@ plainto_tsquery('simple',$2))
    GROUP BY e.id ORDER BY e.entry_type,e.name`,
      [workspaceId, value],
    )
  ).rows;
}

export async function saveWikiEntry(input: z.input<typeof entrySchema>) {
  const data = entrySchema.parse(input);
  const user = await membership(data.workspaceId, true);
  if (data.id) {
    const result = await query(
      `UPDATE wiki_entries SET entry_type=$3,name=$4,summary=$5,details=$6,category=$7,updated_at=now()
      WHERE id=$1 AND workspace_id=$2 RETURNING *`,
      [
        data.id,
        data.workspaceId,
        data.type,
        data.name,
        data.summary,
        data.details,
        data.category,
      ],
    );
    if (!result.rows[0]) throw new Error("Wiki entry not found");
    return result.rows[0];
  }
  return (
    await query(
      `INSERT INTO wiki_entries(workspace_id,created_by,entry_type,name,summary,details,category)
    VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        data.workspaceId,
        user.id,
        data.type,
        data.name,
        data.summary,
        data.details,
        data.category,
      ],
    )
  ).rows[0];
}

export async function deleteWikiEntry(workspaceId: string, id: string) {
  await membership(workspaceId, true);
  await query("DELETE FROM wiki_entries WHERE id=$1 AND workspace_id=$2", [
    id,
    workspaceId,
  ]);
}

export async function linkWikiEntries(input: {
  workspaceId: string;
  sourceId: string;
  targetId: string;
  relationship: string;
}) {
  const user = await membership(input.workspaceId, true);
  await query(
    `INSERT INTO wiki_links(workspace_id,source_entry_id,target_entry_id,relationship,created_by)
    SELECT $1,$2,$3,$4,$5 WHERE EXISTS(SELECT 1 FROM wiki_entries WHERE id=$2 AND workspace_id=$1) AND EXISTS(SELECT 1 FROM wiki_entries WHERE id=$3 AND workspace_id=$1)
    ON CONFLICT DO NOTHING`,
    [
      input.workspaceId,
      input.sourceId,
      input.targetId,
      input.relationship.trim() || "related to",
      user.id,
    ],
  );
}

export async function unlinkWikiEntry(workspaceId: string, linkId: string) {
  await membership(workspaceId, true);
  await query("DELETE FROM wiki_links WHERE id=$1 AND workspace_id=$2", [
    linkId,
    workspaceId,
  ]);
}
