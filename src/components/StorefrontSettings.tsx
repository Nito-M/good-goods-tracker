import { useState, useEffect } from 'react';
import { Store, Save, ExternalLink, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrgOption {
  id: string;
  name: string;
  slug: string | null;
  storefront_enabled: boolean;
}

export function StorefrontSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Org selection
  const [orgs, setOrgs] = useState<OrgOption[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Org-level settings
  const [storefrontEnabled, setStorefrontEnabled] = useState(false);
  const [slug, setSlug] = useState('');

  // Storefront branding
  const [storeName, setStoreName] = useState('Our Shop');
  const [tagline, setTagline] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Load orgs the user is admin/owner of
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .in('role', ['owner', 'admin']);

      if (!memberships || memberships.length === 0) {
        setLoading(false);
        return;
      }

      const orgIds = memberships.map((m) => m.organization_id);
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name, slug, storefront_enabled')
        .in('id', orgIds);

      const orgList = (orgData || []) as OrgOption[];
      setOrgs(orgList);
      if (orgList.length > 0) {
        setSelectedOrgId(orgList[0].id);
      }
      setLoading(false);
    })();
  }, [user]);

  // Load settings when selected org changes
  useEffect(() => {
    if (!selectedOrgId) return;
    const org = orgs.find((o) => o.id === selectedOrgId);
    if (!org) return;

    setStorefrontEnabled(org.storefront_enabled);
    setSlug(org.slug || '');

    // Load storefront_settings for this org
    (async () => {
      const { data } = await supabase
        .from('storefront_settings')
        .select('*')
        .eq('organization_id', selectedOrgId)
        .limit(1)
        .single();

      if (data) {
        setStoreName((data as any).store_name || 'Our Shop');
        setTagline((data as any).tagline || '');
        setAnnouncement((data as any).announcement_text || '');
        setLogoUrl((data as any).logo_url || null);
      } else {
        setStoreName('Our Shop');
        setTagline('');
        setAnnouncement('');
        setLogoUrl(null);
      }
    })();
  }, [selectedOrgId, orgs]);

  const handleSave = async () => {
    if (!user || !selectedOrgId) return;

    if (storefrontEnabled && !slug.trim()) {
      toast({ title: 'Slug is required when storefront is enabled', variant: 'destructive' });
      return;
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    setSaving(true);

    // Update org slug and enabled flag
    const { error: orgError } = await supabase
      .from('organizations')
      .update({
        slug: cleanSlug || null,
        storefront_enabled: storefrontEnabled,
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', selectedOrgId);

    if (orgError) {
      if (orgError.message.includes('duplicate') || orgError.message.includes('unique')) {
        toast({ title: 'This slug is already taken', description: 'Choose a different URL slug.', variant: 'destructive' });
      } else {
        toast({ title: 'Error saving org settings', description: orgError.message, variant: 'destructive' });
      }
      setSaving(false);
      return;
    }

    // Update local org state
    setOrgs((prev) =>
      prev.map((o) => (o.id === selectedOrgId ? { ...o, slug: cleanSlug, storefront_enabled: storefrontEnabled } : o))
    );

    // Upsert storefront_settings
    const payload = {
      user_id: user.id,
      organization_id: selectedOrgId,
      store_name: storeName,
      tagline,
      announcement_text: announcement,
      logo_url: logoUrl,
      updated_at: new Date().toISOString(),
    };

    // Check if exists
    const { data: existing } = await supabase
      .from('storefront_settings')
      .select('id')
      .eq('organization_id', selectedOrgId)
      .limit(1)
      .single();

    let settingsError;
    if (existing) {
      const { error } = await supabase
        .from('storefront_settings')
        .update(payload as any)
        .eq('id', existing.id);
      settingsError = error;
    } else {
      const { error } = await supabase
        .from('storefront_settings')
        .insert(payload as any);
      settingsError = error;
    }

    if (settingsError) {
      toast({ title: 'Error saving storefront branding', description: settingsError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Storefront settings saved' });
    }
    setSaving(false);
  };

  const handleLogoUpload = async (file: File) => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const path = `${user.id}/storefront-logo-${selectedOrgId}.${ext}`;

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

  if (orgs.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        You need to be an admin or owner of an organization to manage storefront settings.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Org selector */}
      {orgs.length > 1 && (
        <div className="space-y-2">
          <Label>Organization</Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              {orgs.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name} {o.storefront_enabled ? '(Shop enabled)' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Enable / Slug */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Shop Availability
          </CardTitle>
          <CardDescription>
            Enable a public storefront for this organization and set its URL slug.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Storefront</Label>
              <p className="text-xs text-muted-foreground">Make this org's shop publicly accessible</p>
            </div>
            <Switch checked={storefrontEnabled} onCheckedChange={setStorefrontEnabled} />
          </div>

          <div>
            <Label>URL Slug</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground whitespace-nowrap">/shop/</span>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-store"
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Letters, numbers, and hyphens only. This will be the public URL for your store.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Storefront Header
          </CardTitle>
          <CardDescription>
            Customize your public shop page header.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Store Name</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Store" />
          </div>

          <div>
            <Label>Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Quality products at great prices" />
          </div>

          <div>
            <Label>Announcement Banner</Label>
            <Textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Free shipping on orders over $100! 🎉"
              rows={2}
            />
            <p className="text-xs text-muted-foreground mt-1">Leave empty to hide the announcement bar</p>
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
            {storefrontEnabled && slug && (
              <a
                href={`/shop/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview Shop
              </a>
            )}
            {(!storefrontEnabled || !slug) && <div />}
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
