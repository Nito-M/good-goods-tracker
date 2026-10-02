
-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  job_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_items junction table
CREATE TABLE public.job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  item_name TEXT NOT NULL,
  sku TEXT NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;

-- Jobs RLS policies
CREATE POLICY "Users can view their own jobs" ON public.jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own jobs" ON public.jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own jobs" ON public.jobs FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Org members can view org jobs" ON public.jobs FOR SELECT USING (users_share_org(auth.uid(), user_id));

-- Job items RLS policies (through jobs ownership)
CREATE POLICY "Users can view their own job items" ON public.job_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Users can insert their own job items" ON public.job_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Users can update their own job items" ON public.job_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Users can delete their own job items" ON public.job_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND jobs.user_id = auth.uid()));
CREATE POLICY "Org members can view org job items" ON public.job_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_items.job_id AND users_share_org(auth.uid(), jobs.user_id)));

-- Auto-generate job numbers
CREATE OR REPLACE FUNCTION public.generate_job_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  next_num INTEGER;
BEGIN
  IF NEW.job_number IS NULL OR TRIM(NEW.job_number) = '' THEN
    SELECT COALESCE(MAX(
      CASE 
        WHEN job_number ~ '^JOB-[0-9]+$' 
        THEN CAST(SUBSTRING(job_number FROM 5) AS INTEGER)
        ELSE 0
      END
    ), 0) + 1
    INTO next_num
    FROM public.jobs
    WHERE user_id = NEW.user_id;
    
    NEW.job_number := 'JOB-' || LPAD(next_num::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER generate_job_number_trigger
BEFORE INSERT ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.generate_job_number();

-- Updated_at trigger
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
