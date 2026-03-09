import { useState, useEffect } from 'react';
import { Store, Save, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function StorefrontSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeName, setStoreName] = useState('Our Shop');
  const [tagline, setTagline] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('storefront_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setStoreName((data as any).store_name || 'Our Shop');
        setTagline((data as any).tagline || '');
        setAnnouncement((data as any).announcement_text || '');
        setLogoUrl((data as any).logo_url || null);
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      store_name: storeName,
      tagline,
      announcement_text: announcement,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    };

    // Upsert
    const { error } = await supabase
      .from('storefront_settings')
      .upsert(payload as any, { onConflict: 'user_id' });

    if (error) {
      toast({ title: 'Error saving settings', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Storefront settings saved' });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/storefront-logo.${ext}`;

    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
      return;
    }
    setLogoUrl(`logos/${path}`);
    toast({ title: 'Logo uploaded — save settings to apply' });
  };

  if (loading) {
    return <div className="text-muted-foreground py-8 text-center">Loading storefront settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Storefront Header
          </CardTitle>
          <CardDescription>
            Customize your public shop page header. Visitors will see this at the top of your store.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Store Name</Label>
            <Input
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="My Store"
            />
          </div>

          <div>
            <Label>Tagline</Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Quality products at great prices"
            />
          </div>

          <div>
            <Label>Announcement Banner</Label>
            <Textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Free shipping on orders over $100! 🎉"
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to hide the announcement bar
            </p>
          </div>

          <div>
            <Label>Store Logo</Label>
            <div className="flex items-center gap-4 mt-1">
              {logoUrl && (
                <div className="h-12 w-12 rounded border border-border overflow-hidden flex items-center justify-center bg-muted/30">
                  <Store className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleLogoUpload(file);
                }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <a
              href="/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Preview Shop
            </a>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
