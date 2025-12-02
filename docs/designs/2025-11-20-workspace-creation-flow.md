# Workspace Creation Flow

**Date:** 2025-11-20

## Context

The `handleNewWorkspace` function in `RepoSidebar.tsx` needs to be implemented to create new workspaces for a repository. The initial requirement specified a two-step process:

1. Request workspace creation via `'project.workspaces.create'` with `{ cwd, skipUpdate: true }`
2. After successful creation, select the newly created workspace

The backend API returns a minimal response with `{ success, error?, data?: { workspace: {name, path, branch} } }`, where `error` is a string (not an object).

## Discussion

### Key Decisions Made:

**Error Handling Pattern:**
- Decision: Use toast notifications for all errors
- Toast type: Error toasts for failures, warning toasts for partial failures
- Error message source: `createResponse.error` is a string, not an object

**Post-Creation Behavior:**
- Decision: Only select the workspace, don't auto-create sessions
- User maintains control over when to start a new session

**Data Completeness Strategy:**
- Three approaches explored:
  - A) Map minimal backend response to full `WorkspaceData` with defaults
  - B) Assume backend returns complete `WorkspaceData`
  - **C) Create + Fetch pattern (SELECTED)**
- Selected approach ensures complete, authoritative workspace data from backend

### Remaining Clarifications Needed:

1. **Workspace ID field**: Which field from create response serves as the workspace ID?
   - Options: `name`, `path`, or other?
   - Used for the fetch request: `project.workspaces.get({ workspaceId })`

2. **Fetch API contract**:
   - Method name: `'project.workspaces.get'`?
   - Request structure: `{ workspaceId: string }`?
   - Response structure: `{ success, error?, data: WorkspaceData }`?

## Approach

**Create + Fetch Pattern:**

The implementation uses a two-request pattern to ensure data completeness:

1. **Create:** Call `project.workspaces.create` to create workspace on backend
2. **Fetch:** Immediately fetch full workspace details via `project.workspaces.get`
3. **Update:** Add complete workspace to store and select it

**Benefits:**
- Clean separation between creation and data retrieval
- Always has complete, authoritative data from backend
- Single source of truth for workspace structure

**Trade-offs:**
- Two network requests instead of one
- Slightly more complex error handling
- Requires additional API endpoint

## Architecture

### Flow Diagram

```
User clicks "New workspace"
  ↓
1. Request: project.workspaces.create({ cwd: repoPath, skipUpdate: true })
  ↓
  ├─ Success: false → Show error toast → EXIT
  ↓
  └─ Success: true → Extract workspace ID
       ↓
2. Request: project.workspaces.get({ workspaceId })
       ↓
       ├─ Success: false → Show warning toast → EXIT (workspace exists but not loaded)
       ↓
       └─ Success: true → Get full WorkspaceData
            ↓
3. Update store: addWorkspace(fullWorkspaceData)
            ↓
4. Select: selectWorkspace(workspaceId)
```

### Implementation Details

**Function Signature:**
```typescript
const handleNewWorkspace = async (repoPath: string) => { ... }
```

**Required Imports:**
```typescript
import { toastManager } from './ui/toast';

// Inside component:
const request = useStore((state) => state.request);
const addWorkspace = useStore((state) => state.addWorkspace);
const selectWorkspace = useStore((state) => state.selectWorkspace);
```

**Error Handling:**

1. **Creation fails** (`success: false`):
   - Show error toast with message from `createResponse.error` (string)
   - Default message: "Failed to create workspace"
   - Exit early

2. **Fetch fails** (workspace created but details not loaded):
   - Show warning toast: "Workspace created but could not load details"
   - Don't add incomplete data to store
   - Keeps UI consistent

3. **Network/exception errors**:
   - Wrap entire flow in try-catch
   - Show generic error toast
   - Exit early

**Edge Cases:**
- Rapid clicking: Sequential requests via async/await prevents race conditions
- Partial failures: Warning toast informs user workspace exists but needs refresh
- Network errors: Caught and displayed as error toasts

### Code Structure

```typescript
const handleNewWorkspace = async (repoPath: string) => {
  try {
    // Step 1: Create workspace
    const createResponse = await request('project.workspaces.create', {
      cwd: repoPath,
      skipUpdate: true
    });

    if (!createResponse.success) {
      toastManager.add({
        title: 'Workspace Creation Failed',
        description: createResponse.error || 'Failed to create workspace',
        type: 'error'
      });
      return;
    }

    // Step 2: Fetch full workspace details
    const workspaceId = createResponse.data.workspace.name; // TODO: Confirm ID field
    const fetchResponse = await request('project.workspaces.get', {
      workspaceId
    });

    if (!fetchResponse.success) {
      toastManager.add({
        title: 'Failed to load workspace',
        description: 'Workspace created but could not load details',
        type: 'warning'
      });
      return;
    }

    // Step 3: Add to store and select
    addWorkspace(fetchResponse.data);
    selectWorkspace(workspaceId);

  } catch (error) {
    toastManager.add({
      title: 'Workspace Creation Failed',
      description: error instanceof Error ? error.message : 'Unknown error',
      type: 'error'
    });
  }
};
```

### Integration Points

**Store Methods Used:**
- `request(method, params)`: Make RPC requests to backend
- `addWorkspace(workspace)`: Add workspace to store and link to parent repo
- `selectWorkspace(id)`: Set workspace as selected in UI

**UI Components:**
- `toastManager.add()`: Display notifications with title, description, and type
- Toast types: `'error'`, `'warning'`, `'success'`, `'info'`, `'loading'`

**Backend APIs:**
- `project.workspaces.create`: Creates workspace, returns minimal data
- `project.workspaces.get`: Fetches complete workspace details (needs confirmation)
