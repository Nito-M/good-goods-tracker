import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

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

    try {
      const updateData: Record<string, any> = {};
      
      if (input.displayName !== undefined) updateData.display_name = input.displayName;
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl;
      if (input.logoUrl !== undefined) updateData.logo_url = input.logoUrl;
      if (input.businessName !== undefined) updateData.business_name = input.businessName;
      if (input.businessAddress !== undefined) updateData.business_address = input.businessAddress;
      if (input.businessPhone !== undefined) updateData.business_phone = input.businessPhone;
      if (input.businessEmail !== undefined) updateData.business_email = input.businessEmail;
      if (input.businessNumber !== undefined) updateData.business_number = input.businessNumber;
      if (input.invoiceThankYouNote !== undefined) updateData.invoice_thank_you_note = input.invoiceThankYouNote;

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
    } catch (error: any) {
      toast({
        title: 'Error saving settings',
        description: error.message,
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
