import { useState } from 'react';
import { Plus, Type, Calendar as CalIcon, CheckSquare, Tag, Paperclip, Link as LinkIcon, Link2, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

export type BoardColumnType = 'text' | 'date' | 'checkbox' | 'status' | 'files' | 'link' | 'connect' | 'price';

interface AddColumnPopoverProps {
  onAdd: (name: string, type: BoardColumnType) => void;
}

const TYPES: { type: BoardColumnType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'price', label: 'Price', icon: DollarSign },
  { type: 'date', label: 'Date', icon: CalIcon },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'status', label: 'Status', icon: Tag },
  { type: 'files', label: 'Files', icon: Paperclip },
  { type: 'link', label: 'Link', icon: LinkIcon },
  { type: 'connect', label: 'Connect board', icon: Link2 },
];

export function AddColumnPopover({ onAdd }: AddColumnPopoverProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const handleAdd = (type: BoardColumnType) => {
    const finalName = name.trim() || defaultNameForType(type);
    onAdd(finalName, type);
    setName('');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Add column">
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground">Column name (optional)</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled"
              className="h-8 mt-1"
            />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Type</p>
            {TYPES.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleAdd(type)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-sm text-left"
              >
                <Icon className="h-4 w-4 text-muted-foreground" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function defaultNameForType(type: BoardColumnType): string {
  const map: Record<BoardColumnType, string> = {
    text: 'Text',
    date: 'Date',
    checkbox: 'Checkbox',
    status: 'Status',
    files: 'Files',
    link: 'Link',
    connect: 'Connect board',
    price: 'Price',
  };
  return map[type];
}
