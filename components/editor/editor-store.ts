"use client";

import { useSyncExternalStore } from "react";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import {
  createPage,
  deletePage,
  getPageContent,
  renameFolder,
  renamePage,
  saveDocument,
} from "@/app/workspace/actions";
import {
  EMPTY_DOCUMENT,
  documentToText,
  normalizeProse,
  normalizeDocument,
  textToDocument,
} from "@/lib/document";

export type SaveStatus =
  | "saved"
  | "saving"
  | "unsaved"
  | "offline"
  | "conflict"
  | "error";

export interface EditProposal {
  id: string;
  fileId: string;
  baseRevision: number;
  from: number;
  to: number;
  expectedText: string;
  replacementText: string;
  contextBefore: string;
  contextAfter: string;
  description?: string;
  kind: "selection" | "document";
}

export interface EditorFile {
  id: string;
  title: string;
  content: string;
  document: JSONContent;
  revision: number;
  isLoaded: boolean;
  isModified: boolean;
  saveStatus: SaveStatus;
  pendingEdit?: EditProposal | null;
  isReviewing?: boolean;
  originalContent?: string | null;
}

export interface EditorTab {
  id: string;
  fileId: string;
  title: string;
  isActive: boolean;
  isPinned: boolean;
}
export interface LayoutState {
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  leftSidebarVisible: boolean;
  rightSidebarVisible: boolean;
}
export interface EditorSelection {
  fileId: string;
  text: string;
  start: number;
  end: number;
  baseRevision: number;
  contextBefore: string;
  contextAfter: string;
}
export interface EditorState {
  files: EditorFile[];
  tabs: EditorTab[];
  activeTabId: string | null;
  layout: LayoutState;
  activeSelection: EditorSelection | null;
  workspaceId: string | null;
  userId: string | null;
  folderName: string;
}

const defaultLayout: LayoutState = {
  leftSidebarWidth: 260,
  rightSidebarWidth: 340,
  leftSidebarVisible: true,
  rightSidebarVisible: true,
};
let state: EditorState = {
  files: [],
  tabs: [],
  activeTabId: null,
  layout: defaultLayout,
  activeSelection: null,
  workspaceId: null,
  userId: null,
  folderName: "UNIX",
};
const listeners = new Set<() => void>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
const savesInFlight = new Set<string>();
let connectionListenersAttached = false;
const editorCommands = new Map<
  string,
  {
    apply: (proposal: EditProposal) => boolean;
    undo: () => boolean;
    redo: () => boolean;
    canUndo: () => boolean;
    canRedo: () => boolean;
    insertImage: (src: string, alt: string) => boolean;
  }
>();

function emit() {
  listeners.forEach((listener) => listener());
}
function patchFile(fileId: string, patch: Partial<EditorFile>) {
  state = {
    ...state,
    files: state.files.map((file) =>
      file.id === fileId ? { ...file, ...patch } : file,
    ),
  };
  emit();
}
function storageKey(id: string) {
  return `unix-document-${id}`;
}
function writeCache(file: EditorFile) {
  try {
    localStorage.setItem(
      storageKey(file.id),
      JSON.stringify({
        document: file.document,
        text: file.content,
        revision: file.revision,
      }),
    );
  } catch {
    /* storage is best effort */
  }
}

function scheduleSave(fileId: string) {
  const prior = saveTimers.get(fileId);
  if (prior) clearTimeout(prior);
  const timer = setTimeout(async () => {
    saveTimers.delete(fileId);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      patchFile(fileId, { saveStatus: "offline", isModified: true });
      return;
    }
    if (savesInFlight.has(fileId)) {
      scheduleSave(fileId);
      return;
    }
    const file = state.files.find((item) => item.id === fileId);
    if (!file) return;
    savesInFlight.add(fileId);
    const savedDocument = JSON.stringify(file.document);
    patchFile(fileId, { saveStatus: "saving" });
    try {
      const result = await saveDocument(fileId, {
        document: file.document,
        expectedRevision: file.revision,
      });
      const latest = state.files.find((item) => item.id === fileId);
      if (!latest) return;
      if (!result.ok) {
        patchFile(fileId, { saveStatus: "conflict" });
        toast.error("This document changed elsewhere", {
          description:
            "Your local draft is safe. Reload or copy it before resolving the conflict.",
        });
      } else {
        const unchangedSinceRequest =
          JSON.stringify(latest.document) === savedDocument;
        patchFile(fileId, {
          revision: result.revision,
          saveStatus: unchangedSinceRequest ? "saved" : "unsaved",
          isModified: !unchangedSinceRequest,
        });
      }
    } catch {
      patchFile(fileId, { saveStatus: "error", isModified: true });
      toast.error("Could not save", {
        description:
          "Your draft remains on this device and will be retried when the connection returns.",
      });
      window.setTimeout(() => {
        const pending = state.files.find((item) => item.id === fileId);
        if (
          pending?.isModified &&
          typeof navigator !== "undefined" &&
          navigator.onLine
        ) {
          patchFile(fileId, { saveStatus: "unsaved" });
          scheduleSave(fileId);
        }
      }, 5_000);
    } finally {
      savesInFlight.delete(fileId);
      const latest = state.files.find((item) => item.id === fileId);
      if (latest?.isModified && latest.saveStatus === "unsaved")
        scheduleSave(fileId);
    }
  }, 700);
  saveTimers.set(fileId, timer);
}

function attachConnectionListeners() {
  if (connectionListenersAttached || typeof window === "undefined") return;
  connectionListenersAttached = true;
  window.addEventListener("offline", () => {
    state.files
      .filter((file) => file.isModified)
      .forEach((file) => patchFile(file.id, { saveStatus: "offline" }));
  });
  window.addEventListener("online", () => {
    state.files
      .filter((file) => file.isModified)
      .forEach((file) => {
        patchFile(file.id, { saveStatus: "unsaved" });
        scheduleSave(file.id);
      });
  });
}

export const editorStore = {
  getState: () => state,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async initFromDatabase(
    folder: { id: string; name: string },
    pages: Array<{
      id: string;
      title: string;
      folder_id: string;
      revision?: number;
    }>,
    userId?: string,
  ) {
    attachConnectionListeners();
    const files: EditorFile[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      content: "",
      document: EMPTY_DOCUMENT,
      revision: page.revision || 1,
      isLoaded: false,
      isModified: false,
      saveStatus: "saved",
    }));
    const first = files[0];
    state = {
      files,
      workspaceId: folder.id,
      userId: userId || null,
      folderName: folder.name,
      activeSelection: null,
      layout: state.layout,
      tabs: first
        ? [
            {
              id: `tab-${first.id}`,
              fileId: first.id,
              title: first.title,
              isActive: true,
              isPinned: false,
            },
          ]
        : [],
      activeTabId: first ? `tab-${first.id}` : null,
    };
    emit();
    if (first) await this.loadFileContent(first.id);
  },

  initReadOnly(
    folder: { id: string; name: string },
    pages: Array<{
      id: string;
      title: string;
      revision: number;
      document: JSONContent;
      content: string;
    }>,
  ) {
    const files: EditorFile[] = pages.map((page) => ({
      id: page.id,
      title: page.title,
      content: page.content,
      document: normalizeDocument(page.document),
      revision: page.revision,
      isLoaded: true,
      isModified: false,
      saveStatus: "saved",
    }));
    const first = files[0];
    state = {
      files,
      workspaceId: folder.id,
      userId: null,
      folderName: folder.name,
      activeSelection: null,
      layout: state.layout,
      tabs: first
        ? [
            {
              id: `tab-${first.id}`,
              fileId: first.id,
              title: first.title,
              isActive: true,
              isPinned: false,
            },
          ]
        : [],
      activeTabId: first ? `tab-${first.id}` : null,
    };
    emit();
  },

  async loadFileContent(fileId: string) {
    const file = state.files.find((item) => item.id === fileId);
    if (!file || file.isLoaded) return;
    try {
      const row = await getPageContent(fileId);
      if (!row) throw new Error("Document not found");
      const document = normalizeDocument(row.document);
      patchFile(fileId, {
        document,
        content: row.text ?? documentToText(document),
        revision: row.revision,
        isLoaded: true,
        saveStatus: "saved",
      });
    } catch {
      try {
        const cached = JSON.parse(
          localStorage.getItem(storageKey(fileId)) || "null",
        );
        if (cached?.document) {
          patchFile(fileId, {
            document: normalizeDocument(cached.document),
            content: cached.text || documentToText(cached.document),
            revision: cached.revision || file.revision,
            isLoaded: true,
            saveStatus: "error",
          });
          return;
        }
      } catch {
        /* ignore corrupt cache */
      }
      toast.error("Unable to load document");
    }
  },

  async refreshFile(fileId: string) {
    const file = state.files.find((item) => item.id === fileId);
    if (
      !file ||
      !file.isLoaded ||
      file.isModified ||
      file.saveStatus === "saving"
    )
      return;
    try {
      const row = await getPageContent(fileId);
      if (row && row.revision > file.revision)
        patchFile(fileId, {
          document: normalizeDocument(row.document),
          content: row.text,
          revision: row.revision,
          saveStatus: "saved",
        });
    } catch {
      /* reconnect on the next poll */
    }
  },

  replaceLoadedFile(
    fileId: string,
    document: JSONContent,
    content: string,
    revision: number,
  ) {
    patchFile(fileId, {
      document: normalizeDocument(document),
      content,
      revision,
      isLoaded: true,
      isModified: false,
      saveStatus: "saved",
    });
  },

  updateFileDocument(fileId: string, document: JSONContent, text?: string) {
    const file = state.files.find((item) => item.id === fileId);
    if (!file) return;
    const normalized = normalizeDocument(document);
    const nextText = text ?? documentToText(normalized);
    const next = {
      ...file,
      document: normalized,
      content: nextText,
      isLoaded: true,
      isModified: true,
      saveStatus: "unsaved" as const,
    };
    patchFile(fileId, next);
    writeCache(next);
    scheduleSave(fileId);
  },

  updateFileContent(fileId: string, content: string) {
    this.updateFileDocument(fileId, textToDocument(content), content);
  },
  setSelection(selection: EditorSelection | null) {
    state = { ...state, activeSelection: selection };
    emit();
  },
  registerEditor(
    fileId: string,
    commands: typeof editorCommands extends Map<string, infer V> ? V : never,
  ) {
    editorCommands.set(fileId, commands);
    return () => {
      editorCommands.delete(fileId);
    };
  },

  proposeSelectionEdit(
    fileId: string,
    replacementText: string,
    description?: string,
  ) {
    const file = state.files.find((item) => item.id === fileId);
    const selection = state.activeSelection;
    if (!file || !selection || selection.fileId !== fileId || !selection.text)
      return false;
    const proposal: EditProposal = {
      id: crypto.randomUUID(),
      fileId,
      baseRevision: selection.baseRevision,
      from: selection.start,
      to: selection.end,
      expectedText: selection.text,
      replacementText,
      contextBefore: selection.contextBefore,
      contextAfter: selection.contextAfter,
      description,
      kind: "selection",
    };
    patchFile(fileId, {
      pendingEdit: proposal,
      isReviewing: true,
      originalContent: file.content,
    });
    return true;
  },

  proposeStoredEdit(proposal: EditProposal) {
    const file = state.files.find((item) => item.id === proposal.fileId);
    if (!file) return false;
    patchFile(proposal.fileId, {
      pendingEdit: proposal,
      isReviewing: true,
      originalContent: file.content,
    });
    return true;
  },

  proposeUpdate(fileId: string, newContent: string) {
    const selection = state.activeSelection;
    if (selection?.fileId === fileId)
      return this.proposeSelectionEdit(
        fileId,
        newContent,
        "Rewrite selected passage",
      );
    toast.info("Select the passage to rewrite", {
      description:
        "Whole-document AI rewrites are disabled to protect formatting.",
    });
    return false;
  },

  replaceText(fileId: string, targetText: string, replacementText: string) {
    const selection = state.activeSelection;
    if (
      !selection ||
      selection.fileId !== fileId ||
      selection.text !== targetText
    ) {
      toast.error("The selected passage changed", {
        description: "Select it again before creating the edit proposal.",
      });
      return false;
    }
    return this.proposeSelectionEdit(
      fileId,
      replacementText,
      "Replace selected passage",
    );
  },

  searchAndReplace(..._arguments: [string?, string?, ("file" | "workspace")?]) {
    void _arguments;
    toast.info(
      "Use Find for manual replacements. AI bulk replacement requires individual review.",
    );
  },
  acceptChange(fileId: string) {
    const file = state.files.find((item) => item.id === fileId);
    if (!file?.pendingEdit) return false;
    if (file.revision !== file.pendingEdit.baseRevision) {
      patchFile(fileId, { saveStatus: "conflict" });
      toast.error("Suggestion is stale", {
        description: "The document changed after this suggestion was created.",
      });
      return false;
    }
    const applied =
      editorCommands.get(fileId)?.apply(file.pendingEdit) || false;
    if (!applied) toast.error("Could not apply this suggestion safely");
    return applied;
  },
  rejectChange(fileId: string) {
    patchFile(fileId, {
      pendingEdit: null,
      isReviewing: false,
      originalContent: null,
    });
    return true;
  },
  acceptAllReviews() {
    state.files
      .filter((file) => file.pendingEdit)
      .forEach((file) => this.acceptChange(file.id));
  },
  rejectAllReviews() {
    state.files
      .filter((file) => file.pendingEdit)
      .forEach((file) => this.rejectChange(file.id));
  },
  getReviewingFilesCount: () =>
    state.files.filter((file) => file.pendingEdit).length,
  insertImage(fileId: string, src: string, alt: string) {
    return editorCommands.get(fileId)?.insertImage(src, alt) || false;
  },
  proposeDocumentAppend(fileId: string, text: string, description?: string) {
    const file = state.files.find((item) => item.id === fileId);
    const normalizedText = normalizeProse(text);
    if (!file || !normalizedText) return false;
    patchFile(fileId, {
      pendingEdit: {
        id: crypto.randomUUID(),
        fileId,
        baseRevision: file.revision,
        from: 0,
        to: 0,
        expectedText: "",
        replacementText: normalizedText,
        contextBefore: file.content.slice(-1000),
        contextAfter: "",
        description: description || "Append AI draft",
        kind: "document",
      },
      isReviewing: true,
      originalContent: file.content,
    });
    return true;
  },
  proposalApplied(fileId: string, document: JSONContent, text: string) {
    patchFile(fileId, {
      pendingEdit: null,
      isReviewing: false,
      originalContent: null,
    });
    this.updateFileDocument(fileId, document, text);
  },

  openFile(fileId: string) {
    const file = state.files.find((item) => item.id === fileId);
    if (!file) return;
    const existing = state.tabs.find((tab) => tab.fileId === fileId);
    const tabId = existing?.id || `tab-${fileId}`;
    const tabs = existing
      ? state.tabs
      : [
          ...state.tabs,
          {
            id: tabId,
            fileId,
            title: file.title,
            isActive: false,
            isPinned: false,
          },
        ];
    state = {
      ...state,
      tabs: tabs.map((tab) => ({ ...tab, isActive: tab.id === tabId })),
      activeTabId: tabId,
      activeSelection: null,
    };
    emit();
    void this.loadFileContent(fileId);
  },
  closeTab(tabId: string) {
    const index = state.tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    const tabs = state.tabs.filter((tab) => tab.id !== tabId);
    const active =
      state.activeTabId === tabId
        ? tabs[Math.min(index, tabs.length - 1)]?.id || null
        : state.activeTabId;
    state = {
      ...state,
      tabs: tabs.map((tab) => ({ ...tab, isActive: tab.id === active })),
      activeTabId: active,
      activeSelection: null,
    };
    emit();
  },
  setActiveTab(tabId: string) {
    const tab = state.tabs.find((item) => item.id === tabId);
    if (tab) this.openFile(tab.fileId);
  },
  reorderTabs(from: number, to: number) {
    const tabs = [...state.tabs];
    const [moved] = tabs.splice(from, 1);
    tabs.splice(to, 0, moved);
    state = { ...state, tabs };
    emit();
  },
  undo(fileId: string) {
    editorCommands.get(fileId)?.undo();
  },
  redo(fileId: string) {
    editorCommands.get(fileId)?.redo();
  },
  getHistoryInfo(fileId: string) {
    const commands = editorCommands.get(fileId);
    return {
      canUndo: commands?.canUndo() || false,
      canRedo: commands?.canRedo() || false,
      undoCount: 0,
      redoCount: 0,
    };
  },

  async renameFile(fileId: string, title: string) {
    await renamePage(fileId, title);
    state = {
      ...state,
      files: state.files.map((f) => (f.id === fileId ? { ...f, title } : f)),
      tabs: state.tabs.map((t) => (t.fileId === fileId ? { ...t, title } : t)),
    };
    emit();
  },
  async createFile(title: string) {
    if (!state.workspaceId) return;
    const page = await createPage(state.workspaceId, title);
    const file: EditorFile = {
      id: page.id,
      title: page.title,
      content: "",
      document: EMPTY_DOCUMENT,
      revision: page.revision,
      isLoaded: true,
      isModified: false,
      saveStatus: "saved",
    };
    state = { ...state, files: [...state.files, file] };
    emit();
    this.openFile(file.id);
    return file;
  },
  async deleteFile(fileId: string) {
    await deletePage(fileId);
    state.tabs
      .filter((tab) => tab.fileId === fileId)
      .forEach((tab) => this.closeTab(tab.id));
    state = {
      ...state,
      files: state.files.filter((file) => file.id !== fileId),
    };
    emit();
  },
  async renameWorkspace(name: string) {
    if (!state.workspaceId) return;
    await renameFolder(state.workspaceId, name);
    state = { ...state, folderName: name };
    emit();
  },

  toggleLeftSidebar() {
    state = {
      ...state,
      layout: {
        ...state.layout,
        leftSidebarVisible: !state.layout.leftSidebarVisible,
      },
    };
    emit();
  },
  toggleRightSidebar() {
    state = {
      ...state,
      layout: {
        ...state.layout,
        rightSidebarVisible: !state.layout.rightSidebarVisible,
      },
    };
    emit();
  },
  setLeftSidebar(value: boolean) {
    state = {
      ...state,
      layout: { ...state.layout, leftSidebarVisible: value },
    };
    emit();
  },
  setRightSidebar(value: boolean) {
    state = {
      ...state,
      layout: { ...state.layout, rightSidebarVisible: value },
    };
    emit();
  },
  setLeftSidebarWidth(value: number) {
    state = { ...state, layout: { ...state.layout, leftSidebarWidth: value } };
    emit();
  },
  setRightSidebarWidth(value: number) {
    state = { ...state, layout: { ...state.layout, rightSidebarWidth: value } };
    emit();
  },
};

export function useEditorState() {
  return useSyncExternalStore(
    editorStore.subscribe,
    editorStore.getState,
    editorStore.getState,
  );
}
export function useActiveFile() {
  const current = useEditorState();
  const tab = current.tabs.find((item) => item.id === current.activeTabId);
  return tab
    ? current.files.find((file) => file.id === tab.fileId) || null
    : null;
}
