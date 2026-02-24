

## Fix: Allow Company Change When Updating a Quote

### Problem
The `updateQuote` function in `useQuotes.ts` does not include `company_id` in the database update call. The Edit Quote dialog sends the `companyId` value, but it gets silently dropped.

### Changes

**`src/hooks/useQuotes.ts`**
1. Add `companyId` to the `updateQuote` function's input type definition (around line 320).
2. Add `company_id: input.companyId || null` to the `.update({...})` call (around line 340-352).

### Technical Detail

The input type at line 302-322 needs a new field:
```
companyId?: string | null;
```

The update object at line 340-352 needs:
```
company_id: input.companyId || null,
```

This is a two-line fix -- no database or RLS changes needed since the org update policy already covers this field.
