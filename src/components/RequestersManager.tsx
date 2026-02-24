import { useState } from 'react';
import { Plus, Trash2, Users, ChevronDown, Link2 } from 'lucide-react';
import { useOrgRequesters } from '@/hooks/useOrgRequesters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RequestersManagerProps {
  onRequestersChanged?: () => void;
}

export function RequestersManager({ onRequestersChanged }: RequestersManagerProps) {
  const { requesters, members, loading, addRequester, deleteRequester, linkRequester, unlinkRequester } = useOrgRequesters();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addRequester(newName);
    setNewName('');
    onRequestersChanged?.();
  };

  const handleDelete = async (id: string) => {
    await deleteRequester(id);
    onRequestersChanged?.();
  };

  const handleLinkChange = async (requesterId: string, value: string) => {
    if (value === '__none__') {
      await unlinkRequester(requesterId);
    } else {
      await linkRequester(requesterId, value);
    }
    onRequestersChanged?.();
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="outline" className="gap-2 w-full justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Manage Requesters ({requesters.length})
          </span>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-3 rounded-lg border bg-card p-4 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <>
            {/* Add new requester */}
            <div className="flex gap-2">
              <Input
                placeholder="New requester name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="flex-1"
              />
              <Button size="sm" onClick={handleAdd} disabled={!newName.trim()} className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            {/* Requester list */}
            {requesters.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No requesters yet</p>
            ) : (
              <div className="space-y-2">
                {requesters.map((r) => {
                  const linkedMember = r.linked_user_id
                    ? members.find(m => m.userId === r.linked_user_id)
                    : null;

                  return (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded-md border bg-background">
                      <span className="font-medium text-sm flex-1 min-w-0 truncate">{r.name}</span>
                      <div className="flex items-center gap-1.5">
                        <Link2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Select
                          value={r.linked_user_id || '__none__'}
                          onValueChange={(val) => handleLinkChange(r.id, val)}
                        >
                          <SelectTrigger className="h-7 text-xs w-40">
                            <SelectValue placeholder="Link user" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Not linked</SelectItem>
                            {members.map(m => (
                              <SelectItem key={m.userId} value={m.userId}>
                                {m.displayName || m.userId.slice(0, 8)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground shrink-0"
                        onClick={() => handleDelete(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
