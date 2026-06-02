import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface BankCard {
  id: string;
  userId: string;
  name: string;
  balance: number;
  color: string;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useBankCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const queryKey = ['bank_cards', user?.id] as const;

  const { data, isPending, refetch } = useQuery({
    queryKey,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_cards')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map((c: any): BankCard => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        balance: Number(c.balance),
        color: c.color,
        category: c.category || null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addCard = async (name: string, balance: number, color: string, category?: string | null) => {
    if (!user) return false;
    try {
      const { error } = await supabase.from('bank_cards').insert({
        user_id: user.id,
        name,
        balance,
        color,
        category: category || null,
      } as any);
      if (error) throw error;
      toast({ title: 'Card added', description: `"${name}" card created.` });
      invalidate();
      return true;
    } catch (e) {
      console.error('Error adding card:', e);
      toast({ title: 'Error adding card', variant: 'destructive' });
      return false;
    }
  };

  const updateCard = async (id: string, updates: Partial<Pick<BankCard, 'name' | 'balance' | 'color' | 'category'>>) => {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.balance !== undefined) payload.balance = updates.balance;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.category !== undefined) payload.category = updates.category;

      const { error } = await supabase.from('bank_cards').update(payload).eq('id', id);
      if (error) throw error;
      invalidate();
      return true;
    } catch (e) {
      console.error('Error updating card:', e);
      toast({ title: 'Error updating card', variant: 'destructive' });
      return false;
    }
  };

  const deleteCard = async (id: string) => {
    try {
      const { error } = await supabase.from('bank_cards').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Card deleted' });
      invalidate();
      return true;
    } catch (e) {
      console.error('Error deleting card:', e);
      toast({ title: 'Error deleting card', variant: 'destructive' });
      return false;
    }
  };

  return {
    cards: data ?? [],
    loading: !!user && isPending,
    addCard,
    updateCard,
    deleteCard,
    refetch: () => refetch().then(() => undefined),
  };
}
