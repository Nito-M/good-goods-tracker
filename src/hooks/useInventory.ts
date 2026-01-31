import { useState, useMemo } from 'react';
import { InventoryItem } from '@/types/inventory';

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    category: 'Electronics',
    quantity: 12,
    price: 1999.99,
    minStock: 5,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    category: 'Electronics',
    quantity: 45,
    price: 29.99,
    minStock: 10,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Office Chair',
    category: 'Office',
    quantity: 3,
    price: 299.99,
    minStock: 5,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'Cotton T-Shirt (L)',
    category: 'Clothing',
    quantity: 150,
    price: 24.99,
    minStock: 20,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    name: 'Mechanical Keyboard',
    category: 'Electronics',
    quantity: 8,
    price: 149.99,
    minStock: 10,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    name: 'Desk Lamp',
    category: 'Office',
    quantity: 25,
    price: 49.99,
    minStock: 8,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-14'),
  },
];

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>(INITIAL_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const addItem = (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: InventoryItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, ...updates, updatedAt: new Date() } : item
      )
    );
  };

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return {
    items: filteredItems,
    allItems: items,
    stats,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    addItem,
    updateItem,
    deleteItem,
  };
}
