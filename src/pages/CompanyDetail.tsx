import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, Star, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { useCompanies } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InvoiceLayoutEditor } from '@/components/InvoiceLayoutEditor';
import { InvoiceLayout, defaultInvoiceLayout } from '@/types/invoiceLayout';


export function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { companies, loading, updateCompany, deleteCompany } = useCompanies();
  const { user } = useAuth();

  const [editingSection, setEditingSection] = useState<'info' | 'invoice' | 'quote' | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Invoice settings
  const [invoicePrefix, setInvoicePrefix] = useState('INV');
  const [invoiceNextNumber, setInvoiceNextNumber] = useState(1);
  const [invoiceThankYouNote, setInvoiceThankYouNote] = useState('Thank you for your business!');
  const [invoiceLayout, setInvoiceLayout] = useState<InvoiceLayout>(defaultInvoiceLayout);

  // Quote settings
  const [quoteThankYouNote, setQuoteThankYouNote] = useState('Thank you for considering our services!');
  const [quoteValidityDays, setQuoteValidityDays] = useState(30);
  const [quoteLayout, setQuoteLayout] = useState<InvoiceLayout>(defaultInvoiceLayout);


  const company = companies.find((c) => c.id === id);

  // Populate form from company data
  useEffect(() => {
    if (company) {
      setName(company.name);
      setAddress(company.address || '');
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setBusinessNumber(company.businessNumber || '');
      setLogoUrl(company.logoUrl || '');
      setIsDefault(company.isDefault);
      setInvoicePrefix(company.invoicePrefix || 'INV');
      setInvoiceNextNumber(company.invoiceNextNumber || 1);
      setInvoiceThankYouNote(company.invoiceThankYouNote || 'Thank you for your business!');
      setInvoiceLayout(company.invoiceLayout || defaultInvoiceLayout);
      setQuoteThankYouNote(company.quoteThankYouNote || 'Thank you for considering our services!');
      setQuoteValidityDays(company.quoteValidityDays || 30);
      setQuoteLayout(company.quoteLayout || defaultInvoiceLayout);
    }
  }, [company]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/company-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: signedData, error: signedError } = await supabase.storage
        .from('logos')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (signedError || !signedData?.signedUrl) throw new Error('Failed to get signed URL');
      setLogoUrl(signedData.signedUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!name.trim() || !company) return;
    await updateCompany(company.id, {
      name: name.trim(),
      address: address || null,
      phone: phone || null,
      email: email || null,
      businessNumber: businessNumber || null,
      logoUrl: logoUrl || null,
      isDefault,
    });
    setEditingSection(null);
  };

  const handleSaveInvoice = async () => {
    if (!company) return;
    await updateCompany(company.id, {
      invoicePrefix: invoicePrefix || 'INV',
      invoiceNextNumber,
      invoiceThankYouNote,
      invoiceLayout,
    });
    setEditingSection(null);
  };

  const handleSaveQuote = async () => {
    if (!company) return;
    await updateCompany(company.id, {
      quoteThankYouNote,
      quoteValidityDays,
      quoteLayout,
    });
    setEditingSection(null);
  };

  const handleDelete = async () => {
    if (!company) return;
    await deleteCompany(company.id);
    navigate('/settings');
  };

  const cancelEditing = () => {
    if (company) {
      setName(company.name);
      setAddress(company.address || '');
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setBusinessNumber(company.businessNumber || '');
      setLogoUrl(company.logoUrl || '');
      setIsDefault(company.isDefault);
      setInvoicePrefix(company.invoicePrefix || 'INV');
      setInvoiceNextNumber(company.invoiceNextNumber || 1);
      setInvoiceThankYouNote(company.invoiceThankYouNote || 'Thank you for your business!');
      setInvoiceLayout(company.invoiceLayout || defaultInvoiceLayout);
      setQuoteThankYouNote(company.quoteThankYouNote || 'Thank you for considering our services!');
      setQuoteValidityDays(company.quoteValidityDays || 30);
      setQuoteLayout(company.quoteLayout || defaultInvoiceLayout);
    }
    setEditingSection(null);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-center py-8">Loading...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => navigate('/settings')} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to Settings
        </Button>
        <p className="text-muted-foreground text-center py-8">Company not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {company.logoUrl && (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="h-10 w-10 rounded object-contain border bg-background"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold truncate">{company.name}</h1>
              {company.isDefault && (
                <Badge variant="secondary" className="gap-1 shrink-0">
                  <Star className="h-3 w-3" /> Default
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive shrink-0" onClick={() => setDeleteOpen(true)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator />

      {/* Company Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Company Information</CardTitle>
            {editingSection === 'info' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                <Button size="sm" onClick={handleSaveInfo} disabled={!name.trim()}>Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingSection('info')}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'info' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Business Number</Label>
                <Input value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded border object-contain" />
                    <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl('')}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="gap-2" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
                    <Upload className="h-4 w-4" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="is-default-edit" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded" />
                <Label htmlFor="is-default-edit">Set as default company</Label>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
                {company.address && (
                  <>
                    <span className="text-muted-foreground">Address</span>
                    <span className="whitespace-pre-line">{company.address}</span>
                  </>
                )}
                {company.phone && (
                  <>
                    <span className="text-muted-foreground">Phone</span>
                    <span>{company.phone}</span>
                  </>
                )}
                {company.email && (
                  <>
                    <span className="text-muted-foreground">Email</span>
                    <span>{company.email}</span>
                  </>
                )}
                {company.businessNumber && (
                  <>
                    <span className="text-muted-foreground">Business #</span>
                    <span>{company.businessNumber}</span>
                  </>
                )}
              </div>
              {!company.address && !company.phone && !company.email && !company.businessNumber && (
                <p className="text-sm text-muted-foreground">No details added yet.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoice Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Invoice Settings</CardTitle>
            {editingSection === 'invoice' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                <Button size="sm" onClick={handleSaveInvoice}>Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingSection('invoice')}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'invoice' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Number Format</Label>
                <div className="flex items-center gap-2">
                  <div className="space-y-1">
                    <Input
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
                  Next invoice: {invoicePrefix || 'INV'}-{String(invoiceNextNumber).padStart(4, '0')}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Thank You Note</Label>
                <Textarea value={invoiceThankYouNote} onChange={(e) => setInvoiceThankYouNote(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <InvoiceLayoutEditor layout={invoiceLayout} onChange={setInvoiceLayout} logoUrl={logoUrl} businessName={name} businessAddress={address} businessPhone={phone} businessEmail={email} documentType="invoice" thankYouNote={invoiceThankYouNote} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Next Invoice</span>
              <span className="font-mono">{company.invoicePrefix}-{String(company.invoiceNextNumber).padStart(4, '0')}</span>
              <span className="text-muted-foreground">Thank You</span>
              <span>{company.invoiceThankYouNote}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quote Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Quote Settings</CardTitle>
            {editingSection === 'quote' ? (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={cancelEditing}>Cancel</Button>
                <Button size="sm" onClick={handleSaveQuote}>Save</Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setEditingSection('quote')}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingSection === 'quote' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Validity Period (days)</Label>
                <Input
                  type="number"
                  value={quoteValidityDays}
                  onChange={(e) => setQuoteValidityDays(parseInt(e.target.value) || 30)}
                  min={1}
                  max={365}
                  className="w-32"
                />
              </div>
              <div className="space-y-2">
                <Label>Thank You Note</Label>
                <Textarea value={quoteThankYouNote} onChange={(e) => setQuoteThankYouNote(e.target.value)} rows={2} />
              </div>
              <div className="space-y-2 pt-2 border-t">
                <InvoiceLayoutEditor layout={quoteLayout} onChange={setQuoteLayout} logoUrl={logoUrl} businessName={name} businessAddress={address} businessPhone={phone} businessEmail={email} documentType="quote" thankYouNote={quoteThankYouNote} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
              <span className="text-muted-foreground">Validity</span>
              <span>{company.quoteValidityDays} days</span>
              <span className="text-muted-foreground">Thank You</span>
              <span>{company.quoteThankYouNote}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company. Documents already using it will keep their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
