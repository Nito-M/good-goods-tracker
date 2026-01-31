import { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem, Dimensions } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DbInventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
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
  created_at: string;
  updated_at: string;
}

function dbToInventoryItem(db: DbInventoryItem): InventoryItem {
  return {
    id: db.id,
    name: db.name,
    sku: db.sku,
    category: db.category,
    quantity: db.quantity,
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
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: 'Error loading inventory',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    setItems((data as DbInventoryItem[]).map(dbToInventoryItem));
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchItems();
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
    const { error } = await supabase.from('inventory_items').insert({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
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
    });

    if (error) {
      toast({
        title: 'Error adding item',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Item added successfully' });
    fetchItems();
  };

  const updateItem = async (id: string, updates: Partial<InventoryItem>) => {
    const dbUpdates: Record<string, unknown> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
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

    const { error } = await supabase
      .from('inventory_items')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error updating item',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Item updated successfully' });
    fetchItems();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting item',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Item deleted successfully' });
    fetchItems();
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
  };
}
