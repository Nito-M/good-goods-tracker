import { useState } from 'react';
import { Plus, X, ExternalLink, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomerLinks, type CustomerLink } from '@/hooks/useCustomerLinks';

interface Props { customerId: string }

function normalizeUrl(v: string): string {
  const t = v.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t) || /^mailto:/i.test(t) || /^tel:/i.test(t)) return t;
  return `https://${t}`;
}

export function CustomerLinksSection({ customerId }: Props) {
  const { links, addLink, updateLink, removeLink } = useCustomerLinks(customerId);
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const resetAdd = () => { setAdding(false); setNewLabel(''); setNewUrl(''); };

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    await addLink(newUrl, newLabel);
    resetAdd();
  };

  const startEdit = (l: CustomerLink) => {
    setEditingId(l.id);
    setEditLabel(l.label || '');
    setEditUrl(l.url);
  };

  const commitEdit = async () => {
    if (!editingId) return;
    await updateLink(editingId, { url: editUrl.trim(), label: editLabel.trim() || null });
    setEditingId(null);
  };

  return (
    <div className="space-y-2">
      {links.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No links added yet.</p>
      )}
      <div className="space-y-2">
        {links.map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
            {editingId === l.id ? (
              <>
                <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Label (optional)" className="h-8 w-48" />
                <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="h-8 flex-1" />
                <Button type="button" size="sm" variant="ghost" onClick={commitEdit} title="Save"><Check className="h-4 w-4" /></Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)} title="Cancel"><X className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                <a href={normalizeUrl(l.url)} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-sm text-primary hover:underline" title={l.url}>
                  {l.label ? <span className="font-medium text-foreground mr-2">{l.label}:</span> : null}
                  {l.url}
                </a>
                <Button type="button" size="sm" variant="ghost" onClick={() => startEdit(l)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeLink(l.id)} title="Remove" className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        ))}
      </div>

      {adding ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Label (optional)" className="h-8 w-48" />
          <Input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." className="h-8 flex-1" autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') resetAdd(); }} />
          <Button type="button" size="sm" onClick={handleAdd} disabled={!newUrl.trim()}>Add</Button>
          <Button type="button" size="sm" variant="ghost" onClick={resetAdd}>Cancel</Button>
        </div>
      ) : (
        <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" /> Add link
        </Button>
      )}
    </div>
  );
}
