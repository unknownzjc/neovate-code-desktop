import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FolderIcon,
  GitBranchIcon,
  PlusSignIcon,
  DeleteIcon,
  SettingsIcon,
  InformationCircleIcon,
  CalendarIcon,
  ClockIcon,
  DatabaseIcon,
  CloudIcon,
} from '@hugeicons/core-free-icons';
import type { RepoData, WorkspaceData } from '../client/types/entities';
import { useStore } from '../store';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from './ui/accordion';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogPopup,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from './ui/alert-dialog';
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from './ui/empty';
import { Button } from './ui/button';
import { AddRepoMenu } from './AddRepoMenu';
import { toastManager } from './ui/toast';

export const RepoSidebar = ({
  repos,
  selectedRepoPath,
  selectedWorkspaceId,
  onSelectRepo,
  onSelectWorkspace,
}: {
  repos: RepoData[];
  selectedRepoPath: string | null;
  selectedWorkspaceId: string | null;
  onSelectRepo: (path: string | null) => void;
  onSelectWorkspace: (id: string | null) => void;
}) => {
  const allRepoIds = repos.map((repo) => repo.path);
  const [openRepos, setOpenRepos] = useState<string[]>(allRepoIds);
  const workspaces = useStore((state) => state.workspaces);
  const deleteRepo = useStore((state) => state.deleteRepo);
  const request = useStore((state) => state.request);
  const addWorkspace = useStore((state) => state.addWorkspace);
  const selectWorkspace = useStore((state) => state.selectWorkspace);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedRepoForDialog, setSelectedRepoForDialog] =
    useState<RepoData | null>(null);

  const handleRepoInfoClick = (repo: RepoData, e: React.MouseEvent) => {
    e.stopPropagation();
    setAlertDialogOpen(false); // Ensure alert is closed
    setSelectedRepoForDialog(repo);
    setDialogOpen(true);
  };

  const handleDeleteRepo = () => {
    setAlertDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedRepoForDialog) {
      deleteRepo(selectedRepoForDialog.path);
      setAlertDialogOpen(false);
      setDialogOpen(false);
      setSelectedRepoForDialog(null);
    }
  };

  React.useEffect(() => {
    setOpenRepos((prev) => {
      const newRepoIds = allRepoIds.filter((id) => !prev.includes(id));
      if (newRepoIds.length > 0) {
        return [...prev, ...newRepoIds];
      }
      return prev;
    });
  }, [allRepoIds.join(',')]);

  const handleNewWorkspace = async (repoPath: string) => {
    if (!openRepos.includes(repoPath)) {
      setOpenRepos((prev) => [...prev, repoPath]);
    }

    try {
      // Step 1: Create workspace
      const createResponse = await request<
        { cwd: string; skipUpdate: boolean },
        {
          success: boolean;
          error?: string;
          data?: { workspace: { name: string; path: string; branch: string } };
        }
      >('project.workspaces.create', {
        cwd: repoPath,
        skipUpdate: true,
      });

      if (!createResponse.success) {
        toastManager.add({
          title: 'Workspace Creation Failed',
          description: createResponse.error || 'Failed to create workspace',
          type: 'error',
        });
        return;
      }

      // Step 2: Fetch full workspace details
      const workspaceId = createResponse.data?.workspace.name;
      if (!workspaceId) {
        toastManager.add({
          title: 'Workspace Creation Failed',
          description: 'Invalid workspace response from server',
          type: 'error',
        });
        return;
      }

      const fetchResponse = await request<
        { cwd: String; workspaceId: string },
        { success: boolean; error?: string; data?: WorkspaceData }
      >('project.workspaces.get', {
        cwd: repoPath,
        workspaceId,
      });

      if (!fetchResponse.success || !fetchResponse.data) {
        toastManager.add({
          title: 'Failed to load workspace',
          description: 'Workspace created but could not load details',
          type: 'warning',
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
        type: 'error',
      });
    }
  };

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <RepoSidebar.Header />

      <div className="flex-1 overflow-y-auto">
        {repos.length === 0 ? (
          <Empty>
            <EmptyMedia variant="icon">
              <HugeiconsIcon
                icon={FolderIcon}
                size={48}
                strokeWidth={1.5}
                style={{ color: 'var(--text-tertiary)' }}
              />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>No repositories</EmptyTitle>
              <EmptyDescription>
                Click the + icon below to add your first repository
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Accordion value={openRepos} onValueChange={setOpenRepos}>
            {repos.map((repo) => (
              <AccordionItem key={repo.path} value={repo.path}>
                <AccordionTrigger className="px-3 py-2 hover:bg-opacity-50">
                  <div className="flex items-center gap-2 flex-1">
                    <HugeiconsIcon
                      icon={FolderIcon}
                      size={18}
                      strokeWidth={1.5}
                    />
                    <span className="font-medium text-sm">{repo.name}</span>
                    <span
                      className="ml-auto text-xs px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--bg-base)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {repo.workspaceIds.length}
                    </span>
                    <button
                      className="p-1 rounded hover:bg-opacity-70"
                      onClick={(e) => handleRepoInfoClick(repo, e)}
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <HugeiconsIcon
                        icon={InformationCircleIcon}
                        size={16}
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>
                </AccordionTrigger>

                <AccordionPanel>
                  <div className="ml-4 space-y-1">
                    <button
                      className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded transition-colors w-full text-left"
                      style={{
                        color: 'var(--text-secondary)',
                        backgroundColor: 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          'var(--bg-base-hover)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => handleNewWorkspace(repo.path)}
                    >
                      <HugeiconsIcon
                        icon={PlusSignIcon}
                        size={16}
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium">New workspace</span>
                    </button>

                    {repo.workspaceIds.map((workspaceId) => {
                      const workspace = workspaces[workspaceId];
                      if (!workspace) return null;

                      const isSelected = selectedWorkspaceId === workspaceId;
                      const changesCount =
                        workspace.gitState.pendingChanges.length;

                      return (
                        <div
                          key={workspaceId}
                          className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded transition-colors"
                          style={{
                            backgroundColor: isSelected
                              ? 'var(--bg-base)'
                              : 'transparent',
                            color: isSelected
                              ? 'var(--text-primary)'
                              : 'var(--text-secondary)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor =
                                'var(--bg-base-hover)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor =
                                'transparent';
                            }
                          }}
                          onClick={() => onSelectWorkspace(workspaceId)}
                        >
                          <HugeiconsIcon
                            icon={GitBranchIcon}
                            size={16}
                            strokeWidth={1.5}
                          />
                          <span className="flex-1 text-sm">
                            {workspace.branch}
                          </span>
                          {changesCount > 0 && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                backgroundColor: '#fef3c7',
                                color: '#92400e',
                              }}
                            >
                              {changesCount}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionPanel>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <RepoSidebar.Footer />

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setAlertDialogOpen(false);
        }}
      >
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Repository Information</DialogTitle>
            <DialogDescription>{selectedRepoForDialog?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <InfoRow
              icon={FolderIcon}
              label="Path"
              value={selectedRepoForDialog?.path || ''}
            />
            <InfoRow
              icon={GitBranchIcon}
              label="Workspaces"
              value={`${selectedRepoForDialog?.workspaceIds.length || 0} worktrees`}
            />
            <InfoRow
              icon={CloudIcon}
              label="Remote URL"
              value="https://github.com/user/repo.git"
            />
            <InfoRow icon={ClockIcon} label="Last Commit" value="2 hours ago" />
            <InfoRow
              icon={DatabaseIcon}
              label="Repository Size"
              value="12.5 MB"
            />
            <InfoRow
              icon={CalendarIcon}
              label="Created"
              value={new Date().toLocaleDateString()}
            />
          </div>

          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteRepo}
              className="gap-2"
            >
              <HugeiconsIcon icon={DeleteIcon} size={16} strokeWidth={1.5} />
              Delete Repository
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>

      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRepoForDialog &&
                `This will permanently delete '${selectedRepoForDialog.name}' and its ${selectedRepoForDialog.workspaceIds.length} workspace(s). This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose>
              <Button variant="outline">Cancel</Button>
            </AlertDialogClose>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="gap-2"
            >
              <HugeiconsIcon icon={DeleteIcon} size={16} strokeWidth={1.5} />
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>
    </div>
  );
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <HugeiconsIcon
        icon={icon}
        size={16}
        strokeWidth={1.5}
        style={{ color: 'var(--text-secondary)', marginTop: '2px' }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium mb-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </div>
        <div
          className="text-sm break-all"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

RepoSidebar.Header = function Header() {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <h2 className="text-base font-semibold">Repositories</h2>
    </div>
  );
};

RepoSidebar.Footer = function Footer() {
  return (
    <div
      className="px-3 py-2 flex gap-2"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <AddRepoMenu>
        <button
          className="p-2 rounded hover:bg-opacity-70 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} />
        </button>
      </AddRepoMenu>
      <button
        className="p-2 rounded hover:bg-opacity-70 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onClick={() => alert('Not implemented')}
      >
        <HugeiconsIcon icon={SettingsIcon} size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
};
