export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  cost: number;
  minStock: number;
  weight: number;
  weightUnit: 'lb' | 'kg';
  dimensions: Dimensions;
  colors: string[];
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Category = 'Electronics' | 'Clothing' | 'Food' | 'Office' | 'Other';

export const CATEGORIES: Category[] = ['Electronics', 'Clothing', 'Food', 'Office', 'Other'];
