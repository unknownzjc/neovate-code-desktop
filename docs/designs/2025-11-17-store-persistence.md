# Store Persistence to Local File System

**Date:** 2025-11-17

## Context

The application needs to persist Zustand store state between app sessions. The store contains entity data (repos, workspaces, sessions) and UI selections (selectedRepoPath, selectedWorkspaceId, selectedSessionId) that should survive app restarts. The persisted state should be saved to `~/.neovate/desktop/store.json` automatically as changes occur.

## Discussion

**Persistence Trigger Strategy**
The team evaluated four options for when to save state:
- Automatic save on every state change (debounced)
- Only save when app closes
- Both auto-save + final save on quit
- Manual user-triggered save

**Decision:** Automatic debounced saves on state changes (Option A) to ensure data is never lost even if app crashes.

**State Scope**
Considered what parts of the store should be persisted:
- Full state including WebSocket connection
- Only entity data
- Entity data + UI selections
- Custom subset

**Decision:** Persist entity data + UI selections (Option C). WebSocket connection state and runtime objects (transport, messageBus) are excluded as they cannot be serialized and must be recreated on app start.

**Error Handling**
Evaluated approaches for handling file write errors:
- Silent failure with console logs
- User notification
- Retry with backoff
- Hybrid approach

**Decision:** Show error notifications to user (Option B) so they're aware if state cannot be saved.

**Implementation Approach**
Three architectural approaches were explored:

1. **Zustand Persist Middleware + Custom IPC Storage** - Use built-in persist middleware with custom storage adapter
2. **Manual Subscription with Debounced IPC** - Subscribe to store manually, debounce, call IPC handlers
3. **Main Process State Mirror** - Duplicate state in main process for persistence

**Decision:** Manual subscription approach (Option B) for simplicity, full control, and avoiding unnecessary abstraction layers.

## Approach

Implement a three-layer persistence system:

1. **Main Process IPC Handlers** handle file I/O operations
2. **Renderer Store Subscription** monitors changes and triggers saves
3. **Hydration Logic** loads persisted state on app startup

The system automatically saves filtered state (entities + UI selections) on every change with 500ms debouncing to batch rapid updates. On startup, it loads the saved state and initializes the store. Non-serializable runtime data is excluded and recreated fresh.

## Architecture

### Layer 1: Main Process IPC Handlers (src/main/main.ts)

Two IPC handlers manage file operations:

**`store:save` Handler**
- Accepts serialized state from renderer
- Ensures `~/.neovate/desktop/` directory exists using `fs.mkdir` with recursive option
- Writes atomically: write to temporary file, then rename to `store.json`
- Atomic writes prevent corruption if app crashes during save
- Throws descriptive errors on failure (permission denied, disk full, etc.)

**`store:load` Handler**
- Reads `~/.neovate/desktop/store.json`
- Returns parsed JSON object or null if file doesn't exist
- Catches and handles JSON parse errors gracefully (returns null for fresh start)
- Uses `fs.promises` for async operations

### Layer 2: Preload Script (src/main/preload.ts)

Expose IPC methods via contextBridge:
```typescript
saveStore: (state) => ipcRenderer.invoke('store:save', state)
loadStore: () => ipcRenderer.invoke('store:load')
```

### Layer 3: Persistence Manager (src/renderer/persistence.ts)

New file with two main functions:

**`setupPersistence(store)`**
- Subscribes to Zustand store changes using `store.subscribe()`
- Extracts persistable state: `{repos, workspaces, sessions, selectedRepoPath, selectedWorkspaceId, selectedSessionId}`
- Debounces with 500ms timeout to batch rapid changes
- Calls `window.electron.saveStore()` with filtered state
- Catches errors and shows `window.alert()` notification to user
- Flushes debounced save in `beforeunload` handler to ensure final save on app quit

**`hydrateStore(store)`**
- Called before app renders
- Calls `window.electron.loadStore()` to retrieve persisted state
- Merges loaded data into store initial state
- Handles missing file gracefully (returns null, store uses defaults)
- Handles corrupted JSON gracefully (logs error, starts fresh)
- Validates selection IDs exist in loaded entities, resets to null if orphaned
- Returns boolean success status

### Layer 4: Store Initialization (src/renderer/main.tsx)

Update app entry point:
- Import `hydrateStore()` and call before `ReactDOM.render()`
- Import `setupPersistence()` and call after render
- Connection state always starts as 'disconnected' regardless of loaded state

## Error Handling & Edge Cases

### File System Errors
- Directory creation fails → "Cannot create config directory"
- Write permission denied → "Permission denied saving state"
- Disk full → "Insufficient disk space"
- All errors bubble to renderer and trigger `window.alert()` notification

### Data Corruption
- Malformed JSON → Catch parse error, log to console, return null (fresh start)
- Invalid state structure → Validate basic shape, use defaults for missing fields
- Partial state → Merge with initial state, missing entities become empty objects

### Race Conditions
- Multiple rapid saves → Debounce ensures only last state saved
- Save during app quit → Flush debounced save in `beforeunload` handler
- Load during hydration → Hydrate happens once before render, no conflicts

### Edge Cases
- No file exists on first launch → Hydrate returns null, store uses defaults
- Empty repos/workspaces/sessions → All objects remain empty `{}`
- Invalid selections → Validate IDs exist on load, reset to null if orphaned

### Future Considerations
- No version field needed initially
- If state structure changes in future, add version check in hydration
- Handle old formats with transforms when needed
