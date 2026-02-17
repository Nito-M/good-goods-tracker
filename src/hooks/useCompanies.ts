import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Company {
  id: string;
  userId: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  businessNumber: string | null;
  logoUrl: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInput {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  businessNumber?: string | null;
  logoUrl?: string | null;
  isDefault?: boolean;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name');

    if (error) {
      console.error('Error fetching companies:', error);
      setLoading(false);
      return;
    }

    setCompanies(
      (data || []).map((c: any) => ({
        id: c.id,
        userId: c.user_id,
        name: c.name,
        address: c.address,
        phone: c.phone,
        email: c.email,
        businessNumber: c.business_number,
        logoUrl: c.logo_url,
        isDefault: c.is_default,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      }))
    );
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const addCompany = async (input: CompanyInput) => {
    if (!user) return;

    // If setting as default, unset others first
    if (input.isDefault) {
      await supabase
        .from('companies')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { error } = await supabase.from('companies').insert({
      user_id: user.id,
      name: input.name,
      address: input.address || null,
      phone: input.phone || null,
      email: input.email || null,
      business_number: input.businessNumber || null,
      logo_url: input.logoUrl || null,
      is_default: input.isDefault || false,
    });

    if (error) {
      console.error('Error adding company:', error);
      toast({ title: 'Error adding company', variant: 'destructive' });
      return;
    }

    toast({ title: 'Company added' });
    fetchCompanies();
  };

  const updateCompany = async (id: string, input: Partial<CompanyInput>) => {
    if (!user) return;

    if (input.isDefault) {
      await supabase
        .from('companies')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.address !== undefined) updateData.address = input.address || null;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.businessNumber !== undefined) updateData.business_number = input.businessNumber || null;
    if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl || null;
    if (input.isDefault !== undefined) updateData.is_default = input.isDefault;

    const { error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating company:', error);
      toast({ title: 'Error updating company', variant: 'destructive' });
      return;
    }

    toast({ title: 'Company updated' });
    fetchCompanies();
  };

  const deleteCompany = async (id: string) => {
    const { error } = await supabase.from('companies').delete().eq('id', id);

    if (error) {
      console.error('Error deleting company:', error);
      toast({ title: 'Error deleting company', variant: 'destructive' });
      return;
    }

    toast({ title: 'Company deleted' });
    fetchCompanies();
  };

  const defaultCompany = companies.find((c) => c.isDefault) || companies[0] || null;

  return { companies, loading, addCompany, updateCompany, deleteCompany, defaultCompany, fetchCompanies };
}
