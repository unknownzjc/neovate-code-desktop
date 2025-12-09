import { useMemo, useState, useCallback } from 'react';
import type React from 'react';
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
import type {
  HandlerMethod,
  HandlerInput,
  HandlerOutput,
} from '../../nodeBridge.types';

// Provider type from the API
interface Provider {
  id: string;
  name: string;
  doc?: string;
  env?: string[];
  apiEnv?: string[];
  validEnvs: string[];
  hasApiKey: boolean;
}

// Model type from the API
interface Model {
  name: string;
  modelId: string;
  value: string;
}

interface ChatInputProps {
  onSubmit: (value: string, images?: string[]) => void;
  onCancel?: () => void;
  onShowForkModal?: () => void;
  fetchPaths?: () => Promise<string[]>;
  fetchCommands?: () => Promise<SlashCommand[]>;
  placeholder?: string;
  disabled?: boolean;
  modelName?: string;
  sessionId?: string;
  cwd?: string;
  request?: <K extends HandlerMethod>(
    method: K,
    params: HandlerInput<K>,
  ) => Promise<HandlerOutput<K>>;
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
  sessionId,
  cwd,
  request,
}: ChatInputProps) {
  const { planMode, thinking, togglePlanMode, toggleThinking } =
    useInputStore();

  // Parse modelName into provider and model
  const [currentProvider, currentModel] = useMemo(() => {
    if (!modelName) return ['', ''];
    const parts = modelName.split('/');
    if (parts.length >= 2) {
      return [parts[0], parts.slice(1).join('/')];
    }
    return ['', modelName];
  }, [modelName]);

  // Provider and model selector state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [providerValue, setProviderValue] = useState<string | null>(null);
  const [modelValue, setModelValue] = useState<string | null>(null);

  // Debug: Log state changes
  console.log('[ChatInput] Provider/Model Selector State:', {
    modelName,
    currentProvider,
    currentModel,
    providerValue,
    modelValue,
    providersCount: providers.length,
    modelsCount: models.length,
    hasRequest: !!request,
    cwd,
    sessionId,
  });

  // Fetch providers when provider selector opens
  const handleProviderOpen = useCallback(async () => {
    console.log('[ChatInput] handleProviderOpen called', {
      request: !!request,
      cwd,
      isLoadingProviders,
    });
    if (!request || !cwd || isLoadingProviders) return;

    setIsLoadingProviders(true);
    try {
      const response = await request('providers.list', { cwd });
      console.log('[ChatInput] providers.list response:', response);
      if (response.success) {
        // Filter to only show providers with valid configuration
        const validProviders = response.data.providers.filter(
          (p: Provider) => p.validEnvs.length > 0 || p.hasApiKey,
        );
        console.log('[ChatInput] Valid providers:', validProviders);
        setProviders(validProviders);
      }
    } catch (error) {
      console.error('[ChatInput] Failed to fetch providers:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  }, [request, cwd, isLoadingProviders]);

  // Fetch models for the current provider when model selector opens
  // Returns the fetched models so caller can use them
  const handleModelOpen = useCallback(
    async (providerId?: string): Promise<Model[]> => {
      console.log('[ChatInput] handleModelOpen called', {
        providerId,
        currentProvider,
        request: !!request,
        cwd,
        isLoadingModels,
      });
      if (!request || !cwd || isLoadingModels) return [];

      const targetProvider = providerId || currentProvider;
      if (!targetProvider) {
        console.log('[ChatInput] No target provider, skipping model fetch');
        return [];
      }

      setIsLoadingModels(true);
      try {
        const response = await request('models.list', { cwd });
        console.log('[ChatInput] models.list response:', response);
        if (response.success) {
          console.log(
            '[ChatInput] Looking for provider:',
            targetProvider,
            'in groupedModels:',
            response.data.groupedModels,
          );
          const providerModels =
            response.data.groupedModels.find(
              (g: { providerId: string }) => g.providerId === targetProvider,
            )?.models || [];
          console.log('[ChatInput] Provider models found:', providerModels);
          setModels(providerModels);
          return providerModels;
        }
      } catch (error) {
        console.error('[ChatInput] Failed to fetch models:', error);
      } finally {
        setIsLoadingModels(false);
      }
      return [];
    },
    [request, cwd, currentProvider, isLoadingModels],
  );

  // Handle provider change
  const handleProviderChange = useCallback(
    async (newProvider: string) => {
      console.log('[ChatInput] handleProviderChange called', {
        newProvider,
        currentProvider,
        request: !!request,
        cwd,
        sessionId,
      });
      if (!request || !cwd || !sessionId || newProvider === currentProvider)
        return;

      // Fetch models for the new provider
      const fetchedModels = await handleModelOpen(newProvider);

      // Auto-select the first model and update session config
      if (fetchedModels.length > 0) {
        const firstModel = fetchedModels[0];
        const fullModelValue = `${newProvider}/${firstModel.modelId}`;
        console.log('[ChatInput] Auto-selecting first model:', fullModelValue);

        setModelValue(firstModel.modelId);

        try {
          await request('session.config.set', {
            cwd,
            sessionId,
            key: 'model',
            value: fullModelValue,
          });
          console.log('[ChatInput] Auto-selected model set successfully');
        } catch (error) {
          console.error('[ChatInput] Failed to auto-set model:', error);
        }
      }
    },
    [request, cwd, sessionId, currentProvider, handleModelOpen],
  );

  // Handle model change
  const handleModelChange = useCallback(
    async (newModel: string) => {
      console.log('[ChatInput] handleModelChange called', {
        newModel,
        providerValue,
        currentProvider,
        request: !!request,
        cwd,
        sessionId,
      });
      if (!request || !cwd || !sessionId) return;

      // Determine which provider to use
      const provider = providerValue || currentProvider;
      const fullModelValue = `${provider}/${newModel}`;

      console.log('[ChatInput] Setting model to:', fullModelValue);
      try {
        await request('session.config.set', {
          cwd,
          sessionId,
          key: 'model',
          value: fullModelValue,
        });
        console.log('[ChatInput] Model set successfully');
        // Reset local state after successful update
        // setProviderValue(null);
        // setModelValue(null);
      } catch (error) {
        console.error('[ChatInput] Failed to set model:', error);
      }
    },
    [request, cwd, sessionId, providerValue, currentProvider],
  );

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
      target: {
        ...e.target,
        selectionStart: e.target.selectionStart,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>);
  };
  const handleSelect = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handlers.onSelect({
      ...e,
      target: {
        ...e.target,
        // @ts-ignore
        selectionStart: e.target.selectionStart,
      },
    } as React.KeyboardEvent<HTMLTextAreaElement>);
  };

  const isSuggestionVisible = suggestions.type !== null;

  const handleSendClick = () => {
    // Prevent submission when suggestions are visible
    if (canSend && !disabled && !isSuggestionVisible) {
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
    // Memory and bash input modes take precedence
    if (mode === 'memory') return 'var(--brand-purple, #8b5cf6)';
    if (mode === 'bash') return 'var(--brand-orange, #f97316)';
    // Plan mode colors
    if (planMode === 'plan') return '#3b82f6';
    if (planMode === 'brainstorm') return '#8b5cf6';
    return 'var(--border-subtle)';
  }, [mode, planMode]);

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
          onSelect={handleSelect}
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
            {/* Provider and Model selectors */}
            {modelName && request && cwd && sessionId && (
              <div className="flex items-center gap-0.5">
                <HugeiconsIcon
                  icon={ChipIcon}
                  size={14}
                  style={{ color: 'var(--text-secondary)' }}
                  className="mr-1"
                />
                {/* Provider selector - native select */}
                <select
                  value={providerValue || currentProvider}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('[ChatInput] Provider select onChange:', value);
                    setProviderValue(value);
                    handleProviderChange(value);
                  }}
                  onFocus={() => {
                    console.log('[ChatInput] Provider select onFocus');
                    handleProviderOpen();
                  }}
                  className="text-xs font-medium bg-transparent border-0 outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 py-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Select provider"
                >
                  {isLoadingProviders ? (
                    <option disabled>Loading...</option>
                  ) : providers.length === 0 ? (
                    <option value={currentProvider}>{currentProvider}</option>
                  ) : (
                    providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.id}
                      </option>
                    ))
                  )}
                </select>

                <span
                  className="text-xs"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  /
                </span>

                {/* Model selector - native select */}
                <select
                  value={modelValue || currentModel}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('[ChatInput] Model select onChange:', value);
                    setModelValue(value);
                    handleModelChange(value);
                  }}
                  onFocus={() => {
                    console.log(
                      '[ChatInput] Model select onFocus, providerValue:',
                      providerValue,
                    );
                    handleModelOpen(providerValue || undefined);
                  }}
                  className="text-xs font-medium bg-transparent border-0 outline-none cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 rounded px-1 py-0.5 max-w-[150px]"
                  style={{ color: 'var(--text-secondary)' }}
                  title="Select model"
                >
                  {isLoadingModels ? (
                    <option disabled>Loading...</option>
                  ) : models.length === 0 ? (
                    <option value={currentModel}>{currentModel}</option>
                  ) : (
                    models.map((model) => (
                      <option key={model.modelId} value={model.modelId}>
                        {model.modelId}
                      </option>
                    ))
                  )}
                </select>
              </div>
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
                        planMode === 'plan'
                          ? '#3b82f6'
                          : planMode === 'brainstorm'
                            ? '#8b5cf6'
                            : 'var(--text-secondary)',
                    }}
                  >
                    <HugeiconsIcon icon={NoteEditIcon} size={14} />
                    <span className="font-medium capitalize">{planMode}</span>
                  </button>
                }
              />
              <TooltipPopup>
                {planMode === 'normal'
                  ? 'Switch to plan mode'
                  : planMode === 'plan'
                    ? 'Switch to brainstorm mode'
                    : 'Switch to normal mode'}{' '}
                (Shift+Tab)
              </TooltipPopup>
            </Tooltip>

            {/* Thinking Toggle - only show when enabled */}
            {thinking && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => toggleThinking()}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${
                        thinking === 'high' ? 'thinking-high-twinkle' : ''
                      }`}
                      style={{
                        color:
                          thinking === 'high'
                            ? '#d4a520'
                            : 'var(--brand-primary, #3b82f6)',
                      }}
                    >
                      <HugeiconsIcon icon={BrainIcon} size={14} />
                      <span className="font-medium capitalize">
                        {thinking === 'medium' ? 'Med' : thinking}
                      </span>
                    </button>
                  }
                />
                <TooltipPopup>
                  Extended thinking: {thinking} (Ctrl+T to cycle)
                </TooltipPopup>
              </Tooltip>
            )}
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
