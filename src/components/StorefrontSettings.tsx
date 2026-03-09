import { useState, useEffect } from 'react';
import { Store, Save, ExternalLink, Globe, Palette, Layout, Eye, Image as ImageIcon, Upload, Plus, X, GripVertical, Tags, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OrgOption {
  id: string;
  name: string;
  slug: string | null;
  storefront_enabled: boolean;
}

interface StorefrontSettings {
  store_name: string;
  tagline: string;
  announcement_text: string;
  logo_url: string | null;
  header_banner_url: string | null;
  header_bg_color: string;
  header_text_color: string;
  header_nav_color: string;
  background_color: string;
  background_image_url: string | null;
  background_overlay_opacity: number;
  background_blur: number;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  button_color: string;
  text_color: string;
  product_card_spacing: string;
  product_image_shape: string;
  grid_columns: number;
  show_featured_section: boolean;
  welcome_message: string;
  product_card_bg_color: string;
  show_prices: boolean;
  enable_search: boolean;
  enable_categories: boolean;
  contact_button_text: string;
  contact_button_url: string;
  link_button_text: string;
  link_button_url: string;
  cart_message: string;
}

const defaultSettings: StorefrontSettings = {
  store_name: 'Our Shop',
  tagline: '',
  announcement_text: '',
  logo_url: null,
  header_banner_url: null,
  header_bg_color: '#ffffff',
  header_text_color: '#000000',
  header_nav_color: '#6b7280',
  background_color: '#ffffff',
  background_image_url: null,
  background_overlay_opacity: 0,
  background_blur: 0,
  primary_color: '#000000',
  secondary_color: '#6b7280',
  accent_color: '#3b82f6',
  button_color: '#3b82f6',
  text_color: '#000000',
  product_card_spacing: 'normal',
  product_image_shape: 'square',
  grid_columns: 4,
  show_featured_section: false,
  welcome_message: '',
  product_card_bg_color: '#ffffff',
  show_prices: true,
  enable_search: true,
  enable_categories: true,
  contact_button_text: '',
  contact_button_url: '',
  link_button_text: '',
  link_button_url: '',
};

interface CategoryPage {
  id?: string;
  category_name: string;
  is_visible: boolean;
  display_order: number;
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

  // All storefront settings
  const [settings, setSettings] = useState<StorefrontSettings>(defaultSettings);

  // Category pages
  const [categoryPages, setCategoryPages] = useState<CategoryPage[]>([]);
  const [newPageName, setNewPageName] = useState('');

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
      // Load category pages
      const { data: catPages } = await supabase
        .from('storefront_categories')
        .select('*')
        .eq('organization_id', selectedOrgId)
        .order('display_order');
      
      if (catPages) {
        setCategoryPages(catPages.map(c => ({
          id: c.id,
          category_name: c.category_name,
          is_visible: c.is_visible,
          display_order: c.display_order,
        })));
      } else {
        setCategoryPages([]);
      }

      const { data } = await supabase
        .from('storefront_settings')
        .select('*')
        .eq('organization_id', selectedOrgId)
        .limit(1)
        .single();

      if (data) {
        setSettings({
          store_name: data.store_name || defaultSettings.store_name,
          tagline: data.tagline || defaultSettings.tagline,
          announcement_text: data.announcement_text || defaultSettings.announcement_text,
          logo_url: data.logo_url || defaultSettings.logo_url,
          header_banner_url: data.header_banner_url || defaultSettings.header_banner_url,
          header_bg_color: (data as any).header_bg_color || defaultSettings.header_bg_color,
          header_text_color: (data as any).header_text_color || defaultSettings.header_text_color,
          header_nav_color: (data as any).header_nav_color || defaultSettings.header_nav_color,
          background_color: data.background_color || defaultSettings.background_color,
          background_image_url: data.background_image_url || defaultSettings.background_image_url,
          background_overlay_opacity: data.background_overlay_opacity ?? defaultSettings.background_overlay_opacity,
          background_blur: data.background_blur ?? defaultSettings.background_blur,
          primary_color: data.primary_color || defaultSettings.primary_color,
          secondary_color: data.secondary_color || defaultSettings.secondary_color,
          accent_color: data.accent_color || defaultSettings.accent_color,
          button_color: data.button_color || defaultSettings.button_color,
          text_color: data.text_color || defaultSettings.text_color,
          product_card_spacing: data.product_card_spacing || defaultSettings.product_card_spacing,
          product_image_shape: data.product_image_shape || defaultSettings.product_image_shape,
          grid_columns: data.grid_columns ?? defaultSettings.grid_columns,
          show_featured_section: data.show_featured_section ?? defaultSettings.show_featured_section,
          welcome_message: data.welcome_message || defaultSettings.welcome_message,
          product_card_bg_color: data.product_card_bg_color || defaultSettings.product_card_bg_color,
          show_prices: data.show_prices ?? defaultSettings.show_prices,
          enable_search: data.enable_search ?? defaultSettings.enable_search,
          enable_categories: data.enable_categories ?? defaultSettings.enable_categories,
          contact_button_text: data.contact_button_text || defaultSettings.contact_button_text,
          contact_button_url: data.contact_button_url || defaultSettings.contact_button_url,
          link_button_text: data.link_button_text || defaultSettings.link_button_text,
          link_button_url: data.link_button_url || defaultSettings.link_button_url,
        });
      } else {
        setSettings(defaultSettings);
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
      ...settings,
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
      toast({ title: 'Error saving storefront settings', description: settingsError.message, variant: 'destructive' });
      setSaving(false);
      return;
    }

    // Save category pages
    // Delete existing pages for this org
    await supabase
      .from('storefront_categories')
      .delete()
      .eq('organization_id', selectedOrgId);

    // Insert current pages
    if (categoryPages.length > 0) {
      const pagesToInsert = categoryPages.map((cp, idx) => ({
        organization_id: selectedOrgId,
        category_name: cp.category_name,
        is_visible: cp.is_visible,
        display_order: idx,
      }));
      await supabase.from('storefront_categories').insert(pagesToInsert as any);
    }

    toast({ title: 'Storefront settings saved successfully!' });
    setSaving(false);
  };

  const handleFileUpload = async (file: File, field: 'logo' | 'header' | 'background') => {
    if (!user) return;
    const ext = file.name.split('.').pop();
    const bucket = field === 'logo' ? 'logos' : field === 'header' ? 'logos' : 'backgrounds';
    const path = `${user.id}/storefront-${field}-${selectedOrgId}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Upload failed', variant: 'destructive' });
      return;
    }
    
    const fullPath = `${bucket}/${path}`;
    if (field === 'logo') {
      setSettings(prev => ({ ...prev, logo_url: fullPath }));
    } else if (field === 'header') {
      setSettings(prev => ({ ...prev, header_banner_url: fullPath }));
    } else {
      setSettings(prev => ({ ...prev, background_image_url: fullPath }));
    }
    toast({ title: `${field} uploaded — save settings to apply` });
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
    <div className="space-y-6 max-w-6xl">
      {/* Org selector */}
      {orgs.length > 1 && (
        <div className="space-y-2">
          <Label>Organization</Label>
          <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
            <SelectTrigger className="max-w-md">
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

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 max-w-3xl">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
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

          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Store Name</Label>
                <Input 
                  value={settings.store_name} 
                  onChange={(e) => setSettings(prev => ({ ...prev, store_name: e.target.value }))} 
                  placeholder="My Store" 
                />
              </div>

              <div>
                <Label>Tagline</Label>
                <Input 
                  value={settings.tagline} 
                  onChange={(e) => setSettings(prev => ({ ...prev, tagline: e.target.value }))} 
                  placeholder="Quality products at great prices" 
                />
              </div>

              <div>
                <Label>Welcome Message</Label>
                <Textarea
                  value={settings.welcome_message}
                  onChange={(e) => setSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
                  placeholder="Welcome to our store! Discover amazing products..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Announcement Banner</Label>
                <Textarea
                  value={settings.announcement_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, announcement_text: e.target.value }))}
                  placeholder="Free shipping on orders over $100! 🎉"
                  rows={2}
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty to hide the announcement bar</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Product Prices</Label>
                  <p className="text-xs text-muted-foreground">Display pricing information</p>
                </div>
                <Switch 
                  checked={settings.show_prices} 
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_prices: v }))} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Search</Label>
                  <p className="text-xs text-muted-foreground">Allow customers to search products</p>
                </div>
                <Switch 
                  checked={settings.enable_search} 
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, enable_search: v }))} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Categories</Label>
                  <p className="text-xs text-muted-foreground">Show category filters</p>
                </div>
                <Switch 
                  checked={settings.enable_categories} 
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, enable_categories: v }))} 
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Show Featured Section</Label>
                  <p className="text-xs text-muted-foreground">Display featured products area</p>
                </div>
                <Switch 
                  checked={settings.show_featured_section} 
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, show_featured_section: v }))} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Header Tab */}
        <TabsContent value="header" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Store Logo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.logo_url && (
                  <div className="h-20 w-20 rounded border border-border overflow-hidden flex items-center justify-center bg-muted/30">
                    <Store className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                  />
                  <Button variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 200x200px, PNG or SVG</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Header Banner
              </CardTitle>
              <CardDescription>Large banner image displayed at the top of your shop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings.header_banner_url && (
                  <div className="h-32 w-full rounded border border-border overflow-hidden flex items-center justify-center bg-muted/30">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'header');
                    }}
                  />
                  <Button variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recommended: 1920x400px, JPG or PNG</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Action Buttons</CardTitle>
              <CardDescription>Optional buttons displayed in your shop header</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contact Button Text</Label>
                <Input
                  value={settings.contact_button_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, contact_button_text: e.target.value }))}
                  placeholder="Contact Us"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Button URL</Label>
                <Input
                  value={settings.contact_button_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, contact_button_url: e.target.value }))}
                  placeholder="https://example.com/contact"
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Link Button Text</Label>
                <Input
                  value={settings.link_button_text}
                  onChange={(e) => setSettings(prev => ({ ...prev, link_button_text: e.target.value }))}
                  placeholder="Learn More"
                />
              </div>
              <div className="space-y-2">
                <Label>Custom Link Button URL</Label>
                <Input
                  value={settings.link_button_url}
                  onChange={(e) => setSettings(prev => ({ ...prev, link_button_url: e.target.value }))}
                  placeholder="https://example.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pages Tab */}
        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Shop Pages
              </CardTitle>
              <CardDescription>
                Create pages that appear in your shop header navigation. Assign items to pages when editing each item.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryPages.map((cat, idx) => (
                <div key={cat.id || idx} className="flex items-center gap-2 p-3 border rounded">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-sm font-medium">{cat.category_name}</div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Visible</Label>
                    <Switch
                      checked={cat.is_visible}
                      onCheckedChange={(checked) => {
                        const updated = [...categoryPages];
                        updated[idx].is_visible = checked;
                        setCategoryPages(updated);
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setCategoryPages(categoryPages.filter((_, i) => i !== idx));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <Input
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="Enter page name (e.g. Axles, Brakes, Electric)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const trimmed = newPageName.trim();
                      if (trimmed && !categoryPages.find(c => c.category_name.toLowerCase() === trimmed.toLowerCase())) {
                        setCategoryPages([...categoryPages, { category_name: trimmed, is_visible: true, display_order: categoryPages.length }]);
                        setNewPageName('');
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const trimmed = newPageName.trim();
                    if (trimmed && !categoryPages.find(c => c.category_name.toLowerCase() === trimmed.toLowerCase())) {
                      setCategoryPages([...categoryPages, { category_name: trimmed, is_visible: true, display_order: categoryPages.length }]);
                      setNewPageName('');
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {categoryPages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No pages added yet. Add pages to enable navigation in your shop header.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>Customize your store's color palette</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.header_bg_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_bg_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.header_bg_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_bg_color: e.target.value }))}
                      placeholder="#ffffff"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Header Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.header_text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_text_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.header_text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_text_color: e.target.value }))}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Header Navigation Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.header_nav_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_nav_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.header_nav_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, header_nav_color: e.target.value }))}
                      placeholder="#6b7280"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, primary_color: e.target.value }))}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.secondary_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, secondary_color: e.target.value }))}
                      placeholder="#6b7280"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.accent_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.accent_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, accent_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Button Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.button_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, button_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.button_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, button_color: e.target.value }))}
                      placeholder="#3b82f6"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Text Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.text_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, text_color: e.target.value }))}
                      placeholder="#000000"
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Product Card Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={settings.product_card_bg_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, product_card_bg_color: e.target.value }))}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.product_card_bg_color}
                      onChange={(e) => setSettings(prev => ({ ...prev, product_card_bg_color: e.target.value }))}
                      placeholder="#ffffff"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout Tab */}
        <TabsContent value="layout" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Product Display Layout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Grid Columns: {settings.grid_columns}</Label>
                <Slider
                  value={[settings.grid_columns]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, grid_columns: v }))}
                  min={2}
                  max={6}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Number of product columns on desktop</p>
              </div>

              <div className="space-y-2">
                <Label>Product Card Spacing</Label>
                <Select
                  value={settings.product_card_spacing}
                  onValueChange={(v) => setSettings(prev => ({ ...prev, product_card_spacing: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="spacious">Spacious</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Image Shape</Label>
                <Select
                  value={settings.product_image_shape}
                  onValueChange={(v) => setSettings(prev => ({ ...prev, product_image_shape: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="square">Square</SelectItem>
                    <SelectItem value="rounded">Rounded</SelectItem>
                    <SelectItem value="circle">Circle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Background Tab */}
        <TabsContent value="background" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Background Customization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Background Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={settings.background_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.background_color}
                    onChange={(e) => setSettings(prev => ({ ...prev, background_color: e.target.value }))}
                    placeholder="#ffffff"
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Background Image</Label>
                {settings.background_image_url && (
                  <div className="h-32 w-full rounded border border-border overflow-hidden flex items-center justify-center bg-muted/30">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'background');
                    }}
                  />
                  <Button variant="outline" size="icon" disabled>
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Recommended: High resolution, 1920px+ width</p>
              </div>

              <div className="space-y-2">
                <Label>Background Overlay Opacity: {settings.background_overlay_opacity}%</Label>
                <Slider
                  value={[settings.background_overlay_opacity]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, background_overlay_opacity: v }))}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Dark overlay on background image</p>
              </div>

              <div className="space-y-2">
                <Label>Background Blur: {settings.background_blur}px</Label>
                <Slider
                  value={[settings.background_blur]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, background_blur: v }))}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">Blur effect on background image</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button + Preview */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {storefrontEnabled && slug ? (
              <a
                href={`/shop/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <Eye className="h-4 w-4" />
                Preview Shop
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <div className="text-sm text-muted-foreground">Enable storefront and set a slug to preview</div>
            )}
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save All Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
