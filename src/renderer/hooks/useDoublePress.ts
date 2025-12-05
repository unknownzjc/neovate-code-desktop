import { useRef, useCallback } from 'react';

export function useDoublePress(
  onDouble: () => void,
  onSingle?: () => void,
  timeout: number = 500,
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
