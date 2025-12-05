import { useCallback, useRef } from 'react';
import { useInputStore } from '../store/inputStore';

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
    [generatePasteId, pastedTextMap, setPastedTextMap],
  );

  const getPastedText = useCallback(
    (pasteId: string) => pastedTextMap[pasteId],
    [pastedTextMap],
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
    [getPastedText],
  );

  return {
    handleTextPaste,
    getPastedText,
    expandPastedText,
  };
}
