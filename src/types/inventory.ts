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

// Default categories that can be seeded for new users
export const DEFAULT_CATEGORY_NAMES = ['Electronics', 'Clothing', 'Food', 'Office', 'Other'] as const;
