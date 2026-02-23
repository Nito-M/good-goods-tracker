

# Fix: Items Not Showing for jkmartens47

## Root Cause
The `useInventory` hook loads items from IndexedDB first, then fetches from the server. If the IndexedDB cache is stale or empty (likely after the warehouses feature changed the DB version), and the server fetch encounters a silent error, items remain empty showing "No items found."

The current error handling also has a stale closure issue -- `items.length` inside the error handler captures the state value at callback creation time, not the current value.

## Solution
Make the inventory loading more resilient:

1. **Always show server data when available** -- even if IndexedDB load fails
2. **Clear stale IndexedDB data on user change** -- prevent one user's cache from interfering with another
3. **Improve error handling** -- remove stale closure reference and always log errors

## Changes

### 1. `src/hooks/useInventory.ts` -- Fix `fetchItems` function

**Current issues:**
- Uses `items.length` (stale closure) inside the error callback
- If IndexedDB has stale data with `deleted_at` set, `activeItems` is empty but `localItems.length > 0` is true, causing `setLoading(false)` before server response
- Errors in the server fetch are conditionally logged

**Fix:**
- Always log server fetch errors (remove the `items.length === 0` conditional)
- Remove stale closure reference to `items`
- Ensure `setLoading(false)` only happens after the server fetch completes (when online)
- Clear the IndexedDB inventory store before writing fresh server data to avoid accumulating stale records from other users or sessions

```typescript
const fetchItems = useCallback(async () => {
  if (!user) {
    setItems([]);
    setLoading(false);
    return;
  }

  // Load from IndexedDB for instant display
  try {
    const localItems = await getAll('inventory_items', user.id);
    if (localItems.length > 0) {
      const activeItems = (localItems as unknown as DbInventoryItem[]).filter(
        (item) => !item.deleted_at
      );
      setItems(activeItems.map(dbToInventoryItem));
      // Don't set loading false yet if online -- wait for server
      if (!isOnline) {
        setLoading(false);
      }
    }
  } catch (error) {
    console.error('Error loading from IndexedDB:', error);
  }

  // If online, always fetch from server
  if (isOnline) {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading inventory:', error);
      toast({
        title: 'Error loading inventory',
        description: 'Unable to load inventory. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    if (data) {
      await putMany('inventory_items', data as unknown as Record<string, unknown>[]);
      setItems((data as DbInventoryItem[]).map(dbToInventoryItem));
    }
  }

  setLoading(false);
}, [toast, user, isOnline]);
```

Key changes:
- **Don't set `loading = false` early when online** -- wait for the server response so the user sees a loading spinner instead of "No items found" briefly
- **Always log errors** -- removes the conditional `if (items.length === 0)` check that used a stale closure
- **Remove stale `items` reference** from the dependency-free error handler

This ensures jkmartens47 (or any user) always gets fresh server data when online, and the "No items found" message only appears after the server confirms there are truly no items.

