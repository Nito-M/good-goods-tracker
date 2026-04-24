-- Ensure RLS is enabled (already is, but defensive)
ALTER TABLE public.signup_requests_log ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "Admins can view signup logs" ON public.signup_requests_log;
DROP POLICY IF EXISTS "Block all reads from non-admins" ON public.signup_requests_log;
DROP POLICY IF EXISTS "Block all client inserts" ON public.signup_requests_log;

-- Only platform admins can read signup log entries
CREATE POLICY "Admins can view signup logs"
ON public.signup_requests_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Block all client-side inserts; the signup edge function uses the service role
-- which bypasses RLS, so legitimate writes still work.
CREATE POLICY "Block all client inserts"
ON public.signup_requests_log
FOR INSERT
TO authenticated, anon
WITH CHECK (false);