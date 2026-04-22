import { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, Eye, EyeOff, Pencil } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useBoardAccess, type ColumnPermission } from '@/hooks/useBoardAccess';
import type { BoardColumn } from '@/hooks/useBoard';

interface BoardAccessSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  organizationId: string | null;
  columns: BoardColumn[];
}

const PERMISSION_OPTIONS: { value: ColumnPermission; label: string; icon: typeof Eye }[] = [
  { value: 'edit', label: 'Full access', icon: Pencil },
  { value: 'view', label: 'View only', icon: Eye },
  { value: 'hidden', label: 'Hidden', icon: EyeOff },
];

export function BoardAccessSheet({
  open,
  onOpenChange,
  boardId,
  organizationId,
  columns,
}: BoardAccessSheetProps) {
  const {
    members,
    accessUserIds,
    boardOwnerId,
    loading,
    isOwnerOrAdmin,
    setMemberAccess,
    setColumnPermission,
    getColumnPermission,
  } = useBoardAccess(boardId, organizationId);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-0"
      >
        <div className="p-6 space-y-1 border-b border-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Board Access
            </SheetTitle>
            <SheetDescription>
              Control which org members can see this board and what they can do with each column.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="p-6 space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading members…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No org members found. Add members in your organization settings first.
            </p>
          ) : (
            members.map((m) => {
              const isAdminMember = isOwnerOrAdmin(m.user_id);
              const isOwner = m.user_id === boardOwnerId;
              const hasAccess = isAdminMember || accessUserIds.has(m.user_id);
              const isExpanded = !!expanded[m.user_id];
              const initials =
                (m.display_name || m.email || '?')
                  .split(/\s+/)
                  .map((p) => p[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || '?';

              return (
                <div
                  key={m.user_id}
                  className="border border-border rounded-lg bg-card overflow-hidden"
                >
                  <div className="flex items-center gap-3 p-3">
                    <div className="h-9 w-9 rounded-full bg-primary/15 text-primary text-sm font-semibold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {m.display_name || m.email || 'Unknown'}
                        </p>
                        {isOwner && (
                          <Badge variant="secondary" className="text-xs">
                            Owner
                          </Badge>
                        )}
                        {!isOwner && isAdminMember && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                      </div>
                      {m.email && (
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        Has access
                      </span>
                      <Switch
                        checked={hasAccess}
                        disabled={isAdminMember}
                        onCheckedChange={(v) => setMemberAccess(m.user_id, v)}
                      />
                    </div>
                  </div>

                  {hasAccess && !isAdminMember && (
                    <>
                      <button
                        onClick={() =>
                          setExpanded((s) => ({ ...s, [m.user_id]: !s[m.user_id] }))
                        }
                        className="w-full flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:bg-accent border-t border-border"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        Column permissions ({columns.length})
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/30 p-3 space-y-2">
                          {columns.map((col) => {
                            const current = getColumnPermission(col.id, m.user_id);
                            return (
                              <div
                                key={col.id}
                                className="flex items-center gap-2 flex-wrap"
                              >
                                <p className="text-sm font-medium flex-1 min-w-[120px] truncate">
                                  {col.name}
                                </p>
                                <div className="flex gap-1">
                                  {PERMISSION_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const active = current === opt.value;
                                    return (
                                      <Button
                                        key={opt.value}
                                        type="button"
                                        size="sm"
                                        variant={active ? 'default' : 'outline'}
                                        className={cn(
                                          'h-7 px-2 text-xs',
                                          active && opt.value === 'hidden' && 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                                          active && opt.value === 'view' && 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
                                        )}
                                        onClick={() =>
                                          setColumnPermission(col.id, m.user_id, opt.value)
                                        }
                                      >
                                        <Icon className="h-3 w-3 mr-1" />
                                        {opt.label}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
