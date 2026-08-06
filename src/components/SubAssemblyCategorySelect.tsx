import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Plus, Trash2, Pencil, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Category { id: string; name: string; }

export function SubAssemblyCategorySelect({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  className?: string;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const load = async () => {
    const { data } = await supabase
      .from('parts_assembly_categories' as any)
      .select('id, name')
      .order('name');
    setCategories(((data as any) || []) as Category[]);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user]);

  const addCategory = async () => {
    const name = newName.trim();
    if (!name || !user) return;
    const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      onChange(existing.name);
      setNewName('');
      setOpen(false);
      return;
    }
    const { data, error } = await supabase
      .from('parts_assembly_categories' as any)
      .insert({ user_id: user.id, name })
      .select('id, name')
      .single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCategories(prev => [...prev, data as any as Category].sort((a, b) => a.name.localeCompare(b.name)));
    onChange(name);
    setNewName('');
  };

  const removeCategory = async (cat: Category) => {
    const { error } = await supabase.from('parts_assembly_categories' as any).delete().eq('id', cat.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    setCategories(prev => prev.filter(c => c.id !== cat.id));
    if (value === cat.name) onChange(null);
  };

  const saveEdit = async (cat: Category) => {
    const name = editingName.trim();
    if (!name) return;
    if (name === cat.name) { setEditingId(null); return; }
    const { error } = await supabase.from('parts_assembly_categories' as any).update({ name }).eq('id', cat.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    // Re-point any sub assemblies using the old name
    await supabase.from('parts_assemblies' as any).update({ category: name }).eq('category', cat.name);
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name } : c).sort((a, b) => a.name.localeCompare(b.name)));
    if (value === cat.name) onChange(name);
    setEditingId(null);
    setEditingName('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" role="combobox" className={cn('justify-between font-normal h-7 px-2 text-sm', className)}>
          <span className={cn(!value && 'text-muted-foreground')}>{value || 'Set category…'}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="max-h-56 overflow-y-auto py-1">
          {categories.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No categories yet.</div>
          )}
          {value && (
            <button
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              onClick={() => { onChange(null); setOpen(false); }}
            >
              Clear category
            </button>
          )}
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-1 px-2 py-1 hover:bg-accent group">
              {editingId === cat.id ? (
                <>
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); saveEdit(cat); }
                      else if (e.key === 'Escape') { e.preventDefault(); setEditingId(null); }
                    }}
                    className="h-7 text-sm flex-1"
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => saveEdit(cat)}>
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex-1 flex items-center gap-2 text-left text-sm px-1 py-1"
                    onClick={() => { onChange(cat.name); setOpen(false); }}
                  >
                    <Check className={cn('h-3.5 w-3.5', value === cat.name ? 'opacity-100' : 'opacity-0')} />
                    <span className="truncate">{cat.name}</span>
                  </button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setEditingId(cat.id); setEditingName(cat.name); }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon" variant="ghost"
                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); removeCategory(cat); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-border p-2 flex gap-1">
          <Input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } }}
            placeholder="Add category..."
            className="h-8 text-sm"
          />
          <Button size="icon" className="h-8 w-8 shrink-0" onClick={addCategory} disabled={!newName.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
