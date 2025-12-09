# Chat Input Provider and Model Selectors

**Date:** 2025-12-08

## Context

The current `ChatInput` component displays the model name as a single chip button (e.g., "anthropic/claude-3-5-sonnet"). The goal is to split this into two separate Select components—one for provider and one for model—allowing users to independently change their AI provider and model selection directly from the chat input toolbar.

## Discussion

### Key Questions Resolved

1. **Selector Position**: Replace the existing model chip button with two separate selectors in the same toolbar location, rather than using a popover approach.

2. **Provider Change Behavior**: When the user selects a different provider, the model selector should automatically open to prompt model selection from the new provider.

### Data Sources

- **Providers**: Fetched via `providers.list` API, filtered to only show providers where `validEnvs.length > 0 || hasApiKey` (i.e., properly configured providers)
- **Models**: Fetched via `models.list` API, filtered by the currently selected provider
- **Persistence**: Model changes are persisted via `session.config.set` with key `model` and value `provider/model`

## Approach

Parse the existing `modelName` prop (format: `provider/model`) into separate provider and model values. Render two adjacent Select components in the toolbar. Each selector fetches its options on-demand when opened. When the provider changes, automatically trigger the model selector to open, ensuring the user completes their selection.

## Architecture

### Props Changes

```typescript
interface ChatInputProps {
  // ... existing props
  modelName?: string;        // existing - format: "provider/model"
  sessionId?: string;        // NEW - required for session.config.set
  cwd?: string;              // NEW - required for API calls
}
```

### Internal State

```typescript
const [providers, setProviders] = useState<Provider[]>([]);
const [models, setModels] = useState<Model[]>([]);
const [isProviderOpen, setIsProviderOpen] = useState(false);
const [isModelOpen, setIsModelOpen] = useState(false);
const [isLoadingProviders, setIsLoadingProviders] = useState(false);
const [isLoadingModels, setIsLoadingModels] = useState(false);
```

### UI Layout

```
[ProviderIcon] [ProviderSelect ▼] / [ModelSelect ▼]  |  [PlanMode] [Thinking] ... [Send]
```

Both selects use the existing `Select` component from `ui/select.tsx`.

### Key Handlers

| Handler | Action |
|---------|--------|
| `handleProviderOpen()` | Fetch `providers.list`, filter by `validEnvs.length > 0 \|\| hasApiKey` |
| `handleProviderChange(newProvider)` | Call `session.config.set`, then auto-open model selector |
| `handleModelOpen()` | Fetch `models.list`, filter by current provider |
| `handleModelChange(newModel)` | Call `session.config.set` with `provider/newModel` |

### API Calls

```typescript
// Fetch providers
const response = await request('providers.list', { cwd });
const validProviders = response.data.providers.filter(
  p => p.validEnvs.length > 0 || p.hasApiKey
);

// Fetch models for provider
const response = await request('models.list', { cwd });
const providerModels = response.data.groupedModels.find(
  g => g.providerId === currentProvider
)?.models || [];

// Update model
await request('session.config.set', {
  cwd,
  sessionId,
  key: 'model',
  value: `${provider}/${model}`
});
```

### Data Flow

1. Component mounts → parse `modelName` into `[provider, model]`
2. User clicks provider selector → fetch and display filtered providers
3. User selects provider → persist via API → auto-open model selector → fetch models for new provider
4. User selects model → persist via API with full `provider/model` value
