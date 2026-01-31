export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
  minStock: number;
  createdAt: Date;
  updatedAt: Date;
}

export type Category = 'Electronics' | 'Clothing' | 'Food' | 'Office' | 'Other';

export const CATEGORIES: Category[] = ['Electronics', 'Clothing', 'Food', 'Office', 'Other'];
