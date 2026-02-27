export interface Dimensions {
  length: number;
  width: number;
  height: number;
  unit: 'in' | 'cm' | 'ft';
}

export type QuantityUnit = 'pcs' | 'ft' | 'm' | 'yd' | 'in' | 'sqft' | 'lt' | 'lbs';

export const QUANTITY_UNIT_LABELS: Record<QuantityUnit, string> = {
  pcs: 'Pieces',
  ft: 'Feet',
  m: 'Meters',
  yd: 'Yards',
  in: 'Inches',
  sqft: 'Sq Ft',
  lt: 'Litres',
  lbs: 'Pounds',
};

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  subcategory?: string | null;
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
  dxfUrl?: string | null;
  warehouseId?: string | null;
  palletAmount: number;
  boxAmount: number;
  bundleAmount: number;
  pieceLength: number;
  createdAt: Date;
  updatedAt: Date;
}

// Default categories that can be seeded for new users
export const DEFAULT_CATEGORY_NAMES = ['Electronics', 'Clothing', 'Food', 'Office', 'Other'] as const;
