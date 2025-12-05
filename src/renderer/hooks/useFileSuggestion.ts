import { useState, useMemo, useCallback, useEffect } from 'react';
import { useListNavigation } from './useListNavigation';

type TriggerType = 'at' | 'tab' | null;

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
        fullMatch: '',
        query: '',
        startIndex: -1,
        triggerType: null,
      };
    }

    const fullMatch = lastMatch[1];
    let query = fullMatch.slice(1);
    if (query.startsWith('"')) {
      query = query.slice(1).replace(/"$/, '');
    }
    const startIndex =
      lastMatch.index! + (lastMatch[0].length - fullMatch.length);

    return { hasQuery: true, fullMatch, query, startIndex, triggerType: 'at' };
  }, [value, cursorPosition]);

  const tabMatch = useMemo((): MatchResult => {
    if (!forceTabTrigger) {
      return {
        hasQuery: false,
        fullMatch: '',
        query: '',
        startIndex: -1,
        triggerType: null,
      };
    }

    const beforeCursor = value.substring(0, cursorPosition);
    const wordMatch = beforeCursor.match(/([^\s]*)$/);

    if (!wordMatch || !wordMatch[1] || beforeCursor.match(/@[^\s]*$/)) {
      return {
        hasQuery: false,
        fullMatch: '',
        query: '',
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
      triggerType: 'tab',
    };
  }, [value, cursorPosition, forceTabTrigger]);

  const activeMatch = atMatch.hasQuery ? atMatch : tabMatch;

  const matchedPaths = useMemo(() => {
    if (!activeMatch.hasQuery) return [];
    if (activeMatch.query === '') return paths;
    return paths.filter((p) =>
      p.toLowerCase().includes(activeMatch.query.toLowerCase()),
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
    if (!selected) return '';
    return selected.includes(' ') ? `"${selected}"` : selected;
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
