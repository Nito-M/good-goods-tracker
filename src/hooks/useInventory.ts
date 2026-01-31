import { useState, useMemo } from 'react';
import { InventoryItem } from '@/types/inventory';

const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'MacBook Pro 14"',
    sku: 'ELEC-MBP14-001',
    category: 'Electronics',
    quantity: 12,
    price: 1999.99,
    cost: 1599.99,
    minStock: 5,
    weight: 3.5,
    weightUnit: 'lb',
    dimensions: { length: 12.31, width: 8.71, height: 0.61, unit: 'in' },
    colors: ['Space Gray', 'Silver'],
    description: 'Apple MacBook Pro 14-inch with M3 Pro chip, 18GB RAM, and 512GB SSD. Features Liquid Retina XDR display and up to 17 hours of battery life.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Wireless Mouse',
    sku: 'ELEC-WM-002',
    category: 'Electronics',
    quantity: 45,
    price: 29.99,
    cost: 12.50,
    minStock: 10,
    weight: 0.22,
    weightUnit: 'lb',
    dimensions: { length: 4.5, width: 2.8, height: 1.5, unit: 'in' },
    colors: ['Black', 'White', 'Blue'],
    description: 'Ergonomic wireless mouse with 2.4GHz connectivity, adjustable DPI settings, and silent click technology.',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '3',
    name: 'Office Chair',
    sku: 'OFF-CHR-003',
    category: 'Office',
    quantity: 3,
    price: 299.99,
    cost: 180.00,
    minStock: 5,
    weight: 35,
    weightUnit: 'lb',
    dimensions: { length: 26, width: 26, height: 42, unit: 'in' },
    colors: ['Black', 'Gray'],
    description: 'Ergonomic office chair with lumbar support, adjustable armrests, and breathable mesh back. Supports up to 300 lbs.',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '4',
    name: 'Cotton T-Shirt (L)',
    sku: 'CLO-TSH-004',
    category: 'Clothing',
    quantity: 150,
    price: 24.99,
    cost: 8.50,
    minStock: 20,
    weight: 0.35,
    weightUnit: 'lb',
    dimensions: { length: 12, width: 10, height: 1, unit: 'in' },
    colors: ['White', 'Black', 'Navy', 'Red', 'Green'],
    description: '100% organic cotton t-shirt, pre-shrunk, machine washable. Classic fit with reinforced seams.',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: '5',
    name: 'Mechanical Keyboard',
    sku: 'ELEC-KB-005',
    category: 'Electronics',
    quantity: 8,
    price: 149.99,
    cost: 75.00,
    minStock: 10,
    weight: 2.2,
    weightUnit: 'lb',
    dimensions: { length: 17.5, width: 5.5, height: 1.5, unit: 'in' },
    colors: ['Black', 'White'],
    description: 'Full-size mechanical keyboard with Cherry MX switches, RGB backlighting, and programmable macro keys.',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-19'),
  },
  {
    id: '6',
    name: 'Desk Lamp',
    sku: 'OFF-LMP-006',
    category: 'Office',
    quantity: 25,
    price: 49.99,
    cost: 22.00,
    minStock: 8,
    weight: 1.8,
    weightUnit: 'lb',
    dimensions: { length: 6, width: 6, height: 18, unit: 'in' },
    colors: ['Black', 'White', 'Silver'],
    description: 'LED desk lamp with adjustable brightness levels, color temperature control, and USB charging port.',
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
