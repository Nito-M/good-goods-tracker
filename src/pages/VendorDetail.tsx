import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, ExternalLink, Mail, Phone, MapPin, FileText, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useVendors } from '@/hooks/useVendors';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { useItemVendorPrices } from '@/hooks/useItemVendorPrices';
import { VendorContactsManager } from '@/components/VendorContactsManager';

export function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, loading, deleteVendor, updateVendor } = useVendors();
  const { orders } = usePurchaseOrders();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const vendor = vendors.find((v) => v.id === id);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading vendor...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Vendor not found</p>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
      </div>
    );
  }

  const vendorOrders = orders.filter((o) => o.vendorId === vendor.id);
  const totalSpent = vendorOrders.reduce((sum, o) => {
    if (o.items && Array.isArray(o.items)) {
      return sum + (o.items as any[]).reduce((s: number, item: any) => s + (Number(item.unitCost || 0) * Number(item.quantity || 0)), 0);
    }
    return sum;
  }, 0);

  const handleDelete = async () => {
    await deleteVendor(vendor.id);
    navigate('/settings');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                {vendor.color && (
                  <div
                    className="h-8 w-8 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: vendor.color }}
                  />
                )}
                <div>
                  <h1 className="text-xl font-bold text-card-foreground">{vendor.name}</h1>
                  <p className="text-sm text-muted-foreground">Vendor Details</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate(`/vendors/${vendor.id}/edit`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {vendor.contact_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${vendor.contact_email}`} className="text-sm hover:underline text-primary">
                    {vendor.contact_email}
                  </a>
                </div>
              )}
              {vendor.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${vendor.contact_phone}`} className="text-sm hover:underline text-primary">
                    {vendor.contact_phone}
                  </a>
                </div>
              )}
              {vendor.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{vendor.address}</span>
                </div>
              )}
              {vendor.link && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={vendor.link} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline text-primary truncate">
                    {vendor.link}
                  </a>
                </div>
              )}
              {!vendor.contact_email && !vendor.contact_phone && !vendor.address && !vendor.link && (
                <p className="text-sm text-muted-foreground">No contact information added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Purchase Orders</span>
                <Badge variant="secondary">{vendorOrders.length}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Spent</span>
                <span className="font-semibold text-foreground">${totalSpent.toFixed(2)}</span>
              </div>
              {vendor.color && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Color</span>
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full border border-border" style={{ backgroundColor: vendor.color }} />
                      <span className="text-sm text-foreground">{vendor.color}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contacts */}
        <VendorContactsManager vendorId={vendor.id} />

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {editingNotes ? (
              <div className="space-y-2">
                <textarea
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes about this vendor..."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotesValue(vendor.notes || ''); }}>Cancel</Button>
                  <Button size="sm" onClick={async () => { await updateVendor(vendor.id, { notes: notesValue || null }); setEditingNotes(false); }}>Save</Button>
                </div>
              </div>
            ) : (
              <div
                className="text-sm text-foreground whitespace-pre-wrap min-h-[40px] cursor-pointer rounded p-2 -m-2 hover:bg-muted/50 transition-colors"
                onClick={() => setEditingNotes(true)}
              >
                {vendor.notes || <span className="text-muted-foreground italic">Click to add notes...</span>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Purchase Orders */}
        {vendorOrders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {vendorOrders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-medium text-sm">{order.poNumber || (order.items?.[0]?.itemName)}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(order.orderedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant={order.status === 'received' ? 'default' : 'secondary'}>
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{vendor.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
