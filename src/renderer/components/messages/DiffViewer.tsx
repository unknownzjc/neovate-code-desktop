import { useMemo } from 'react';
import { createTwoFilesPatch } from 'diff';
import type { DiffViewerProps } from './types';

/**
 * Parse diff output into structured lines
 */
interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
}

function parseDiff(diff: string): DiffLine[] {
  const lines = diff.split('\n');
  const result: DiffLine[] = [];

  for (const line of lines) {
    if (line.startsWith('+++') || line.startsWith('---')) {
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('+')) {
      result.push({ type: 'add', content: line });
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line });
    } else if (line.startsWith('@@')) {
      // Skip hunk headers for simplified view
      continue;
    } else {
      // result.push({ type: 'context', content: line });
    }
  }

  return result;
}

/**
 * DiffViewer component
 * Displays file differences in a simple, color-coded format
 */
export function DiffViewer({
  originalContent,
  newContent,
  filePath,
}: DiffViewerProps) {
  const diffLines = useMemo(() => {
    const patch = createTwoFilesPatch(
      filePath,
      filePath,
      originalContent,
      newContent,
      'Original',
      'Modified',
    );
    return parseDiff(patch);
  }, [originalContent, newContent, filePath]);

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '6px',
        padding: '12px',
        marginTop: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        overflowX: 'auto',
        maxHeight: '400px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        {filePath}
      </div>
      {diffLines.map((line, index) => {
        let color = 'var(--text-primary)';
        let backgroundColor = 'transparent';

        if (line.type === 'add') {
          color = '#22c55e';
          backgroundColor = 'rgba(34, 197, 94, 0.1)';
        } else if (line.type === 'remove') {
          color = '#ef4444';
          backgroundColor = 'rgba(239, 68, 68, 0.1)';
        } else if (line.type === 'header') {
          color = 'var(--text-secondary)';
          return null; // Skip header lines for simplified view
        }

        return (
          <div
            key={index}
            style={{
              color,
              backgroundColor,
              padding: '2px 4px',
              // whiteSpace: 'pre',
            }}
          >
            {line.content}
          </div>
        );
      })}
    </div>
  );
}
