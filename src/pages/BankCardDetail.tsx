import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBank, TransactionType } from '@/hooks/useBank';
import { useBankCards } from '@/hooks/useBankCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  Plus,
  Minus,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const CARD_COLORS = [
  { label: 'Blue', value: 'from-blue-600 to-blue-800' },
  { label: 'Purple', value: 'from-purple-600 to-purple-800' },
  { label: 'Green', value: 'from-emerald-600 to-emerald-800' },
  { label: 'Red', value: 'from-red-600 to-red-800' },
  { label: 'Orange', value: 'from-orange-500 to-orange-700' },
  { label: 'Gray', value: 'from-gray-600 to-gray-800' },
  { label: 'Teal', value: 'from-teal-500 to-teal-700' },
  { label: 'Cyan', value: 'from-cyan-500 to-cyan-700' },
  { label: 'Indigo', value: 'from-indigo-600 to-indigo-800' },
  { label: 'Violet', value: 'from-violet-600 to-violet-800' },
  { label: 'Fuchsia', value: 'from-fuchsia-600 to-fuchsia-800' },
  { label: 'Pink', value: 'from-pink-500 to-pink-700' },
  { label: 'Rose', value: 'from-rose-500 to-rose-700' },
  { label: 'Amber', value: 'from-amber-500 to-amber-700' },
  { label: 'Yellow', value: 'from-yellow-500 to-yellow-700' },
  { label: 'Lime', value: 'from-lime-500 to-lime-700' },
  { label: 'Sky', value: 'from-sky-500 to-sky-700' },
  { label: 'Slate', value: 'from-slate-600 to-slate-800' },
  { label: 'Zinc', value: 'from-zinc-600 to-zinc-800' },
  { label: 'Stone', value: 'from-stone-600 to-stone-800' },
  { label: 'Midnight', value: 'from-blue-900 to-indigo-950' },
  { label: 'Forest', value: 'from-green-700 to-emerald-900' },
  { label: 'Sunset', value: 'from-orange-500 to-pink-600' },
  { label: 'Ocean', value: 'from-cyan-600 to-blue-800' },
  { label: 'Lavender', value: 'from-purple-400 to-indigo-600' },
  { label: 'Crimson', value: 'from-red-700 to-rose-900' },
];

export function BankCardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, loading: txLoading, deleteTransaction, addCardDeposit, addDeposit, addWithdrawal, updateTransactionAmount } = useBank();
  const { cards, loading: cardsLoading, refetch: refetchCards, updateCard, deleteCard } = useBankCards();

  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [depositCardId, setDepositCardId] = useState(id || '');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawCardId, setWithdrawCardId] = useState(id || '');

  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCategory, setEditCategory] = useState('');

  const [editTxOpen, setEditTxOpen] = useState(false);
  const [editTxId, setEditTxId] = useState('');
  const [editTxAmount, setEditTxAmount] = useState('');
  const [editTxSaving, setEditTxSaving] = useState(false);

  const card = cards.find((c) => c.id === id);
  const cardTx = transactions.filter((t) => t.bankCardId === id);
  const loading = txLoading || cardsLoading;

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    setDepositing(true);
    const targetCardId = depositCardId && depositCardId !== 'none' ? depositCardId : undefined;
    let ok: boolean;
    if (targetCardId) {
      ok = await addCardDeposit(targetCardId, amount, depositDescription || undefined);
    } else {
      ok = await addDeposit(amount, depositDescription || undefined);
    }
    if (ok) {
      await refetchCards();
      setDepositOpen(false);
      setDepositAmount('');
      setDepositDescription('');
      setDepositCardId(id || '');
    }
    setDepositing(false);
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) return;
    setWithdrawing(true);
    const targetCardId = withdrawCardId && withdrawCardId !== 'none' ? withdrawCardId : undefined;
    const ok = await addWithdrawal(amount, withdrawDescription || undefined, targetCardId);
    if (ok) {
      await refetchCards();
      setWithdrawOpen(false);
      setWithdrawAmount('');
      setWithdrawDescription('');
      setWithdrawCardId(id || '');
    }
    setWithdrawing(false);
  };

  const openEdit = () => {
    if (!card) return;
    setEditName(card.name);
    setEditColor(card.color);
    setEditCategory(card.category || '');
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!id || !editName.trim()) return;
    await updateCard(id, { name: editName.trim(), color: editColor, category: editCategory.trim() || null });
    await refetchCards();
    setEditOpen(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteCard(id);
    navigate('/bank');
  };

  const openEditTx = (txId: string, currentAmount: number) => {
    setEditTxId(txId);
    setEditTxAmount(String(currentAmount));
    setEditTxOpen(true);
  };

  const handleEditTx = async () => {
    const newAmount = parseFloat(editTxAmount);
    if (isNaN(newAmount) || newAmount <= 0) return;
    setEditTxSaving(true);
    const ok = await updateTransactionAmount(editTxId, newAmount);
    if (ok) {
      await refetchCards();
      setEditTxOpen(false);
    }
    setEditTxSaving(false);
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
      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={(open) => { setDepositOpen(open); if (open) setDepositCardId(id || ''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Input placeholder="e.g. Monthly funding" value={depositDescription} onChange={(e) => setDepositDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Card</Label>
              <Select value={depositCardId} onValueChange={setDepositCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="No card (general bank)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No card (general bank)</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDepositOpen(false)}>Cancel</Button>
            <Button onClick={handleDeposit} disabled={depositing || !depositAmount}>
              {depositing ? 'Adding...' : 'Add Deposit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={withdrawOpen} onOpenChange={(open) => { setWithdrawOpen(open); if (open) setWithdrawCardId(id || ''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" min="0.01" step="0.01" placeholder="0.00" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <Input placeholder="e.g. Business expense" value={withdrawDescription} onChange={(e) => setWithdrawDescription(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Card</Label>
              <Select value={withdrawCardId} onValueChange={setWithdrawCardId}>
                <SelectTrigger>
                  <SelectValue placeholder="No card (general bank)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No card (general bank)</SelectItem>
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleWithdraw} disabled={withdrawing || !withdrawAmount}>
              {withdrawing ? 'Processing...' : 'Withdraw'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Card Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Card Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Business Visa" />
            </div>
            <div className="space-y-2">
              <Label>Category <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="e.g. Business, Personal, Petty Cash" />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {CARD_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setEditColor(c.value)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${c.value} border-2 transition-all ${
                      editColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                    }`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Amount Dialog */}
      <Dialog open={editTxOpen} onOpenChange={setEditTxOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction Amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>New Amount</Label>
              <Input type="number" min="0.01" step="0.01" value={editTxAmount} onChange={(e) => setEditTxAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTxOpen(false)}>Cancel</Button>
            <Button onClick={handleEditTx} disabled={editTxSaving || !editTxAmount}>
              {editTxSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete "{card.name}"?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>Deleting this card will:</p>
                <ul className="list-disc list-inside space-y-1 text-foreground/80">
                  <li>Permanently remove the card and its settings</li>
                  <li><strong>{cardTx.length} transaction{cardTx.length !== 1 ? 's' : ''}</strong> linked to this card will remain in the overall ledger but will no longer show a card association</li>
                  <li>The card balance of <strong>{formatCurrency(card.balance)}</strong> will be lost from this card (overall bank transactions are unaffected)</li>
                </ul>
                <p className="text-destructive font-medium">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/bank')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{card.name}</h1>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="icon" onClick={openEdit} title="Edit card">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteConfirmOpen(true)} title="Delete card" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => setWithdrawOpen(true)}>
                <Minus className="h-4 w-4 mr-2" /> Withdraw
              </Button>
              <Button onClick={() => setDepositOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Deposit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Card Visual */}
        <div className={`relative rounded-2xl bg-gradient-to-br ${card.color} p-6 text-white shadow-lg max-w-sm`}>
          <div className="flex items-start justify-between mb-6">
            <CreditCard className="h-8 w-8 opacity-80" />
          </div>
          <div className="text-2xl font-bold tracking-tight truncate mb-1">
            {card.name}
          </div>
          <div className="text-4xl font-bold tracking-tight">
            {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(card.balance)}
          </div>
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
                    <TableHead className="w-[80px]"></TableHead>
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
                      <TableCell>
                        {t.description ? (() => {
                          const poMatch = t.description.match(/(PO-\d+)/);
                          if (poMatch) {
                            const parts = t.description.split(poMatch[1]);
                            return (
                              <span>
                                {parts[0]}
                                <button
                                  onClick={() => navigate(`/purchase-orders?po=${encodeURIComponent(poMatch[1])}`)}
                                  className="text-primary hover:underline font-medium"
                                >
                                  {poMatch[1]}
                                </button>
                                {parts[1]}
                              </span>
                            );
                          }
                          return t.description;
                        })() : '-'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        t.type === 'withdrawal' ? 'text-destructive' : 'text-success'
                      }`}>
                        {t.type === 'withdrawal' ? '-' : '+'}{formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        {t.type !== 'sale_profit' && (
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditTx(t.id, t.amount)} title="Edit amount">
                              <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteTransaction(t.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
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
