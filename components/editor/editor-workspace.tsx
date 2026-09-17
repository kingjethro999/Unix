"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import { TextStyleKit } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Image from "@tiptap/extension-image";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Redo2,
  Sparkles,
  Table2,
  Undo2,
  X,
  Check,
  FileText,
  ImagePlus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { useActiveFile, editorStore, type EditProposal } from "./editor-store";
import { validateTextProposal } from "@/lib/edit-proposal";
import { FindReplace } from "./find-replace";
import {
  CollaborationCursors,
  collaborationCursorKey,
} from "@/lib/collaboration-cursors";
import { usePresence } from "@/hooks/use-presence";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const writingFonts = [
  { value: "Georgia, 'Times New Roman', serif", label: "Georgia" },
  { value: "'Palatino Linotype', Palatino, serif", label: "Palatino" },
  { value: "'Baskerville', 'Times New Roman', serif", label: "Baskerville" },
  { value: "Garamond, 'Times New Roman', serif", label: "Garamond" },
  { value: "'Book Antiqua', Palatino, serif", label: "Book Antiqua" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  {
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    label: "Helvetica",
  },
  { value: "'Trebuchet MS', Arial, sans-serif", label: "Trebuchet" },
  { value: "Verdana, Geneva, sans-serif", label: "Verdana" },
  { value: "Tahoma, Geneva, sans-serif", label: "Tahoma" },
  { value: "'Courier New', Courier, monospace", label: "Courier New" },
  { value: "Consolas, 'Courier New', monospace", label: "Consolas" },
  { value: "var(--font-eb-garamond), Garamond, serif", label: "EB Garamond" },
  { value: "var(--font-lora), Georgia, serif", label: "Lora" },
  { value: "var(--font-merriweather), Georgia, serif", label: "Merriweather" },
  {
    value: "var(--font-libre-baskerville), Baskerville, serif",
    label: "Libre Baskerville",
  },
  { value: "var(--font-crimson-pro), Georgia, serif", label: "Crimson Pro" },
  { value: "var(--font-inter), Arial, sans-serif", label: "Inter" },
  { value: "var(--font-source-sans), Arial, sans-serif", label: "Source Sans" },
  {
    value: "var(--font-ibm-plex-sans), Arial, sans-serif",
    label: "IBM Plex Sans",
  },
  {
    value: "var(--font-jetbrains-mono), Consolas, monospace",
    label: "JetBrains Mono",
  },
  {
    value: "var(--font-ibm-plex-mono), Consolas, monospace",
    label: "IBM Plex Mono",
  },
] as const;

export function EditorWorkspace() {
  const activeFile = useActiveFile();
  const [editorTick, setEditorTick] = useState(0);
  const [showFind, setShowFind] = useState(false);
  const activeFileId = useRef<string | null>(activeFile?.id || null);
  const workspaceId = useRef<string | null>(editorStore.getState().workspaceId);
  const imageInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    activeFileId.current = activeFile?.id || null;
  }, [activeFile?.id]);
  useEffect(() => {
    workspaceId.current = editorStore.getState().workspaceId;
  }, [activeFile?.id]);
  const extensions = useMemo(
    () => [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextStyleKit,
      FontFamily.configure({ types: ["textStyle"] }),
      TableKit.configure({ table: { resizable: true } }),
      Image.configure({ allowBase64: false, inline: false }),
      CollaborationCursors,
    ],
    [],
  );

  const editor = useEditor({
    extensions,
    content: activeFile?.document,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "unix-editor prose prose-invert max-w-none min-h-full focus:outline-none px-8 sm:px-12 py-10",
        "aria-label": "Document editor",
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files || []).filter(
          (file) => file.type.startsWith("image/"),
        );
        if (!files.length) return false;
        event.preventDefault();
        const position =
          view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ??
          view.state.selection.from;
        void insertUploadedImages(files, position, view);
        return true;
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files || []).filter(
          (file) => file.type.startsWith("image/"),
        );
        if (!files.length) return false;
        event.preventDefault();
        void insertUploadedImages(files, view.state.selection.from, view);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const file = editorStore
        .getState()
        .files.find((item) => item.id === activeFileId.current);
      if (file)
        editorStore.updateFileDocument(
          file.id,
          editor.getJSON(),
          editor.getText({ blockSeparator: "\n" }),
        );
      setEditorTick((value) => value + 1);
    },
    onSelectionUpdate: ({ editor }) => {
      setEditorTick((value) => value + 1);
      const fileId = activeFileId.current || "";
      const file = editorStore
        .getState()
        .files.find((item) => item.id === fileId);
      const { from, to } = editor.state.selection;
      if (!file || from === to) return editorStore.setSelection(null);
      editorStore.setSelection({
        fileId,
        start: from,
        end: to,
        baseRevision: file.revision,
        text: editor.state.doc.textBetween(from, to, "\n", "\n"),
        contextBefore: editor.state.doc.textBetween(
          Math.max(0, from - 120),
          from,
          "\n",
          "\n",
        ),
        contextAfter: editor.state.doc.textBetween(
          to,
          Math.min(editor.state.doc.content.size, to + 120),
          "\n",
          "\n",
        ),
      });
    },
  });
  const activeDocument = activeFile?.document;
  const localSelection = editor
    ? { from: editor.state.selection.from, to: editor.state.selection.to }
    : undefined;
  const collaborators = usePresence(
    editorStore.getState().workspaceId,
    activeFile?.id,
    localSelection,
  );

  useEffect(() => {
    if (!editor) return;
    const others = collaborators.filter(
      (person) =>
        person.userId !== editorStore.getState().userId &&
        person.documentId === activeFile?.id,
    );
    editor.view.dispatch(
      editor.state.tr.setMeta(collaborationCursorKey, others),
    );
  }, [editor, collaborators, activeFile?.id]);

  async function insertUploadedImages(
    files: File[],
    position: number,
    view = editor?.view,
  ) {
    if (!view || !workspaceId.current || !activeFileId.current) return;
    let insertAt = position;
    for (const file of files) {
      const form = new FormData();
      form.set("file", file);
      form.set("workspaceId", workspaceId.current);
      form.set("documentId", activeFileId.current);
      form.set("altText", file.name.replace(/\.[^.]+$/, ""));
      const response = await fetch("/api/assets", {
        method: "POST",
        body: form,
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(result?.error || "Image upload failed");
        continue;
      }
      const node = view.state.schema.nodes.image.create({
        src: result.asset.url,
        alt: result.asset.alt,
        title: file.name,
      });
      view.dispatch(view.state.tr.insert(insertAt, node));
      insertAt += node.nodeSize;
    }
  }

  useEffect(() => {
    if (!editor || !activeFile?.isLoaded) return;
    if (
      activeDocument &&
      JSON.stringify(editor.getJSON()) !== JSON.stringify(activeDocument)
    )
      editor.commands.setContent(activeDocument, { emitUpdate: false });
  }, [
    editor,
    activeFile?.id,
    activeFile?.isLoaded,
    activeFile?.revision,
    activeDocument,
  ]);

  useEffect(() => {
    const fileId = activeFile?.id;
    if (!editor || !fileId) return;
    return editorStore.registerEditor(fileId, {
      apply(proposal: EditProposal) {
        const current = editorStore
          .getState()
          .files.find((file) => file.id === fileId);
        if (proposal.fileId !== fileId || !current) return false;
        const validation = validateTextProposal(
          editor.state.doc,
          proposal,
          current.revision,
        );
        if (!validation.ok) return false;
        const transaction = proposal.replacementText
          ? editor.state.tr.replaceWith(
              proposal.from,
              proposal.to,
              editor.state.schema.text(
                proposal.replacementText,
                validation.marks,
              ),
            )
          : editor.state.tr.delete(proposal.from, proposal.to);
        editor.view.dispatch(transaction);
        editorStore.proposalApplied(
          fileId,
          editor.getJSON(),
          editor.getText({ blockSeparator: "\n" }),
        );
        return true;
      },
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      canUndo: () => editor.can().undo(),
      canRedo: () => editor.can().redo(),
      insertImage: (src: string, alt: string) =>
        editor.chain().focus().setImage({ src, alt }).run(),
    });
  }, [editor, activeFile?.id]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const href = window.prompt(
      "Link URL",
      (editor.getAttributes("link").href as string | undefined) || "https://",
    );
    if (href === null) return;
    if (!href) editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  }, [editor]);

  if (!activeFile)
    return (
      <div className="h-full grid place-items-center bg-zinc-950 text-zinc-500">
        <div className="text-center">
          <FileText className="mx-auto mb-3" />
          <p>Select a document to start writing.</p>
        </div>
      </div>
    );
  const pending = activeFile.pendingEdit;
  const words = activeFile.content.trim()
    ? activeFile.content.trim().split(/\s+/).length
    : 0;
  void editorTick;

  return (
    <div className="h-full flex flex-col bg-zinc-950">
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-zinc-800/60">
        <div className="min-w-0 flex items-center gap-2">
          <FileText size={15} className="text-cyan-400" />
          <span className="truncate text-sm text-zinc-300">
            {activeFile.title}
          </span>
        </div>
        <div
          className="flex items-center gap-1"
          aria-label="Formatting toolbar"
        >
          <Select
            value={
              (editor?.getAttributes("textStyle").fontFamily as string) ||
              writingFonts[0].value
            }
            onValueChange={(fontFamily) =>
              editor?.chain().focus().setFontFamily(fontFamily).run()
            }
          >
            <SelectTrigger
              size="sm"
              aria-label="Text font"
              className="h-8 min-w-28 border-zinc-800 bg-zinc-900 px-2 text-xs text-zinc-300"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-zinc-700 bg-zinc-900 text-zinc-100">
              {writingFonts.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span style={{ fontFamily: font.value }}>{font.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="w-px h-5 bg-zinc-800 mx-1" />
          <Tool
            label="Bold"
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <Bold size={14} />
          </Tool>
          <Tool
            label="Italic"
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <Italic size={14} />
          </Tool>
          <Tool
            label="Bulleted list"
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <List size={14} />
          </Tool>
          <Tool
            label="Numbered list"
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered size={14} />
          </Tool>
          <Tool
            label="Link"
            active={editor?.isActive("link")}
            onClick={setLink}
          >
            <Link2 size={14} />
          </Tool>
          <Tool
            label="Insert table"
            onClick={() =>
              editor
                ?.chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
          >
            <Table2 size={14} />
          </Tool>
          <Tool
            label="Insert image"
            onClick={() => imageInput.current?.click()}
          >
            <ImagePlus size={14} />
          </Tool>
          <Tool
            label="Find and replace"
            onClick={() => setShowFind((value) => !value)}
          >
            <Search size={14} />
          </Tool>
          <input
            ref={imageInput}
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              if (files.length && editor)
                void insertUploadedImages(files, editor.state.selection.from);
              event.target.value = "";
            }}
          />
          <span className="w-px h-5 bg-zinc-800 mx-1" />
          <Tool
            label="Undo"
            disabled={!editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
          >
            <Undo2 size={14} />
          </Tool>
          <Tool
            label="Redo"
            disabled={!editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
          >
            <Redo2 size={14} />
          </Tool>
          <Tool
            label="AI assistant"
            onClick={() => editorStore.toggleRightSidebar()}
          >
            <Sparkles size={14} />
          </Tool>
        </div>
      </div>
      {pending && (
        <div className="mx-4 mt-3 rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3 text-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-medium text-cyan-300">
                Proposed change · {pending.description || "AI edit"}
              </p>
              <p className="mt-1 text-zinc-500 line-through break-words">
                {pending.expectedText}
              </p>
              <p className="mt-1 text-zinc-200 break-words">
                {pending.replacementText}
              </p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                className="p-2 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                onClick={() => editorStore.acceptChange(activeFile.id)}
                aria-label="Accept suggestion"
              >
                <Check size={14} />
              </button>
              <button
                className="p-2 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20"
                onClick={() => editorStore.rejectChange(activeFile.id)}
                aria-label="Reject suggestion"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      {showFind && editor && (
        <FindReplace editor={editor} onClose={() => setShowFind(false)} />
      )}
      <div className="flex-1 overflow-y-auto">
        {!activeFile.isLoaded ? (
          <div className="p-12 text-zinc-500">Loading document…</div>
        ) : (
          <EditorContent
            editor={editor}
            className="min-h-full max-w-[860px] mx-auto"
          />
        )}
      </div>
      <div className="px-4 py-1.5 border-t border-zinc-800/50 grid grid-cols-3 items-center text-[10px] text-zinc-600">
        <span>
          {words} words · {activeFile.content.length} characters
        </span>
        <span className="justify-self-center">
          <SaveState status={activeFile.saveStatus} />
        </span>
        <span className="justify-self-end">
          Rich document v1 · revision {activeFile.revision}
        </span>
      </div>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded transition-colors disabled:opacity-30 ${active ? "bg-cyan-500/15 text-cyan-300" : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"}`}
    >
      {children}
    </button>
  );
}
function SaveState({ status }: { status: string }) {
  const label =
    status === "saved"
      ? "Saved"
      : status === "saving"
        ? "Saving…"
        : status === "conflict"
          ? "Conflict"
          : status === "offline"
            ? "Saved locally · offline"
            : status === "error"
              ? "Save failed"
              : "Unsaved";
  const color =
    status === "saved"
      ? "text-zinc-600"
      : status === "conflict" || status === "error"
        ? "text-red-400"
        : "text-amber-400";
  return <span className={`text-[10px] ${color}`}>{label}</span>;
}
