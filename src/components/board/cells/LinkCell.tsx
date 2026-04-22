import { useState, useEffect, useRef } from 'react';
import { ExternalLink, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface LinkCellProps {
  value: string;
  onSave: (value: string) => void;
  readOnly?: boolean;
}

function normalizeUrl(v: string): string {
  const trimmed = v.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function LinkCell({ value, onSave, readOnly }: LinkCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== value) onSave(draft.trim());
  };

  if (editing && !readOnly) {
    return (
      <Input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        placeholder="https://example.com"
        className="h-8 border-0 rounded-none focus-visible:ring-1 focus-visible:ring-inset"
      />
    );
  }

  if (!value) {
    if (readOnly) {
      return <div className="px-2 py-1.5 text-xs text-muted-foreground">—</div>;
    }
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full h-full px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <LinkIcon className="h-3 w-3" />
        Add link
      </button>
    );
  }

  const href = normalizeUrl(value);
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 group/link">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 truncate text-sm text-primary hover:underline flex items-center gap-1"
        title={value}
      >
        <ExternalLink className="h-3 w-3 shrink-0" />
        <span className="truncate">{value}</span>
      </a>
      {!readOnly && (
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover/link:opacity-100"
          title="Edit"
        >
          Edit
        </button>
      )}
    </div>
  );
}
