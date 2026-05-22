import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as LinkIcon, X, Plus, FileText, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuotes } from '@/hooks/useQuotes';
import { useSales } from '@/hooks/useSales';
import { Sale } from '@/types/sale';
import { Quote } from '@/types/quote';

interface Props {
  sale: Sale;
}

type Kind = 'quote' | 'sales_order';

export function LinkedDocumentsCard({ sale }: Props) {
  const navigate = useNavigate();
  const { quotes } = useQuotes();
  const { updateLinks } = useSales();

  // Quote picker: all quotes (including converted/sales_order). Label by quote number.
  const quoteOptions = useMemo(() => quotes, [quotes]);
  const salesOrderOptions = useMemo(
    () => quotes.filter((q) => q.status === 'sales_order'),
    [quotes]
  );

  // Auto-detected: quotes whose linkedInvoices include this sale
  const autoDetected = useMemo(() => {
    return quotes.filter((q) =>
      (q.linkedInvoices || []).some((li) => li.saleId === sale.id)
    );
  }, [quotes, sale.id]);

  const autoQuotes = autoDetected.filter((q) => q.status !== 'sales_order');
  const autoSalesOrders = autoDetected.filter((q) => q.status === 'sales_order');

  const linkedQuote = sale.linkedQuoteId
    ? quotes.find((q) => q.id === sale.linkedQuoteId) || null
    : null;
  const linkedSalesOrder = sale.linkedSalesOrderId
    ? quotes.find((q) => q.id === sale.linkedSalesOrderId) || null
    : null;

  const openDoc = (q: Quote, slotKind: Kind) => {
    if (slotKind === 'sales_order') {
      navigate(`/sales-orders/${q.id}`);
    } else {
      navigate('/quotes');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <LinkIcon className="h-4 w-4" /> Linked Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <LinkRow
          icon={<FileText className="h-4 w-4" />}
          label="Quote"
          manualLink={linkedQuote}
          autoLinks={autoQuotes}
          options={quoteOptions}
          kind="quote"
          onPick={(q) => updateLinks(sale.id, { linkedQuoteId: q.id })}
          onUnlink={() => updateLinks(sale.id, { linkedQuoteId: null })}
          onOpen={(q) => openDoc(q, 'quote')}
        />
        <LinkRow
          icon={<ClipboardList className="h-4 w-4" />}
          label="Sales Order"
          manualLink={linkedSalesOrder}
          autoLinks={autoSalesOrders}
          options={salesOrderOptions}
          kind="sales_order"
          onPick={(q) => updateLinks(sale.id, { linkedSalesOrderId: q.id })}
          onUnlink={() => updateLinks(sale.id, { linkedSalesOrderId: null })}
          onOpen={(q) => openDoc(q, 'sales_order')}
        />
      </CardContent>
    </Card>
  );
}

interface LinkRowProps {
  icon: React.ReactNode;
  label: string;
  manualLink: Quote | null;
  autoLinks: Quote[];
  options: Quote[];
  kind: Kind;
  onPick: (q: Quote) => void;
  onUnlink: () => void;
  onOpen: (q: Quote) => void;
}

function LinkRow({
  icon,
  label,
  manualLink,
  autoLinks,
  options,
  kind,
  onPick,
  onUnlink,
  onOpen,
}: LinkRowProps) {
  const [open, setOpen] = useState(false);

  const labelFor = (q: Quote) =>
    kind === 'sales_order' ? q.salesOrderNumber || q.quoteNumber : q.quoteNumber;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[110px]">
        {icon}
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {autoLinks.map((q) => (
          <Badge
            key={`auto-${q.id}`}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => onOpen(q)}
            title="Auto-linked from this document"
          >
            {labelFor(q)}
            <span className="ml-1 text-[10px] text-muted-foreground">auto</span>
          </Badge>
        ))}
        {manualLink && (
          <Badge variant="outline" className="gap-1 pr-1">
            <button
              type="button"
              onClick={() => onOpen(manualLink)}
              className="hover:underline"
            >
              {labelFor(manualLink)}
            </button>
            <button
              type="button"
              onClick={onUnlink}
              className="rounded hover:bg-muted p-0.5"
              aria-label="Unlink"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )}
        {!manualLink && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add link
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
                <CommandList>
                  <CommandEmpty>None found.</CommandEmpty>
                  <CommandGroup>
                    {options.map((q) => (
                      <CommandItem
                        key={q.id}
                        value={`${labelFor(q)} ${q.vendorName || ''}`}
                        onSelect={() => {
                          onPick(q);
                          setOpen(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{labelFor(q)}</span>
                          {q.vendorName && (
                            <span className="text-xs text-muted-foreground">
                              {q.vendorName}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  );
}
