import { ReactNode, useEffect, useState } from 'react';
import {
  GripVertical,
  Maximize2,
  RefreshCw,
  Settings2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { WIDGET_SIZE_CLASSES, WidgetSize } from '@/lib/dashboard/types';

interface WidgetShellProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  size: WidgetSize;
  editing: boolean;
  /** seconds; 0 disables auto refresh */
  refreshInterval?: number;
  onOpenSettings: () => void;
  onRemove: () => void;
  onDropWidget: (fromId: string) => void;
  children: (refreshKey: number) => ReactNode;
}

export function WidgetShell({
  id,
  title,
  icon: Icon,
  size,
  editing,
  refreshInterval = 0,
  onOpenSettings,
  onRemove,
  onDropWidget,
  children,
}: WidgetShellProps) {
  const [draggable, setDraggable] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;
    const t = window.setInterval(() => setRefreshKey((k) => k + 1), refreshInterval * 1000);
    return () => window.clearInterval(t);
  }, [refreshInterval]);

  return (
    <>
      <section
        draggable={draggable}
        onDragStart={(e) => e.dataTransfer.setData('text/widget-id', id)}
        onDragEnd={() => setDraggable(false)}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('text/widget-id')) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const from = e.dataTransfer.getData('text/widget-id');
          if (from && from !== id) onDropWidget(from);
        }}
        className={cn(
          'group col-span-1 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all',
          'hover:shadow-md',
          WIDGET_SIZE_CLASSES[size],
          dragOver && 'ring-2 ring-primary',
          editing && 'border-dashed'
        )}
      >
        <header className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span
            onMouseDown={() => setDraggable(true)}
            onMouseUp={() => setDraggable(false)}
            onTouchStart={() => setDraggable(true)}
            className={cn(
              'cursor-grab text-muted-foreground transition-opacity active:cursor-grabbing',
              editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            )}
            aria-label="Drag widget"
          >
            <GripVertical className="h-4 w-4" />
          </span>
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          <h3 className="flex-1 truncate text-sm font-semibold text-card-foreground">{title}</h3>

          <div
            className={cn(
              'flex items-center gap-0.5 transition-opacity',
              editing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
            )}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Refresh widget"
              onClick={() => setRefreshKey((k) => k + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Expand widget"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              aria-label="Widget settings"
              onClick={onOpenSettings}
            >
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Remove widget"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </header>
        <div className="flex-1 p-4">{children(refreshKey)}</div>
      </section>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div>{children(refreshKey)}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
