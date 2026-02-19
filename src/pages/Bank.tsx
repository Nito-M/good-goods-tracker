import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBank, TransactionType, BankTransaction } from '@/hooks/useBank';
import { useBankCards, BankCard } from '@/hooks/useBankCards';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
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
  CreditCard,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CARD_COLORS = [
  { label: 'Blue', value: 'from-blue-600 to-blue-800' },
  { label: 'Purple', value: 'from-purple-600 to-purple-800' },
  { label: 'Green', value: 'from-emerald-600 to-emerald-800' },
  { label: 'Red', value: 'from-red-600 to-red-800' },
  { label: 'Orange', value: 'from-orange-500 to-orange-700' },
  { label: 'Gray', value: 'from-gray-600 to-gray-800' },
];

function BankCardVisual({ card, transactions, onEdit, onDelete }: { 
  card: BankCard; 
  transactions: import('@/hooks/useBank').BankTransaction[];
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 min-w-[280px] max-w-sm">
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${card.color} p-5 text-white shadow-lg cursor-pointer select-none hover:opacity-90 transition-opacity`}
        onClick={() => navigate(`/bank/card/${card.id}`)}
      >
        <div className="flex items-start justify-between mb-6">
          <CreditCard className="h-7 w-7 opacity-80" />
          <div className="flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1 rounded hover:bg-white/20 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-white/20 transition-colors">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight mb-1">
          {formatCurrency(card.balance)}
        </div>
        <div className="text-sm font-medium opacity-80 truncate">{card.name}</div>
        <div className="mt-3 text-xs opacity-70 flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} — tap to view
        </div>
      </div>
    </div>
  );
}

interface CardFormProps {
  initial?: { name: string; balance: string; color: string };
  onSave: (name: string, balance: number, color: string) => void;
  onCancel: () => void;
  saveLabel?: string;
}

function CardForm({ initial, onSave, onCancel, saveLabel = 'Add Card' }: CardFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [balance, setBalance] = useState(initial?.balance ?? '');
  const [color, setColor] = useState(initial?.color ?? CARD_COLORS[0].value);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), parseFloat(balance) || 0, color);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-2">
        <Label>Card Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Business Visa" />
      </div>
      <div className="space-y-2">
        <Label>Balance ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          placeholder="0.00"
        />
      </div>
      <div className="space-y-2">
        <Label>Color</Label>
        <div className="flex gap-2 flex-wrap">
          {CARD_COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                color === c.value ? 'border-foreground scale-110' : 'border-transparent'
              }`}
              title={c.label}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        <Button onClick={handleSave} className="flex-1">{saveLabel}</Button>
      </div>
    </div>
  );
}

export function Bank() {
  const navigate = useNavigate();
  const { transactions, balance, loading, addDeposit, addWithdrawal, deleteTransaction } = useBank();
  const { cards, addCard, updateCard, deleteCard } = useBankCards();
  const { orders } = usePurchaseOrders();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addCardOpen, setAddCardOpen] = useState(false);
  const [editCard, setEditCard] = useState<BankCard | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    const success = await addDeposit(numAmount, description || undefined);
    if (success) { setDepositOpen(false); setAmount(''); setDescription(''); }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;
    const success = await addWithdrawal(numAmount, description || undefined);
    if (success) { setWithdrawOpen(false); setAmount(''); setDescription(''); }
  };

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

  // Find which PO a withdrawal transaction refers to (by matching description)
  const findPoForTransaction = (t: BankTransaction) => {
    if (t.type !== 'withdrawal') return null;
    const desc = t.description || '';
    const match = desc.match(/Payment for (PO-\d+)/);
    if (!match) return null;
    const poNumber = match[1];
    return orders.find((o) => o.poNumber === poNumber) ?? null;
  };

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
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">Bank</h1>
            <div className="flex gap-2">
              {/* Add Card */}
              <Dialog open={addCardOpen} onOpenChange={setAddCardOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Bank Card</DialogTitle></DialogHeader>
                  <CardForm
                    onSave={async (name, bal, color) => {
                      const ok = await addCard(name, bal, color);
                      if (ok) setAddCardOpen(false);
                    }}
                    onCancel={() => setAddCardOpen(false)}
                  />
                </DialogContent>
              </Dialog>

              {/* Deposit */}
              <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Deposit</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Deposit</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Amount</Label>
                      <Input id="deposit-amount" type="number" step="0.00001" min="0" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-description">Description <span className="text-sky-400 font-normal">(optional)</span></Label>
                      <Input id="deposit-description" placeholder="e.g., Initial capital" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <Button onClick={handleDeposit} className="w-full">Add Deposit</Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Withdraw */}
              <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Minus className="h-4 w-4 mr-2" />Withdraw</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Withdraw Funds</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Amount</Label>
                      <Input id="withdraw-amount" type="number" step="0.00001" min="0" max={balance} placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                      <p className="text-xs text-muted-foreground">Available: {formatCurrency(balance)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-description">Description <span className="text-sky-400 font-normal">(optional)</span></Label>
                      <Input id="withdraw-description" placeholder="e.g., Business expense" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                    <Button onClick={handleWithdraw} className="w-full">Withdraw</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading bank...</div>
          </div>
        ) : (
          <>
            {/* Bank Cards Section */}
            {cards.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  My Cards
                </h2>
                <div className="flex gap-4 flex-wrap">
                  {cards.map((card) => (
                    <BankCardVisual
                      key={card.id}
                      card={card}
                      transactions={transactions.filter(t => t.bankCardId === card.id)}
                      onEdit={() => setEditCard(card)}
                      onDelete={() => deleteCard(card.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Edit Card Dialog */}
            {editCard && (
              <Dialog open={!!editCard} onOpenChange={(o) => { if (!o) setEditCard(null); }}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Edit Card</DialogTitle></DialogHeader>
                  <CardForm
                    initial={{ name: editCard.name, balance: String(editCard.balance), color: editCard.color }}
                    saveLabel="Save Changes"
                    onSave={async (name, bal, color) => {
                      await updateCard(editCard.id, { name, balance: bal, color });
                      setEditCard(null);
                    }}
                    onCancel={() => setEditCard(null)}
                  />
                </DialogContent>
              </Dialog>
            )}

            {/* Main Bank Overview */}
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                Overall Bank
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-primary/30 bg-primary/5">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                    <Wallet className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-primary">{formatCurrency(balance)}</div>
                  </CardContent>
                </Card>

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
                          <TableHead>Card</TableHead>
                          <TableHead>Link</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((t) => {
                          const linkedCard = t.bankCardId ? cards.find((c) => c.id === t.bankCardId) : null;
                          const linkedPo = findPoForTransaction(t);
                          return (
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
                            <TableCell>
                              {linkedCard ? (
                                <button
                                  onClick={() => navigate(`/bank/card/${linkedCard.id}`)}
                                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                                >
                                  <CreditCard className="h-3.5 w-3.5" />
                                  {linkedCard.name}
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {linkedPo ? (
                                <button
                                  onClick={() => navigate(`/purchase-orders`)}
                                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                                  title={`Go to ${linkedPo.poNumber}`}
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {linkedPo.poNumber}
                                </button>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </TableCell>
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
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
