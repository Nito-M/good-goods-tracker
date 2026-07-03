import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import { History, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { useOrgUserNames } from '@/hooks/useOrgUserNames';

interface Props {
  assemblyId: string;
  assemblyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface HistoryEntry {
  id: string;
  changed_by: string | null;
  old_price: number | null;
  new_price: number;
  created_at: string;
}

export function AssemblyPriceHistoryDialog({ assemblyId, assemblyName, open, onOpenChange }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const userIds = Array.from(new Set(entries.map(e => e.changed_by).filter((v): v is string => !!v)));
  const { names } = useOrgUserNames(userIds);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (supabase as any)
      .from('assembly_price_history')
      .select('*')
      .eq('assembly_id', assemblyId)
      .order('created_at', { ascending: false })
      .then(({ data, error }: any) => {
        if (!error) setEntries((data || []) as HistoryEntry[]);
        setLoading(false);
      });
  }, [open, assemblyId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Price History — {assemblyName}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No price changes recorded yet.</div>
          ) : (
            <div className="space-y-2">
              {entries.map((e) => {
                const diff = e.old_price != null ? e.new_price - e.old_price : null;
                const Icon = diff == null ? Minus : diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
                const color = diff == null ? 'text-muted-foreground' : diff > 0 ? 'text-green-600' : diff < 0 ? 'text-destructive' : 'text-muted-foreground';
                return (
                  <div key={e.id} className="flex items-center justify-between border rounded-md px-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <div>
                        <div className="font-medium">
                          {e.old_price != null ? (
                            <>{formatCurrency(e.old_price)} → {formatCurrency(e.new_price)}</>
                          ) : (
                            <>Set to {formatCurrency(e.new_price)}</>
                          )}
                          {diff != null && diff !== 0 && (
                            <span className={`ml-2 text-xs ${color}`}>({diff > 0 ? '+' : ''}{formatCurrency(diff)})</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(e.created_at).toLocaleString()}
                          {e.changed_by && names[e.changed_by] && <> · by {names[e.changed_by]}</>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
