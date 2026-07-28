import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function ItemCsvExport() {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      const pageSize = 1000;
      let from = 0;
      const all: any[] = [];
      // Paginate to bypass Supabase default row cap
      while (true) {
        const { data, error } = await supabase
          .from('inventory_items')
          .select('id, name, sku, description, category, subcategory, quantity, quantity_unit, price, cost, min_stock, max_stock, weight, weight_unit')
          .is('deleted_at', null)
          .order('name', { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      const { data: vps } = await supabase
        .from('item_vendor_prices')
        .select('item_id, vendors:vendor_id(name)');
      const vendorsByItem = new Map<string, string[]>();
      (vps || []).forEach((r: any) => {
        const list = vendorsByItem.get(r.item_id) || [];
        if (r.vendors?.name) list.push(r.vendors.name);
        vendorsByItem.set(r.item_id, list);
      });

      const { data: tags } = await supabase
        .from('item_tags')
        .select('item_id, tag');
      const tagsByItem = new Map<string, string[]>();
      (tags || []).forEach((r: any) => {
        const list = tagsByItem.get(r.item_id) || [];
        list.push(r.tag);
        tagsByItem.set(r.item_id, list);
      });

      const headers = [
        'Name', 'Description', 'Tags', 'Unit', 'Vendors',
        'Part Number', 'Category', 'Subcategory',
        'Quantity', 'Price', 'Cost', 'Min Stock', 'Max Stock',
        'Weight', 'Weight Unit',
      ];
      const lines = [headers.join(',')];
      for (const it of all as any[]) {
        const vendorNames = vendorsByItem.get(it.id) || [];
        const tagList = tagsByItem.get(it.id) || [];
        lines.push([
          it.name,
          it.description || '',
          tagList.join(', '),
          it.quantity_unit || 'pcs',
          vendorNames.join(', '),
          it.sku || '',
          it.category || '',
          it.subcategory || '',
          it.quantity ?? 0,
          it.price ?? 0,
          it.cost ?? 0,
          it.min_stock ?? 0,
          it.max_stock ?? 0,
          it.weight ?? 0,
          it.weight_unit || '',
        ].map(csvEscape).join(','));
      }

      const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);

      toast({ title: `Exported ${all.length} item${all.length !== 1 ? 's' : ''}` });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Unknown error', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" className="gap-2" onClick={handleExport} disabled={busy}>
      <Download className="h-4 w-4" /> {busy ? 'Exporting...' : 'Export CSV'}
    </Button>
  );
}
