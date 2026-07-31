import { useState } from 'react';
import { Copy, LayoutDashboard, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { DASHBOARD_TEMPLATES } from '@/lib/dashboard/presets';
import { DashboardConfig, ROLE_LABELS, RoleKey } from '@/lib/dashboard/types';

interface Props {
  dashboards: DashboardConfig[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreate: (name: string, base?: DashboardConfig) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onApplyRole: (role: RoleKey) => void;
}

export function DashboardSwitcher({
  dashboards,
  activeId,
  onSelect,
  onCreate,
  onRename,
  onDelete,
  onDuplicate,
  onApplyRole,
}: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('home');
  const active = dashboards.find((d) => d.id === activeId);

  const create = () => {
    const tpl = DASHBOARD_TEMPLATES.find((t) => t.key === template);
    const base = tpl ? tpl.build() : undefined;
    onCreate(name.trim() || base?.name || 'New dashboard', base);
    setName('');
    setCreateOpen(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-card p-1">
        {dashboards.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onSelect(d.id)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              d.id === activeId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            )}
          >
            {d.name}
          </button>
        ))}
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          aria-label="New dashboard"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <LayoutDashboard className="mr-1.5 h-4 w-4" />
            Dashboards
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{active?.name ?? 'Dashboard'}</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              setName(active?.name ?? '');
              setRenameOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => active && onDuplicate(active.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => active && onDelete(active.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Role defaults
          </DropdownMenuLabel>
          {(Object.keys(ROLE_LABELS) as RoleKey[]).map((role) => (
            <DropdownMenuItem key={role} onClick={() => onApplyRole(role)}>
              {ROLE_LABELS[role]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New dashboard</DialogTitle>
            <DialogDescription>
              Start from a template or a blank canvas — you can add unlimited dashboards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Warehouse"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DASHBOARD_TEMPLATES.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename dashboard</DialogTitle>
          </DialogHeader>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (active) onRename(active.id, name);
                setRenameOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
