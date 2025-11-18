import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { MainLayout } from './components';
import { TestHugeIcons } from './components/test';
import { mockData } from './mockData';

function App() {
  // Get state and actions from the store
  const {
    repos,
    selectedRepoPath,
    selectedWorkspaceId,
    selectedSessionId,
    selectRepo,
    selectWorkspace,
    selectSession,
    addMessage,
    addRepo,
    addWorkspace,
    addSession,
    request,
  } = useStore();

  // Initialize store with mock data
  useEffect(() => {
    // Check if we already have data in the store
    if (Object.keys(repos).length === 0) {
      // Add mock repos
      Object.values(mockData.repos).forEach((repo) => {
        addRepo(repo);
      });

      // Add mock workspaces
      Object.values(mockData.workspaces).forEach((workspace) => {
        addWorkspace(workspace);
      });

      // Add mock sessions
      Object.values(mockData.sessions).forEach((session) => {
        addSession(session);
      });

      // Select the first repo and workspace by default
      const firstRepo = Object.values(mockData.repos)[0];
      if (firstRepo) {
        selectRepo(firstRepo.path);

        const firstWorkspaceId = firstRepo.workspaceIds[0];
        if (firstWorkspaceId) {
          selectWorkspace(firstWorkspaceId);

          const firstWorkspace = mockData.workspaces[firstWorkspaceId];
          if (firstWorkspace && firstWorkspace.sessionIds.length > 0) {
            selectSession(firstWorkspace.sessionIds[0]);
          }
        }
      }
    }
  }, []);

  // Mock function to send a message
  const handleSendMessage = async (content: string) => {
    if (selectedSessionId) {
      // In a real implementation, this would send the message via WebSocket
      // For now, we'll just add it directly to the store
      addMessage(selectedSessionId, {
        role: 'user',
        content,
      });

      // Simulate a response after a short delay
      setTimeout(() => {
        if (selectedSessionId) {
          addMessage(selectedSessionId, {
            role: 'assistant',
            content: `Echo: ${content}`,
          });
        }
      }, 1000);
    }
  };

  // Mock function to execute a command
  const handleExecuteCommand = async (command: string) => {
    // In a real implementation, this would send the command via WebSocket
    console.log(`Executing command: ${command}`);
    // For now, we'll just simulate the execution
    return Promise.resolve();
  };

  return (
    <div className="h-screen flex flex-col">
      <MainLayout
        repos={Object.values(repos)}
        selectedRepoPath={selectedRepoPath}
        selectedWorkspaceId={selectedWorkspaceId}
        selectedSessionId={selectedSessionId}
        onSelectRepo={selectRepo}
        onSelectWorkspace={selectWorkspace}
        onSelectSession={selectSession}
        onSendMessage={handleSendMessage}
        onExecuteCommand={handleExecuteCommand}
      />
      <div className="p-4 overflow-auto">
        <TestHugeIcons />
      </div>
    </div>
  );
}

export default App;
