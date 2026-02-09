import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Building2, Tags, LogOut, Sun, Moon, Monitor, FileText, Palette, Upload, X, Search, ExternalLink, User, Users, Shield, ShieldCheck, UserX, UserCheck, Building } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { useCategories } from '@/hooks/useCategories';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLayoutEditor } from '@/components/InvoiceLayoutEditor';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';

import { useColorTheme, ColorTheme, BackgroundTheme } from '@/hooks/useColorTheme';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { ALL_PAGES } from '@/hooks/usePagePermissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';


export function Settings() {
  const { signOut, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme } = useColorTheme();
  const { vendors, loading: vendorsLoading, addVendor, updateVendor, deleteVendor } = useVendors();
  const { categories, allCategories, loading: categoriesLoading, addCategory, deleteCategory } = useCategories();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const { users: adminUsers, loading: adminUsersLoading, isAdmin, isOrgAdmin, organizations, setRole, setPagePermissions, toggleActive, deleteUser, createUser, createOrg, deleteOrg, addOrgMember, removeOrgMember, setOrgMemberRole } = useAdminUsers();
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [createdTempPassword, setCreatedTempPassword] = useState<string | null>(null);
  const [addingUser, setAddingUser] = useState(false);
  const [selectedOrgForNewUser, setSelectedOrgForNewUser] = useState<string>('');
  // Org management state
  const [newOrgName, setNewOrgName] = useState('');
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [expandedOrgId, setExpandedOrgId] = useState<string | null>(null);
  const [addMemberUserId, setAddMemberUserId] = useState<string>('');
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null);

  // Save theme to database when changed
  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (user) {
      await supabase
        .from('profiles')
        .update({ theme: newTheme })
        .eq('user_id', user.id);
    }
  };

  // Load theme from database on mount
  useEffect(() => {
    const loadThemeFromDatabase = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', user.id)
          .single();
        
        if (data?.theme && data.theme !== theme) {
          setTheme(data.theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    loadThemeFromDatabase();
  }, [user]);

  const colorThemeOptions: { value: ColorTheme; label: string; color: string }[] = [
    { value: 'normal', label: 'Normal (Teal)', color: 'bg-[hsl(200,98%,39%)]' },
    { value: 'green', label: 'Light Green', color: 'bg-[hsl(142,76%,36%)]' },
    { value: 'blue', label: 'Light Blue', color: 'bg-[hsl(217,91%,60%)]' },
    { value: 'grey', label: 'Light Grey', color: 'bg-[hsl(215,16%,47%)]' },
    { value: 'red', label: 'Light Red', color: 'bg-[hsl(0,72%,50%)]' },
  ];

  const backgroundThemeOptions: { value: BackgroundTheme; label: string; color: string }[] = [
    { value: 'normal', label: 'Normal', color: 'bg-[hsl(209,40%,96%)]' },
    { value: 'green', label: 'Light Green', color: 'bg-[hsl(142,40%,96%)]' },
    { value: 'blue', label: 'Light Blue', color: 'bg-[hsl(217,40%,96%)]' },
    { value: 'grey', label: 'Light Grey', color: 'bg-[hsl(0,0%,96%)]' },
    { value: 'red', label: 'Light Red', color: 'bg-[hsl(0,40%,96%)]' },
    { value: 'black', label: 'Black', color: 'bg-[hsl(0,0%,8%)]' },
  ];

  // Invoice settings state
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [invoiceThankYouNote, setInvoiceThankYouNote] = useState('');
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1);
  const [logoUrl, setLogoUrl] = useState('');
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>(defaultInvoiceLayout);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Quote settings state
  const [quoteThankYouNote, setQuoteThankYouNote] = useState('');
  const [quoteValidityDays, setQuoteValidityDays] = useState<number | null>(null);
  const [quoteLayout, setQuoteLayout] = useState<InvoiceLayout>(defaultInvoiceLayout);

  // Requester settings state
  const [requesterName, setRequesterName] = useState('');
  const [requesterNames, setRequesterNames] = useState<string[]>([]);
  const [newRequesterName, setNewRequesterName] = useState('');
  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setBusinessAddress(profile.businessAddress || '');
      setBusinessPhone(profile.businessPhone || '');
      setBusinessEmail(profile.businessEmail || '');
      setBusinessNumber(profile.businessNumber || '');
      setInvoiceThankYouNote(profile.invoiceThankYouNote || 'Thank you for your business!');
      setInvoicePrefix(profile.invoicePrefix || 'INV');
      setInvoiceNextNumber(profile.invoiceNextNumber || 1);
      setLogoUrl(profile.logoUrl || '');
      setInvoiceLayout(profile.invoiceLayout || defaultInvoiceLayout);
      // Quote settings
      setQuoteThankYouNote(profile.quoteThankYouNote || 'Thank you for considering our services!');
      setQuoteValidityDays(profile.quoteValidityDays || null);
      setQuoteLayout(profile.quoteLayout || profile.invoiceLayout || defaultInvoiceLayout);
      // Requester settings
      setRequesterName(profile.requesterName || '');
      setRequesterNames(profile.requesterNames || []);
    }
  }, [profile]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      await updateProfile({ logoUrl: publicUrl });
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl('');
    await updateProfile({ logoUrl: null });
  };

  // Vendor dialog state
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');
  const [vendorLink, setVendorLink] = useState('');

  // Category state
  const [newCategory, setNewCategory] = useState('');

  // Delete confirmation state
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  
  // Search state
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  
  // Filtered vendors
  const filteredVendors = vendors.filter((vendor) => {
    if (!vendorSearchQuery) return true;
    const query = vendorSearchQuery.toLowerCase();
    return (
      vendor.name.toLowerCase().includes(query) ||
      vendor.contact_email?.toLowerCase().includes(query) ||
      vendor.contact_phone?.toLowerCase().includes(query) ||
      vendor.address?.toLowerCase().includes(query)
    );
  });
  
  // Filtered categories
  const filteredCategories = categories.filter((cat) => {
    if (!categorySearchQuery) return true;
    return cat.name.toLowerCase().includes(categorySearchQuery.toLowerCase());
  });

  const openVendorDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorName(vendor.name);
      setVendorEmail(vendor.contact_email || '');
      setVendorPhone(vendor.contact_phone || '');
      setVendorAddress(vendor.address || '');
      setVendorNotes(vendor.notes || '');
      setVendorLink(vendor.link || '');
    } else {
      setEditingVendor(null);
      setVendorName('');
      setVendorEmail('');
      setVendorPhone('');
      setVendorAddress('');
      setVendorNotes('');
      setVendorLink('');
    }
    setVendorDialogOpen(true);
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorData = {
      name: vendorName,
      contact_email: vendorEmail || null,
      contact_phone: vendorPhone || null,
      address: vendorAddress || null,
      notes: vendorNotes || null,
      link: vendorLink || null,
    };

    if (editingVendor) {
      await updateVendor(editingVendor.id, vendorData);
    } else {
      await addVendor(vendorData);
    }
    setVendorDialogOpen(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCategory(newCategory);
    setNewCategory('');
  };

  const handleSaveInvoiceSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      businessName: businessName || null,
      businessAddress: businessAddress || null,
      businessPhone: businessPhone || null,
      businessEmail: businessEmail || null,
      businessNumber: businessNumber || null,
      invoiceThankYouNote: invoiceThankYouNote || null,
      invoicePrefix: invoicePrefix || 'INV',
      invoiceNextNumber: invoiceNextNumber,
      invoiceLayout: invoiceLayout,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold tracking-tight text-card-foreground font-sans">
                  Settings
                </h1>
                <p className="text-sm text-muted-foreground font-medium tracking-wide">
                  Manage vendors and categories
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Inventory
                </Button>
              </Link>
              <Button variant="outline" size="icon" onClick={signOut} title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full max-w-4xl ${(isAdmin || isOrgAdmin) ? 'grid-cols-7' : 'grid-cols-5'}`}>
            <TabsTrigger value="general" className="gap-2">
              <Monitor className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="quote" className="gap-2">
              <FileText className="h-4 w-4" />
              Quote
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Building2 className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="organizations" className="gap-2">
                <Building className="h-4 w-4" />
                Orgs
              </TabsTrigger>
            )}
            {(isAdmin || isOrgAdmin) && (
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>Customize how the app looks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Select your preferred color scheme
                    </p>
                  </div>
                  <Select value={theme} onValueChange={handleThemeChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Accent Color</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred accent color
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {colorThemeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setColorTheme(option.value)}
                        className={`w-8 h-8 rounded-full ${option.color} transition-all ${
                          colorTheme === option.value
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                            : 'hover:scale-105'
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label>Background Color</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred background color
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {backgroundThemeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBackgroundTheme(option.value)}
                        className={`w-8 h-8 rounded-full ${option.color} border border-border transition-all ${
                          backgroundTheme === option.value
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                            : 'hover:scale-105'
                        }`}
                        title={option.label}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requests Settings */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Requesters
                </CardTitle>
                <CardDescription>Manage the list of people who can be selected as requesters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new requester */}
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newRequesterName.trim()) return;
                  const updated = [...requesterNames, newRequesterName.trim()];
                  const success = await updateProfile({ requesterNames: updated });
                  if (success) {
                    setRequesterNames(updated);
                    setNewRequesterName('');
                  }
                }} className="flex gap-2">
                  <Input
                    placeholder="Enter requester name"
                    value={newRequesterName}
                    onChange={(e) => setNewRequesterName(e.target.value)}
                  />
                  <Button type="submit" disabled={!newRequesterName.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </form>

                {/* List of requesters */}
                {requesterNames.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No requesters added yet. Add names above to allow selection when creating requests.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {requesterNames.map((name, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card"
                      >
                        <span className="font-medium">{name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={async () => {
                            const updated = requesterNames.filter((_, i) => i !== index);
                            const success = await updateProfile({ requesterNames: updated });
                            if (success) {
                              setRequesterNames(updated);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Tab */}
          <TabsContent value="invoice" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Settings</CardTitle>
                <CardDescription>Customize how your invoices look</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveInvoiceSettings} className="space-y-6">
                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label>Business Logo</Label>
                    <p className="text-sm text-muted-foreground">
                      Upload a logo (max 160x160) that will appear on your invoices
                    </p>
                    <div className="flex items-center gap-4">
                      <div 
                        className="relative rounded border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
                        style={{ width: '160px', height: '160px', maxWidth: '160px', maxHeight: '160px' }}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        {logoUrl ? (
                          <img 
                            src={logoUrl} 
                            alt="Business logo" 
                            className="w-full h-full object-contain"
                            style={{ maxWidth: '160px', maxHeight: '160px' }}
                          />
                        ) : (
                          <Upload className="h-8 w-8 text-muted-foreground" />
                        )}
                        <input
                          ref={logoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </div>
                      {logoUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveLogo}
                          className="gap-1"
                        >
                          <X className="h-3 w-3" />
                          Remove
                        </Button>
                      )}
                      {uploadingLogo && (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      )}
                    </div>
                  </div>

                  {/* Business Information */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Business Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business-name">Business Name</Label>
                        <Input
                          id="business-name"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                          placeholder="Your Company Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-email">Business Email</Label>
                        <Input
                          id="business-email"
                          type="email"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                          placeholder="contact@company.com"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="business-phone">Business Phone</Label>
                        <Input
                          id="business-phone"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="business-number">Business Number</Label>
                        <Input
                          id="business-number"
                          value={businessNumber}
                          onChange={(e) => setBusinessNumber(e.target.value)}
                          placeholder="Tax ID / Registration #"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Invoice Number Format</Label>
                      <div className="flex items-center gap-2">
                        <div className="space-y-1">
                          <Input
                            id="invoice-prefix"
                            value={invoicePrefix}
                            onChange={(e) => setInvoicePrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                            placeholder="INV"
                            className="w-24 text-center font-medium"
                          />
                          <p className="text-xs text-muted-foreground text-center">Prefix</p>
                        </div>
                        <span className="text-lg text-muted-foreground font-bold mt-[-1rem]">-</span>
                        <div className="space-y-1">
                          <Input
                            type="number"
                            value={invoiceNextNumber}
                            onChange={(e) => setInvoiceNextNumber(Math.max(1, parseInt(e.target.value) || 1))}
                            min={1}
                            className="w-20 text-center font-mono"
                          />
                          <p className="text-xs text-muted-foreground text-center">Next #</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Next invoice will be: {invoicePrefix || 'INV'}-{String(invoiceNextNumber).padStart(4, '0')}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business-address">Business Address</Label>
                      <Textarea
                        id="business-address"
                        value={businessAddress}
                        onChange={(e) => setBusinessAddress(e.target.value)}
                        placeholder="123 Main St&#10;City, State 12345"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Thank You Note */}
                  <div className="space-y-2">
                    <Label htmlFor="thank-you-note">Thank You Note</Label>
                    <p className="text-sm text-muted-foreground">
                      This message appears at the bottom of your invoices
                    </p>
                    <Textarea
                      id="thank-you-note"
                      value={invoiceThankYouNote}
                      onChange={(e) => setInvoiceThankYouNote(e.target.value)}
                      placeholder="Thank you for your business!"
                      rows={2}
                    />
                  </div>

                  {/* Invoice Layout Editor */}
                  <div className="space-y-2 pt-4 border-t">
                    <InvoiceLayoutEditor
                      layout={invoiceLayout}
                      onChange={setInvoiceLayout}
                      logoUrl={logoUrl}
                      businessName={businessName}
                    />
                  </div>

                  <Button type="submit" disabled={profileLoading}>
                    Save Invoice Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quote Tab */}
          <TabsContent value="quote" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Quote Settings</CardTitle>
                <CardDescription>Customize how your quotes look</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await updateProfile({
                    quoteThankYouNote: quoteThankYouNote || null,
                    quoteValidityDays: quoteValidityDays || undefined,
                    quoteLayout: quoteLayout,
                  });
                }} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="quote-validity">Default Validity Period (days)</Label>
                    <p className="text-sm text-muted-foreground">
                      How many days quotes are valid by default (leave empty for no default)
                    </p>
                    <Input
                      id="quote-validity"
                      type="number"
                      value={quoteValidityDays ?? ''}
                      onChange={(e) => setQuoteValidityDays(e.target.value ? parseInt(e.target.value) : null)}
                      min={1}
                      max={365}
                      placeholder="No default"
                      className="w-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quote-thank-you-note">Thank You Note</Label>
                    <p className="text-sm text-muted-foreground">
                      This message appears at the bottom of your quotes
                    </p>
                    <Textarea
                      id="quote-thank-you-note"
                      value={quoteThankYouNote}
                      onChange={(e) => setQuoteThankYouNote(e.target.value)}
                      placeholder="Thank you for considering our services!"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="text-sm font-medium">Quote Layout</h4>
                    <p className="text-sm text-muted-foreground">
                      Customize the layout of your quote PDFs. Uses the same layout options as invoices.
                    </p>
                    <InvoiceLayoutEditor
                      layout={quoteLayout}
                      onChange={setQuoteLayout}
                      logoUrl={logoUrl}
                      businessName={businessName}
                    />
                  </div>

                  <Button type="submit" disabled={profileLoading}>
                    Save Quote Settings
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage your suppliers and vendors</CardDescription>
                </div>
                <Button onClick={() => openVendorDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Vendor
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search bar for vendors */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search vendors..."
                    value={vendorSearchQuery}
                    onChange={(e) => setVendorSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {vendorsLoading ? (
                  <div className="text-muted-foreground py-8 text-center">Loading vendors...</div>
                ) : filteredVendors.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    {vendors.length === 0 
                      ? "No vendors yet. Add your first vendor to get started."
                      : "No vendors match your search."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredVendors.map((vendor) => (
                      <div key={vendor.id} className="flex items-center justify-between py-4">
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {[vendor.contact_email, vendor.contact_phone].filter(Boolean).join(' • ') || 'No contact info'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openVendorDialog(vendor)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteVendorId(vendor.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>Add custom categories for your inventory items</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <Input
                    placeholder="New category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button type="submit" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </form>

                {/* Search bar for categories */}
                {categories.length > 0 && (
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {categories.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">
                    No categories yet. Add your first category to get started.
                  </div>
                ) : filteredCategories.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">
                    No categories match your search.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-md text-sm"
                      >
                        {cat.name}
                        <button
                          onClick={() => setDeleteCategoryId(cat.id)}
                          className="ml-1 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          {isAdmin && (
            <TabsContent value="organizations" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Organizations
                    </CardTitle>
                    <CardDescription>Create and manage workspaces. Each organization has its own users and shared data.</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Create new org (super admin only) */}
                  {isAdmin && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!newOrgName.trim()) return;
                        setCreatingOrg(true);
                        await createOrg(newOrgName.trim());
                        setNewOrgName('');
                        setCreatingOrg(false);
                      }}
                      className="flex gap-2 mb-6"
                    >
                      <Input
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="New organization name..."
                        className="max-w-xs"
                      />
                      <Button type="submit" disabled={creatingOrg || !newOrgName.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Create
                      </Button>
                    </form>
                  )}

                  {organizations.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">No organizations yet. Create one to get started.</div>
                  ) : (
                    <div className="space-y-4">
                      {organizations.map((org) => (
                        <Card key={org.id} className="border">
                          <CardHeader className="py-3 px-4 cursor-pointer" onClick={() => setExpandedOrgId(expandedOrgId === org.id ? null : org.id)}>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-base">{org.name}</CardTitle>
                                <CardDescription className="text-xs">{org.members.length} member{org.members.length !== 1 ? 's' : ''}</CardDescription>
                              </div>
                              <div className="flex items-center gap-2">
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={(e) => { e.stopPropagation(); setDeleteOrgId(org.id); }}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          {expandedOrgId === org.id && (
                            <CardContent className="pt-0 px-4 pb-4">
                              {/* Members list */}
                              <div className="space-y-2 mb-4">
                                <Label className="text-sm font-medium">Members</Label>
                                {org.members.length === 0 ? (
                                  <p className="text-sm text-muted-foreground">No members yet.</p>
                                ) : (
                                  <div className="divide-y divide-border">
                                    {org.members.map((member) => (
                                      <div key={member.userId} className="flex items-center justify-between py-2">
                                        <div>
                                          <span className="text-sm font-medium">{member.displayName || member.email}</span>
                                          <span className="text-xs text-muted-foreground ml-2">{member.email}</span>
                                          <Badge variant="outline" className="ml-2 text-xs">{member.role}</Badge>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Select
                                            value={member.role}
                                            onValueChange={(val) => setOrgMemberRole(org.id, member.userId, val)}
                                          >
                                            <SelectTrigger className="w-24 h-7 text-xs">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="member">Member</SelectItem>
                                              <SelectItem value="admin">Admin</SelectItem>
                                              <SelectItem value="owner">Owner</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => removeOrgMember(org.id, member.userId)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Add existing user to org */}
                              <div className="flex gap-2">
                                <Select value={addMemberUserId} onValueChange={setAddMemberUserId}>
                                  <SelectTrigger className="max-w-xs">
                                    <SelectValue placeholder="Select a user to add..." />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {adminUsers
                                      .filter((u) => !org.members.some((m) => m.userId === u.id))
                                      .map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.displayName || u.email}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  variant="outline"
                                  disabled={!addMemberUserId}
                                  onClick={async () => {
                                    if (addMemberUserId) {
                                      await addOrgMember(org.id, addMemberUserId);
                                      setAddMemberUserId('');
                                    }
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Users Tab (Admin only) */}
          {(isAdmin || isOrgAdmin) && (
            <TabsContent value="users" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      User Management
                    </CardTitle>
                    <CardDescription>View and manage all registered users. Click a user to configure page access.</CardDescription>
                  </div>
                  <Button onClick={() => { setNewUserEmail(''); setNewUserPassword(''); setCreatedTempPassword(null); setSelectedOrgForNewUser(!isAdmin && organizations.length > 0 ? organizations[0].id : ''); setAddUserDialogOpen(true); }} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add User
                  </Button>
                </CardHeader>
                <CardContent>
                  {adminUsersLoading ? (
                    <div className="text-muted-foreground py-8 text-center">Loading users...</div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">No users found.</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {adminUsers.map((u) => (
                        <div key={u.id} className="py-4">
                          <div className="flex items-center justify-between">
                            <div
                              className="flex-1 min-w-0 cursor-pointer"
                              onClick={() => setExpandedUserId(expandedUserId === u.id ? null : u.id)}
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{u.displayName || 'No name'}</span>
                                {u.roles.includes('admin') && (
                                  <Badge variant="default" className="text-xs gap-1">
                                    <ShieldCheck className="h-3 w-3" />
                                    Admin
                                  </Badge>
                                )}
                                {!u.isActive && (
                                  <Badge variant="destructive" className="text-xs">Deactivated</Badge>
                                )}
                                {!u.emailConfirmedAt && (
                                  <Badge variant="outline" className="text-xs">Unconfirmed</Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">{u.email}</div>
                              {u.organizations && u.organizations.length > 0 && (
                                <div className="flex gap-1 mt-0.5 flex-wrap">
                                  {u.organizations.map((org) => (
                                    <Badge key={org.organizationId} variant="secondary" className="text-xs">
                                      {org.organizationName} ({org.role})
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Joined {new Date(u.createdAt).toLocaleDateString()}
                                {u.lastSignIn && ` • Last sign in ${new Date(u.lastSignIn).toLocaleDateString()}`}
                              </div>
                            </div>
                            {u.id !== user?.id && (
                              <div className="flex items-center gap-2 ml-4">
                                {isAdmin && (
                                  <Select
                                    value={u.roles.includes('admin') ? 'admin' : 'user'}
                                    onValueChange={(val) => setRole(u.id, val as 'admin' | 'user')}
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="user">User</SelectItem>
                                      <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={() => toggleActive(u.id)}
                                    title={u.isActive ? 'Deactivate user' : 'Activate user'}
                                  >
                                    {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                                  </Button>
                                )}
                                {isAdmin && (
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => setDeleteUserId(u.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Page Permissions (expandable) */}
                          {expandedUserId === u.id && !u.roles.includes('admin') && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <Label className="text-sm font-medium mb-2 block">Page Access</Label>
                              <p className="text-xs text-muted-foreground mb-3">
                                {u.pagePermissions.length === 0
                                  ? 'No restrictions set — user can access all pages. Check specific pages to restrict access to only those pages.'
                                  : 'User can only access the checked pages.'}
                              </p>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {ALL_PAGES.map((page) => {
                                  const isChecked = u.pagePermissions.length === 0
                                    ? true
                                    : u.pagePermissions.includes(page.key);
                                  return (
                                    <label
                                      key={page.key}
                                      className="flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded hover:bg-muted/50"
                                    >
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          let newPerms: string[];
                                          if (u.pagePermissions.length === 0) {
                                            // Currently unrestricted, user unchecked one page
                                            if (!checked) {
                                              newPerms = ALL_PAGES.filter(p => p.key !== page.key).map(p => p.key);
                                            } else {
                                              return; // Already all checked
                                            }
                                          } else {
                                            if (checked) {
                                              newPerms = [...u.pagePermissions, page.key];
                                            } else {
                                              newPerms = u.pagePermissions.filter(k => k !== page.key);
                                            }
                                          }
                                          // If all pages selected, clear permissions (unrestricted)
                                          if (newPerms.length === ALL_PAGES.length) {
                                            newPerms = [];
                                          }
                                          setPagePermissions(u.id, newPerms);
                                        }}
                                      />
                                      {page.label}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                          {expandedUserId === u.id && u.roles.includes('admin') && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs text-muted-foreground">Admins have access to all pages.</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* Vendor Dialog */}
      <Dialog open={vendorDialogOpen} onOpenChange={setVendorDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveVendor} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-name">Name *</Label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="Vendor name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-email">Email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={vendorEmail}
                  onChange={(e) => setVendorEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-phone">Phone</Label>
                <Input
                  id="vendor-phone"
                  value={vendorPhone}
                  onChange={(e) => setVendorPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-address">Address</Label>
              <Textarea
                id="vendor-address"
                value={vendorAddress}
                onChange={(e) => setVendorAddress(e.target.value)}
                placeholder="Full address"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-link">Website / Link</Label>
              <Input
                id="vendor-link"
                type="url"
                value={vendorLink}
                onChange={(e) => setVendorLink(e.target.value)}
                placeholder="https://vendor-website.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-notes">Notes</Label>
              <Textarea
                id="vendor-notes"
                value={vendorNotes}
                onChange={(e) => setVendorNotes(e.target.value)}
                placeholder="Additional notes..."
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setVendorDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingVendor ? 'Save Changes' : 'Add Vendor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Vendor Confirmation */}
      <AlertDialog open={!!deleteVendorId} onOpenChange={() => setDeleteVendorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteVendorId) deleteVendor(deleteVendorId);
                setDeleteVendorId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={() => setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCategoryId) deleteCategory(deleteCategoryId);
                setDeleteCategoryId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user account and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteUserId) deleteUser(deleteUserId);
                setDeleteUserId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          {createdTempPassword ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                User created successfully. Share the temporary password below with the user so they can sign in.
              </p>
              <div className="space-y-2">
                <Label>Temporary Password</Label>
                <div className="flex items-center gap-2">
                  <Input value={createdTempPassword} readOnly className="font-mono" />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(createdTempPassword);
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setAddUserDialogOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setAddingUser(true);
                const result = await createUser(newUserEmail, newUserPassword || undefined, selectedOrgForNewUser || undefined);
                setAddingUser(false);
                if (result.tempPassword) {
                  setCreatedTempPassword(result.tempPassword);
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-user-email">Email *</Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-user-password">Password (optional)</Label>
                <Input
                  id="new-user-password"
                  type="text"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
                <p className="text-xs text-muted-foreground">If left blank, a temporary password will be generated.</p>
              </div>
              {isAdmin && organizations.length > 0 && (
                <div className="space-y-2">
                  <Label>Add to Organization (optional)</Label>
                  <Select value={selectedOrgForNewUser} onValueChange={setSelectedOrgForNewUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="No organization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No organization</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!isAdmin && organizations.length > 0 && (
                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Select value={selectedOrgForNewUser} onValueChange={setSelectedOrgForNewUser}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">New users will be added to this organization.</p>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addingUser}>
                  {addingUser ? 'Creating...' : 'Add User'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Org Confirmation */}
      <AlertDialog open={!!deleteOrgId} onOpenChange={() => setDeleteOrgId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this organization and remove all member associations. User accounts and their data will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteOrgId) deleteOrg(deleteOrgId);
                setDeleteOrgId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
