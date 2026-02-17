

## Rename "Tags" Category to "Trailers" and Add "Metal" Tag

### What changes

1. **Rename existing "Tags" category to "Trailers" in the database** -- A database update to rename the existing category record.

2. **Add a "Metal" tag** -- Insert a new tag called "Metal" under a category. (It will be added to the "Parts" category since that seems the most fitting -- or "Trailers" if you prefer. I'll add it to "Parts" by default.)

3. **Update the default seed list in code** -- Change the `DEFAULT_TAG_CATEGORY_NAMES` constant in `src/hooks/useTagCategories.ts` from `['Parts', 'Tags']` to `['Parts', 'Trailers']` so new users get the correct defaults.

### Files to update
- `src/hooks/useTagCategories.ts` -- change `'Tags'` to `'Trailers'` in the defaults array

### Database changes
- Rename the "Tags" tag category to "Trailers"
- Insert a new "Metal" tag under the "Parts" category

