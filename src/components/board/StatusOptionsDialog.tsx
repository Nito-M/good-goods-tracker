import { useState, useEffect } from 'react';
import { Trash2, Plus, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface StatusOption {
  id: string;
  label: string;
  color: string; // palette key
  isAutomatic?: boolean;
}

export const STATUS_COLORS: { key: string; bg: string; text: string }[] = [
  { key: 'gray', bg: 'bg-muted', text: 'text-foreground' },
  { key: 'red', bg: 'bg-red-500/20', text: 'text-red-700 dark:text-red-300' },
  { key: 'orange', bg: 'bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300' },
  { key: 'yellow', bg: 'bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300' },
  { key: 'green', bg: 'bg-green-500/20', text: 'text-green-700 dark:text-green-300' },
  { key: 'teal', bg: 'bg-teal-500/20', text: 'text-teal-700 dark:text-teal-300' },
  { key: 'blue', bg: 'bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300' },
  { key: 'indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-300' },
  { key: 'purple', bg: 'bg-purple-500/20', text: 'text-purple-700 dark:text-purple-300' },
  { key: 'pink', bg: 'bg-pink-500/20', text: 'text-pink-700 dark:text-pink-300' },
];

export function getStatusColorClasses(colorKey: string) {
  return STATUS_COLORS.find((c) => c.key === colorKey) || STATUS_COLORS[0];
}

interface StatusOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialOptions: StatusOption[];
  onSave: (options: StatusOption[]) => void;
}

export function StatusOptionsDialog({ open, onOpenChange, initialOptions, onSave }: StatusOptionsDialogProps) {
  const [options, setOptions] = useState<StatusOption[]>(initialOptions);

  useEffect(() => {
    if (open) setOptions(initialOptions);
  }, [open, initialOptions]);

  const addOption = () => {
    const used = new Set(options.map((o) => o.color));
    const nextColor = STATUS_COLORS.find((c) => !used.has(c.key))?.key || 'gray';
    setOptions((os) => [
      ...os,
      { id: crypto.randomUUID(), label: 'New status', color: nextColor },
    ]);
  };

  const updateOption = (id: string, patch: Partial<StatusOption>) => {
    setOptions((os) => os.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  };

  const deleteOption = (id: string) => {
    setOptions((os) => os.filter((o) => o.id !== id));
  };

  const handleSave = () => {
    const cleaned = options
      .map((o) => ({ ...o, label: o.label.trim() }))
      .filter((o) => o.label.length > 0);
    onSave(cleaned);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage status options</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {options.length === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No options yet — click "Add option" to create one.
            </p>
          )}
          {options.map((opt) => {
            const color = getStatusColorClasses(opt.color);
            return (
              <div key={opt.id} className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1 shrink-0">
                  {STATUS_COLORS.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => updateOption(opt.id, { color: c.key })}
                      className={cn(
                        'h-5 w-5 rounded-full border-2',
                        c.bg,
                        opt.color === c.key ? 'border-foreground' : 'border-transparent'
                      )}
                      title={c.key}
                    />
                  ))}
                </div>
                <Input
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  className={cn('h-8 flex-1', color.bg, color.text)}
                />
                <Button variant="ghost" size="icon" onClick={() => deleteOption(opt.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
          <Button variant="outline" size="sm" onClick={addOption} className="w-full mt-2">
            <Plus className="h-3 w-3" />
            Add option
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
