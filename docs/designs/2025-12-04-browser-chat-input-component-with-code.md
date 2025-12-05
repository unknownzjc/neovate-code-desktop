# Browser ChatInput Component

**Date:** 2025-12-04

## Context

Implement a feature-rich ChatInput component for a browser-based application, porting functionality from a CLI-based React (Ink) implementation. The component needs to support file suggestions, slash commands, keyboard shortcuts, history navigation, special modes, and paste handling.

**Features required:**

1. `@` to suggest files
2. `/` to suggest slash commands
3. `Ctrl+A/E/D/F/K/U/W/H/T/N/P/B` for cursor navigation and editing
4. Up/Down for history navigation
5. `Option+Up` to edit queued messages
6. `#` for memory mode, `!` for bash mode
7. `Shift+Tab` to toggle plan/brainstorm mode
8. `Tab` to trigger file suggestions
9. Text and image paste handling
10. Double `Escape` to show fork modal
11. Single `Escape` to cancel

## Discussion

### Suggestion UI Style

**Decision:** Floating dropdown positioned below the cursor (VS Code style autocomplete).

### History Navigation Activation

**Decision:** Up arrow navigates history only when cursor is at position 0; down only when cursor is at end of input.

### Special Mode Prefixes

**Decision:** Prefix-only trigger - `#` or `!` must be the first character to activate memory/bash mode. Visual indicator shows active mode.

### Image Paste Handling

**Decision:** Inline preview - show small thumbnail below textarea with remove button; image sent alongside text.

### Dropdown Keyboard Navigation

**Decision:** Arrow keys hijack - when dropdown is open, up/down select items. Tab/Enter to confirm, Escape to close.

### State Management

**Decision:** Zustand store - shared across components, persists between mounts.

## Approach

Use a hook-based composition pattern with a Zustand store for state management. The main component orchestrates multiple specialized hooks, each handling a specific concern (suggestions, history, paste, etc.). The textarea uses native browser events (`onKeyDown`, `onPaste`, `onChange`) instead of terminal-specific input handling.

## Architecture

### File Structure

```
src/
├── components/
│   └── ChatInput/
│       ├── ChatInput.tsx           # Main component
│       ├── SuggestionDropdown.tsx  # Floating dropdown UI
│       └── ImagePreview.tsx        # Thumbnail preview row
├── hooks/
│   ├── useInputState.ts            # Zustand-based state
│   ├── useInputHandlers.ts         # Keyboard orchestrator
│   ├── useFileSuggestion.ts        # @ and tab file suggestions
│   ├── useSlashCommands.ts         # / command suggestions
│   ├── useListNavigation.ts        # Shared navigation logic
│   ├── usePasteManager.ts          # Text paste handling
│   ├── useImagePasteManager.ts     # Image paste handling
│   └── useDoublePress.ts           # Double-key detection (escape)
└── store/
    └── inputStore.ts               # Zustand store slice
```

### Component Hierarchy

```
ChatInput (component)
├── useInputState           (state management)
├── useInputHandlers        (orchestrates all handlers)
│   ├── useFileSuggestion   (@ and tab file suggestions)
│   ├── useSlashCommands    (/ commands)
│   ├── useHistoryNavigation (up/down history)
│   └── useSpecialModes     (# memory, ! bash)
├── usePasteManager         (text paste)
├── useImagePasteManager    (image paste)
└── SuggestionDropdown      (floating UI component)
```

### Keyboard Mappings

| Key              | Condition             | Action                      |
| ---------------- | --------------------- | --------------------------- |
| `@`              | typing                | trigger file suggestions    |
| `/`              | at position 0         | trigger slash commands      |
| `Tab`            | no suggestions open   | trigger file suggestions    |
| `Tab`            | suggestions open      | apply selected suggestion   |
| `Shift+Tab`      | any                   | toggle plan/brainstorm mode |
| `↑`              | cursor at line 1      | history previous            |
| `↓`              | cursor at last line   | history next                |
| `↑/↓`            | suggestions open      | navigate suggestions        |
| `Option+↑`       | any                   | edit queued message         |
| `Ctrl+A`         | any                   | cursor to line start        |
| `Ctrl+E`         | any                   | cursor to line end          |
| `Ctrl+D`         | empty input           | no-op (browser closes tab)  |
| `Ctrl+D`         | has input             | delete forward              |
| `Ctrl+F`         | any                   | cursor right                |
| `Ctrl+B`         | any                   | cursor left                 |
| `Ctrl+K`         | any                   | delete to line end          |
| `Ctrl+U`         | any                   | delete to line start        |
| `Ctrl+W`         | any                   | delete word before          |
| `Ctrl+H`         | any                   | backspace                   |
| `Ctrl+T`         | any                   | toggle thinking mode        |
| `Ctrl+N`         | any                   | same as ↓                   |
| `Ctrl+P`         | any                   | same as ↑                   |
| `Meta+B`         | any                   | previous word               |
| `Meta+F`         | any                   | next word                   |
| `Meta+D`         | any                   | delete word after           |
| `Meta+Backspace` | any                   | delete word before          |
| `Escape`         | single                | cancel/clear mode           |
| `Escape`         | double (within 500ms) | show fork modal             |
| `Enter`          | suggestions open      | apply selected              |
| `Enter`          | no suggestions        | submit                      |
| `Meta+Enter`     | any                   | insert newline              |

---

## Implementation Code

### 1. Store (store/inputStore.ts)

```typescript
import { create } from "zustand";

export type InputMode = "prompt" | "bash" | "memory";
export type PlanMode = "plan" | "brainstorm";

interface InputState {
  value: string;
  cursorPosition: number;
  historyIndex: number | null;
  draftInput: string;
  history: string[];
  queuedMessages: string[];
  planMode: PlanMode;
  thinkingEnabled: boolean;
  pastedTextMap: Record<string, string>;
  pastedImageMap: Record<string, string>;
}

interface InputActions {
  setValue: (value: string) => void;
  setCursorPosition: (pos: number) => void;
  setHistoryIndex: (index: number | null) => void;
  setDraftInput: (input: string) => void;
  addToHistory: (input: string) => void;
  clearQueue: () => void;
  togglePlanMode: () => void;
  toggleThinking: () => void;
  setPastedTextMap: (map: Record<string, string>) => void;
  setPastedImageMap: (map: Record<string, string>) => void;
  reset: () => void;
}

export const useInputStore = create<InputState & InputActions>((set) => ({
  value: "",
  cursorPosition: 0,
  historyIndex: null,
  draftInput: "",
  history: [],
  queuedMessages: [],
  planMode: "plan",
  thinkingEnabled: false,
  pastedTextMap: {},
  pastedImageMap: {},

  setValue: (value) => set({ value }),
  setCursorPosition: (cursorPosition) => set({ cursorPosition }),
  setHistoryIndex: (historyIndex) => set({ historyIndex }),
  setDraftInput: (draftInput) => set({ draftInput }),
  addToHistory: (input) =>
    set((state) => ({ history: [...state.history, input] })),
  clearQueue: () => set({ queuedMessages: [] }),
  togglePlanMode: () =>
    set((state) => ({
      planMode: state.planMode === "plan" ? "brainstorm" : "plan",
    })),
  toggleThinking: () =>
    set((state) => ({ thinkingEnabled: !state.thinkingEnabled })),
  setPastedTextMap: (pastedTextMap) => set({ pastedTextMap }),
  setPastedImageMap: (pastedImageMap) => set({ pastedImageMap }),
  reset: () =>
    set({
      value: "",
      cursorPosition: 0,
      historyIndex: null,
      draftInput: "",
    }),
}));

export function getInputMode(value: string): InputMode {
  if (value.startsWith("!")) return "bash";
  if (value.startsWith("#")) return "memory";
  return "prompt";
}
```

### 2. useInputState (hooks/useInputState.ts)

```typescript
import { useCallback } from "react";
import {
  useInputStore,
  getInputMode,
  type InputMode,
} from "../store/inputStore";

export interface InputState {
  value: string;
  cursorPosition: number;
  mode: InputMode;
}

export function useInputState() {
  const {
    value,
    cursorPosition,
    setValue: setStoreValue,
    setCursorPosition: setStoreCursorPosition,
    reset: storeReset,
  } = useInputStore();

  const state: InputState = {
    value,
    cursorPosition,
    mode: getInputMode(value),
  };

  const setValue = useCallback(
    (newValue: string) => {
      setStoreValue(newValue);
    },
    [setStoreValue]
  );

  const setCursorPosition = useCallback(
    (pos: number) => {
      setStoreCursorPosition(pos);
    },
    [setStoreCursorPosition]
  );

  const reset = useCallback(() => {
    storeReset();
  }, [storeReset]);

  return {
    state,
    setValue,
    setCursorPosition,
    reset,
  };
}
```

### 3. useListNavigation (hooks/useListNavigation.ts)

```typescript
import { useState, useCallback, useEffect } from "react";

export function useListNavigation<T>(items: T[]) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (selectedIndex >= items.length) {
      setSelectedIndex(Math.max(0, items.length - 1));
    }
  }, [items.length, selectedIndex]);

  const navigateNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const navigatePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const reset = useCallback(() => {
    setSelectedIndex(0);
  }, []);

  const getSelected = useCallback(() => {
    return items[selectedIndex] ?? null;
  }, [items, selectedIndex]);

  return {
    selectedIndex,
    setSelectedIndex,
    navigateNext,
    navigatePrevious,
    reset,
    getSelected,
  };
}
```

### 4. useDoublePress (hooks/useDoublePress.ts)

```typescript
import { useRef, useCallback } from "react";

export function useDoublePress(
  onDouble: () => void,
  onSingle?: () => void,
  timeout: number = 500
) {
  const lastPressRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handlePress = useCallback(() => {
    const now = Date.now();
    const lastPress = lastPressRef.current;

    if (lastPress && now - lastPress < timeout) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      lastPressRef.current = null;
      onDouble();
    } else {
      lastPressRef.current = now;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastPressRef.current = null;
        timeoutRef.current = null;
        onSingle?.();
      }, timeout);
    }
  }, [onDouble, onSingle, timeout]);

  return handlePress;
}
```

### 5. useFileSuggestion (hooks/useFileSuggestion.ts)

```typescript
import { useState, useMemo, useCallback, useEffect } from "react";
import { useListNavigation } from "./useListNavigation";

type TriggerType = "at" | "tab" | null;

interface MatchResult {
  hasQuery: boolean;
  fullMatch: string;
  query: string;
  startIndex: number;
  triggerType: TriggerType;
}

interface UseFileSuggestionProps {
  value: string;
  cursorPosition: number;
  forceTabTrigger: boolean;
  fetchPaths: () => Promise<string[]>;
}

export function useFileSuggestion({
  value,
  cursorPosition,
  forceTabTrigger,
  fetchPaths,
}: UseFileSuggestionProps) {
  const [paths, setPaths] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const atMatch = useMemo((): MatchResult => {
    const beforeCursor = value.substring(0, cursorPosition);
    const atMatches = [
      ...beforeCursor.matchAll(/(?:^|\s)(@(?:"[^"]*"|[^\s]*))/g),
    ];
    const lastMatch = atMatches[atMatches.length - 1];

    if (!lastMatch) {
      return {
        hasQuery: false,
        fullMatch: "",
        query: "",
        startIndex: -1,
        triggerType: null,
      };
    }

    const fullMatch = lastMatch[1];
    let query = fullMatch.slice(1);
    if (query.startsWith('"')) {
      query = query.slice(1).replace(/"$/, "");
    }
    const startIndex =
      lastMatch.index! + (lastMatch[0].length - fullMatch.length);

    return { hasQuery: true, fullMatch, query, startIndex, triggerType: "at" };
  }, [value, cursorPosition]);

  const tabMatch = useMemo((): MatchResult => {
    if (!forceTabTrigger) {
      return {
        hasQuery: false,
        fullMatch: "",
        query: "",
        startIndex: -1,
        triggerType: null,
      };
    }

    const beforeCursor = value.substring(0, cursorPosition);
    const wordMatch = beforeCursor.match(/([^\s]*)$/);

    if (!wordMatch || !wordMatch[1] || beforeCursor.match(/@[^\s]*$/)) {
      return {
        hasQuery: false,
        fullMatch: "",
        query: "",
        startIndex: -1,
        triggerType: null,
      };
    }

    const currentWord = wordMatch[1];
    return {
      hasQuery: true,
      fullMatch: currentWord,
      query: currentWord,
      startIndex: beforeCursor.length - currentWord.length,
      triggerType: "tab",
    };
  }, [value, cursorPosition, forceTabTrigger]);

  const activeMatch = atMatch.hasQuery ? atMatch : tabMatch;

  const matchedPaths = useMemo(() => {
    if (!activeMatch.hasQuery) return [];
    if (activeMatch.query === "") return paths;
    return paths.filter((p) =>
      p.toLowerCase().includes(activeMatch.query.toLowerCase())
    );
  }, [paths, activeMatch]);

  const navigation = useListNavigation(matchedPaths);

  useEffect(() => {
    if (activeMatch.hasQuery && paths.length === 0) {
      setIsLoading(true);
      fetchPaths()
        .then(setPaths)
        .finally(() => setIsLoading(false));
    }
  }, [activeMatch.hasQuery, paths.length, fetchPaths]);

  const getSelected = useCallback(() => {
    const selected = navigation.getSelected();
    if (!selected) return "";
    return selected.includes(" ") ? `"${selected}"` : selected;
  }, [navigation]);

  return {
    matchedPaths,
    isLoading,
    selectedIndex: navigation.selectedIndex,
    startIndex: activeMatch.startIndex,
    fullMatch: activeMatch.fullMatch,
    triggerType: activeMatch.triggerType,
    navigateNext: navigation.navigateNext,
    navigatePrevious: navigation.navigatePrevious,
    reset: navigation.reset,
    getSelected,
  };
}
```

### 6. useSlashCommands (hooks/useSlashCommands.ts)

```typescript
import { useState, useMemo, useEffect, useCallback } from "react";
import { useListNavigation } from "./useListNavigation";

export interface SlashCommand {
  name: string;
  description: string;
}

interface UseSlashCommandsProps {
  value: string;
  fetchCommands: () => Promise<SlashCommand[]>;
}

export function useSlashCommands({
  value,
  fetchCommands,
}: UseSlashCommandsProps) {
  const [commands, setCommands] = useState<SlashCommand[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const suggestions = useMemo(() => {
    if (!value.startsWith("/")) return [];
    const prefix = value.slice(1).toLowerCase().trim();
    if (prefix === "") return commands;

    return commands
      .filter(
        (cmd) =>
          cmd.name.toLowerCase().startsWith(prefix) ||
          cmd.description.toLowerCase().includes(prefix)
      )
      .sort((a, b) => {
        const aMatch = a.name.toLowerCase().startsWith(prefix);
        const bMatch = b.name.toLowerCase().startsWith(prefix);
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });
  }, [value, commands]);

  const navigation = useListNavigation(suggestions);

  useEffect(() => {
    if (value === "/" && commands.length === 0) {
      setIsLoading(true);
      fetchCommands()
        .then(setCommands)
        .finally(() => setIsLoading(false));
    }
  }, [value, commands.length, fetchCommands]);

  const getCompletedCommand = useCallback(() => {
    const selected = navigation.getSelected();
    if (!selected) return value;
    const args = value.includes(" ") ? value.split(" ").slice(1).join(" ") : "";
    return `/${selected.name} ${args}`.trim() + " ";
  }, [value, navigation]);

  return {
    suggestions,
    selectedIndex: navigation.selectedIndex,
    isLoading,
    navigateNext: navigation.navigateNext,
    navigatePrevious: navigation.navigatePrevious,
    reset: navigation.reset,
    getSelected: navigation.getSelected,
    getCompletedCommand,
  };
}
```

### 7. usePasteManager (hooks/usePasteManager.ts)

```typescript
import { useCallback, useRef } from "react";
import { useInputStore } from "../store/inputStore";

export interface PasteResult {
  success: boolean;
  pasteId?: string;
  prompt?: string;
}

function getPastedTextPrompt(text: string, pasteId: string): string {
  const lineCount = text.split(/\r\n|\r|\n/).length;
  return `[Pasted text ${pasteId} ${lineCount} lines]`;
}

export function usePasteManager() {
  const { pastedTextMap, setPastedTextMap } = useInputStore();
  const counterRef = useRef(0);

  const generatePasteId = useCallback(() => `#${++counterRef.current}`, []);

  const handleTextPaste = useCallback(
    async (rawText: string): Promise<PasteResult> => {
      const text = rawText.trim();
      if (!text) return { success: false };

      const pasteId = generatePasteId();
      setPastedTextMap({ ...pastedTextMap, [pasteId]: text });

      return {
        success: true,
        pasteId,
        prompt: getPastedTextPrompt(text, pasteId),
      };
    },
    [generatePasteId, pastedTextMap, setPastedTextMap]
  );

  const getPastedText = useCallback(
    (pasteId: string) => pastedTextMap[pasteId],
    [pastedTextMap]
  );

  const expandPastedText = useCallback(
    (message: string): string => {
      let expanded = message;
      const regex = /\[Pasted text (#\d+) \d+ lines\]/g;
      const matches = [...message.matchAll(regex)];

      for (const match of matches) {
        const pasteId = match[1];
        const content = getPastedText(pasteId);
        if (content) {
          expanded = expanded.replace(match[0], content);
        }
      }

      return expanded;
    },
    [getPastedText]
  );

  return {
    handleTextPaste,
    getPastedText,
    expandPastedText,
  };
}
```

### 8. useImagePasteManager (hooks/useImagePasteManager.ts)

```typescript
import { useCallback, useRef } from "react";
import { useInputStore } from "../store/inputStore";

export interface ImagePasteResult {
  success: boolean;
  imageId?: string;
  prompt?: string;
  dimensions?: { width: number; height: number };
}

function getImageDimensions(
  base64: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 100, height: 100 });
    img.src = base64;
  });
}

function truncateFilename(filename: string, maxLength = 20): string {
  if (filename.length <= maxLength) return filename;
  const ext = filename.split(".").pop() || "";
  const name = filename.substring(0, filename.lastIndexOf("."));
  const availableLength = maxLength - ext.length - 4;
  const prefixLen = Math.ceil(availableLength / 2);
  const suffixLen = Math.floor(availableLength / 2);
  return `${name.substring(0, prefixLen)}...${name.slice(-suffixLen)}.${ext}`;
}

export function useImagePasteManager() {
  const { pastedImageMap, setPastedImageMap } = useInputStore();
  const counterRef = useRef(0);

  const generateImageId = useCallback(() => `#${++counterRef.current}`, []);

  const handleImagePaste = useCallback(
    async (file: File): Promise<ImagePasteResult> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          const imageId = generateImageId();
          const dimensions = await getImageDimensions(base64);
          const filename = truncateFilename(file.name || "image.png");

          setPastedImageMap({ ...pastedImageMap, [imageId]: base64 });

          resolve({
            success: true,
            imageId,
            dimensions,
            prompt: `[Image ${dimensions.width}X${dimensions.height} ${filename}${imageId}]`,
          });
        };
        reader.onerror = () => resolve({ success: false });
        reader.readAsDataURL(file);
      });
    },
    [generateImageId, pastedImageMap, setPastedImageMap]
  );

  const getPastedImage = useCallback(
    (imageId: string) => pastedImageMap[imageId],
    [pastedImageMap]
  );

  const removePastedImage = useCallback(
    (imageId: string) => {
      const newMap = { ...pastedImageMap };
      delete newMap[imageId];
      setPastedImageMap(newMap);
    },
    [pastedImageMap, setPastedImageMap]
  );

  const expandImageReferences = useCallback(
    (message: string): { expandedMessage: string; images: string[] } => {
      const images: string[] = [];
      let expandedMessage = message;
      const regex = /\[Image \d+X\d+ [^\]]+#(\d+)\]/g;
      const matches = [...message.matchAll(regex)];

      for (const match of matches) {
        const imageId = `#${match[1]}`;
        const imageData = getPastedImage(imageId);
        if (imageData) {
          images.push(imageData);
          expandedMessage = expandedMessage.replace(match[0], "").trim();
        }
      }

      return { expandedMessage, images };
    },
    [getPastedImage]
  );

  return {
    pastedImageMap,
    handleImagePaste,
    getPastedImage,
    removePastedImage,
    expandImageReferences,
  };
}
```

### 9. useInputHandlers (hooks/useInputHandlers.ts)

```typescript
import { useCallback, useState, useRef } from "react";
import { useInputStore, getInputMode } from "../store/inputStore";
import { useInputState } from "./useInputState";
import { useFileSuggestion } from "./useFileSuggestion";
import { useSlashCommands, type SlashCommand } from "./useSlashCommands";
import { usePasteManager } from "./usePasteManager";
import { useImagePasteManager } from "./useImagePasteManager";
import { useDoublePress } from "./useDoublePress";

const LARGE_PASTE_THRESHOLD = 800;

interface UseInputHandlersProps {
  onSubmit: (value: string, images?: string[]) => void;
  onCancel: () => void;
  onShowForkModal: () => void;
  fetchPaths: () => Promise<string[]>;
  fetchCommands: () => Promise<SlashCommand[]>;
}

export function useInputHandlers({
  onSubmit,
  onCancel,
  onShowForkModal,
  fetchPaths,
  fetchCommands,
}: UseInputHandlersProps) {
  const inputState = useInputState();
  const { value, cursorPosition, mode } = inputState.state;

  const {
    historyIndex,
    history,
    draftInput,
    queuedMessages,
    setHistoryIndex,
    setDraftInput,
    addToHistory,
    clearQueue,
    togglePlanMode,
    toggleThinking,
  } = useInputStore();

  const [forceTabTrigger, setForceTabTrigger] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fileSuggestion = useFileSuggestion({
    value,
    cursorPosition,
    forceTabTrigger,
    fetchPaths,
  });

  const slashCommands = useSlashCommands({ value, fetchCommands });
  const pasteManager = usePasteManager();
  const imageManager = useImagePasteManager();

  const hasSuggestions =
    fileSuggestion.matchedPaths.length > 0 ||
    slashCommands.suggestions.length > 0;

  const handleDoubleEscape = useDoublePress(onShowForkModal, () => {
    if ((mode === "bash" || mode === "memory") && value.length === 1) {
      inputState.setValue("");
    } else {
      onCancel();
    }
  });

  const applyFileSuggestion = useCallback(() => {
    const selected = fileSuggestion.getSelected();
    if (!selected) return;

    const prefix = fileSuggestion.triggerType === "at" ? "@" : "";
    const before = value.substring(0, fileSuggestion.startIndex);
    const after = value
      .substring(fileSuggestion.startIndex + fileSuggestion.fullMatch.length)
      .trim();
    const newValue = `${before}${prefix}${selected} ${after}`.trim();

    inputState.setValue(newValue);
    inputState.setCursorPosition(`${before}${prefix}${selected} `.length);
    setForceTabTrigger(false);
  }, [fileSuggestion, inputState, value]);

  const handleSubmit = useCallback(() => {
    if (slashCommands.suggestions.length > 0) {
      const completed = slashCommands.getCompletedCommand();
      inputState.reset();
      onSubmit(completed);
      return;
    }

    if (fileSuggestion.matchedPaths.length > 0) {
      applyFileSuggestion();
      return;
    }

    const trimmed = value.trim();
    if (!trimmed) return;

    const { expandedMessage, images } = imageManager.expandImageReferences(
      pasteManager.expandPastedText(trimmed)
    );

    addToHistory(trimmed);
    inputState.reset();
    onSubmit(expandedMessage, images.length > 0 ? images : undefined);
  }, [
    value,
    slashCommands,
    fileSuggestion,
    applyFileSuggestion,
    inputState,
    onSubmit,
    addToHistory,
    pasteManager,
    imageManager,
  ]);

  const handleHistoryUp = useCallback(() => {
    if (hasSuggestions) {
      if (slashCommands.suggestions.length > 0) {
        slashCommands.navigatePrevious();
      } else {
        fileSuggestion.navigatePrevious();
      }
      return;
    }

    if (history.length === 0) return;

    if (historyIndex === null) {
      setDraftInput(value);
      setHistoryIndex(history.length - 1);
      inputState.setValue(history[history.length - 1]);
    } else if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      inputState.setValue(history[historyIndex - 1]);
    }
    inputState.setCursorPosition(0);
  }, [
    hasSuggestions,
    slashCommands,
    fileSuggestion,
    history,
    historyIndex,
    value,
    setDraftInput,
    setHistoryIndex,
    inputState,
  ]);

  const handleHistoryDown = useCallback(() => {
    if (hasSuggestions) {
      if (slashCommands.suggestions.length > 0) {
        slashCommands.navigateNext();
      } else {
        fileSuggestion.navigateNext();
      }
      return;
    }

    if (historyIndex === null) return;

    if (historyIndex === history.length - 1) {
      setHistoryIndex(null);
      inputState.setValue(draftInput);
    } else {
      setHistoryIndex(historyIndex + 1);
      inputState.setValue(history[historyIndex + 1]);
    }
  }, [
    hasSuggestions,
    slashCommands,
    fileSuggestion,
    historyIndex,
    history,
    draftInput,
    setHistoryIndex,
    inputState,
  ]);

  const handleQueuedMessagesUp = useCallback(() => {
    if (queuedMessages.length === 0) return;
    const queuedText = queuedMessages.join("\n");
    clearQueue();
    inputState.setValue(queuedText);
    inputState.setCursorPosition(0);
  }, [queuedMessages, clearQueue, inputState]);

  const isAtFirstLine = useCallback(() => {
    const beforeCursor = value.substring(0, cursorPosition);
    return !beforeCursor.includes("\n");
  }, [value, cursorPosition]);

  const isAtLastLine = useCallback(() => {
    const afterCursor = value.substring(cursorPosition);
    return !afterCursor.includes("\n");
  }, [value, cursorPosition]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget;

      // Escape handling
      if (e.key === "Escape") {
        e.preventDefault();
        handleDoubleEscape();
        return;
      }

      // Enter handling
      if (e.key === "Enter") {
        if (e.metaKey || e.shiftKey) {
          return; // Allow newline
        }
        e.preventDefault();
        handleSubmit();
        return;
      }

      // Tab handling
      if (e.key === "Tab") {
        e.preventDefault();
        if (e.shiftKey) {
          togglePlanMode();
          return;
        }
        if (hasSuggestions) {
          if (slashCommands.suggestions.length > 0) {
            const completed = slashCommands.getCompletedCommand();
            inputState.setValue(completed);
            inputState.setCursorPosition(completed.length);
          } else {
            applyFileSuggestion();
          }
        } else if (value.trim()) {
          setForceTabTrigger(true);
        }
        return;
      }

      // Arrow up/down
      if (e.key === "ArrowUp") {
        if (e.altKey || e.metaKey) {
          e.preventDefault();
          handleQueuedMessagesUp();
          return;
        }
        if (hasSuggestions || isAtFirstLine()) {
          e.preventDefault();
          handleHistoryUp();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        if (hasSuggestions || isAtLastLine()) {
          e.preventDefault();
          handleHistoryDown();
        }
        return;
      }

      // Ctrl shortcuts
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case "a":
            e.preventDefault();
            textarea.setSelectionRange(0, 0);
            inputState.setCursorPosition(0);
            break;
          case "e":
            e.preventDefault();
            textarea.setSelectionRange(value.length, value.length);
            inputState.setCursorPosition(value.length);
            break;
          case "d":
            if (value) {
              e.preventDefault();
              const newValue =
                value.slice(0, cursorPosition) +
                value.slice(cursorPosition + 1);
              inputState.setValue(newValue);
            }
            break;
          case "f":
            e.preventDefault();
            if (cursorPosition < value.length) {
              inputState.setCursorPosition(cursorPosition + 1);
              textarea.setSelectionRange(
                cursorPosition + 1,
                cursorPosition + 1
              );
            }
            break;
          case "b":
            e.preventDefault();
            if (cursorPosition > 0) {
              inputState.setCursorPosition(cursorPosition - 1);
              textarea.setSelectionRange(
                cursorPosition - 1,
                cursorPosition - 1
              );
            }
            break;
          case "k":
            e.preventDefault();
            inputState.setValue(value.slice(0, cursorPosition));
            break;
          case "u":
            e.preventDefault();
            inputState.setValue(value.slice(cursorPosition));
            inputState.setCursorPosition(0);
            textarea.setSelectionRange(0, 0);
            break;
          case "w":
            e.preventDefault();
            const beforeCursor = value.slice(0, cursorPosition);
            const wordMatch = beforeCursor.match(/\S+\s*$/);
            if (wordMatch) {
              const newPos = cursorPosition - wordMatch[0].length;
              inputState.setValue(
                value.slice(0, newPos) + value.slice(cursorPosition)
              );
              inputState.setCursorPosition(newPos);
              textarea.setSelectionRange(newPos, newPos);
            }
            break;
          case "h":
            e.preventDefault();
            if (cursorPosition > 0) {
              inputState.setValue(
                value.slice(0, cursorPosition - 1) + value.slice(cursorPosition)
              );
              inputState.setCursorPosition(cursorPosition - 1);
            }
            break;
          case "t":
            e.preventDefault();
            toggleThinking();
            break;
          case "n":
            e.preventDefault();
            handleHistoryDown();
            break;
          case "p":
            e.preventDefault();
            handleHistoryUp();
            break;
        }
        return;
      }

      // Meta shortcuts
      if (e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b": {
            e.preventDefault();
            const beforeCursor = value.slice(0, cursorPosition);
            const match = beforeCursor.match(/\S+\s*$/);
            const newPos = match ? cursorPosition - match[0].length : 0;
            inputState.setCursorPosition(newPos);
            textarea.setSelectionRange(newPos, newPos);
            break;
          }
          case "f": {
            e.preventDefault();
            const afterCursor = value.slice(cursorPosition);
            const match = afterCursor.match(/^\s*\S+/);
            const newPos = match
              ? cursorPosition + match[0].length
              : value.length;
            inputState.setCursorPosition(newPos);
            textarea.setSelectionRange(newPos, newPos);
            break;
          }
          case "d": {
            e.preventDefault();
            const afterCursor = value.slice(cursorPosition);
            const match = afterCursor.match(/^\s*\S+/);
            if (match) {
              inputState.setValue(
                value.slice(0, cursorPosition) +
                  afterCursor.slice(match[0].length)
              );
            }
            break;
          }
          case "backspace": {
            e.preventDefault();
            const beforeCursor = value.slice(0, cursorPosition);
            const match = beforeCursor.match(/\S+\s*$/);
            if (match) {
              const newPos = cursorPosition - match[0].length;
              inputState.setValue(
                value.slice(0, newPos) + value.slice(cursorPosition)
              );
              inputState.setCursorPosition(newPos);
            }
            break;
          }
        }
      }
    },
    [
      value,
      cursorPosition,
      hasSuggestions,
      slashCommands,
      fileSuggestion,
      inputState,
      handleSubmit,
      handleHistoryUp,
      handleHistoryDown,
      handleQueuedMessagesUp,
      handleDoubleEscape,
      applyFileSuggestion,
      togglePlanMode,
      toggleThinking,
      isAtFirstLine,
      isAtLastLine,
    ]
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;

      // Check for images first
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const result = await imageManager.handleImagePaste(file);
            if (result.success && result.prompt) {
              const before = value.slice(0, cursorPosition);
              const after = value.slice(cursorPosition);
              inputState.setValue(`${before}${result.prompt} ${after}`);
              inputState.setCursorPosition(
                before.length + result.prompt.length + 1
              );
            }
          }
          return;
        }
      }

      // Handle text paste
      const text = e.clipboardData.getData("text");
      if (text.length > LARGE_PASTE_THRESHOLD || text.includes("\n")) {
        e.preventDefault();
        const result = await pasteManager.handleTextPaste(text);
        if (result.success && result.prompt) {
          const before = value.slice(0, cursorPosition);
          const after = value.slice(cursorPosition);
          inputState.setValue(`${before}${result.prompt} ${after}`);
          inputState.setCursorPosition(
            before.length + result.prompt.length + 1
          );
        }
      }
      // Small text: let browser handle normally
    },
    [value, cursorPosition, inputState, imageManager, pasteManager]
  );

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      inputState.setValue(newValue);
      inputState.setCursorPosition(e.target.selectionStart);
      setHistoryIndex(null);

      // Reset tab trigger if @ appears or value is empty
      if (newValue.includes("@") || newValue.trim() === "") {
        setForceTabTrigger(false);
      }
    },
    [inputState, setHistoryIndex]
  );

  return {
    inputState,
    mode,
    textareaRef,
    handlers: {
      onKeyDown,
      onPaste,
      onChange,
    },
    suggestions: {
      type:
        slashCommands.suggestions.length > 0
          ? ("slash" as const)
          : fileSuggestion.matchedPaths.length > 0
          ? ("file" as const)
          : null,
      items:
        slashCommands.suggestions.length > 0
          ? slashCommands.suggestions
          : fileSuggestion.matchedPaths,
      selectedIndex:
        slashCommands.suggestions.length > 0
          ? slashCommands.selectedIndex
          : fileSuggestion.selectedIndex,
    },
    imageManager,
  };
}
```

### 10. SuggestionDropdown (components/ChatInput/SuggestionDropdown.tsx)

```typescript
import React from "react";

interface SuggestionDropdownProps {
  type: "file" | "slash";
  items: (string | { name: string; description: string })[];
  selectedIndex: number;
  maxVisible?: number;
}

export function SuggestionDropdown({
  type,
  items,
  selectedIndex,
  maxVisible = 10,
}: SuggestionDropdownProps) {
  if (items.length === 0) return null;

  const startIndex = Math.max(
    0,
    Math.min(
      selectedIndex - Math.floor(maxVisible / 2),
      items.length - maxVisible
    )
  );
  const visibleItems = items.slice(startIndex, startIndex + maxVisible);

  return (
    <div className="absolute bottom-full left-0 mb-1 w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
      <ul className="py-1 max-h-64 overflow-y-auto">
        {visibleItems.map((item, index) => {
          const actualIndex = startIndex + index;
          const isSelected = actualIndex === selectedIndex;
          const name = typeof item === "string" ? item : item.name;
          const description = typeof item === "string" ? "" : item.description;

          return (
            <li
              key={actualIndex}
              className={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <span className="font-mono text-sm">
                {type === "slash" ? `/${name}` : name}
              </span>
              {description && (
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 truncate">
                  {description}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

### 11. ImagePreview (components/ChatInput/ImagePreview.tsx)

```typescript
import React from "react";

interface ImagePreviewProps {
  images: Array<{
    imageId: string;
    base64: string;
    filename?: string;
  }>;
  onRemove: (imageId: string) => void;
}

export function ImagePreview({ images, onRemove }: ImagePreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 p-2 border-t border-gray-200 dark:border-gray-700">
      {images.map(({ imageId, base64, filename }) => (
        <div
          key={imageId}
          className="relative group w-12 h-12 rounded overflow-hidden border border-gray-300 dark:border-gray-600"
        >
          <img
            src={base64}
            alt={filename || "Pasted image"}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => onRemove(imageId)}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
```

### 12. ChatInput (components/ChatInput/ChatInput.tsx)

```typescript
import React, { useMemo } from "react";
import { useInputHandlers } from "../../hooks/useInputHandlers";
import { SuggestionDropdown } from "./SuggestionDropdown";
import { ImagePreview } from "./ImagePreview";
import type { SlashCommand } from "../../hooks/useSlashCommands";

interface ChatInputProps {
  onSubmit: (value: string, images?: string[]) => void;
  onCancel: () => void;
  onShowForkModal: () => void;
  fetchPaths: () => Promise<string[]>;
  fetchCommands: () => Promise<SlashCommand[]>;
  placeholder?: string;
  disabled?: boolean;
}

export function ChatInput({
  onSubmit,
  onCancel,
  onShowForkModal,
  fetchPaths,
  fetchCommands,
  placeholder = "Type your message...",
  disabled = false,
}: ChatInputProps) {
  const { inputState, mode, handlers, suggestions, imageManager } =
    useInputHandlers({
      onSubmit,
      onCancel,
      onShowForkModal,
      fetchPaths,
      fetchCommands,
    });

  const { value } = inputState.state;
  const canSend = value.trim().length > 0;

  const displayValue = useMemo(() => {
    if (mode === "bash" || mode === "memory") {
      return value.slice(1);
    }
    return value;
  }, [mode, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (mode === "bash" || mode === "memory") {
      const prefix = mode === "bash" ? "!" : "#";
      newValue = prefix + newValue;
    }
    handlers.onChange({
      ...e,
      target: { ...e.target, value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const borderColor = useMemo(() => {
    if (mode === "memory") return "border-purple-500";
    if (mode === "bash") return "border-orange-500";
    return "border-gray-300 dark:border-gray-600";
  }, [mode]);

  const promptSymbol = useMemo(() => {
    if (mode === "memory") return "#";
    if (mode === "bash") return "!";
    return ">";
  }, [mode]);

  const pastedImages = useMemo(() => {
    return Object.entries(imageManager.pastedImageMap).map(
      ([imageId, base64]) => ({
        imageId,
        base64,
      })
    );
  }, [imageManager.pastedImageMap]);

  return (
    <div className="relative">
      {suggestions.type && (
        <SuggestionDropdown
          type={suggestions.type}
          items={suggestions.items}
          selectedIndex={suggestions.selectedIndex}
        />
      )}

      <div className={`flex items-start border rounded-lg ${borderColor}`}>
        <span className="px-3 py-2 text-gray-500">{promptSymbol}</span>
        <textarea
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handlers.onKeyDown}
          onPaste={handlers.onPaste}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 p-2 resize-none bg-transparent outline-none"
          style={{ minHeight: "80px", maxHeight: "200px" }}
          rows={1}
        />
        <button
          type="button"
          onClick={() => {
            if (canSend) {
              const submitEvent = {
                preventDefault: () => {},
              } as React.KeyboardEvent<HTMLTextAreaElement>;
              handlers.onKeyDown({
                ...submitEvent,
                key: "Enter",
                ctrlKey: false,
                metaKey: false,
                shiftKey: false,
                altKey: false,
              } as React.KeyboardEvent<HTMLTextAreaElement>);
            }
          }}
          disabled={!canSend}
          className={`p-2 m-2 rounded ${
            canSend
              ? "text-blue-500 hover:bg-blue-50"
              : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <SendIcon />
        </button>
      </div>

      <ImagePreview
        images={pastedImages}
        onRemove={imageManager.removePastedImage}
      />
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
    >
      <path d="M22 2L2 9L11 13L15 22L22 2Z" />
    </svg>
  );
}
```

## Implementation Order

1. `store/inputStore.ts` - state foundation
2. `hooks/useInputState.ts` - state access hook
3. `hooks/useListNavigation.ts` - shared utility
4. `hooks/useDoublePress.ts` - escape detection utility
5. `hooks/useFileSuggestion.ts` - @ and tab suggestions
6. `hooks/useSlashCommands.ts` - / commands
7. `hooks/usePasteManager.ts` - text paste
8. `hooks/useImagePasteManager.ts` - image paste
9. `hooks/useInputHandlers.ts` - orchestrator
10. `components/ChatInput/SuggestionDropdown.tsx` - dropdown UI
11. `components/ChatInput/ImagePreview.tsx` - image preview UI
12. `components/ChatInput/ChatInput.tsx` - main component

**Total: 12 files**
