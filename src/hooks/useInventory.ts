import { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem, QuantityUnit } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from './useOnlineStatus';
import {
  getAll,
  put,
  putMany,
  deleteItem as deleteFromDb,
  addToSyncQueue,
} from '@/lib/offlineDb';
import { inventoryItemSchema, validateInput } from '@/lib/validation';

interface DbInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  quantity_unit: string;
  price: number;
  cost: number;
  min_stock: number;
  weight: number;
  weight_unit: string;
  dimensions_length: number;
  dimensions_width: number;
  dimensions_height: number;
  dimensions_unit: string;
  colors: string[];
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  deleted_at: string | null;
}

function dbToInventoryItem(db: DbInventoryItem): InventoryItem {
  return {
    id: db.id,
    name: db.name,
    sku: db.sku,
    category: db.category,
    quantity: db.quantity,
    quantityUnit: (db.quantity_unit || 'pcs') as QuantityUnit,
    price: Number(db.price),
    cost: Number(db.cost),
    minStock: db.min_stock,
    weight: Number(db.weight),
    weightUnit: db.weight_unit as 'lb' | 'kg',
    dimensions: {
      length: Number(db.dimensions_length),
      width: Number(db.dimensions_width),
      height: Number(db.dimensions_height),
      unit: db.dimensions_unit as 'in' | 'cm',
    },
    colors: db.colors || [],
    description: db.description || '',
    imageUrl: db.image_url,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

function inventoryItemToDb(
  item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>,
  userId: string,
  id?: string
): DbInventoryItem {
  const now = new Date().toISOString();
  return {
    id: id || crypto.randomUUID(),
    name: item.name,
    sku: item.sku,
    category: item.category,
    quantity: item.quantity,
    quantity_unit: item.quantityUnit || 'pcs',
    price: item.price,
    cost: item.cost,
    min_stock: item.minStock,
    weight: item.weight,
    weight_unit: item.weightUnit,
    dimensions_length: item.dimensions.length,
    dimensions_width: item.dimensions.width,
    dimensions_height: item.dimensions.height,
    dimensions_unit: item.dimensions.unit,
    colors: item.colors,
    description: item.description || null,
    image_url: item.imageUrl || null,
    created_at: now,
    updated_at: now,
    user_id: userId,
    deleted_at: null,
  };
}


export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { isOnline } = useOnlineStatus();

  // Load from local DB first, then sync with server
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    // First, load from IndexedDB for instant display (filter out deleted items)
    try {
      const localItems = await getAll('inventory_items', user.id);
      if (localItems.length > 0) {
        const activeItems = (localItems as unknown as DbInventoryItem[]).filter(
          (item) => !item.deleted_at
        );
        setItems(activeItems.map(dbToInventoryItem));
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading from IndexedDB:', error);
    }

    // If online, fetch from server and update local (only active items)
    if (isOnline) {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        if (items.length === 0) {
          console.error('Error loading inventory:', error);
          toast({
            title: 'Error loading inventory',
            description: 'Unable to load inventory. Please try again.',
            variant: 'destructive',
          });
        }
        setLoading(false);
        return;
      }

      // Update local DB with server data
      if (data) {
        await putMany('inventory_items', data as unknown as Record<string, unknown>[]);
        setItems((data as DbInventoryItem[]).map(dbToInventoryItem));
      }
    }

    setLoading(false);
  }, [toast, user, isOnline]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Listen for sync complete events
  useEffect(() => {
    const handleSyncComplete = () => fetchItems();
    window.addEventListener('sync-complete', handleSyncComplete);
    return () => window.removeEventListener('sync-complete', handleSyncComplete);
  }, [fetchItems]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, categoryFilter]);

  const stats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    const lowStockItems = items.filter((item) => item.quantity <= item.minStock);
    return { totalItems, totalValue, lowStockCount: lowStockItems.length, lowStockItems };
  }, [items]);

  const addItem = async (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast({
        title: 'Not authenticated',
        description: 'Please sign in to add items.',
        variant: 'destructive',
      });
      return;
    }

    // Validate input
    const validation = validateInput(inventoryItemSchema, item);
    if (!validation.success) {
      toast({
        title: 'Validation error',
        description: validation.errors[0],
        variant: 'destructive',
      });
      return;
    }

    const dbItem = inventoryItemToDb(validation.data as Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>, user.id);

    // Save locally first
    await put('inventory_items', dbItem as unknown as Record<string, unknown>);
    setItems((prev) => [dbToInventoryItem(dbItem), ...prev]);

    if (isOnline) {
      // Try to save to server immediately
      const { error } = await supabase.from('inventory_items').insert({
        id: dbItem.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        quantity_unit: item.quantityUnit || 'pcs',
        price: item.price,
        cost: item.cost,
        min_stock: item.minStock,
        weight: item.weight,
        weight_unit: item.weightUnit,
        dimensions_length: item.dimensions.length,
        dimensions_width: item.dimensions.width,
        dimensions_height: item.dimensions.height,
        dimensions_unit: item.dimensions.unit,
        colors: item.colors,
        description: item.description,
        image_url: item.imageUrl || null,
        user_id: user.id,
      });

      if (error) {
        // Queue for later sync
        await addToSyncQueue({
          table: 'inventory_items',
          operation: 'insert',
          data: dbItem as unknown as Record<string, unknown>,
        });
        toast({ title: 'Item saved offline', description: 'Will sync when back online' });
        return;
      }
    } else {
      // Queue for sync
      await addToSyncQueue({
        table: 'inventory_items',
        operation: 'insert',
        data: dbItem as unknown as Record<string, unknown>,
      });
      toast({ title: 'Item saved offline', description: 'Will sync when back online' });
      return;
    }

    toast({ title: 'Item added successfully' });
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const existingItem = items.find((i) => i.id === id);
    if (!existingItem) return;

    // Prepare DB updates
    const dbUpdates: Record<string, unknown> = { id };
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.quantityUnit !== undefined) dbUpdates.quantity_unit = updates.quantityUnit;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.minStock !== undefined) dbUpdates.min_stock = updates.minStock;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.weightUnit !== undefined) dbUpdates.weight_unit = updates.weightUnit;
    if (updates.dimensions !== undefined) {
      dbUpdates.dimensions_length = updates.dimensions.length;
      dbUpdates.dimensions_width = updates.dimensions.width;
      dbUpdates.dimensions_height = updates.dimensions.height;
      dbUpdates.dimensions_unit = updates.dimensions.unit;
    }
    if (updates.colors !== undefined) dbUpdates.colors = updates.colors;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    dbUpdates.updated_at = new Date().toISOString();

    // Get current item from local DB and merge updates
    const localItem = await getAll('inventory_items', user?.id).then(
      (items) => items.find((i) => (i as { id: string }).id === id)
    );
    
    const mergedItem = { ...localItem, ...dbUpdates };

    // Update locally first
    await put('inventory_items', mergedItem);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
    );

    if (isOnline) {
      const { id: _, ...updateData } = dbUpdates;
      const { error } = await supabase
        .from('inventory_items')
        .update(updateData)
        .eq('id', id);

      if (error) {
        await addToSyncQueue({
          table: 'inventory_items',
          operation: 'update',
          data: dbUpdates,
        });
        toast({ title: 'Changes saved offline', description: 'Will sync when back online' });
        return;
      }
    } else {
      await addToSyncQueue({
        table: 'inventory_items',
        operation: 'update',
        data: dbUpdates,
      });
      toast({ title: 'Changes saved offline', description: 'Will sync when back online' });
      return;
    }

    toast({ title: 'Item updated successfully' });
  };

  const checkUnreceivedPOs = async (itemId: string, sku: string): Promise<{ blocked: boolean; poNumbers: string[] }> => {
    if (!user) return { blocked: false, poNumbers: [] };

    // Check for unreceived POs that contain this item
    const { data: unreceived } = await supabase
      .from('purchase_orders')
      .select('po_number, items, sku')
      .eq('user_id', user.id)
      .eq('status', 'ordered');

    if (!unreceived || unreceived.length === 0) {
      return { blocked: false, poNumbers: [] };
    }

    const blockingPOs: string[] = [];
    for (const po of unreceived) {
      // Check if the PO contains this SKU (either in items array or legacy sku field)
      const items = po.items as Array<{ sku: string }> | null;
      const hasItem = items?.some((item) => item.sku === sku) || po.sku === sku;
      if (hasItem) {
        blockingPOs.push(po.po_number || 'Unnamed PO');
      }
    }

    return { blocked: blockingPOs.length > 0, poNumbers: blockingPOs };
  };

  const deleteItem = async (id: string): Promise<{ success: boolean; error?: string; poNumbers?: string[] }> => {
    const item = items.find((i) => i.id === id);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Check for unreceived POs
    const { blocked, poNumbers } = await checkUnreceivedPOs(id, item.sku);
    if (blocked) {
      return { 
        success: false, 
        error: 'Cannot delete item - it is on unreceived purchase orders',
        poNumbers,
      };
    }

    // Soft delete - set deleted_at timestamp
    const deletedAt = new Date().toISOString();

    // Update locally first
    const localItem = await getAll('inventory_items', user?.id).then(
      (items) => items.find((i) => (i as { id: string }).id === id)
    );
    if (localItem) {
      await put('inventory_items', { ...localItem, deleted_at: deletedAt });
    }
    setItems((prev) => prev.filter((item) => item.id !== id));

    if (isOnline) {
      const { error } = await supabase
        .from('inventory_items')
        .update({ deleted_at: deletedAt })
        .eq('id', id);

      if (error) {
        await addToSyncQueue({
          table: 'inventory_items',
          operation: 'update',
          data: { id, deleted_at: deletedAt },
        });
        toast({ title: 'Delete saved offline', description: 'Will sync when back online' });
        return { success: true };
      }
    } else {
      await addToSyncQueue({
        table: 'inventory_items',
        operation: 'update',
        data: { id, deleted_at: deletedAt },
      });
      toast({ title: 'Delete saved offline', description: 'Will sync when back online' });
      return { success: true };
    }

    toast({ title: 'Item deleted successfully', description: 'Historical records preserved' });
    return { success: true };
  };

  const uploadItemImage = async (file: File): Promise<string | null> => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast({
          title: 'Upload failed',
          description: 'Could not upload image. Please try again.',
          variant: 'destructive',
        });
        return null;
      }

      // Create signed URL
      const { data, error: signedUrlError } = await supabase.storage
        .from('item-images')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (signedUrlError || !data) {
        console.error('Error creating signed URL:', signedUrlError);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const getItemImageUrl = async (imagePath: string | null | undefined): Promise<string | null> => {
    if (!imagePath || !user) return null;

    // If it's already a signed URL (temporary), regenerate it
    if (imagePath.startsWith('http')) {
      // Extract the file path from the URL if possible
      const match = imagePath.match(/item-images\/([^?]+)/);
      if (match) {
        const filePath = match[1];
        const { data, error } = await supabase.storage
          .from('item-images')
          .createSignedUrl(filePath, 3600);
        
        if (!error && data) {
          return data.signedUrl;
        }
      }
      return imagePath; // Return as-is if we can't parse it
    }

    // It's a storage path, generate signed URL
    const { data, error } = await supabase.storage
      .from('item-images')
      .createSignedUrl(imagePath, 3600);

    if (error || !data) {
      console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  return {
    items: filteredItems,
    allItems: items,
    stats,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addItem,
    updateItem,
    deleteItem,
    uploadItemImage,
    getItemImageUrl,
  };
}
