import { z } from 'zod';

// Common validation patterns
const optionalEmail = z.string().email('Invalid email format').max(255, 'Email must be less than 255 characters').optional().nullable().or(z.literal(''));
const optionalPhone = z.string().max(50, 'Phone must be less than 50 characters').optional().nullable();
const optionalAddress = z.string().max(500, 'Address must be less than 500 characters').optional().nullable();
const optionalNotes = z.string().max(2000, 'Notes must be less than 2000 characters').optional().nullable();
const requiredName = z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters');

// Vendor validation
const optionalUrl = z.string().url('Invalid URL format').max(2000, 'Link must be less than 2000 characters').optional().nullable().or(z.literal(''));

export const vendorSchema = z.object({
  name: requiredName,
  contact_email: optionalEmail,
  contact_phone: optionalPhone,
  address: optionalAddress,
  notes: optionalNotes,
  link: optionalUrl,
});

export type VendorInput = z.infer<typeof vendorSchema>;

// Category validation
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters').trim(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

// Profile validation
export const profileSchema = z.object({
  displayName: z.string().max(255, 'Display name must be less than 255 characters').optional().nullable(),
  avatarUrl: z.string().url('Invalid URL format').max(2000).optional().nullable().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL format').max(2000).optional().nullable().or(z.literal('')),
  businessName: z.string().max(255, 'Business name must be less than 255 characters').optional().nullable(),
  businessAddress: optionalAddress,
  businessPhone: optionalPhone,
  businessEmail: optionalEmail,
  businessNumber: z.string().max(100, 'Business number must be less than 100 characters').optional().nullable(),
  invoiceThankYouNote: z.string().max(500, 'Thank you note must be less than 500 characters').optional().nullable(),
  theme: z.string().max(20).optional().nullable(),
  colorTheme: z.string().max(20).optional().nullable(),
  backgroundTheme: z.string().max(20).optional().nullable(),
  quoteThankYouNote: z.string().max(500, 'Thank you note must be less than 500 characters').optional().nullable(),
  quoteValidityDays: z.number().int().min(1).max(365).optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Inventory item validation
export const inventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name must be less than 500 characters'),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be less than 100 characters'),
  quantity: z.number().int('Quantity must be a whole number').min(0, 'Quantity cannot be negative'),
  quantityUnit: z.enum(['pcs', 'ft', 'm', 'yd', 'in'], { errorMap: () => ({ message: 'Invalid quantity unit' }) }).optional().default('pcs'),
  price: z.number().min(0, 'Price cannot be negative'),
  cost: z.number().min(0, 'Cost cannot be negative'),
  minStock: z.number().int('Min stock must be a whole number').min(0, 'Min stock cannot be negative'),
  weight: z.number().min(0, 'Weight cannot be negative'),
  weightUnit: z.enum(['lb', 'kg'], { errorMap: () => ({ message: 'Invalid weight unit' }) }),
  dimensions: z.object({
    length: z.number().min(0, 'Length cannot be negative'),
    width: z.number().min(0, 'Width cannot be negative'),
    height: z.number().min(0, 'Height cannot be negative'),
    unit: z.enum(['in', 'cm'], { errorMap: () => ({ message: 'Invalid dimension unit' }) }),
  }),
  colors: z.array(z.string().max(50)).max(20, 'Maximum 20 colors allowed').optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters').optional(),
});

export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

// Purchase order item validation
export const purchaseOrderItemSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(100),
  itemName: z.string().min(1, 'Item name is required').max(500),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative').optional(),
});

export const purchaseOrderSchema = z.object({
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
  orderedAt: z.date(),
  notes: optionalNotes,
  vendorId: z.string().uuid().optional().nullable(),
  poNumber: z.string().max(50, 'PO number must be less than 50 characters').optional(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

// Sale item validation
export const saleItemSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item'),
  itemName: z.string().min(1).max(500),
  sku: z.string().min(1).max(100),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Price cannot be negative'),
  unitCost: z.number().min(0, 'Cost cannot be negative'),
});

export const createSaleSchema = z.object({
  vendorId: z.string().uuid().optional().nullable(),
  invoiceNumber: z.string().max(50).optional().nullable(),
  items: z.array(saleItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100, 'Tax rate must be between 0-100'),
  discountRate: z.number().min(0).max(100, 'Discount rate must be between 0-100'),
  notes: optionalNotes,
  paymentTerms: z.string().max(255).optional().nullable(),
  dueDate: z.string().optional().nullable(),
});

export type CreateSaleInputValidated = z.infer<typeof createSaleSchema>;

// Helper function to validate and return user-friendly errors
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T; errors?: undefined } | { success: false; errors: string[]; data?: undefined } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => {
    const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
    return `${path}${err.message}`;
  });
  
  return { success: false, errors };
}

// Helper to get first error message for simple cases
export function getValidationError<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): string | null {
  const result = validateInput(schema, data);
  if (result.success) return null;
  return result.errors[0] || 'Validation error';
}
