import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Building2, Tags, LogOut, Sun, Moon, Monitor, FileText, Palette } from 'lucide-react';
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

import { useColorTheme, ColorTheme, BackgroundTheme } from '@/hooks/useColorTheme';
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
import { CATEGORIES as DEFAULT_CATEGORIES } from '@/types/inventory';

export function Settings() {
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, backgroundTheme, setBackgroundTheme } = useColorTheme();
  const { vendors, loading: vendorsLoading, addVendor, updateVendor, deleteVendor } = useVendors();
  const { customCategories, allCategories, loading: categoriesLoading, addCategory, deleteCategory } = useCategories();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

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

  // Load profile data into form
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.businessName || '');
      setBusinessAddress(profile.businessAddress || '');
      setBusinessPhone(profile.businessPhone || '');
      setBusinessEmail(profile.businessEmail || '');
      setBusinessNumber(profile.businessNumber || '');
      setInvoiceThankYouNote(profile.invoiceThankYouNote || 'Thank you for your business!');
    }
  }, [profile]);

  // Vendor dialog state
  const [vendorDialogOpen, setVendorDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorAddress, setVendorAddress] = useState('');
  const [vendorNotes, setVendorNotes] = useState('');

  // Category state
  const [newCategory, setNewCategory] = useState('');

  // Delete confirmation state
  const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);

  const openVendorDialog = (vendor?: Vendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorName(vendor.name);
      setVendorEmail(vendor.contact_email || '');
      setVendorPhone(vendor.contact_phone || '');
      setVendorAddress(vendor.address || '');
      setVendorNotes(vendor.notes || '');
    } else {
      setEditingVendor(null);
      setVendorName('');
      setVendorEmail('');
      setVendorPhone('');
      setVendorAddress('');
      setVendorNotes('');
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
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="general" className="gap-2">
              <Monitor className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="invoice" className="gap-2">
              <FileText className="h-4 w-4" />
              Invoice
            </TabsTrigger>
            <TabsTrigger value="vendors" className="gap-2">
              <Building2 className="h-4 w-4" />
              Vendors
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Tags className="h-4 w-4" />
              Categories
            </TabsTrigger>
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
                  <Select value={theme} onValueChange={setTheme}>
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

                  <Button type="submit" disabled={profileLoading}>
                    Save Invoice Settings
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
              <CardContent>
                {vendorsLoading ? (
                  <div className="text-muted-foreground py-8 text-center">Loading vendors...</div>
                ) : vendors.length === 0 ? (
                  <div className="text-muted-foreground py-8 text-center">
                    No vendors yet. Add your first vendor to get started.
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {vendors.map((vendor) => (
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

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Default Categories</h4>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <div
                        key={cat}
                        className="px-3 py-1.5 bg-muted rounded-md text-sm"
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                </div>

                {customCategories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">Custom Categories</h4>
                    <div className="flex flex-wrap gap-2">
                      {customCategories.map((cat) => (
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
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
    </div>
  );
}
