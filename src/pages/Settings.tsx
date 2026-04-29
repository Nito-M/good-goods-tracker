import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Building2, Tags, Tag, LogOut, Sun, Moon, Monitor, FileText, Palette, Upload, X, Search, ExternalLink, User, ShieldCheck, Users, Contact, Briefcase, ImagePlus, ChevronDown, ChevronRight, ArrowRightLeft, Pencil, Check, Store } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { useIsOrgAdmin } from '@/hooks/useIsOrgAdmin';
import { OrganizationsSettings } from '@/components/OrganizationsSettings';
import { UsersSettings } from '@/components/UsersSettings';
import { TagsSettings } from '@/components/TagsSettings';
import { CompaniesSettings } from '@/components/CompaniesSettings';
import { StorefrontSettings } from '@/components/StorefrontSettings';
import { Link } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVendors, Vendor } from '@/hooks/useVendors';
import { useCustomers, Customer } from '@/hooks/useCustomers';
import { useCategories } from '@/hooks/useCategories';
import { useAssemblyCategories } from '@/hooks/useAssemblyCategories';
import { useSubcategories } from '@/hooks/useSubcategories';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLayoutEditor } from '@/components/InvoiceLayoutEditor';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';

import { useColorTheme, ColorTheme, BackgroundTheme, CustomTextColor, BorderColor } from '@/hooks/useColorTheme';
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
  const { isAdmin } = useIsAdmin();
  const { isOrgAdmin } = useIsOrgAdmin();
  const showUsersTab = isAdmin || isOrgAdmin;
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme, backgroundImageUrl, setCustomBackgroundImage, customBgLight, setCustomBgLight, customTextColor, setCustomTextColor, cardOpacity, setCardOpacity, borderColor, setBorderColor } = useColorTheme();
  const { vendors, loading: vendorsLoading, addVendor, updateVendor, deleteVendor } = useVendors();
  const { customers, loading: customersLoading, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { categories, allCategories, loading: categoriesLoading, addCategory, updateCategory, deleteCategory, moveCategoryToSubcategory } = useCategories();
  const { categories: assemblyCategories, addCategory: addAssemblyCategory, updateCategory: updateAssemblyCategory, deleteCategory: deleteAssemblyCategory } = useAssemblyCategories();
  const { subcategories, getSubcategoriesForCategory, addSubcategory, updateSubcategory, deleteSubcategory } = useSubcategories();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

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
    { value: 'green', label: 'Green', color: 'bg-[hsl(142,76%,36%)]' },
    { value: 'blue', label: 'Blue', color: 'bg-[hsl(217,91%,60%)]' },
    { value: 'grey', label: 'Grey', color: 'bg-[hsl(215,16%,47%)]' },
    { value: 'red', label: 'Red', color: 'bg-[hsl(0,72%,50%)]' },
    { value: 'yellow', label: 'Yellow', color: 'bg-[hsl(48,96%,53%)]' },
    { value: 'white', label: 'White', color: 'bg-[hsl(0,0%,95%)] border border-border' },
    { value: 'purple', label: 'Purple', color: 'bg-[hsl(271,76%,53%)]' },
    { value: 'pink', label: 'Pink', color: 'bg-[hsl(330,81%,60%)]' },
    { value: 'orange', label: 'Orange', color: 'bg-[hsl(24,95%,53%)]' },
    { value: 'gold', label: 'Gold', color: 'bg-[hsl(43,90%,55%)]' },
  ];

  const backgroundThemeOptions: { value: BackgroundTheme; label: string; color: string; gradient?: string }[] = [
    { value: 'normal', label: 'Normal', color: 'bg-[hsl(209,40%,96%)]' },
    { value: 'green', label: 'Light Green', color: 'bg-[hsl(142,40%,96%)]' },
    { value: 'blue', label: 'Light Blue', color: 'bg-[hsl(217,40%,96%)]' },
    { value: 'grey', label: 'Light Grey', color: 'bg-[hsl(0,0%,96%)]' },
    { value: 'red', label: 'Light Red', color: 'bg-[hsl(0,40%,96%)]' },
    { value: 'black', label: 'Black', color: 'bg-[hsl(0,0%,8%)]' },
    { value: 'black-gold', label: 'Black & Gold', color: '', gradient: 'linear-gradient(135deg, hsl(0,0%,4%) 50%, hsl(43,90%,55%) 50%)' },
    { value: 'midnight-silver', label: 'Midnight Silver', color: '', gradient: 'linear-gradient(135deg, hsl(220,30%,6%) 50%, hsl(210,20%,70%) 50%)' },
    { value: 'dark-emerald', label: 'Emerald & Copper', color: '', gradient: 'linear-gradient(135deg, hsl(160,30%,6%) 50%, hsl(25,70%,55%) 50%)' },
    { value: 'charcoal-rose', label: 'Charcoal & Rose', color: '', gradient: 'linear-gradient(135deg, hsl(0,0%,10%) 50%, hsl(340,65%,60%) 50%)' },
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
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

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
  const [vendorColor, setVendorColor] = useState('');

  // Category state
  const [newCategory, setNewCategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newSubcategoryInputs, setNewSubcategoryInputs] = useState<Record<string, string>>({});
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [editingSubcategoryName, setEditingSubcategoryName] = useState('');

  // Delete confirmation state
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [moveCategoryId, setMoveCategoryId] = useState<string | null>(null);
  const [moveTargetCategoryId, setMoveTargetCategoryId] = useState<string>('');
  
  // Search state
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Assembly category state
  const [newAssemblyCategory, setNewAssemblyCategory] = useState('');
  const [assemblyCategorySearchQuery, setAssemblyCategorySearchQuery] = useState('');
  const [editingAssemblyCategoryId, setEditingAssemblyCategoryId] = useState<string | null>(null);
  const [editingAssemblyCategoryName, setEditingAssemblyCategoryName] = useState('');
  const [deleteAssemblyCategoryId, setDeleteAssemblyCategoryId] = useState<string | null>(null);

  const filteredAssemblyCategories = assemblyCategories.filter(c => {
    if (!assemblyCategorySearchQuery) return true;
    return c.name.toLowerCase().includes(assemblyCategorySearchQuery.toLowerCase());
  });

  // Customer dialog state
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
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
    const q = categorySearchQuery.toLowerCase();
    const matchesCat = cat.name.toLowerCase().includes(q);
    const catSubs = getSubcategoriesForCategory(cat.id);
    const matchesSub = catSubs.some((s) => s.name.toLowerCase().includes(q));
    return matchesCat || matchesSub;
  });

  // Filtered customers
  const filteredCustomers = customers.filter((customer) => {
    if (!customerSearchQuery) return true;
    const query = customerSearchQuery.toLowerCase();
    return (
      customer.name.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query)
    );
  });

  const openCustomerDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setCustomerName(customer.name);
      setCustomerCompany(customer.company || '');
      setCustomerPhone(customer.phone || '');
      setCustomerEmail(customer.email || '');
      setCustomerAddress(customer.address || '');
    } else {
      setEditingCustomer(null);
      setCustomerName('');
      setCustomerCompany('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
    }
    setCustomerDialogOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    const customerData = {
      name: customerName,
      company: customerCompany || null,
      phone: customerPhone || null,
      email: customerEmail || null,
      address: customerAddress || null,
    };

    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, customerData);
    } else {
      await addCustomer(customerData);
    }
    setCustomerDialogOpen(false);
  };

  const openVendorDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorName(vendor.name);
      setVendorEmail(vendor.contact_email || '');
      setVendorPhone(vendor.contact_phone || '');
      setVendorAddress(vendor.address || '');
      setVendorNotes(vendor.notes || '');
      setVendorLink(vendor.link || '');
      setVendorColor(vendor.color || '');
    } else {
      setEditingVendor(null);
      setVendorName('');
      setVendorEmail('');
      setVendorPhone('');
      setVendorAddress('');
      setVendorNotes('');
      setVendorLink('');
      setVendorColor('');
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
      color: vendorColor || null,
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
          <TabsList className="flex w-full max-w-5xl overflow-x-auto">
            <TabsTrigger value="general" className="gap-2 shrink-0">
              <Monitor className="h-4 w-4 hidden sm:inline" />
              General
            </TabsTrigger>
            <TabsTrigger value="companies" className="gap-2 shrink-0">
              <Briefcase className="h-4 w-4 hidden sm:inline" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="storefront" className="gap-2 shrink-0">
              <Store className="h-4 w-4 hidden sm:inline" />
              Storefront
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2 shrink-0">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="customers" className="gap-2 shrink-0">
              <Contact className="h-4 w-4 hidden sm:inline" />
              Customers
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 shrink-0">
              <Tags className="h-4 w-4 hidden sm:inline" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="tags" className="gap-2 shrink-0">
              <Tag className="h-4 w-4 hidden sm:inline" />
              Tags
            </TabsTrigger>
            {showUsersTab && (
              <TabsTrigger value="users" className="gap-2 shrink-0">
                <Users className="h-4 w-4 hidden sm:inline" />
                Users
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="organizations" className="gap-2 shrink-0">
                <ShieldCheck className="h-4 w-4 hidden sm:inline" />
                Orgs
              </TabsTrigger>
            )}
          </TabsList>

          {/* Companies Tab */}
          <TabsContent value="companies" className="mt-6">
            <CompaniesSettings />
          </TabsContent>

          {/* Storefront Tab */}
          <TabsContent value="storefront" className="mt-6">
            <StorefrontSettings />
          </TabsContent>

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

                <div className="pt-4 border-t space-y-2">
                  <div className="space-y-0.5">
                    <Label>Accent Color</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred accent color
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
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

                <div className="pt-4 border-t space-y-2">
                  <div className="space-y-0.5">
                    <Label>Background</Label>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred background
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {backgroundThemeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setBackgroundTheme(option.value)}
                        className={`w-8 h-8 rounded-full ${option.color} border border-border transition-all ${
                          backgroundTheme === option.value
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={option.gradient ? { background: option.gradient } : undefined}
                        title={option.label}
                      />
                    ))}
                    {/* Custom image upload button */}
                    <input
                      ref={backgroundInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !user) return;
                        setUploadingBackground(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const filePath = `${user.id}/background.${fileExt}`;
                          const { error: uploadError } = await supabase.storage
                            .from('backgrounds')
                            .upload(filePath, file, { upsert: true });
                          if (uploadError) throw uploadError;
                          // Create a signed URL (1 year)
                          const { data: signedData } = await supabase.storage
                            .from('backgrounds')
                            .createSignedUrl(filePath, 60 * 60 * 24 * 365);
                          if (signedData?.signedUrl) {
                            await setCustomBackgroundImage(signedData.signedUrl);
                            setBackgroundTheme('custom');
                          }
                        } catch (error) {
                          console.error('Error uploading background:', error);
                        } finally {
                          setUploadingBackground(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <div className="relative">
                      <button
                        onClick={() => {
                          if (backgroundImageUrl) {
                            setBackgroundTheme('custom');
                          } else {
                            backgroundInputRef.current?.click();
                          }
                        }}
                        disabled={uploadingBackground}
                        className={`w-8 h-8 rounded-full border border-border transition-all flex items-center justify-center bg-muted ${
                          backgroundTheme === 'custom'
                            ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={
                          backgroundImageUrl
                            ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : undefined
                        }
                        title={backgroundImageUrl ? 'Use saved image' : 'Upload custom image'}
                      >
                        {!backgroundImageUrl && (
                          <ImagePlus className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      {backgroundImageUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            backgroundInputRef.current?.click();
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-110 transition-all"
                          title="Change image"
                        >
                          <Upload className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {backgroundTheme === 'custom' && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label htmlFor="custom-bg-light">Light mode</Label>
                      <p className="text-sm text-muted-foreground">
                        White background, black text (for bright images)
                      </p>
                    </div>
                    <Switch
                      id="custom-bg-light"
                      checked={customBgLight}
                      onCheckedChange={setCustomBgLight}
                    />
                  </div>
                )}

                {backgroundTheme === 'custom' && (
                  <div className="pt-4 border-t space-y-3">
                    <div className="space-y-0.5">
                      <Label>Card Transparency</Label>
                      <p className="text-sm text-muted-foreground">
                        Control how see-through cards and panels are
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {([0, 25, 50, 75, 100] as const).map((value) => (
                        <button
                          key={value}
                          onClick={() => setCardOpacity(value)}
                          className={`flex-1 py-2 px-3 rounded-md border text-sm font-medium transition-all ${
                            cardOpacity === value
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-card hover:bg-accent border-border'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {backgroundTheme === 'custom' && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="space-y-0.5">
                      <Label>Text Color</Label>
                      <p className="text-sm text-muted-foreground">
                        Override the text color on custom backgrounds
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {([
                        { value: 'default' as CustomTextColor, label: 'Default', color: 'bg-foreground', border: true },
                        { value: 'black' as CustomTextColor, label: 'Black', color: 'bg-[hsl(0,0%,5%)]' },
                        { value: 'white' as CustomTextColor, label: 'White', color: 'bg-[hsl(0,0%,95%)]' },
                        { value: 'gold' as CustomTextColor, label: 'Gold', color: 'bg-[hsl(43,90%,55%)]' },
                        { value: 'red' as CustomTextColor, label: 'Red', color: 'bg-[hsl(0,72%,50%)]' },
                        { value: 'blue' as CustomTextColor, label: 'Blue', color: 'bg-[hsl(217,91%,60%)]' },
                        { value: 'grey' as CustomTextColor, label: 'Grey', color: 'bg-[hsl(215,16%,55%)]' },
                        { value: 'green' as CustomTextColor, label: 'Green', color: 'bg-[hsl(142,76%,36%)]' },
                        { value: 'orange' as CustomTextColor, label: 'Orange', color: 'bg-[hsl(24,95%,53%)]' },
                        { value: 'purple' as CustomTextColor, label: 'Purple', color: 'bg-[hsl(271,76%,53%)]' },
                        { value: 'pink' as CustomTextColor, label: 'Pink', color: 'bg-[hsl(330,81%,60%)]' },
                      ]).map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setCustomTextColor(option.value)}
                          className={`w-7 h-7 rounded-full ${option.color} ${option.border ? 'border border-border' : ''} transition-all ${
                            customTextColor === option.value
                              ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                              : 'hover:scale-105'
                          }`}
                          title={option.label}
                        />
                      ))}
                    </div>
                  </div>
                )}
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

          {/* Vendors Tab */}
          <TabsContent value="vendors" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vendors</CardTitle>
                  <CardDescription>Manage your suppliers and vendors</CardDescription>
                </div>
                <Link to="/vendors/new">
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Vendor
                  </Button>
                </Link>
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
                      <Link to={`/vendors/${vendor.id}`} key={vendor.id} className="flex items-center justify-between py-4 hover:bg-muted/50 -mx-2 px-2 rounded-lg transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                          {vendor.color && (
                            <div className="h-4 w-4 rounded-full shrink-0 border border-border" style={{ backgroundColor: vendor.color }} />
                          )}
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {[vendor.contact_email, vendor.contact_phone].filter(Boolean).join(' • ') || 'No contact info'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} asChild>
                            <Link to={`/vendors/${vendor.id}/edit`}>Edit</Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteVendorId(vendor.id); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Manage your customer contacts</CardDescription>
                </div>
                <Button onClick={() => openCustomerDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Customer
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search customers..."
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {customersLoading ? (
                  <div className="text-muted-foreground py-8 text-center">Loading customers...</div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    {customers.length === 0
                      ? "No customers yet. Add your first customer to get started."
                      : "No customers match your search."}
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredCustomers.map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between py-4">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {[customer.company, customer.email, customer.phone].filter(Boolean).join(' • ') || 'No contact info'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openCustomerDialog(customer)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={() => setDeleteCustomerId(customer.id)}
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
                <CardTitle>Item Categories</CardTitle>
                <CardDescription>Add custom categories and subcategories for your inventory items</CardDescription>
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
                  <div className="space-y-1">
                    {filteredCategories.map((cat) => {
                      const isExpanded = expandedCategories.has(cat.id);
                      const catSubs = getSubcategoriesForCategory(cat.id);
                      return (
                        <div key={cat.id} className="border border-border rounded-lg">
                          <div className="flex items-center justify-between px-3 py-2">
                            {editingCategoryId === cat.id ? (
                              <form
                                className="flex items-center gap-2 flex-1"
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  await updateCategory(cat.id, editingCategoryName);
                                  setEditingCategoryId(null);
                                }}
                              >
                                <Input
                                  value={editingCategoryName}
                                  onChange={(e) => setEditingCategoryName(e.target.value)}
                                  className="h-7 text-sm"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape') setEditingCategoryId(null);
                                  }}
                                />
                                <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0">
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingCategoryId(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </form>
                            ) : (
                              <button
                                type="button"
                                className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
                                onClick={() => {
                                  setExpandedCategories((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(cat.id)) next.delete(cat.id);
                                    else next.add(cat.id);
                                    return next;
                                  });
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                {cat.name}
                                <span className="text-xs text-muted-foreground">
                                  ({catSubs.length})
                                </span>
                              </button>
                            )}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingCategoryId(cat.id);
                                  setEditingCategoryName(cat.name);
                                }}
                                className="text-muted-foreground hover:text-primary p-1"
                                title="Edit category"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setMoveCategoryId(cat.id);
                                  setMoveTargetCategoryId('');
                                }}
                                className="text-muted-foreground hover:text-primary p-1"
                                title="Move to subcategory"
                              >
                                <ArrowRightLeft className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteCategoryId(cat.id)}
                                className="text-muted-foreground hover:text-destructive p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          {isExpanded && (
                            <div className="border-t border-border px-3 py-3 space-y-3 bg-muted/30">
                              {/* Add subcategory input */}
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  const val = newSubcategoryInputs[cat.id]?.trim();
                                  if (!val) return;
                                  await addSubcategory(cat.id, val);
                                  setNewSubcategoryInputs((prev) => ({ ...prev, [cat.id]: '' }));
                                }}
                                className="flex gap-2"
                              >
                                <Input
                                  placeholder="New subcategory..."
                                  value={newSubcategoryInputs[cat.id] || ''}
                                  onChange={(e) =>
                                    setNewSubcategoryInputs((prev) => ({
                                      ...prev,
                                      [cat.id]: e.target.value,
                                    }))
                                  }
                                  className="h-8 text-sm"
                                />
                                <Button type="submit" size="sm" variant="outline" className="h-8 gap-1">
                                  <Plus className="h-3 w-3" />
                                  Add
                                </Button>
                              </form>
                              {/* Subcategory list */}
                              {catSubs.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No subcategories yet.</p>
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {catSubs.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-md text-xs"
                                    >
                                      {editingSubcategoryId === sub.id ? (
                                        <form
                                          className="flex items-center gap-1"
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            await updateSubcategory(sub.id, editingSubcategoryName);
                                            setEditingSubcategoryId(null);
                                          }}
                                        >
                                          <Input
                                            value={editingSubcategoryName}
                                            onChange={(e) => setEditingSubcategoryName(e.target.value)}
                                            className="h-6 text-xs w-24"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Escape') setEditingSubcategoryId(null);
                                            }}
                                          />
                                          <button type="submit" className="text-primary hover:text-primary/80">
                                            <Check className="h-3 w-3" />
                                          </button>
                                          <button type="button" onClick={() => setEditingSubcategoryId(null)} className="text-muted-foreground hover:text-foreground">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </form>
                                      ) : (
                                        <>
                                          {sub.name}
                                          <button
                                            onClick={() => {
                                              setEditingSubcategoryId(sub.id);
                                              setEditingSubcategoryName(sub.name);
                                            }}
                                            className="ml-0.5 text-muted-foreground hover:text-primary"
                                          >
                                            <Pencil className="h-3 w-3" />
                                          </button>
                                          <button
                                            onClick={() => deleteSubcategory(sub.id)}
                                            className="ml-0.5 text-muted-foreground hover:text-destructive"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Assembly Categories Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Assembly Categories</CardTitle>
                <CardDescription>Organize your assemblies into categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={async (e) => { e.preventDefault(); await addAssemblyCategory(newAssemblyCategory); setNewAssemblyCategory(''); }} className="flex gap-2">
                  <Input
                    placeholder="New assembly category name"
                    value={newAssemblyCategory}
                    onChange={(e) => setNewAssemblyCategory(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button type="submit" className="gap-2" disabled={!newAssemblyCategory.trim()}>
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </form>

                {assemblyCategories.length > 0 && (
                  <div className="relative max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search assembly categories..."
                      value={assemblyCategorySearchQuery}
                      onChange={(e) => setAssemblyCategorySearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                )}

                {assemblyCategories.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">
                    No assembly categories yet. Add your first category to get started.
                  </div>
                ) : filteredAssemblyCategories.length === 0 ? (
                  <div className="text-muted-foreground py-4 text-center">
                    No categories match your search.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredAssemblyCategories.map((cat) => (
                      <div key={cat.id} className="flex items-center justify-between px-3 py-2 border border-border rounded-lg">
                        {editingAssemblyCategoryId === cat.id ? (
                          <form
                            className="flex items-center gap-2 flex-1"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              await updateAssemblyCategory(cat.id, editingAssemblyCategoryName);
                              setEditingAssemblyCategoryId(null);
                            }}
                          >
                            <Input
                              value={editingAssemblyCategoryName}
                              onChange={(e) => setEditingAssemblyCategoryName(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') setEditingAssemblyCategoryId(null);
                              }}
                            />
                            <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0">
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingAssemblyCategoryId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </form>
                        ) : (
                          <span className="text-sm font-medium">{cat.name}</span>
                        )}
                        {editingAssemblyCategoryId !== cat.id && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingAssemblyCategoryId(cat.id);
                                setEditingAssemblyCategoryName(cat.name);
                              }}
                              className="text-muted-foreground hover:text-primary p-1"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteAssemblyCategoryId(cat.id)}
                              className="text-muted-foreground hover:text-destructive p-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delete Assembly Category Confirmation */}
            <AlertDialog open={!!deleteAssemblyCategoryId} onOpenChange={() => setDeleteAssemblyCategoryId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete assembly category?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All assemblies in this category will be moved to "General". This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (deleteAssemblyCategoryId) {
                        deleteAssemblyCategory(deleteAssemblyCategoryId);
                        setDeleteAssemblyCategoryId(null);
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags" className="mt-6">
            <TagsSettings />
          </TabsContent>

          {/* Users Tab (Org Admin + Super Admin) */}
          {showUsersTab && (
            <TabsContent value="users" className="mt-6">
              <UsersSettings />
            </TabsContent>
          )}

          {/* Organizations Tab (Super Admin only) */}
          {isAdmin && (
            <TabsContent value="organizations" className="mt-6">
              <OrganizationsSettings />
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
            <div className="space-y-2">
              <Label htmlFor="vendor-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="vendor-color"
                  type="color"
                  value={vendorColor || '#6b7280'}
                  onChange={(e) => setVendorColor(e.target.value)}
                  className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                />
                <span className="text-sm text-muted-foreground">{vendorColor || 'No color set'}</span>
                {vendorColor && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setVendorColor('')} className="text-xs h-7">
                    Clear
                  </Button>
                )}
              </div>
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

      {/* Customer Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Name *</Label>
              <Input
                id="customer-name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-company">Company</Label>
              <Input
                id="customer-company"
                value={customerCompany}
                onChange={(e) => setCustomerCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Phone</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-address">Address</Label>
              <Textarea
                id="customer-address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Full address"
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCustomerDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editingCustomer ? 'Save Changes' : 'Add Customer'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation */}
      <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCustomerId) deleteCustomer(deleteCustomerId);
                setDeleteCustomerId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Move Category Dialog */}
      <Dialog open={!!moveCategoryId} onOpenChange={() => setMoveCategoryId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to Subcategory</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{categories.find((c) => c.id === moveCategoryId)?.name}" will become a subcategory. All items in this category will be reassigned. Pick the parent category:
          </p>
          <Select value={moveTargetCategoryId} onValueChange={setMoveTargetCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select parent category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                .filter((c) => c.id !== moveCategoryId)
                .map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveCategoryId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!moveTargetCategoryId}
              onClick={async () => {
                if (moveCategoryId && moveTargetCategoryId) {
                  await moveCategoryToSubcategory(moveCategoryId, moveTargetCategoryId);
                  setMoveCategoryId(null);
                }
              }}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
