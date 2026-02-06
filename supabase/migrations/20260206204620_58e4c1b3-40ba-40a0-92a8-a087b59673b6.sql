-- Add requester_name to profiles table (user's default requester name)
ALTER TABLE public.profiles ADD COLUMN requester_name text;

-- Add requester_name to requests table (captured at creation time)
ALTER TABLE public.requests ADD COLUMN requester_name text;