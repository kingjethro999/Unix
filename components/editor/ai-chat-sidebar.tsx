"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  ArrowUp,
  History,
  FileText,
  ImagePlus,
  MessageSquare,
  ScanEye,
  Sparkles,
  X,
  Paperclip,
  Plus,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import NextImage from "next/image";
import { editorStore, useActiveFile, useEditorState } from "./editor-store";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ImageAsset {
  id: string;
  url: string;
  alt: string;
}
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Array<{ id: string; title: string }>;
  image?: ImageAsset;
  proposalFileId?: string;
  appendFileId?: string;
  appendContent?: string;
  timestamp: Date;
}
interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

const starterPrompts = [
  "Continue this scene",
  "Find a stronger opening",
  "Outline the next chapter",
];

function titleKey(value: string) {
  return value
    .replace(/["“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase();
}

export function AIChatSidebar() {
  const activeFile = useActiveFile();
  const editorState = useEditorState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [isWorking, setIsWorking] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [mode, setMode] = useState<"ask" | "research">("ask");
  const [conversationName, setConversationName] = useState("New conversation");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const hasStartedChatRef = useRef(false);

  useEffect(() => {
    const update = () => setIsOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isWorking]);
  function hydrateMessages(data: {
    messages?: Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      attachments?: {
        references?: Array<{ id: string; title: string }>;
        asset?: ImageAsset;
      };
      created_at: string;
    }>;
  }) {
    setMessages(
      (data.messages || []).map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        timestamp: new Date(message.created_at),
        attachments: message.attachments?.references,
        image: message.attachments?.asset,
      })),
    );
  }

  async function loadConversation(id: string | null, preserveActive = false) {
    if (!editorState.workspaceId) return;
    const params = new URLSearchParams({
      workspaceId: editorState.workspaceId,
    });
    if (id) params.set("conversationId", id);
    const response = await fetch(`/api/ai/chat?${params.toString()}`);
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations || []);
    if (!preserveActive || !hasStartedChatRef.current) hydrateMessages(data);
    if (id) {
      const conversation = (data.conversations || []).find(
        (item: Conversation) => item.id === id,
      );
      setConversationName(conversation?.title || "Conversation");
    }
  }

  useEffect(() => {
    if (!editorState.workspaceId) return;
    let cancelled = false;
    setConversationId(null);
    setConversationName("New conversation");
    setMessages([]);
    hasStartedChatRef.current = false;
    void loadConversation(null, true).catch(() => {
      if (!cancelled) setConversations([]);
    });
    return () => {
      cancelled = true;
    };
  }, [editorState.workspaceId]);

  function handleContextDrop(event: React.DragEvent) {
    event.preventDefault();
    setIsDragOver(false);
    try {
      const value = JSON.parse(
        event.dataTransfer.getData("application/json"),
      ) as { type?: string; id?: string; title?: string };
      if (
        value.type === "file" &&
        value.id &&
        value.title &&
        !attachments.some((item) => item.id === value.id)
      )
        setAttachments((current) => [
          ...current,
          { id: value.id!, title: value.title! },
        ]);
    } catch {
      /* Ignore unrelated drops. */
    }
  }

  async function send(override?: string) {
    const content = (override ?? input).trim();
    let renamedTitle: string | null = null;
    if (
      (!content && !attachments.length) ||
      !editorState.workspaceId ||
      isWorking
    )
      return;
    if (!isOnline) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Writing assistance is unavailable while you are offline. Your local draft remains available.",
          timestamp: new Date(),
        },
      ]);
      return;
    }
    const renameWorkspace = content.match(
      /^(?:please\s+)?rename\s+(?:this\s+)?workspace\s+(?:to|as)\s+(.+?)\s*[.!]?$/i,
    );
    if (renameWorkspace) {
      const title = renameWorkspace[1].trim().replace(/["“”]/g, "");
      if (title) {
        await editorStore.renameWorkspace(title);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Renamed this workspace to **${title}**.`,
            timestamp: new Date(),
          },
        ]);
        setInput("");
        return;
      }
    }
    const deletePage = content.match(
      /^(?:please\s+)?delete\s+(?:the\s+)?(?:page|document|file)(?:\s+(?:called|named))?\s+(.+?)\s*[.!]?$/i,
    );
    if (deletePage) {
      const requestedTitle = deletePage[1];
      const file = editorState.files.find(
        (item) => titleKey(item.title) === titleKey(requestedTitle),
      );
      if (file) await editorStore.deleteFile(file.id);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: file
            ? `Deleted **${file.title}**.`
            : `I could not find a page named **${requestedTitle.trim()}**.`,
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }
    const renameNamedPage = content.match(
      /^(?:please\s+)?rename\s+(?:the\s+)?(?:page|document|file)(?:\s+(?:called|named))?\s+(.+?)\s+(?:to|as)\s+(.+?)\s*[.!]?$/i,
    );
    if (renameNamedPage && !/^(?:this|the)$/i.test(renameNamedPage[1].trim())) {
      const file = editorState.files.find(
        (item) => titleKey(item.title) === titleKey(renameNamedPage[1]),
      );
      const nextTitle = renameNamedPage[2].trim().replace(/["“”]/g, "");
      if (file && nextTitle) {
        await editorStore.renameFile(file.id, nextTitle);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `Renamed **${file.title}** to **${nextTitle}**.`,
            timestamp: new Date(),
          },
        ]);
        setInput("");
        return;
      }
    }
    const rename = content.match(
      /(?:^|[,.;]\s*)(?:please\s+)?rename(?:\s+(?:this|the))?\s+(?:page|document)\s+(?:to|as)\s+([^,.;\n]+)/i,
    );
    const inferredTitle =
      /rename(?:\s+(?:this|the))?\s+(?:page|document)/i.test(content)
        ? content.match(
            /\b(?:hero|he)\s+(?:is|called|named)\s+([\w'-]{2,60})/i,
          )?.[1]
        : null;
    if ((rename || inferredTitle) && activeFile) {
      const title = (rename?.[1] || inferredTitle || "")
        .trim()
        .replace(/["“”]/g, "");
      if (title) {
        const formattedTitle = title.replace(/\b\w/g, (letter) =>
          letter.toUpperCase(),
        );
        await editorStore.renameFile(activeFile.id, formattedTitle);
        renamedTitle = formattedTitle;
        const remaining = content
          .replace(rename?.[0] || "", "")
          .replace(/^\s*(?:,|and|then)\s*/i, "")
          .trim();
        if (!remaining) {
          setMessages((current) => [
            ...current,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `Renamed this page to **${title}**.`,
              timestamp: new Date(),
            },
          ]);
          setInput("");
          return;
        }
      }
    }
    if (
      /^(?:please\s+)?duplicate(?:\s+(?:this|the))?\s+(?:page|document)/i.test(
        content,
      ) &&
      activeFile
    ) {
      const copy = await editorStore.createFile(`${activeFile.title} copy`);
      if (copy)
        editorStore.updateFileDocument(
          copy.id,
          activeFile.document,
          activeFile.content,
        );
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: copy
            ? `Created **${copy.title}** with a copy of the current draft.`
            : "I could not create the copy.",
          timestamp: new Date(),
        },
      ]);
      setInput("");
      return;
    }
    const create = content.match(
      /^(?:please\s+)?create\s+(?:a\s+)?(?:page|document)(?:\s+(?:called|named))?\s+(.+)$/i,
    );
    if (create) {
      const title = create[1].trim().replace(/["“”]/g, "");
      if (title) {
        const file = await editorStore.createFile(title);
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: file
              ? `Created **${file.title}**. What should I write in it?`
              : "I could not create that page.",
            timestamp: new Date(),
          },
        ]);
        setInput("");
        return;
      }
    }
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      attachments: [...attachments],
      timestamp: new Date(),
    };
    const requestMessages = [...messages, userMessage];
    hasStartedChatRef.current = true;
    const requestSelection = editorStore.getState().activeSelection;
    setMessages(requestMessages);
    setInput("");
    if (composerRef.current) composerRef.current.style.height = "44px";
    setAttachments([]);
    setIsWorking(true);
    try {
      const contextFiles =
        userMessage.attachments
          ?.map((attachment) =>
            editorStore
              .getState()
              .files.find((file) => file.id === attachment.id),
          )
          .filter(Boolean)
          .map((file) => ({
            id: file!.id,
            title: file!.title,
            content: file!.content,
          })) || [];
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: requestMessages.map((message) => ({
            role: message.role === "assistant" ? "model" : "user",
            content: message.content,
          })),
          contextFiles,
          activeSelection: requestSelection,
          folderId: editorState.workspaceId,
          conversationId,
          capability:
            mode === "research" ||
            /^(research\s*:|find sources|look up|research\b)/i.test(content)
              ? "research"
              : "fast",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          data?.error || "The request failed. Your document was not changed.",
        );
      if (data.conversationId) {
        setConversationId(data.conversationId);
        setConversationName((current) =>
          current === "New conversation" ? content.slice(0, 72) : current,
        );
        void loadConversation(null, true);
      }
      if (data.type === "proposal") {
        const current = editorStore.getState().activeSelection;
        const unchanged =
          requestSelection &&
          current &&
          current.fileId === requestSelection.fileId &&
          current.baseRevision === requestSelection.baseRevision &&
          current.start === requestSelection.start &&
          current.end === requestSelection.end &&
          current.text === requestSelection.text;
        if (!unchanged)
          throw new Error(
            "The selection changed while Unix was writing. Select it again to regenerate.",
          );
        editorStore.setSelection(requestSelection);
        if (
          !editorStore.proposeSelectionEdit(
            data.proposal.fileId,
            data.proposal.replacementText,
            data.proposal.description,
          )
        )
          throw new Error(
            "The passage changed. Select it again to regenerate.",
          );
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.text || "A focused edit is ready for review.",
            proposalFileId: data.proposal.fileId,
            timestamp: new Date(),
          },
        ]);
      } else if (data.type === "image") {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: data.text || "The image is ready.",
            image: data.asset,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: renamedTitle
              ? `Renamed this page to **${renamedTitle}**.\n\n${data.text}`
              : data.text,
            appendFileId: activeFile?.id,
            appendContent: data.text,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "The request failed. Your document was not changed.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsWorking(false);
    }
  }

  const pendingChanges = editorStore.getReviewingFilesCount();

  return (
    <aside className="flex h-full min-w-0 flex-col overflow-hidden border-l border-white/[0.055] bg-[#111113] text-zinc-200">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.055] px-2.5">
        <span
          title={conversationName}
          className="min-w-0 truncate text-[12px] font-medium tracking-[-0.01em] text-zinc-300"
        >
          Agent
        </span>
        <div className="flex shrink-0 items-center gap-0.5 text-zinc-500">
          <button
            type="button"
            title="New conversation"
            aria-label="New conversation"
            onClick={() => {
              setMessages([]);
              setConversationId(null);
              setConversationName("New conversation");
              hasStartedChatRef.current = false;
              setInput("");
            }}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
          >
            <Plus size={15} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Conversation history"
                aria-label="Conversation history"
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
              >
                <History size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 border-white/[0.08] bg-[#1b1b1e] p-1 text-zinc-300 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
            >
              <DropdownMenuItem
                onSelect={() => {
                  setMessages([]);
                  setConversationId(null);
                  setConversationName("New conversation");
                  hasStartedChatRef.current = false;
                }}
              >
                New conversation
              </DropdownMenuItem>
              {conversations.map((conversation) => (
                <DropdownMenuItem
                  key={conversation.id}
                  onSelect={() => {
                    setConversationId(conversation.id);
                    setConversationName(conversation.title);
                    void loadConversation(conversation.id);
                  }}
                  className="truncate"
                >
                  {conversation.title}
                </DropdownMenuItem>
              ))}
              {!conversations.length && (
                <DropdownMenuItem disabled>
                  No earlier conversations yet
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Chat settings"
                aria-label="Chat settings"
                className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-white/[0.08] bg-[#1b1b1e] p-1 text-zinc-300 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
            >
              <DropdownMenuItem onSelect={() => setMessages([])}>
                Clear this conversation
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => composerRef.current?.focus()}>
                Focus message box
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] space-y-4 px-3 py-3">
          {!messages.length && (
            <div className="py-10 text-center text-zinc-500">
              <MessageSquare size={18} className="mx-auto mb-2" />
              <p className="mx-auto max-w-[220px] text-[12px] leading-5">
                Ask about your draft, or select a passage for a reviewable edit.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <article
              key={message.id}
              className={cn(
                "flex gap-2",
                message.role === "user" && "justify-end",
              )}
            >
              <div
                className={cn(
                  "max-w-full text-[12.5px] leading-[1.65] text-zinc-300",
                  message.role === "user" &&
                    "max-w-[92%] rounded-xl border border-white/[0.055] bg-white/[0.04] px-3 py-2.5 text-zinc-300",
                )}
              >
                {!!message.attachments?.length && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    {message.attachments.map((attachment) => (
                      <span
                        key={attachment.id}
                        className="inline-flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-xs"
                      >
                        <FileText size={11} />
                        {attachment.title}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className="prose prose-invert prose-p:my-0 prose-p:text-[12.5px] prose-p:leading-[1.65] prose-strong:text-zinc-100 max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      marked.parse(message.content || "") as string,
                    ),
                  }}
                />
                {message.image && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
                    <NextImage
                      src={message.image.url}
                      alt={message.image.alt}
                      width={1024}
                      height={768}
                      unoptimized
                      className="w-full h-auto"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        activeFile &&
                        editorStore.insertImage(
                          activeFile.id,
                          message.image!.url,
                          message.image!.alt,
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-cyan-300 hover:bg-zinc-800"
                    >
                      <ImagePlus size={14} />
                      Insert in document
                    </button>
                  </div>
                )}
                {message.appendFileId &&
                  editorState.files.some(
                    (file) => file.id === message.appendFileId,
                  ) && (
                    <button
                      type="button"
                      onClick={() => {
                        const added = editorStore.appendText(
                          message.appendFileId!,
                          message.appendContent || message.content,
                        );
                        if (!added) editorStore.openFile(message.appendFileId!);
                      }}
                      className="mt-3 flex items-center gap-1.5 rounded-md border border-white/[0.08] px-2 py-1.5 text-[11px] text-zinc-400 transition hover:bg-white/[0.05] hover:text-zinc-200"
                    >
                      <FileText size={12} />
                      Add to page
                    </button>
                  )}
                {message.proposalFileId &&
                  editorState.files.find(
                    (file) => file.id === message.proposalFileId,
                  )?.pendingEdit && (
                    <div className="mt-3 flex gap-2 border-t border-zinc-800 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          editorStore.acceptChange(message.proposalFileId!)
                        }
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-emerald-500/10 py-2 text-xs text-emerald-400"
                      >
                        <Check size={12} />
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          editorStore.rejectChange(message.proposalFileId!)
                        }
                        className="flex-1 flex items-center justify-center gap-1 rounded bg-red-500/10 py-2 text-xs text-red-400"
                      >
                        <X size={12} />
                        Reject
                      </button>
                    </div>
                  )}
              </div>
            </article>
          ))}
          {isWorking && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <Sparkles size={13} className="animate-pulse" />
              Working
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>
      <div
        className={cn(
          "shrink-0 border-t border-white/[0.045] bg-[#111113]/95 pt-1.5 backdrop-blur-xl",
          isDragOver && "bg-white/[0.025]",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleContextDrop}
      >
        <div className="px-2 pb-2">
          {editorState.activeSelection && (
            <div className="mb-1.5 flex items-center gap-1.5 px-1">
              <div className="group flex min-w-0 max-w-full items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-[11px] text-zinc-400">
                <ScanEye size={12} className="shrink-0 text-zinc-500" />
                <span className="truncate">
                  Selected: {editorState.activeSelection.text.slice(0, 45)}
                </span>
                <button
                  type="button"
                  aria-label="Clear selection context"
                  onClick={() => editorStore.setSelection(null)}
                  className="ml-auto rounded-sm p-0.5 text-zinc-600 transition hover:bg-white/[0.08] hover:text-zinc-300"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          )}
          {!!attachments.length && (
            <div className="mb-1.5 flex flex-wrap gap-1 px-1">
              {attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="group inline-flex max-w-[220px] items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.035] px-2 py-1 text-[11px] text-zinc-400"
                >
                  <FileText size={11} />
                  {attachment.title}
                  <button
                    type="button"
                    aria-label={`Remove ${attachment.title}`}
                    onClick={() =>
                      setAttachments((items) =>
                        items.filter((item) => item.id !== attachment.id),
                      )
                    }
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
          {!messages.length && !input && !isWorking && (
            <div className="mb-1.5 flex flex-wrap gap-1 px-1">
              {starterPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void send(prompt)}
                  className="rounded-md px-2 py-1 text-[10.5px] text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-300"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}
          {pendingChanges > 0 && (
            <button
              type="button"
              onClick={() => editorStore.toggleRightSidebar()}
              className="group mb-1.5 flex h-8 w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.025] px-2.5 text-[11px] text-zinc-400 transition hover:border-white/[0.1] hover:bg-white/[0.045]"
            >
              <span>
                {pendingChanges}{" "}
                {pendingChanges === 1 ? "suggested edit" : "suggested edits"}
              </span>
              <span className="text-zinc-500 transition group-hover:text-zinc-200">
                Review
              </span>
            </button>
          )}
          <div className="relative overflow-hidden rounded-xl border border-white/[0.09] bg-[#18181b] shadow-[0_1px_2px_rgba(0,0,0,0.25),0_8px_30px_rgba(0,0,0,0.16)] transition focus-within:border-white/[0.15] focus-within:bg-[#1b1b1e]">
            <div className="flex items-start">
              <button
                type="button"
                aria-label="Attach a document"
                title="Attach a document"
                onClick={() => setShowPicker((value) => !value)}
                className="absolute bottom-3 right-11 z-10 flex h-7 w-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-white/[0.06] hover:text-zinc-300"
              >
                <Paperclip size={16} />
              </button>
              {showPicker && (
                <Select
                  onValueChange={(value) => {
                    const file = editorState.files.find(
                      (item) => item.id === value,
                    );
                    if (
                      file &&
                      !attachments.some((item) => item.id === file.id)
                    )
                      setAttachments((items) => [
                        ...items,
                        { id: file.id, title: file.title },
                      ]);
                    setShowPicker(false);
                  }}
                >
                  <SelectTrigger
                    aria-label="Choose a document to attach"
                    className="absolute bottom-10 left-2 z-20 max-w-[180px] border-white/[0.08] bg-[#1b1b1e] text-xs"
                  >
                    <SelectValue placeholder="Choose document" />
                  </SelectTrigger>
                  <SelectContent>
                    {editorState.files
                      .filter((file) => file.id !== activeFile?.id)
                      .map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
              <textarea
                ref={composerRef}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  const element = event.currentTarget;
                  element.style.height = "0px";
                  element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                rows={1}
                placeholder={
                  editorState.activeSelection
                    ? "Ask about the selected passage"
                    : "Ask Unix about your writing"
                }
                className="block min-h-[54px] max-h-44 w-full resize-none overflow-y-auto bg-transparent px-3.5 pb-10 pt-3 text-[13px] leading-[1.55] text-zinc-100 outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                aria-label="Send message"
                disabled={isWorking || (!input.trim() && !attachments.length)}
                onClick={() => void send()}
                className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-950 transition hover:bg-white disabled:cursor-default disabled:bg-white/[0.07] disabled:text-zinc-600"
              >
                <ArrowUp size={14} strokeWidth={2.4} />
              </button>
            </div>
            <div className="flex h-9 items-center gap-0.5 px-2 pb-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex h-7 items-center gap-1 rounded-md px-2 text-[11px] text-zinc-400 transition hover:bg-white/[0.06] hover:text-zinc-200"
                  >
                    {mode === "research" ? "Research" : "Ask"}
                    <ChevronDown size={13} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="border-white/[0.08] bg-[#1b1b1e] p-1 text-zinc-300 shadow-[0_16px_40px_rgba(0,0,0,0.4)]"
                >
                  <DropdownMenuItem onSelect={() => setMode("ask")}>
                    Ask
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setMode("research")}>
                    Research
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {!isOnline && (
            <p className="mt-2 text-[11px] text-amber-400">
              Offline: drafts save locally and will sync when you reconnect.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}
