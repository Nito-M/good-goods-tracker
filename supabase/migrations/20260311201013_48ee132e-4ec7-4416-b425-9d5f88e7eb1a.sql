-- Add kg_amount column to todos table
ALTER TABLE public.todos
ADD COLUMN kg_amount NUMERIC DEFAULT 0;

COMMENT ON COLUMN public.todos.kg_amount IS 'Amount in kilograms for this to-do item';