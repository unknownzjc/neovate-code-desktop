import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  HomeIcon,
  FileIcon,
  FolderIcon,
  SettingsIcon,
  SearchIcon,
  PlusSignIcon,
  DeleteIcon,
  EditIcon,
  FloppyDiskIcon,
  CopyIcon,
  CheckmarkCircleIcon,
  CancelIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MailIcon,
  MessageIcon,
  UserIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  FavouriteIcon,
  ThumbsUpIcon,
  ShareIcon,
  DownloadIcon,
  UploadIcon,
  CloudIcon,
  DatabaseIcon,
  CodeIcon,
  ComputerTerminalIcon,
  BugIcon,
  GitBranchIcon,
} from '@hugeicons/core-free-icons';

export const TestHugeIcons = () => {
  const iconSize = 24;
  const iconColor = 'var(--text-primary)';

  const iconSections = [
    {
      title: 'Navigation',
      icons: [
        { name: 'Home', icon: HomeIcon },
        { name: 'Search', icon: SearchIcon },
        { name: 'Arrow Left', icon: ArrowLeftIcon },
        { name: 'Arrow Right', icon: ArrowRightIcon },
        { name: 'Arrow Up', icon: ArrowUpIcon },
        { name: 'Arrow Down', icon: ArrowDownIcon },
      ],
    },
    {
      title: 'Files & Folders',
      icons: [
        { name: 'File', icon: FileIcon },
        { name: 'Folder', icon: FolderIcon },
        { name: 'Save', icon: FloppyDiskIcon },
        { name: 'Copy', icon: CopyIcon },
        { name: 'Download', icon: DownloadIcon },
        { name: 'Upload', icon: UploadIcon },
      ],
    },
    {
      title: 'Actions',
      icons: [
        { name: 'Plus', icon: PlusSignIcon },
        { name: 'Delete', icon: DeleteIcon },
        { name: 'Edit', icon: EditIcon },
        { name: 'Checkmark', icon: CheckmarkCircleIcon },
        { name: 'Cancel', icon: CancelIcon },
        { name: 'Settings', icon: SettingsIcon },
      ],
    },
    {
      title: 'Communication',
      icons: [
        { name: 'Mail', icon: MailIcon },
        { name: 'Message', icon: MessageIcon },
        { name: 'Share', icon: ShareIcon },
      ],
    },
    {
      title: 'People',
      icons: [
        { name: 'User', icon: UserIcon },
        { name: 'Users', icon: UserGroupIcon },
      ],
    },
    {
      title: 'Time & Date',
      icons: [
        { name: 'Calendar', icon: CalendarIcon },
        { name: 'Clock', icon: ClockIcon },
      ],
    },
    {
      title: 'Favorites',
      icons: [
        { name: 'Star', icon: StarIcon },
        { name: 'Favourite', icon: FavouriteIcon },
        { name: 'Thumbs Up', icon: ThumbsUpIcon },
      ],
    },
    {
      title: 'Development',
      icons: [
        { name: 'Code', icon: CodeIcon },
        { name: 'Terminal', icon: ComputerTerminalIcon },
        { name: 'Bug', icon: BugIcon },
        { name: 'Git Branch', icon: GitBranchIcon },
        { name: 'Database', icon: DatabaseIcon },
        { name: 'Cloud', icon: CloudIcon },
      ],
    },
  ];

  return (
    <div
      className="p-6 rounded-lg"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
      }}
    >
      <h2 className="text-2xl font-bold mb-6">HugeIcons Test Showcase</h2>
      <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        A showcase of various icons from @hugeicons/react and
        @hugeicons/core-free-icons. This library provides 4,400+ free icons.
        Import the HugeiconsIcon component from @hugeicons/react and icon data
        from @hugeicons/core-free-icons.
      </p>

      <div className="space-y-8">
        {iconSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-lg font-semibold mb-4">{section.title}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {section.icons.map(({ name, icon }) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-opacity-50 transition-all cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                  }}
                  title={name}
                >
                  <HugeiconsIcon
                    icon={icon}
                    size={iconSize}
                    color={iconColor}
                    strokeWidth={1.5}
                  />
                  <span
                    className="text-xs text-center"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div
        className="mt-8 pt-6 border-t"
        style={{ borderColor: 'var(--border-base)' }}
      >
        <h3 className="text-lg font-semibold mb-4">Icon Variants & Sizes</h3>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex flex-col items-center gap-2">
            <HugeiconsIcon
              icon={HomeIcon}
              size={16}
              color={iconColor}
              strokeWidth={1.5}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              16px
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HugeiconsIcon
              icon={HomeIcon}
              size={24}
              color={iconColor}
              strokeWidth={1.5}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              24px
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HugeiconsIcon
              icon={HomeIcon}
              size={32}
              color={iconColor}
              strokeWidth={1.5}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              32px
            </span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <HugeiconsIcon
              icon={HomeIcon}
              size={48}
              color={iconColor}
              strokeWidth={1.5}
            />
            <span
              className="text-xs"
              style={{ color: 'var(--text-secondary)' }}
            >
              48px
            </span>
          </div>
        </div>
      </div>

      <div
        className="mt-8 pt-6 border-t"
        style={{ borderColor: 'var(--border-base)' }}
      >
        <h3 className="text-lg font-semibold mb-4">Usage Example</h3>
        <pre
          className="p-4 rounded-lg text-xs overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-base)',
            color: 'var(--text-primary)',
          }}
        >
          {`import { HugeiconsIcon } from '@hugeicons/react';
import { SearchIcon, HomeIcon } from '@hugeicons/core-free-icons';

// Basic usage
<HugeiconsIcon icon={SearchIcon} />

// With custom size and color
<HugeiconsIcon
  icon={HomeIcon}
  size={32}
  color="#4361EE"
  strokeWidth={1.5}
/>

// With alternate icon (for interactive states)
<HugeiconsIcon
  icon={SearchIcon}
  altIcon={CancelIcon}
  showAlt={isActive}
/>`}
        </pre>
      </div>
    </div>
  );
};
