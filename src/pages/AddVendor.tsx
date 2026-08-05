import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useVendors } from '@/hooks/useVendors';

export function AddVendor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, loading, addVendor, updateVendor } = useVendors();
  const isEditing = !!id;

  const existingCategories = Array.from(new Set(vendors.map(v => v.category).filter(Boolean) as string[])).sort();

  const existingVendor = isEditing ? vendors.find((v) => v.id === id) : null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (existingVendor) {
      setName(existingVendor.name);
      setEmail(existingVendor.contact_email || '');
      setPhone(existingVendor.contact_phone || '');
      setAddress(existingVendor.address || '');
      setNotes(existingVendor.notes || '');
      setLink(existingVendor.link || '');
      setColor(existingVendor.color || '');
      setCategory(existingVendor.category || '');
    }
  }, [existingVendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vendorData = {
      name,
      contact_email: email || null,
      contact_phone: phone || null,
      address: address || null,
      notes: notes || null,
      link: link || null,
      color: color || null,
      category: category.trim() || null,
    };

    if (isEditing && id) {
      await updateVendor(id, vendorData);
      navigate(`/vendors/${id}`);
    } else {
      await addVendor(vendorData);
      navigate('/settings?tab=vendors');
    }
  };

  if (isEditing && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isEditing && !existingVendor && !loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Vendor not found</p>
        <Button variant="outline" onClick={() => navigate('/settings?tab=vendors')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(isEditing ? `/vendors/${id}` : '/settings')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-card-foreground">
                {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Vendor Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-name">Name *</Label>
                <Input
                  id="vendor-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Vendor name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor-email">Email</Label>
                  <Input
                    id="vendor-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vendor@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vendor-phone">Phone</Label>
                  <Input
                    id="vendor-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Popover open={catOpen} onOpenChange={setCatOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      <span className={category ? '' : 'text-muted-foreground'}>
                        {category || 'Select or add a category'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-popover" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search or type new category..."
                        value={catSearch}
                        onValueChange={setCatSearch}
                      />
                      <CommandList>
                        <CommandEmpty className="py-2 px-2 text-sm text-muted-foreground">
                          No matching category.
                        </CommandEmpty>
                        {catSearch.trim() &&
                          !existingCategories.some(
                            (c) => c.toLowerCase() === catSearch.trim().toLowerCase()
                          ) && (
                            <CommandGroup>
                              <CommandItem
                                value={`__add__${catSearch}`}
                                onSelect={() => {
                                  setCategory(catSearch.trim());
                                  setCatSearch('');
                                  setCatOpen(false);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add "{catSearch.trim()}"
                              </CommandItem>
                            </CommandGroup>
                          )}
                        <CommandGroup heading="Categories">
                          {category && (
                            <CommandItem
                              value="__clear__"
                              onSelect={() => {
                                setCategory('');
                                setCatOpen(false);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Clear category
                            </CommandItem>
                          )}
                          {existingCategories.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={() => {
                                setCategory(c);
                                setCatSearch('');
                                setCatOpen(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${category === c ? 'opacity-100' : 'opacity-0'}`}
                              />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>




              <div className="space-y-2">
                <Label htmlFor="vendor-address">Address</Label>
                <Textarea
                  id="vendor-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-link">Website / Link</Label>
                <Input
                  id="vendor-link"
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://vendor-website.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-notes">Notes</Label>
                <Textarea
                  id="vendor-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this vendor..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vendor-color">Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    id="vendor-color"
                    type="color"
                    value={color || '#6b7280'}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-9 w-12 rounded border border-border cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground">{color || 'No color set'}</span>
                  {color && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setColor('')} className="text-xs h-7">
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(isEditing ? `/vendors/${id}` : '/settings')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              {isEditing ? 'Save Changes' : 'Add Vendor'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
