ALTER TABLE public.todos
ADD COLUMN IF NOT EXISTS priority_number integer,
ADD COLUMN IF NOT EXISTS priority_group text CHECK (priority_group IN ('urgent','soon','eventually'));