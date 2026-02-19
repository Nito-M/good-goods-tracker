import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export type TransactionType = 'deposit' | 'withdrawal' | 'sale_profit';

export interface BankTransaction {
  id: string;
  userId: string;
  amount: number;
  type: TransactionType;
  description: string | null;
  saleId: string | null;
  bankCardId: string | null;
  createdAt: string;
}

export function useBank() {
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const balance = useMemo(() => {
    return transactions.reduce((sum, t) => {
      if (t.type === 'withdrawal') {
        return sum - t.amount;
      }
      return sum + t.amount;
    }, 0);
  }, [transactions]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mapped: BankTransaction[] = (data || []).map((t) => ({
        id: t.id,
        userId: t.user_id,
        amount: Number(t.amount),
        type: t.type as TransactionType,
        description: t.description,
        saleId: t.sale_id,
        bankCardId: (t as any).bank_card_id ?? null,
        createdAt: t.created_at,
      }));

      setTransactions(mapped);
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      toast({
        title: 'Error loading bank',
        description: 'Unable to load bank transactions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const addDeposit = async (amount: number, description?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase.from('bank_transactions').insert({
        user_id: user.id,
        amount,
        type: 'deposit',
        description: description || 'Manual deposit',
      });

      if (error) throw error;

      toast({
        title: 'Deposit added',
        description: `$${amount.toFixed(2)} deposited to bank`,
      });

      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error adding deposit:', error);
      toast({
        title: 'Error adding deposit',
        description: 'Unable to add deposit. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addWithdrawal = async (amount: number, description?: string) => {
    if (!user) return false;

    if (amount > balance) {
      toast({
        title: 'Insufficient funds',
        description: 'Withdrawal amount exceeds current balance.',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { error } = await supabase.from('bank_transactions').insert({
        user_id: user.id,
        amount,
        type: 'withdrawal',
        description: description || 'Manual withdrawal',
      });

      if (error) throw error;

      toast({
        title: 'Withdrawal processed',
        description: `$${amount.toFixed(2)} withdrawn from bank`,
      });

      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error adding withdrawal:', error);
      toast({
        title: 'Error processing withdrawal',
        description: 'Unable to process withdrawal. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addSaleRevenue = async (saleId: string, total: number, invoiceNumber: string) => {
    if (!user) return false;

    try {
      // Check if this sale already has a revenue entry
      const { data: existing } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('sale_id', saleId)
        .eq('type', 'sale_profit')
        .single();

      if (existing) {
        // Already recorded
        return true;
      }

      const { error } = await supabase.from('bank_transactions').insert({
        user_id: user.id,
        amount: total,
        type: 'sale_profit',
        description: `Revenue from ${invoiceNumber}`,
        sale_id: saleId,
      });

      if (error) throw error;

      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error adding sale profit:', error);
      return false;
    }
  };

  const removeSaleProfit = async (saleId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('sale_id', saleId)
        .eq('type', 'sale_profit');

      if (error) throw error;

      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Error removing sale profit:', error);
      return false;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('bank_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Transaction deleted',
        description: 'The transaction has been removed.',
      });

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast({
        title: 'Error deleting transaction',
        description: 'Unable to delete transaction. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return {
    transactions,
    balance,
    loading,
    addDeposit,
    addWithdrawal,
    addSaleRevenue,
    removeSaleProfit,
    deleteTransaction,
    refetch: fetchTransactions,
  };
}
