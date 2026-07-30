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
import { useSales } from '@/hooks/useSales';
import { useItemVendorPrices } from '@/hooks/useItemVendorPrices';
import { VendorContactsManager } from '@/components/VendorContactsManager';
import { VendorNotesList } from '@/components/VendorNotesList';
import { VendorFilesSection } from '@/components/VendorFilesSection';
import { VendorLinksSection } from '@/components/VendorLinksSection';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import type { PurchaseOrder } from '@/types/purchaseOrder';

function poTotal(o: PurchaseOrder): number {
  const subtotal = (o.items || []).reduce(
    (s, it) => s + Number(it.unitCost || 0) * Number(it.quantity || 0),
    0
  );
  const afterDiscount = (subtotal < 0 ? subtotal - Number(o.discountAmount || 0) : Math.max(0, subtotal - Number(o.discountAmount || 0)));
  const tax = afterDiscount * 0.05;
  const pst = afterDiscount * (Number(o.pstPercent || 0) / 100);
  return afterDiscount + tax + pst;
}

export function VendorDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { vendors, loading, deleteVendor, updateVendor } = useVendors();
  const { orders } = usePurchaseOrders();
  const { sales } = useSales();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');

  const vendor = vendors.find((v) => v.id === id);

  useEffect(() => {
    if (vendor) setNotesValue(vendor.notes || '');
  }, [vendor?.notes]);

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
        <Button variant="outline" onClick={() => navigate('/settings?tab=vendors')}>
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

  const vendorSales = (sales || [])
    .filter((s) => s.vendorId === vendor.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalInvoiced = vendorSales.reduce((sum, s) => sum + Number(s.total || 0), 0);

  const handleDelete = async () => {
    await deleteVendor(vendor.id);
    navigate('/settings?tab=vendors');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings?tab=vendors')}>
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
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Invoices</span>
                <Badge variant="secondary">{vendorSales.length}</Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Invoiced</span>
                <span className="font-semibold text-foreground">${totalInvoiced.toFixed(2)}</span>
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

        {/* Links */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Links</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorLinksSection vendorId={vendor.id} />
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Files &amp; PDFs</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorFilesSection vendorId={vendor.id} />
          </CardContent>
        </Card>

        {/* Notes */}
        <VendorNotesList
          vendorId={vendor.id}
          legacyNote={vendor.notes}
          onMigrateLegacy={async () => { await updateVendor(vendor.id, { notes: null }); }}
        />




        {/* Purchase Orders by Year / Month */}
        {vendorOrders.length > 0 && (() => {
          const byYear = new Map<string, PurchaseOrder[]>();
          for (const o of vendorOrders) {
            const y = format(new Date(o.orderedAt), 'yyyy');
            const arr = byYear.get(y) || [];
            arr.push(o);
            byYear.set(y, arr);
          }
          const years = Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0]));

          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Purchase Orders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {years.map(([year, yOrders]) => {
                  const yearTotal = yOrders.reduce((s, o) => s + poTotal(o), 0);
                  const byMonth = new Map<string, PurchaseOrder[]>();
                  for (const o of yOrders) {
                    const k = format(new Date(o.orderedAt), 'yyyy-MM');
                    const arr = byMonth.get(k) || [];
                    arr.push(o);
                    byMonth.set(k, arr);
                  }
                  const months = Array.from(byMonth.entries()).sort((a, b) => b[0].localeCompare(a[0]));

                  return (
                    <Collapsible key={year} defaultOpen>
                      <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 text-left hover:bg-muted transition-colors group">
                        <span className="font-semibold text-card-foreground">{year}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-foreground">${yearTotal.toFixed(2)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {yOrders.length}
                          </span>
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pt-2 pl-2">
                        {months.map(([mKey, mOrders]) => {
                          const monthTotal = mOrders.reduce((s, o) => s + poTotal(o), 0);
                          const [yy, mm] = mKey.split('-').map(Number);
                          const monthLabel = format(new Date(yy, mm - 1, 1, 12), 'MMMM yyyy');
                          return (
                            <Collapsible key={mKey}>
                              <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left hover:bg-muted/50 transition-colors group">
                                <span className="text-sm font-medium text-card-foreground">{monthLabel}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-foreground">${monthTotal.toFixed(2)}</span>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                    {mOrders.length}
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="divide-y divide-border pl-2">
                                  {mOrders
                                    .sort((a, b) => new Date(b.orderedAt).getTime() - new Date(a.orderedAt).getTime())
                                    .map((order) => (
                                      <Link
                                        key={order.id}
                                        to={`/purchase-orders/${order.id}`}
                                        className="flex items-center justify-between py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                                      >
                                        <div>
                                          <div className="font-medium text-sm">{order.poNumber || (order.items?.[0]?.itemName)}</div>
                                          <div className="text-xs text-muted-foreground">
                                            {new Date(order.orderedAt).toLocaleDateString()}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm font-semibold text-foreground">${poTotal(order).toFixed(2)}</span>
                                          <Badge variant={order.status === 'received' ? 'default' : 'secondary'}>
                                            {order.status}
                                          </Badge>
                                        </div>
                                      </Link>
                                    ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </CardContent>
            </Card>
          );
        })()}

        {/* Recent Invoices */}
        {vendorSales.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {vendorSales.slice(0, 10).map((sale) => (
                  <Link
                    key={sale.id}
                    to={`/sales/${sale.id}`}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 rounded px-2 -mx-2 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-sm">{sale.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">${Number(sale.total || 0).toFixed(2)}</span>
                      <Badge variant={sale.status === 'paid' ? 'default' : 'secondary'}>
                        {sale.status}
                      </Badge>
                    </div>
                  </Link>
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
