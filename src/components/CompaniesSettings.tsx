import { useState, useRef } from 'react';
import { Plus, Trash2, Star, Upload, X, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { useCompanies, Company, CompanyInput } from '@/hooks/useCompanies';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function CompaniesSettings() {
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [businessNumber, setBusinessNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const openDialog = (company?: Company) => {
    if (company) {
      setEditingCompany(company);
      setName(company.name);
      setAddress(company.address || '');
      setPhone(company.phone || '');
      setEmail(company.email || '');
      setBusinessNumber(company.businessNumber || '');
      setLogoUrl(company.logoUrl || '');
      setIsDefault(company.isDefault);
    } else {
      setEditingCompany(null);
      setName('');
      setAddress('');
      setPhone('');
      setEmail('');
      setBusinessNumber('');
      setLogoUrl('');
      setIsDefault(companies.length === 0);
    }
    setDialogOpen(true);
  };

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

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data: CompanyInput = {
      name: name.trim(),
      address: address || null,
      phone: phone || null,
      email: email || null,
      businessNumber: businessNumber || null,
      logoUrl: logoUrl || null,
      isDefault,
    };

    if (editingCompany) {
      await updateCompany(editingCompany.id, data);
    } else {
      await addCompany(data);
    }
    setDialogOpen(false);
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Loading...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Companies</h3>
          <p className="text-sm text-muted-foreground">
            Manage your companies for invoices, POs, and quotes
          </p>
        </div>
        <Button onClick={() => openDialog()} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No companies yet. Add one to use on your documents.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {companies.map((company) => (
            <Card key={company.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="py-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {company.logoUrl && (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-12 w-12 rounded object-contain border bg-background"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{company.name}</h4>
                      {company.isDefault && (
                        <Badge variant="secondary" className="gap-1 shrink-0">
                          <Star className="h-3 w-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
                      {company.address && <p className="truncate">{company.address}</p>}
                      {company.phone && <p>{company.phone}</p>}
                      {company.email && <p>{company.email}</p>}
                      {company.businessNumber && <p>Business #: {company.businessNumber}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openDialog(company)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => setDeleteId(company.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add Company'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
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
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {logoUrl ? (
                <div className="flex items-center gap-3">
                  <img src={logoUrl} alt="Logo" className="h-12 w-12 rounded border object-contain" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl('')}>
                    <X className="h-4 w-4 mr-1" /> Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  <Upload className="h-4 w-4" />
                  {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-default"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="is-default">Set as default company</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!name.trim()}>
                {editingCompany ? 'Save Changes' : 'Add Company'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete company?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the company. Documents already using it will keep their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) deleteCompany(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
