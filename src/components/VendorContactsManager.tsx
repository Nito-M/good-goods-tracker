import { useState } from 'react';
import { Plus, Trash2, Pencil, User, Briefcase, Mail, Phone, Star, X, Check, StickyNote, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVendorContacts, VendorContact } from '@/hooks/useVendorContacts';
import { useToast } from '@/hooks/use-toast';

interface ContactFormData {
  name: string;
  job_position: string;
  email: string;
  phone: string;
  notes: string;
  is_primary: boolean;
}

const emptyForm: ContactFormData = {
  name: '',
  job_position: '',
  email: '',
  phone: '',
  notes: '',
  is_primary: false,
};

interface VendorContactsManagerProps {
  vendorId: string;
  readOnly?: boolean;
}

export function VendorContactsManager({ vendorId, readOnly = false }: VendorContactsManagerProps) {
  const { contacts, loading, addContact, updateContact, deleteContact } = useVendorContacts(vendorId);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCopy = async (value: string, label: string, contactId: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(`${contactId}-${label}`);
      toast({ title: `${label} copied to clipboard` });
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) return;

    const contactData = {
      name: form.name.trim(),
      job_position: form.job_position.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      notes: form.notes.trim() || null,
      is_primary: form.is_primary,
    };

    if (editingId) {
      await updateContact(editingId, contactData);
      setEditingId(null);
    } else {
      await addContact(contactData);
    }

    setForm(emptyForm);
    setShowForm(false);
  };

  const startEdit = (contact: VendorContact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      job_position: contact.job_position || '',
      email: contact.email || '',
      phone: contact.phone || '',
      notes: contact.notes || '',
      is_primary: contact.is_primary,
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <User className="h-4 w-4" />
          Contacts
          <Badge variant="secondary" className="ml-1">{contacts.length}</Badge>
        </CardTitle>
        {!readOnly && !showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Name *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Job Position</Label>
                <Input
                  value={form.job_position}
                  onChange={(e) => setForm({ ...form, job_position: e.target.value })}
                  placeholder="e.g. Sales Manager"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes about this contact..."
                rows={2}
                className="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                  className="rounded"
                />
                Primary contact
              </label>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={cancelForm}>
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={!form.name.trim()}>
                  <Check className="h-4 w-4 mr-1" />
                  {editingId ? 'Save' : 'Add'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {loading && <p className="text-sm text-muted-foreground">Loading contacts...</p>}

        {!loading && contacts.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">No contacts added yet.</p>
        )}

        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-start justify-between border border-border rounded-lg p-3 gap-3"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{contact.name}</span>
                {contact.is_primary && (
                  <Badge variant="default" className="text-[10px] h-5">
                    <Star className="h-3 w-3 mr-0.5" />
                    Primary
                  </Badge>
                )}
                {contact.job_position && (
                  <Badge variant="outline" className="text-[10px] h-5">
                    <Briefcase className="h-3 w-3 mr-0.5" />
                    {contact.job_position}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary">
                    <Mail className="h-3 w-3" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="h-3 w-3" />
                    {contact.phone}
                  </a>
                )}
              </div>
              {contact.notes && (
                <div className="flex items-start gap-1 text-xs text-muted-foreground mt-1">
                  <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
                  <span className="whitespace-pre-line">{contact.notes}</span>
                </div>
              )}
            </div>
            {!readOnly && (
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(contact)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteContact(contact.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
