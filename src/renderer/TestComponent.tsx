// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { useStore } from './store';
import { Button } from './components/ui/button';

const TestComponent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const lastPressTimeRef = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        const now = Date.now();
        if (now - lastPressTimeRef.current < 300) {
          setIsVisible((prev) => !prev);
          lastPressTimeRef.current = 0;
        } else {
          lastPressTimeRef.current = now;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    selectedRepoPath,
    selectedWorkspaceId,
    selectedSessionId,
    workspaces,
    sessions,
    selectRepo,
    selectWorkspace,
    selectSession,
  } = useStore();

  const handleClearSelections = () => {
    selectRepo(null);
    selectWorkspace(null);
    selectSession(null);
    console.log('Cleared all selections');
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        Test Controls
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button onClick={handleClearSelections} variant="outline" size="sm">
          Clear All Selections
        </Button>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Repo: {selectedRepoPath || 'none'} | Workspace:{' '}
          {selectedWorkspaceId || 'none'} | Session:{' '}
          {selectedSessionId || 'none'}
        </div>
      </div>
      {selectedWorkspaceId && workspaces[selectedWorkspaceId] && (
        <div
          style={{
            marginTop: '8px',
            fontSize: '12px',
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '8px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Current Workspace Info:
          </div>
          <div style={{ display: 'grid', gap: '4px' }}>
            <div>ID: {workspaces[selectedWorkspaceId].id}</div>
            <div>Branch: {workspaces[selectedWorkspaceId].branch}</div>
            <div>Path: {workspaces[selectedWorkspaceId].worktreePath}</div>
            <div>
              Sessions:{' '}
              {sessions[selectedWorkspaceId]
                ?.map((s) => s.sessionId.substring(0, 8) + ' - ' + s.summary)
                .join(', ') || 'None'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestComponent;
