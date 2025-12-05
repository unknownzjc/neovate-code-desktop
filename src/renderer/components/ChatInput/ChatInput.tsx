import React, { useMemo } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  SentIcon,
  ChipIcon,
  NoteEditIcon,
  BrainIcon,
  ComputerTerminal01Icon,
  NoteIcon,
} from '@hugeicons/core-free-icons';
import { useInputHandlers } from '../../hooks/useInputHandlers';
import { useInputStore } from '../../store/inputStore';
import { SuggestionDropdown } from './SuggestionDropdown';
import { ImagePreview } from './ImagePreview';
import { Textarea, Tooltip, TooltipTrigger, TooltipPopup, Button } from '../ui';
import type { SlashCommand } from '../../hooks/useSlashCommands';

interface ChatInputProps {
  onSubmit: (value: string, images?: string[]) => void;
  onCancel?: () => void;
  onShowForkModal?: () => void;
  fetchPaths?: () => Promise<string[]>;
  fetchCommands?: () => Promise<SlashCommand[]>;
  placeholder?: string;
  disabled?: boolean;
  modelName?: string;
}

// Default implementations
const defaultFetchPaths = async () => [];
const defaultFetchCommands = async () => [];
const noop = () => {};

export function ChatInput({
  onSubmit,
  onCancel = noop,
  onShowForkModal = noop,
  fetchPaths = defaultFetchPaths,
  fetchCommands = defaultFetchCommands,
  placeholder = 'Type your message...',
  disabled = false,
  modelName,
}: ChatInputProps) {
  const { planMode, thinkingEnabled, togglePlanMode, toggleThinking } =
    useInputStore();

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
    if (mode === 'bash' || mode === 'memory') {
      return value.slice(1);
    }
    return value;
  }, [mode, value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let newValue = e.target.value;
    if (mode === 'bash' || mode === 'memory') {
      const prefix = mode === 'bash' ? '!' : '#';
      newValue = prefix + newValue;
    }
    handlers.onChange({
      ...e,
      target: { ...e.target, value: newValue },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };

  const handleSendClick = () => {
    if (canSend && !disabled) {
      const submitEvent = {
        key: 'Enter',
        preventDefault: () => {},
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
      } as React.KeyboardEvent<HTMLTextAreaElement>;
      handlers.onKeyDown(submitEvent);
    }
  };

  const borderColor = useMemo(() => {
    if (mode === 'memory') return 'var(--brand-purple, #8b5cf6)';
    if (mode === 'bash') return 'var(--brand-orange, #f97316)';
    return 'var(--border-subtle)';
  }, [mode]);

  const modeInfo = useMemo(() => {
    if (mode === 'memory')
      return { icon: NoteIcon, label: 'Memory', color: '#8b5cf6' };
    if (mode === 'bash')
      return { icon: ComputerTerminal01Icon, label: 'Bash', color: '#f97316' };
    return null;
  }, [mode]);

  const pastedImages = useMemo(() => {
    return Object.entries(imageManager.pastedImageMap).map(
      ([imageId, base64]) => ({
        imageId,
        base64,
      }),
    );
  }, [imageManager.pastedImageMap]);

  return (
    <div className="relative">
      {/* Suggestion Dropdown */}
      {suggestions.type && (
        <SuggestionDropdown
          type={suggestions.type}
          items={suggestions.items}
          selectedIndex={suggestions.selectedIndex}
        />
      )}

      {/* Main Input Container */}
      <div
        className="rounded-lg overflow-hidden transition-colors"
        style={{
          border: `1px solid ${borderColor}`,
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        {/* Mode indicator */}
        {modeInfo && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 border-b"
            style={{
              borderColor: 'var(--border-subtle)',
              backgroundColor: `${modeInfo.color}10`,
            }}
          >
            <HugeiconsIcon
              icon={modeInfo.icon}
              size={14}
              color={modeInfo.color}
            />
            <span
              className="text-xs font-medium"
              style={{ color: modeInfo.color }}
            >
              {modeInfo.label} Mode
            </span>
            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
              Press Esc to exit
            </span>
          </div>
        )}

        {/* Textarea */}
        <Textarea
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handlers.onKeyDown}
          onPaste={handlers.onPaste}
          placeholder={placeholder}
          disabled={disabled}
          className="border-0 rounded-none resize-none focus:ring-0 focus-visible:ring-0"
          style={{
            minHeight: '80px',
            maxHeight: '200px',
          }}
        />

        {/* Image Preview */}
        <ImagePreview
          images={pastedImages}
          onRemove={imageManager.removePastedImage}
        />

        {/* Bottom Toolbar */}
        <div
          className="flex items-center justify-between px-2 py-1.5 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          {/* Left side tools */}
          <div className="flex items-center gap-1">
            {/* Model selector */}
            {modelName && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <HugeiconsIcon icon={ChipIcon} size={14} />
                      <span className="font-medium max-w-[120px] truncate">
                        {modelName}
                      </span>
                    </button>
                  }
                />
                <TooltipPopup>Current model</TooltipPopup>
              </Tooltip>
            )}

            {/* Plan/Brainstorm Mode Toggle */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => togglePlanMode()}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      color:
                        planMode === 'brainstorm'
                          ? 'var(--brand-primary, #3b82f6)'
                          : 'var(--text-secondary)',
                    }}
                  >
                    <HugeiconsIcon icon={NoteEditIcon} size={14} />
                    <span className="font-medium capitalize">{planMode}</span>
                  </button>
                }
              />
              <TooltipPopup>
                {planMode === 'plan'
                  ? 'Switch to brainstorm'
                  : 'Switch to plan'}{' '}
                (Shift+Tab)
              </TooltipPopup>
            </Tooltip>

            {/* Thinking Toggle */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => toggleThinking()}
                    className="p-1.5 rounded transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{
                      color: thinkingEnabled
                        ? 'var(--brand-primary, #3b82f6)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    <HugeiconsIcon icon={BrainIcon} size={16} />
                  </button>
                }
              />
              <TooltipPopup>
                {thinkingEnabled ? 'Disable' : 'Enable'} extended thinking
                (Ctrl+T)
              </TooltipPopup>
            </Tooltip>
          </div>

          {/* Right side - Send button */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  variant={canSend ? 'default' : 'ghost'}
                  onClick={handleSendClick}
                  disabled={!canSend || disabled}
                >
                  <HugeiconsIcon icon={SentIcon} size={18} />
                </Button>
              }
            />
            <TooltipPopup>
              {canSend ? 'Send message (Enter)' : 'Type a message to send'}
            </TooltipPopup>
          </Tooltip>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div
        className="flex items-center justify-center gap-4 mt-2 text-xs"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>
          <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">
            @
          </kbd>{' '}
          files
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">
            /
          </kbd>{' '}
          commands
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">
            #
          </kbd>{' '}
          memory
        </span>
        <span>
          <kbd className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/5">
            !
          </kbd>{' '}
          bash
        </span>
      </div>
    </div>
  );
}
