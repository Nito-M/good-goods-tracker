import { useState } from 'react';
import { useBank, TransactionType } from '@/hooks/useBank';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Wallet,
  Plus,
  Minus,
  TrendingUp,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Trash2,
} from 'lucide-react';

export function Bank() {
  const { transactions, balance, loading, addDeposit, addWithdrawal, deleteTransaction } = useBank();
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const success = await addDeposit(numAmount, description || undefined);
    if (success) {
      setDepositOpen(false);
      setAmount('');
      setDescription('');
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const success = await addWithdrawal(numAmount, description || undefined);
    if (success) {
      setWithdrawOpen(false);
      setAmount('');
      setDescription('');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="h-4 w-4 text-success" />;
      case 'withdrawal':
        return <ArrowDownCircle className="h-4 w-4 text-destructive" />;
      case 'sale_profit':
        return <TrendingUp className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'deposit':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Deposit</Badge>;
      case 'withdrawal':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Withdrawal</Badge>;
      case 'sale_profit':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Sale Profit</Badge>;
    }
  };

  // Calculate totals by type
  const totals = transactions.reduce(
    (acc, t) => {
      if (t.type === 'deposit') acc.deposits += t.amount;
      else if (t.type === 'withdrawal') acc.withdrawals += t.amount;
      else if (t.type === 'sale_profit') acc.profits += t.amount;
      return acc;
    },
    { deposits: 0, withdrawals: 0, profits: 0 }
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">
              Bank
            </h1>
            <div className="flex gap-2">
              <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Deposit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-description">Description <span className="text-sky-400 font-normal">(optional)</span></Label>
                      <Input
                        id="deposit-description"
                        placeholder="e.g., Initial capital"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleDeposit} className="w-full">
                      Add Deposit
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Minus className="h-4 w-4 mr-2" />
                    Withdraw
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Withdraw Funds</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        max={balance}
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Available: {formatCurrency(balance)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-description">Description <span className="text-sky-400 font-normal">(optional)</span></Label>
                      <Input
                        id="withdraw-description"
                        placeholder="e.g., Business expense"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleWithdraw} className="w-full">
                      Withdraw
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading bank...</div>
          </div>
        ) : (
          <>
            {/* Balance Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                  <Wallet className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    {formatCurrency(balance)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
                  <ArrowUpCircle className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {formatCurrency(totals.deposits)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Profits</CardTitle>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totals.profits)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
                  <ArrowDownCircle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(totals.withdrawals)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transaction History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Transaction History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet. Add a deposit to get started.
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
                      {transactions.map((t) => (
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
                            {t.type === 'withdrawal' ? '-' : '+'}
                            {formatCurrency(t.amount)}
                          </TableCell>
                          <TableCell>
                            {t.type !== 'sale_profit' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteTransaction(t.id)}
                              >
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
          </>
        )}
      </main>
    </div>
  );
}
