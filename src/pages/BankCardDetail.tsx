import { useParams, useNavigate } from 'react-router-dom';
import { useBank, TransactionType } from '@/hooks/useBank';
import { useBankCards, BankCard } from '@/hooks/useBankCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  ArrowLeft,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  DollarSign,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function BankCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, loading: txLoading, deleteTransaction } = useBank();
  const { cards, loading: cardsLoading } = useBankCards();

  const card = cards.find((c) => c.id === id);
  const cardTx = transactions.filter((t) => t.bankCardId === id);

  const loading = txLoading || cardsLoading;

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return <ArrowUpCircle className="h-4 w-4 text-success" />;
      case 'withdrawal': return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      case 'sale_profit': return <TrendingUp className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'deposit': return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Deposit</Badge>;
      case 'withdrawal': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Withdrawal</Badge>;
      case 'sale_profit': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Sale Profit</Badge>;
    }
  };

  const totals = cardTx.reduce(
    (acc, t) => {
      if (t.type === 'deposit') acc.deposits += t.amount;
      else if (t.type === 'withdrawal') acc.withdrawals += t.amount;
      else if (t.type === 'sale_profit') acc.profits += t.amount;
      return acc;
    },
    { deposits: 0, withdrawals: 0, profits: 0 }
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading card...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-muted-foreground">Card not found.</p>
        <Button variant="outline" onClick={() => navigate('/bank')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Bank
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/bank')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{card.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Card Visual */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${card.color} p-6 text-white shadow-lg max-w-sm`}>
          <div className="flex items-start justify-between mb-6">
            <CreditCard className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1">
            {formatCurrency(card.balance)}
          </div>
          <div className="text-sm font-medium opacity-80">{card.name}</div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(totals.deposits)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profits</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.profits)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(totals.withdrawals)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Card Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cardTx.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions for this card yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardTx.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(t.createdAt), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(t.type)}
                          {getTypeBadge(t.type)}
                        </div>
                      </TableCell>
                      <TableCell>{t.description || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        t.type === 'withdrawal' ? 'text-destructive' : 'text-success'
                      }`}>
                        {t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        {t.type !== 'sale_profit' && (
                          <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)}>
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
