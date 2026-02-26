

# Remove Trailer Parts Subcategories

## What this does
Deletes the 10 subcategories (Axles, Brake Parts, Couplers, Electric Trailer Parts, Hydraulics, Jacks, Tires and Rims, Springs, Vinyls, Wiring) from under the "Trailer Parts" category, while keeping any top-level categories with those same names untouched.

## How
A single data deletion query targeting only the subcategories table where the parent category is "Trailer Parts".

### Technical Details
```sql
DELETE FROM public.subcategories
WHERE name IN (
  'Axles', 'Brake Parts', 'Couplers', 'Electric Trailer Parts',
  'Hydraulics', 'Jacks', 'Tires and Rims', 'Springs', 'Vinyls', 'Wiring'
)
AND category_id IN (
  SELECT id FROM public.categories WHERE name = 'Trailer Parts'
);
```

No code changes needed -- this only removes data from the subcategories table.

