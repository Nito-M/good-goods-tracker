## Plan

Fix the app-wide tab-return reload by stabilizing the global auth context instead of patching individual pages.

### What I’ll change

1. **Stabilize auth updates**
   - Update `AuthContext` so token refresh events do not replace the `session` object or context value when the signed-in user has not changed.
   - Keep the existing `user` stability fix, but extend it to the full context so every component using `useAuth()` does not rerender/refetch on tab focus.

2. **Memoize auth functions/context value**
   - Wrap `signUp`, `signIn`, and `signOut` in stable callbacks.
   - Memoize the provider value so consumers only update when `user`, `session`, or `loading` meaningfully changes.

3. **Keep real auth changes working**
   - Still update immediately on actual sign-in, sign-out, user change, or expired/missing session.
   - Preserve the existing “Remember Me” behavior and password recovery exception.

4. **Verify the trigger is removed**
   - Confirm the only intentional hard reload remains the manual refresh button in `AppLayout`.
   - Run a focused check so returning to the tab should no longer cause global page loading/spinner behavior.