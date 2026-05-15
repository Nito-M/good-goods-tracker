# Why no email is arriving

Your `send-password-reset` edge function is wired correctly and `RESEND_API_KEY` exists, but the function is sending **from `noreply@zumy.app`**. Unless `zumy.app` is verified in the Resend account that owns the API key, Resend silently rejects the send (and our function still returns `success: true` to the browser to avoid leaking whether an account exists). That matches what you're seeing: the UI says "check your email," but nothing arrives.

There are two ways to fix it. Pick one.

---

## Option A — Switch to Lovable Emails (recommended)

Lovable's built-in email system handles the sender domain, DNS, queueing, retries, and templates for you. No Resend account, no API key juggling. Once your domain is verified, password-reset emails (and any other auth emails — verification, magic link, etc.) just work.

Steps I'll take:
1. Set up an email sender domain for your project (you'll go through a short dialog to add a subdomain like `notify.northernoutline.ca` and a couple of NS records at your registrar).
2. Scaffold branded auth email templates (password reset, verification, magic link, etc.) styled to match your app.
3. Switch the password-reset flow over to Supabase's built-in `resetPasswordForEmail` so it goes through the new auth email pipeline.
4. Remove the custom `send-password-reset` / `complete-password-reset` edge functions and the `password_reset_tokens` table since they'll no longer be needed.

After DNS verifies (usually minutes to a few hours), reset emails will arrive from your own domain.

---

## Option B — Keep Resend, verify the sender domain

If you'd rather stay on Resend:
1. In your Resend dashboard, go to **Domains** and add `zumy.app` (or whichever domain you actually want to send from — likely `northernoutline.ca`).
2. Add the DNS records Resend gives you (SPF, DKIM, MX) at your domain registrar and wait for verification.
3. If you switch domains away from `zumy.app`, I'll update the `from` address in `supabase/functions/send-password-reset/index.ts` to match.
4. (Optional but recommended) I'll change the function so that real Resend errors are logged and surface a real failure to the UI instead of always returning success — that way future issues are visible.

Quick sanity test before doing DNS work: temporarily change the `from` to `onboarding@resend.dev` and send a reset to the email address that owns the Resend account. If that one arrives, the only thing missing is domain verification.

---

## Recommendation

Go with **Option A**. It's less moving parts, gives you branded auth emails for free, and removes ~150 lines of custom token/edge-function code we're currently maintaining.

Which direction do you want?
