import { useCallback } from 'react';
import {
  useInputStore,
  getInputMode,
  type InputMode,
} from '../store/inputStore';

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
    [setStoreValue],
  );

  const setCursorPosition = useCallback(
    (pos: number) => {
      setStoreCursorPosition(pos);
    },
    [setStoreCursorPosition],
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
