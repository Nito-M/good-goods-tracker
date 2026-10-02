-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  weight NUMERIC(10,2) NOT NULL DEFAULT 0,
  weight_unit TEXT NOT NULL DEFAULT 'lb',
  dimensions_length NUMERIC(10,2) NOT NULL DEFAULT 0,
  dimensions_width NUMERIC(10,2) NOT NULL DEFAULT 0,
  dimensions_height NUMERIC(10,2) NOT NULL DEFAULT 0,
  dimensions_unit TEXT NOT NULL DEFAULT 'in',
  colors TEXT[] DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for now - no auth required)
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" 
ON public.inventory_items 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Allow public insert access" 
ON public.inventory_items 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Allow public update access" 
ON public.inventory_items 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Allow public delete access" 
ON public.inventory_items 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.inventory_items (name, sku, category, quantity, price, cost, min_stock, weight, weight_unit, dimensions_length, dimensions_width, dimensions_height, dimensions_unit, colors, description) VALUES
('MacBook Pro 14"', 'ELEC-MBP14-001', 'Electronics', 12, 1999.99, 1599.99, 5, 3.5, 'lb', 12.31, 8.71, 0.61, 'in', ARRAY['Space Gray', 'Silver'], 'Apple MacBook Pro 14-inch with M3 Pro chip, 18GB RAM, and 512GB SSD.'),
('Wireless Mouse', 'ELEC-WM-002', 'Electronics', 45, 29.99, 12.50, 10, 0.22, 'lb', 4.5, 2.8, 1.5, 'in', ARRAY['Black', 'White', 'Blue'], 'Ergonomic wireless mouse with 2.4GHz connectivity.'),
('Office Chair', 'OFF-CHR-003', 'Office', 3, 299.99, 180.00, 5, 35, 'lb', 26, 26, 42, 'in', ARRAY['Black', 'Gray'], 'Ergonomic office chair with lumbar support.'),
('Cotton T-Shirt (L)', 'CLO-TSH-004', 'Clothing', 150, 24.99, 8.50, 20, 0.35, 'lb', 12, 10, 1, 'in', ARRAY['White', 'Black', 'Navy', 'Red', 'Green'], '100% organic cotton t-shirt.'),
('Mechanical Keyboard', 'ELEC-KB-005', 'Electronics', 8, 149.99, 75.00, 10, 2.2, 'lb', 17.5, 5.5, 1.5, 'in', ARRAY['Black', 'White'], 'Full-size mechanical keyboard with Cherry MX switches.'),
('Desk Lamp', 'OFF-LMP-006', 'Office', 25, 49.99, 22.00, 8, 1.8, 'lb', 6, 6, 18, 'in', ARRAY['Black', 'White', 'Silver'], 'LED desk lamp with adjustable brightness.');