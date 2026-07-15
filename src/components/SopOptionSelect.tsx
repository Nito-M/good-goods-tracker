import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Kind = 'department' | 'author' | 'approver' | 'revision';

interface Option { id: string; value: string; }

export function SopOptionSelect({
  kind, value, onChange, placeholder,
}: {
  kind: Kind;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Option[]>([]);
  const [newValue, setNewValue] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('sop_options' as any)
      .select('id, value')
      .eq('kind', kind)
      .order('value');
    setOptions(((data as any) || []) as Option[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [kind]);

  const addOption = async () => {
    const v = newValue.trim();
    if (!v || !user) return;
    if (options.some(o => o.value.toLowerCase() === v.toLowerCase())) {
      onChange(v); setNewValue(''); setOpen(false); return;
    }
    const { data, error } = await supabase.from('sop_options' as any)
      .insert({ user_id: user.id, kind, value: v })
      .select('id, value').single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setOptions(prev => [...prev, data as any].sort((a, b) => a.value.localeCompare(b.value)));
    onChange(v);
    setNewValue('');
  };

  const removeOption = async (opt: Option) => {
    const { error } = await supabase.from('sop_options' as any).delete().eq('id', opt.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setOptions(prev => prev.filter(o => o.id !== opt.id));
    if (value === opt.value) onChange('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          <span className={cn(!value && 'text-muted-foreground')}>
            {value || placeholder || 'Select...'}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="max-h-56 overflow-y-auto py-1">
          {options.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No options yet.</div>
          )}
          {options.map(opt => (
            <div key={opt.id} className="flex items-center gap-1 px-2 py-1 hover:bg-accent group">
              <button
                type="button"
                className="flex-1 flex items-center gap-2 text-left text-sm px-1 py-1"
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <Check className={cn('h-3.5 w-3.5', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                <span className="truncate">{opt.value}</span>
              </button>
              <Button
                size="icon" variant="ghost"
                className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                onClick={(e) => { e.stopPropagation(); removeOption(opt); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2 flex gap-1">
          <Input
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
            placeholder="Add new..."
            className="h-8 text-sm"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={addOption} disabled={!newValue.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
