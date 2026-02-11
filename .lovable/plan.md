

## Fix: Published App Stuck on Loading Spinner

### Problem
When visiting `zumy.lovable.app` without being logged in, the app shows an infinite loading spinner instead of redirecting to the sign-in page.

### Root Cause
The `usePagePermissions` hook never finishes loading when there is no authenticated user. Its `useEffect` returns early when `user` is null, but it never sets `loading` to `false` in that case. Since `ProtectedRoute` waits for both auth loading AND permissions loading to finish before deciding to redirect, the page gets stuck forever.

### Fix
**File: `src/hooks/usePagePermissions.ts`**

Add an early return in the `useEffect` that sets `loading = false` when there is no user:

```typescript
useEffect(() => {
  const fetch = async () => {
    if (adminLoading || orgAdminLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    // ... rest of the logic stays the same
  };
  fetch();
}, [user, isAdmin, isOrgAdmin, adminLoading, orgAdminLoading]);
```

This is a one-line change. Once permissions loading resolves to `false`, the `ProtectedRoute` will see that there is no user and properly redirect to `/auth`.

### Technical Details
- Only `src/hooks/usePagePermissions.ts` needs to be edited
- The change separates the `!user` check from the `adminLoading`/`orgAdminLoading` check so loading resolves even when nobody is signed in
- No other files or database changes required

