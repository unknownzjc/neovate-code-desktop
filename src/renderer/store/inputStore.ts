import { create } from 'zustand';

export type InputMode = 'prompt' | 'bash' | 'memory';
export type PlanMode = 'plan' | 'brainstorm';

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
  value: '',
  cursorPosition: 0,
  historyIndex: null,
  draftInput: '',
  history: [],
  queuedMessages: [],
  planMode: 'plan',
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
      planMode: state.planMode === 'plan' ? 'brainstorm' : 'plan',
    })),
  toggleThinking: () =>
    set((state) => ({ thinkingEnabled: !state.thinkingEnabled })),
  setPastedTextMap: (pastedTextMap) => set({ pastedTextMap }),
  setPastedImageMap: (pastedImageMap) => set({ pastedImageMap }),
  reset: () =>
    set({
      value: '',
      cursorPosition: 0,
      historyIndex: null,
      draftInput: '',
    }),
}));

export function getInputMode(value: string): InputMode {
  if (value.startsWith('!')) return 'bash';
  if (value.startsWith('#')) return 'memory';
  return 'prompt';
}
