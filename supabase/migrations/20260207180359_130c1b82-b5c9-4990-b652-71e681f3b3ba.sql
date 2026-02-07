-- Create item_images table for multiple images per inventory item
CREATE TABLE public.item_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own item images" 
ON public.item_images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item images" 
ON public.item_images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item images" 
ON public.item_images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item images" 
ON public.item_images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_item_images_item_id ON public.item_images(item_id);
CREATE INDEX idx_item_images_user_id ON public.item_images(user_id);