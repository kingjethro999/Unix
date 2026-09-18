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
import {
  useActiveFile,
  editorStore,
  type EditProposal,
  type EditorSelection,
} from "./editor-store";
import { validateTextProposal } from "@/lib/edit-proposal";
import { textToDocument } from "@/lib/document";
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
import { InlineAIComposer } from "./inline-ai-composer";

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

const writingFontSizes = [10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36];

export function EditorWorkspace() {
  const activeFile = useActiveFile();
  const [editorTick, setEditorTick] = useState(0);
  const [showFind, setShowFind] = useState(false);
  const [inlineRequest, setInlineRequest] = useState<{
    selection: EditorSelection;
    position: { left: number; top: number };
  } | null>(null);
  const [inlinePrompt, setInlinePrompt] = useState("");
  const [inlineSuggestion, setInlineSuggestion] = useState<string | null>(null);
  const [inlineWorking, setInlineWorking] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
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
      handleKeyDown(view, event) {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          const file = editorStore
            .getState()
            .files.find((item) => item.id === activeFileId.current);
          const { from, to } = view.state.selection;
          if (!file || from === to) {
            toast.message("Select text to ask Unix for a reviewable edit.");
            return true;
          }
          const selection: EditorSelection = {
            fileId: file.id,
            start: from,
            end: to,
            baseRevision: file.revision,
            text: view.state.doc.textBetween(from, to, "\n", "\n"),
            contextBefore: view.state.doc.textBetween(
              Math.max(0, from - 120),
              from,
              "\n",
              "\n",
            ),
            contextAfter: view.state.doc.textBetween(
              to,
              Math.min(view.state.doc.content.size, to + 120),
              "\n",
              "\n",
            ),
          };
          const coords = view.coordsAtPos(to);
          editorStore.setSelection(selection);
          setInlineRequest({
            selection,
            position: { left: coords.left, top: coords.bottom + 8 },
          });
          setInlinePrompt("");
          setInlineSuggestion(null);
          setInlineError(null);
          return true;
        }
        return false;
      },
      handleDOMEvents: {
        contextmenu(view, event) {
          const { from, to } = view.state.selection;
          if (from === to) return false;
          event.preventDefault();
          const file = editorStore
            .getState()
            .files.find((item) => item.id === activeFileId.current);
          if (!file) return true;
          const selection: EditorSelection = {
            fileId: file.id,
            start: from,
            end: to,
            baseRevision: file.revision,
            text: view.state.doc.textBetween(from, to, "\n", "\n"),
            contextBefore: view.state.doc.textBetween(
              Math.max(0, from - 120),
              from,
              "\n",
              "\n",
            ),
            contextAfter: view.state.doc.textBetween(
              to,
              Math.min(view.state.doc.content.size, to + 120),
              "\n",
              "\n",
            ),
          };
          editorStore.setSelection(selection);
          setInlineRequest({
            selection,
            position: { left: event.clientX, top: event.clientY + 8 },
          });
          setInlinePrompt("");
          setInlineSuggestion(null);
          setInlineError(null);
          return true;
        },
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
        if (proposal.kind === "document") {
          if (current.revision !== proposal.baseRevision) return false;
          const applied = editor
            .chain()
            .focus("end")
            .insertContent(
              textToDocument(proposal.replacementText).content || [],
            )
            .run();
          if (applied)
            editorStore.proposalApplied(
              fileId,
              editor.getJSON(),
              editor.getText({ blockSeparator: "\n" }),
            );
          return applied;
        }
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

  async function submitInlineRequest(override?: string) {
    if (!inlineRequest || inlineWorking || !activeFile) return;
    const prompt = (override ?? inlinePrompt).trim();
    if (!prompt) return;
    setInlineWorking(true);
    setInlineError(null);
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          contextFiles: [
            {
              id: activeFile.id,
              title: activeFile.title,
              content: activeFile.content,
            },
          ],
          activeSelection: inlineRequest.selection,
          folderId: editorStore.getState().workspaceId,
          capability: "fast",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(data?.error || "Unix could not prepare an edit.");
      if (data.type !== "proposal" || !data.proposal?.replacementText)
        throw new Error(
          data?.text ||
            "Unix returned an answer instead of an edit. Try asking for a rewrite.",
        );
      const current = editorStore.getState().activeSelection;
      const unchanged =
        current &&
        current.fileId === inlineRequest.selection.fileId &&
        current.baseRevision === inlineRequest.selection.baseRevision &&
        current.start === inlineRequest.selection.start &&
        current.end === inlineRequest.selection.end &&
        current.text === inlineRequest.selection.text;
      if (!unchanged)
        throw new Error(
          "The selection changed. Select it again to regenerate.",
        );
      editorStore.setSelection(inlineRequest.selection);
      if (
        !editorStore.proposeSelectionEdit(
          data.proposal.fileId,
          data.proposal.replacementText,
          data.proposal.description,
        )
      )
        throw new Error("The passage changed. Select it again to regenerate.");
      setInlineSuggestion(data.proposal.replacementText);
    } catch (error) {
      setInlineError(
        error instanceof Error
          ? error.message
          : "Unix could not prepare an edit.",
      );
    } finally {
      setInlineWorking(false);
    }
  }

  if (!activeFile)
    return (
      <div className="grid h-full place-items-center bg-[#111113] text-zinc-500">
        <div className="text-center text-[12px]">
          <FileText className="mx-auto mb-2 h-4 w-4" />
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
    <div className="flex h-full flex-col bg-[#111113]">
      <div className="overflow-x-auto border-b border-white/[0.05] [scrollbar-width:thin]">
        <div className="flex h-9 min-w-max items-center justify-between gap-3 px-2.5">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-zinc-500" />
            <span className="truncate text-[12px] text-zinc-300">
              {activeFile.title}
            </span>
          </div>
          <div
            className="flex shrink-0 items-center gap-1"
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
                className="h-7 min-w-28 border-white/[0.07] bg-white/[0.025] px-2 text-[11px] text-zinc-400"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-white/[0.08] bg-[#1b1b1e] text-zinc-100">
                {writingFonts.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    <span style={{ fontFamily: font.value }}>{font.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <select
              aria-label="Font size presets"
              value={(
                (editor?.getAttributes("textStyle").fontSize as string) ||
                "16px"
              ).replace("px", "")}
              onChange={(event) => {
                const size = Number(event.target.value);
                if (Number.isFinite(size))
                  editor?.chain().focus().setFontSize(`${size}px`).run();
              }}
              className="h-7 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[11px] text-zinc-300 outline-none transition focus:border-white/[0.16]"
              title="Font size presets"
            >
              {writingFontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <input
              aria-label="Custom font size"
              type="number"
              min="8"
              max="96"
              value={(
                (editor?.getAttributes("textStyle").fontSize as string) ||
                "16px"
              ).replace("px", "")}
              onChange={(event) => {
                const size = Number(event.target.value);
                if (Number.isFinite(size) && size >= 8 && size <= 96)
                  editor?.chain().focus().setFontSize(`${size}px`).run();
              }}
              className="h-7 w-11 rounded-md border border-white/[0.07] bg-white/[0.025] px-1.5 text-[11px] text-zinc-300 outline-none transition focus:border-white/[0.16]"
              title="Custom font size"
            />
            <span className="mx-1 h-4 w-px bg-white/[0.06]" />
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
            <span className="mx-1 h-4 w-px bg-white/[0.06]" />
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
      </div>
      {pending && (
        <div className="mx-3 mt-2 rounded-lg border border-white/[0.07] bg-white/[0.025] p-2.5 text-[11.5px]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-zinc-300">
                Proposed change · {pending.description || "AI edit"}
              </p>
              <div className="mt-1 max-h-56 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
                {!!pending.expectedText && (
                  <p className="rounded bg-red-500/10 px-1.5 py-1 text-red-700 line-through break-words dark:text-red-300">
                    {pending.expectedText}
                  </p>
                )}
                <p className="mt-1 rounded bg-emerald-500/10 px-1.5 py-1 text-emerald-700 break-words dark:text-emerald-200">
                  {pending.replacementText}
                </p>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] text-zinc-300 transition hover:bg-white/[0.12]"
                onClick={() => editorStore.acceptChange(activeFile.id)}
                aria-label="Accept suggestion"
              >
                <Check size={14} />
              </button>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
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
      <div className="overflow-x-auto border-t border-white/[0.045] [scrollbar-width:thin]">
        <div className="flex h-6 min-w-max items-center gap-6 whitespace-nowrap px-2.5 text-[10.5px] text-zinc-600">
          <span className="shrink-0">
            {words} words · {activeFile.content.length} characters
          </span>
          <span className="shrink-0">
            <SaveState status={activeFile.saveStatus} />
          </span>
          <span className="shrink-0">
            Rich document v1 · revision {activeFile.revision}
          </span>
        </div>
      </div>
      {inlineRequest && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Dismiss inline Unix request"
            onClick={() => {
              setInlineRequest(null);
              setInlineSuggestion(null);
              setInlineError(null);
            }}
          />
          <InlineAIComposer
            position={inlineRequest.position}
            selectedText={inlineRequest.selection.text}
            value={inlinePrompt}
            onChange={(value) => {
              setInlineError(null);
              setInlinePrompt(value);
            }}
            isWorking={inlineWorking}
            suggestion={inlineSuggestion}
            error={inlineError}
            onSubmit={() => void submitInlineRequest()}
            onQuickAction={(action) => {
              setInlinePrompt(action);
              void submitInlineRequest(action);
            }}
            onAccept={() => {
              if (editorStore.acceptChange(inlineRequest.selection.fileId)) {
                setInlineRequest(null);
                setInlineSuggestion(null);
              }
            }}
            onReject={() => {
              editorStore.rejectChange(inlineRequest.selection.fileId);
              setInlineRequest(null);
              setInlineSuggestion(null);
            }}
            onRetry={() => {
              editorStore.rejectChange(inlineRequest.selection.fileId);
              setInlineSuggestion(null);
              void submitInlineRequest();
            }}
            onClose={() => {
              setInlineRequest(null);
              setInlineSuggestion(null);
              setInlineError(null);
            }}
          />
        </>
      )}
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
      className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors disabled:opacity-30 ${active ? "bg-white/[0.07] text-zinc-200" : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"}`}
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
