import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuotes } from '@/hooks/useQuotes';
import { useVendors } from '@/hooks/useVendors';
import { useProfile } from '@/hooks/useProfile';
import { useCompanies } from '@/hooks/useCompanies';
import { Search, FileText, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { generateQuotePDF } from '@/lib/quoteGenerator';
import { QuoteSettings, Quote } from '@/types/quote';

export function SalesOrders() {
  const { quotes, loading: quotesLoading } = useQuotes();
  const { vendors, loading: vendorsLoading } = useVendors();
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const [searchQuery, setSearchQuery] = useState('');

  const loading = quotesLoading || vendorsLoading;

  const quoteSettings = useMemo<QuoteSettings>(() => ({
    businessName: profile?.businessName || null,
    businessAddress: profile?.businessAddress || null,
    businessPhone: profile?.businessPhone || null,
    businessEmail: profile?.businessEmail || null,
    businessNumber: profile?.businessNumber || null,
    thankYouNote: profile?.quoteThankYouNote || null,
    logoUrl: profile?.logoUrl || null,
    layout: profile?.quoteLayout || profile?.invoiceLayout || null,
    validityDays: profile?.quoteValidityDays || null,
  }), [profile]);

  const getQuoteSettingsForQuote = (quote: Quote): QuoteSettings => {
    const companyId = (quote as any).companyId;
    const company = companyId ? companies.find((c: any) => c.id === companyId) : null;
    if (company) {
      return {
        businessName: company.name,
        businessAddress: company.address,
        businessPhone: company.phone,
        businessEmail: company.email,
        businessNumber: company.businessNumber,
        logoUrl: company.logoUrl,
        thankYouNote: company.quoteThankYouNote || quoteSettings.thankYouNote,
        layout: company.quoteLayout || quoteSettings.layout,
        validityDays: company.quoteValidityDays || quoteSettings.validityDays,
      };
    }
    return quoteSettings;
  };

  const acceptedQuotes = useMemo(() => {
    const accepted = quotes.filter((q) => q.status === 'sales_order');

    if (!searchQuery.trim()) return accepted;

    const query = searchQuery.toLowerCase();
    return accepted.filter((q) => {
      const vendorName = q.vendorName?.toLowerCase() || '';
      const quoteNumber = q.quoteNumber.toLowerCase();
      const soNumber = (q.salesOrderNumber || '').toLowerCase();
      return vendorName.includes(query) || quoteNumber.includes(query) || soNumber.includes(query);
    });
  }, [quotes, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sales Orders</h1>
        <p className="text-muted-foreground text-sm">Accepted quotes ready for fulfillment</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by quote # or customer..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {acceptedQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium text-foreground">No sales orders</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? 'No accepted quotes match your search.' : 'Accepted quotes will appear here.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote Number</TableHead>
                <TableHead>Customer Name</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Date Accepted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {acceptedQuotes.map((quote) => {
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      <Link to={`/sales-orders/${quote.id}`} className="text-primary hover:underline">
                        {quote.quoteNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{quote.vendorName || '—'}</TableCell>
                    <TableCell className="text-right">
                      ${quote.total.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {format(new Date(quote.updatedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      {quote.convertedToJobId ? (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Job Created
                        </Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Accepted
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="icon"
                        title="Download Sales Order PDF"
                        onClick={() => generateQuotePDF(quote, getQuoteSettingsForQuote(quote), { isSalesOrder: true })}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
