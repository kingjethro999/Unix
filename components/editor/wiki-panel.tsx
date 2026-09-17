"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  BookOpen,
  Link2,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  Building2,
  CalendarDays,
} from "lucide-react";
import {
  deleteWikiEntry,
  linkWikiEntries,
  listWikiEntries,
  saveWikiEntry,
  unlinkWikiEntry,
} from "@/app/actions/wiki";
import { useEditorState } from "./editor-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type WikiType = "character" | "location" | "organization" | "event" | "lore";
type Link = {
  id: string;
  targetId: string;
  targetName: string;
  relationship: string;
};
type Entry = {
  id: string;
  entry_type: WikiType;
  name: string;
  summary: string;
  details: string;
  category: string;
  links: Link[];
};
const types: Array<{ value: WikiType; label: string; icon: typeof Users }> = [
  { value: "character", label: "Characters", icon: Users },
  { value: "location", label: "Locations", icon: MapPin },
  { value: "organization", label: "Organizations", icon: Building2 },
  { value: "event", label: "Events", icon: CalendarDays },
  { value: "lore", label: "Lore and concepts", icon: BookOpen },
];

export function WikiPanel() {
  const { workspaceId } = useEditorState();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | WikiType>("all");
  const [editing, setEditing] = useState<Entry | null | undefined>();
  const [pending, start] = useTransition();
  const reload = () => {
    if (workspaceId)
      void listWikiEntries(workspaceId, query).then((rows) =>
        setEntries(rows as Entry[]),
      );
  };
  useEffect(reload, [workspaceId, query]);
  const visible = useMemo(
    () =>
      filter === "all"
        ? entries
        : entries.filter((entry) => entry.entry_type === filter),
    [entries, filter],
  );
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen size={15} className="text-violet-400" />
            World wiki
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            People, places, groups, events, and lore for this workspace.
          </p>
        </div>
        <Button
          size="icon"
          onClick={() => setEditing(null)}
          aria-label="New wiki entry"
        >
          <Plus />
        </Button>
      </div>
      <div className="relative mt-4">
        <Search className="absolute left-2.5 top-2.5 size-4 text-zinc-600" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the wiki"
          className="pl-8"
        />
      </div>
      <div className="mt-2">
        <Select
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entries</SelectItem>
            {types.map((type) => (
              <SelectItem value={type.value} key={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 space-y-2">
        {visible.map((entry) => {
          const kind = types.find((type) => type.value === entry.entry_type)!;
          const Icon = kind.icon;
          return (
            <button
              key={entry.id}
              onClick={() => setEditing(entry)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left hover:border-violet-500/40"
            >
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-violet-400" />
                <span className="text-xs font-medium text-zinc-200">
                  {entry.name}
                </span>
                {entry.category && (
                  <span className="ml-auto text-[10px] text-zinc-600">
                    {entry.category}
                  </span>
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500">
                {entry.summary || "No summary yet."}
              </p>
              {entry.links.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-[10px] text-zinc-600">
                  <Link2 size={10} />
                  {entry.links.length} linked{" "}
                  {entry.links.length === 1 ? "entry" : "entries"}
                </p>
              )}
            </button>
          );
        })}
        {!visible.length && (
          <p className="py-8 text-center text-xs text-zinc-600">
            No wiki entries found.
          </p>
        )}
      </div>
      <WikiEditor
        open={editing !== undefined}
        entry={editing || null}
        entries={entries}
        pending={pending}
        onClose={() => setEditing(undefined)}
        onSave={(value) =>
          start(async () => {
            if (!workspaceId) return;
            await saveWikiEntry({ workspaceId, ...value });
            setEditing(undefined);
            reload();
          })
        }
        onDelete={(id) =>
          start(async () => {
            if (!workspaceId) return;
            await deleteWikiEntry(workspaceId, id);
            setEditing(undefined);
            reload();
          })
        }
        onLink={(sourceId, targetId, relationship) =>
          start(async () => {
            if (!workspaceId) return;
            await linkWikiEntries({
              workspaceId,
              sourceId,
              targetId,
              relationship,
            });
            reload();
          })
        }
        onUnlink={(id) =>
          start(async () => {
            if (!workspaceId) return;
            await unlinkWikiEntry(workspaceId, id);
            reload();
          })
        }
      />
    </div>
  );
}

function WikiEditor({
  open,
  entry,
  entries,
  pending,
  onClose,
  onSave,
  onDelete,
  onLink,
  onUnlink,
}: {
  open: boolean;
  entry: Entry | null;
  entries: Entry[];
  pending: boolean;
  onClose: () => void;
  onSave: (value: {
    id?: string;
    type: WikiType;
    name: string;
    summary: string;
    details: string;
    category: string;
  }) => void;
  onDelete: (id: string) => void;
  onLink: (source: string, target: string, relation: string) => void;
  onUnlink: (id: string) => void;
}) {
  const [type, setType] = useState<WikiType>("character");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [category, setCategory] = useState("");
  const [target, setTarget] = useState("");
  const [relationship, setRelationship] = useState("related to");
  useEffect(() => {
    setType(entry?.entry_type || "character");
    setName(entry?.name || "");
    setSummary(entry?.summary || "");
    setDetails(entry?.details || "");
    setCategory(entry?.category || "");
    setTarget("");
  }, [entry, open]);
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950">
        <DialogHeader>
          <DialogTitle>
            {entry ? "Edit wiki entry" : "New wiki entry"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Select
            value={type}
            onValueChange={(value) => setType(value as WikiType)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category or group"
          />
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Short summary"
          />
          <Textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Details, history, traits, or notes"
            className="min-h-32"
          />
          {entry && (
            <section className="rounded-lg border border-zinc-800 p-3">
              <p className="mb-2 text-xs font-medium">Relationships</p>
              {entry.links.map((link) => (
                <div
                  key={link.id}
                  className="mb-1 flex items-center gap-2 text-xs text-zinc-400"
                >
                  <span className="truncate">
                    {link.relationship} {link.targetName}
                  </span>
                  <button
                    className="ml-auto"
                    onClick={() => onUnlink(link.id)}
                    aria-label="Remove relationship"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <div className="mt-2 flex gap-2">
                <Select value={target} onValueChange={setTarget}>
                  <SelectTrigger className="min-w-0 flex-1">
                    <SelectValue placeholder="Link an entry" />
                  </SelectTrigger>
                  <SelectContent>
                    {entries
                      .filter((item) => item.id !== entry.id)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-28"
                />
                <Button
                  size="sm"
                  disabled={!target}
                  onClick={() => onLink(entry.id, target, relationship)}
                >
                  <Link2 />
                </Button>
              </div>
            </section>
          )}
          <div className="flex justify-between">
            <div>
              {entry && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(entry.id)}
                >
                  <Trash2 />
                  Delete
                </Button>
              )}
            </div>
            <Button
              disabled={pending || !name.trim()}
              onClick={() =>
                onSave({
                  id: entry?.id,
                  type,
                  name,
                  summary,
                  details,
                  category,
                })
              }
            >
              Save entry
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
