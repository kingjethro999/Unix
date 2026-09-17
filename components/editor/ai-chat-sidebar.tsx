"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  History,
  FileText,
  ImagePlus,
  MessageSquare,
  ScanEye,
  Send,
  Sparkles,
  X,
  Paperclip,
  Plus,
  MoreHorizontal,
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
  const [conversationName, setConversationName] = useState("New conversation");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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

  async function loadConversation(id: string | null) {
    if (!editorState.workspaceId) return;
    const params = new URLSearchParams({
      workspaceId: editorState.workspaceId,
    });
    if (id) params.set("conversationId", id);
    const response = await fetch(`/api/ai/chat?${params.toString()}`);
    if (!response.ok) return;
    const data = await response.json();
    setConversations(data.conversations || []);
    hydrateMessages(data);
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
    void loadConversation(null).catch(() => {
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
    const rename = content.match(
      /^(?:please\s+)?rename(?:\s+(?:this|the))?\s+(?:page|document)(?:\s+to)?\s+(.+)$/i,
    );
    if (rename && activeFile) {
      const title = rename[1].trim().replace(/["“”]/g, "");
      if (title && !/for me$/i.test(title)) {
        await editorStore.renameFile(activeFile.id, title);
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
      if (activeFile && !contextFiles.some((file) => file.id === activeFile.id))
        contextFiles.push({
          id: activeFile.id,
          title: activeFile.title,
          content: activeFile.content,
        });
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
          capability: /^(research\s*:|find sources|look up|research\b)/i.test(
            content,
          )
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
        void loadConversation(null);
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
            content: data.text,
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

  return (
    <div className="h-full flex flex-col border-l border-zinc-800/70 bg-zinc-950">
      <header className="flex h-10 shrink-0 items-center border-b border-zinc-800/70 px-3">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200">
          {conversationName}
        </span>
        <div className="flex items-center gap-0.5 text-zinc-500">
          <button
            type="button"
            title="New conversation"
            aria-label="New conversation"
            onClick={() => {
              setMessages([]);
              setConversationId(null);
              setConversationName("New conversation");
              setInput("");
            }}
            className="rounded p-1.5 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <Plus size={15} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Conversation history"
                aria-label="Conversation history"
                className="rounded p-1.5 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <History size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-64 border-zinc-700 bg-zinc-900"
            >
              <DropdownMenuItem
                onSelect={() => {
                  setMessages([]);
                  setConversationId(null);
                  setConversationName("New conversation");
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
                className="rounded p-1.5 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 border-zinc-700 bg-zinc-900"
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
      <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
        {!messages.length && (
          <div className="py-10 text-center text-zinc-500">
            <MessageSquare size={22} className="mx-auto mb-3" />
            <p className="text-sm">
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
                "max-w-full text-sm",
                message.role === "user" &&
                  "max-w-[88%] rounded-xl bg-cyan-700 px-3 py-2 text-white",
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
                className="prose prose-invert prose-p:my-1 prose-p:text-sm max-w-none"
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
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Sparkles size={13} className="animate-pulse" />
            Working
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div
        className={cn(
          "border-t border-zinc-800/50 px-5 py-4",
          isDragOver && "bg-cyan-500/5",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleContextDrop}
      >
        {editorState.activeSelection && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-3 py-2">
            <ScanEye size={12} className="text-cyan-400" />
            <span className="truncate text-xs text-cyan-300">
              Selected: {editorState.activeSelection.text.slice(0, 45)}
            </span>
            <button
              type="button"
              aria-label="Clear selection context"
              onClick={() => editorStore.setSelection(null)}
              className="ml-auto"
            >
              <X size={12} />
            </button>
          </div>
        )}
        {!!attachments.length && (
          <div className="mb-2 flex flex-wrap gap-1">
            {attachments.map((attachment) => (
              <span
                key={attachment.id}
                className="inline-flex items-center gap-1 rounded-full bg-cyan-500/10 px-2 py-1 text-xs text-cyan-300"
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
          <div className="mb-2 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void send(prompt)}
                className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[11px] text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}
        {editorStore.getReviewingFilesCount() > 0 && (
          <button
            type="button"
            onClick={() => editorStore.toggleRightSidebar()}
            className="mb-2 flex w-full items-center justify-between rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-700"
          >
            <span>Review pending changes</span>
            <span className="rounded bg-cyan-500/15 px-1.5 py-0.5 text-cyan-300">
              {editorStore.getReviewingFilesCount()}
            </span>
          </button>
        )}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-sm">
          <div className="flex items-end gap-2">
            <button
              type="button"
              aria-label="Attach a document"
              title="Attach a document"
              onClick={() => setShowPicker((value) => !value)}
              className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-cyan-300"
            >
              <Paperclip size={16} />
            </button>
            {showPicker && (
              <Select
                onValueChange={(value) => {
                  const file = editorState.files.find(
                    (item) => item.id === value,
                  );
                  if (file && !attachments.some((item) => item.id === file.id))
                    setAttachments((items) => [
                      ...items,
                      { id: file.id, title: file.title },
                    ]);
                  setShowPicker(false);
                }}
              >
                <SelectTrigger
                  aria-label="Choose a document to attach"
                  className="max-w-[150px]"
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
              className="min-h-[38px] max-h-[180px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-zinc-200 outline-none"
            />
            <button
              type="button"
              aria-label="Send message"
              disabled={isWorking || (!input.trim() && !attachments.length)}
              onClick={() => void send()}
              className="rounded-lg bg-cyan-600 p-2.5 text-white disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
        {!isOnline && (
          <p className="mt-2 text-[11px] text-amber-400">
            Offline: drafts save locally and will sync when you reconnect.
          </p>
        )}
        <p className="mt-2 px-1 text-[10px] text-zinc-600">
          Attach context or drop a document here. Enter sends · Shift+Enter adds
          a line.
        </p>
      </div>
    </div>
  );
}
