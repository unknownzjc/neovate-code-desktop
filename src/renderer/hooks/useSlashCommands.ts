import { useState, useMemo, useEffect, useCallback } from 'react';
import { useListNavigation } from './useListNavigation';

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
    if (!value.startsWith('/')) return [];
    const prefix = value.slice(1).toLowerCase().trim();
    if (prefix === '') return commands;

    return commands
      .filter(
        (cmd) =>
          cmd.name.toLowerCase().startsWith(prefix) ||
          cmd.description.toLowerCase().includes(prefix),
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
    if (value === '/' && commands.length === 0) {
      setIsLoading(true);
      fetchCommands()
        .then(setCommands)
        .finally(() => setIsLoading(false));
    }
  }, [value, commands.length, fetchCommands]);

  const getCompletedCommand = useCallback(() => {
    const selected = navigation.getSelected();
    if (!selected) return value;
    const args = value.includes(' ') ? value.split(' ').slice(1).join(' ') : '';
    return `/${selected.name} ${args}`.trim() + ' ';
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
