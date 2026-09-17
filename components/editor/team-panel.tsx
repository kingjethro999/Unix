"use client";

import { useEffect, useState, useTransition } from "react";
import { Copy, MailPlus, Trash2, Users } from "lucide-react";
import {
  createWorkspaceInvitation,
  listWorkspaceMembers,
  removeWorkspaceMember,
  revokeWorkspaceInvitation,
  updateWorkspaceMember,
} from "@/app/actions/members";
import { useEditorState } from "./editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

type Member = {
  id: string;
  email: string;
  full_name: string | null;
  role: "owner" | "editor" | "viewer";
};
type Invitation = {
  id: string;
  email: string;
  role: "editor" | "viewer";
  expires_at: string;
};
export function TeamPanel() {
  const { workspaceId, userId } = useEditorState();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviteUrl, setInviteUrl] = useState("");
  const [pending, start] = useTransition();
  const owner =
    members.find((member) => member.role === "owner")?.id === userId;
  const reload = () => {
    if (workspaceId)
      void listWorkspaceMembers(workspaceId).then((result) => {
        setMembers(result.members as Member[]);
        setInvites(result.invitations as Invitation[]);
      });
  };
  useEffect(reload, [workspaceId]);
  const invite = () =>
    start(async () => {
      if (!workspaceId || !email.trim()) return;
      try {
        const result = await createWorkspaceInvitation({
          workspaceId,
          email,
          role,
        });
        const url = `${window.location.origin}/invite/${result.token}`;
        setInviteUrl(url);
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // The visible field below remains copyable when clipboard access is blocked.
        }
        setEmail("");
        reload();
        toast.success("Invitation created");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create invitation",
        );
      }
    });
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="flex items-center gap-2">
        <Users size={16} className="text-emerald-400" />
        <h2 className="text-sm font-semibold">Team workspace</h2>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Invite collaborators and control who can edit or view this workspace.
      </p>
      {owner && (
        <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-medium">
            <MailPlus size={13} />
            Invite a member
          </p>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="writer@example.com"
          />
          <div className="mt-2 flex gap-2">
            <Select
              value={role}
              onValueChange={(value) => setRole(value as typeof role)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="editor">Can edit</SelectItem>
                <SelectItem value="viewer">Can view</SelectItem>
              </SelectContent>
            </Select>
            <Button disabled={pending || !email.trim()} onClick={invite}>
              Invite
            </Button>
          </div>
          {inviteUrl && (
            <div className="mt-2 flex gap-2">
              <Input aria-label="Invitation link" readOnly value={inviteUrl} />
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy invitation link"
                onClick={() => void navigator.clipboard.writeText(inviteUrl)}
              >
                <Copy />
              </Button>
            </div>
          )}
          <p className="mt-2 text-[10px] text-zinc-600">
            Invitation links expire after seven days and only work for the
            invited email address.
          </p>
        </div>
      )}
      <div className="mt-5 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-600">
          Members
        </p>
        {members.map((member) => (
          <div
            key={member.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-full bg-zinc-800 text-xs text-zinc-300">
                {(member.full_name || member.email).slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs text-zinc-200">
                  {member.full_name || member.email}
                </p>
                {member.full_name && (
                  <p className="truncate text-[10px] text-zinc-600">
                    {member.email}
                  </p>
                )}
              </div>
              {owner && member.role !== "owner" ? (
                <>
                  <Select
                    value={member.role}
                    onValueChange={(value) =>
                      start(async () => {
                        if (!workspaceId) return;
                        await updateWorkspaceMember(
                          workspaceId,
                          member.id,
                          value as "editor" | "viewer",
                        );
                        reload();
                      })
                    }
                  >
                    <SelectTrigger className="h-7 w-24 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    aria-label={`Remove ${member.email}`}
                    onClick={() =>
                      start(async () => {
                        if (!workspaceId) return;
                        await removeWorkspaceMember(workspaceId, member.id);
                        reload();
                      })
                    }
                  >
                    <Trash2
                      size={13}
                      className="text-zinc-600 hover:text-red-400"
                    />
                  </button>
                </>
              ) : (
                <span className="text-[10px] capitalize text-zinc-500">
                  {member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      {owner && invites.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-600">
            Pending invitations
          </p>
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 p-3"
            >
              <Copy size={12} className="text-zinc-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{invite.email}</p>
                <p className="text-[10px] text-zinc-600">
                  {invite.role} · expires{" "}
                  {new Date(invite.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                aria-label={`Revoke invitation for ${invite.email}`}
                onClick={() =>
                  start(async () => {
                    if (!workspaceId) return;
                    await revokeWorkspaceInvitation(workspaceId, invite.id);
                    reload();
                  })
                }
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
