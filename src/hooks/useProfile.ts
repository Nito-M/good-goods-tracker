import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { profileSchema, validateInput } from '@/lib/validation';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';

export interface Profile {
  id: string;
  userId: string;
  displayName: string | null;
  avatarUrl: string | null;
  logoUrl: string | null;
  businessName: string | null;
  businessAddress: string | null;
  businessPhone: string | null;
  businessEmail: string | null;
  businessNumber: string | null;
  invoiceThankYouNote: string | null;
  theme: string | null;
  colorTheme: string | null;
  backgroundTheme: string | null;
  invoiceLayout: InvoiceLayout;
  quoteThankYouNote: string | null;
  quoteValidityDays: number;
  quoteLayout: InvoiceLayout;
}

export interface UpdateProfileInput {
  displayName?: string | null;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  businessName?: string | null;
  businessAddress?: string | null;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessNumber?: string | null;
  invoiceThankYouNote?: string | null;
  theme?: string | null;
  colorTheme?: string | null;
  backgroundTheme?: string | null;
  invoiceLayout?: InvoiceLayout | null;
  quoteThankYouNote?: string | null;
  quoteValidityDays?: number;
  quoteLayout?: InvoiceLayout | null;
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setProfile({
        id: data.id,
        userId: data.user_id,
        displayName: data.display_name,
        avatarUrl: data.avatar_url,
        logoUrl: data.logo_url,
        businessName: data.business_name,
        businessAddress: data.business_address,
        businessPhone: data.business_phone,
        businessEmail: data.business_email,
        businessNumber: data.business_number,
        invoiceThankYouNote: data.invoice_thank_you_note,
        theme: data.theme,
        colorTheme: data.color_theme,
        backgroundTheme: data.background_theme,
        invoiceLayout: (data.invoice_layout as unknown as InvoiceLayout) || defaultInvoiceLayout,
        quoteThankYouNote: (data as any).quote_thank_you_note,
        quoteValidityDays: (data as any).quote_validity_days || 30,
        quoteLayout: ((data as any).quote_layout as unknown as InvoiceLayout) || defaultInvoiceLayout,
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (input: UpdateProfileInput) => {
    if (!user) return false;

    // Validate input
    const validation = validateInput(profileSchema.partial(), input);
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return false;
    }

    try {
      const updateData: Record<string, unknown> = {};
      
      if (validation.data.displayName !== undefined) updateData.display_name = validation.data.displayName;
      if (validation.data.avatarUrl !== undefined) updateData.avatar_url = validation.data.avatarUrl;
      if (validation.data.logoUrl !== undefined) updateData.logo_url = validation.data.logoUrl;
      if (validation.data.businessName !== undefined) updateData.business_name = validation.data.businessName;
      if (validation.data.businessAddress !== undefined) updateData.business_address = validation.data.businessAddress;
      if (validation.data.businessPhone !== undefined) updateData.business_phone = validation.data.businessPhone;
      if (validation.data.businessEmail !== undefined) updateData.business_email = validation.data.businessEmail;
      if (validation.data.businessNumber !== undefined) updateData.business_number = validation.data.businessNumber;
      if (validation.data.invoiceThankYouNote !== undefined) updateData.invoice_thank_you_note = validation.data.invoiceThankYouNote;
      if (validation.data.theme !== undefined) updateData.theme = validation.data.theme;
      if (validation.data.colorTheme !== undefined) updateData.color_theme = validation.data.colorTheme;
      if (validation.data.backgroundTheme !== undefined) updateData.background_theme = validation.data.backgroundTheme;
      if (input.invoiceLayout !== undefined) updateData.invoice_layout = input.invoiceLayout;
      if ((input as any).quoteThankYouNote !== undefined) updateData.quote_thank_you_note = (input as any).quoteThankYouNote;
      if ((input as any).quoteValidityDays !== undefined) updateData.quote_validity_days = (input as any).quoteValidityDays;
      if ((input as any).quoteLayout !== undefined) updateData.quote_layout = (input as any).quoteLayout;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Settings saved',
        description: 'Your invoice settings have been updated',
      });

      await fetchProfile();
      return true;
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error saving settings',
        description: 'Unable to save settings. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    profile,
    loading,
    updateProfile,
    refetch: fetchProfile,
  };
}
