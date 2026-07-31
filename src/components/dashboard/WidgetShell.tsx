import { ReactNode, useState } from 'react';
import {
  GripVertical,
  Maximize2,
  Settings2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  WIDGET_SIZE_CLASSES,
  WIDGET_SIZE_LABELS,
  WidgetSize,
} from '@/types/dashboard';

interface WidgetShellProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  size: WidgetSize;
  editing: boolean;
  onSizeChange: (size: WidgetSize) => void;
  onTitleChange: (title: string) => void;
  onRemove: () => void;
  onDropWidget: (fromId: string) => void;
  children: ReactNode;
}

export function WidgetShell({
  id,
  title,
  icon: Icon,
  size,
  editing,
  onSizeChange,
  onTitleChange,
  onRemove,
  onDropWidget,
  children,
}: WidgetShellProps) {
  const [draggable, setDraggable] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [titleDraft, setTitleDraft] = useState(title);

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
              aria-label="Expand widget"
              onClick={() => setExpanded(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Widget settings">
                  <Settings2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => onTitleChange(titleDraft)}
                    onKeyDown={(e) => e.key === 'Enter' && onTitleChange(titleDraft)}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Size</Label>
                  <Select value={size} onValueChange={(v) => onSizeChange(v as WidgetSize)}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(WIDGET_SIZE_LABELS) as WidgetSize[]).map((s) => (
                        <SelectItem key={s} value={s}>
                          {WIDGET_SIZE_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </PopoverContent>
            </Popover>
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
        <div className="flex-1 p-4">{children}</div>
      </section>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {Icon && <Icon className="h-4 w-4 text-primary" />}
              {title}
            </DialogTitle>
          </DialogHeader>
          <div className="pt-2">{children}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
