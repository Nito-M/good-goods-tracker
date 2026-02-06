-- Add deleted_at column for soft delete functionality
ALTER TABLE public.inventory_items
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient filtering of active items
CREATE INDEX idx_inventory_items_deleted_at ON public.inventory_items(deleted_at) WHERE deleted_at IS NULL;