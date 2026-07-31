import { Link } from 'react-router-dom';
import { Pin } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { WidgetEmpty } from './primitives';

export function NotesWidget() {
  const { notes, loading } = useNotes();

  const visible = notes.filter((n) => !n.archived && !n.deletedAt).slice(0, 5);

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading notes…</WidgetEmpty>
      ) : visible.length === 0 ? (
        <WidgetEmpty>No notes yet.</WidgetEmpty>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => (
            <li key={n.id} className="rounded-lg border border-border bg-muted/40 p-2.5">
              <div className="flex items-center gap-1.5">
                {n.isPinned && <Pin className="h-3 w-3 text-primary" />}
                <p className="truncate text-sm font-medium text-foreground">
                  {n.title || 'Untitled note'}
                </p>
              </div>
              {n.content && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.content}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <Link to="/notes" className="block text-xs font-medium text-primary hover:underline">
        Open notes →
      </Link>
    </div>
  );
}
