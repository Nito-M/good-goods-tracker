import { Link } from 'react-router-dom';
import { useSales } from '@/hooks/useSales';
import { formatCurrencyPdf } from '@/lib/utils';
import { WidgetEmpty, WidgetList } from './primitives';

export function RecentOrdersWidget({
  limit = 7,
  showLink = true,
}: {
  limit?: number;
  showLink?: boolean;
}) {
  const { sales, loading } = useSales();

  const recent = [...sales]
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
    .slice(0, limit);

  return (
    <div className="space-y-3">
      {loading ? (
        <WidgetEmpty>Loading orders…</WidgetEmpty>
      ) : recent.length === 0 ? (
        <WidgetEmpty>No orders yet.</WidgetEmpty>
      ) : (
        <WidgetList
          items={recent.map((s) => ({
            id: s.id,
            primary: `${s.invoiceNumber || 'Invoice'}${s.vendorName ? ` · ${s.vendorName}` : ''}`,
            secondary: `${s.status}${s.createdAt ? ` · ${s.createdAt.slice(0, 10)}` : ''}`,
            trailing: formatCurrencyPdf(s.total || 0),
            tone: s.status === 'paid' ? 'success' : 'info',
          }))}
        />
      )}
      {showLink && (
        <Link to="/sales" className="block text-xs font-medium text-primary hover:underline">
          View all orders →
        </Link>
      )}
    </div>
  );
}
