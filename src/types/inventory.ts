export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm';
}

export type QuantityUnit = 'pcs' | 'ft' | 'm' | 'yd' | 'in';

export const QUANTITY_UNIT_LABELS: Record<QuantityUnit, string> = {
  pcs: 'Pieces',
  ft: 'Feet',
  m: 'Meters',
  yd: 'Yards',
  in: 'Inches',
};

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  quantityUnit: QuantityUnit;
  price: number;
  cost: number;
  minStock: number;
  weight: number;
  weightUnit: 'lb' | 'kg';
  dimensions: Dimensions;
  colors: string[];
  description: string;
  imageUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Default categories that can be seeded for new users
export const DEFAULT_CATEGORY_NAMES = ['Electronics', 'Clothing', 'Food', 'Office', 'Other'] as const;
