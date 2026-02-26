

# Add Trailer Parts Subcategories

## What this does
Seed the "Trailer Parts" category with the following subcategories:
- Axles
- Brake Parts
- Couplers
- Electric Trailer Parts
- Hydraulics
- Jacks
- Tires and Rims
- Springs
- Vinyls
- Wiring

## How
A single database migration that:
1. Looks up (or creates) the "Trailer Parts" category for your user
2. Inserts each subcategory under it, skipping any that already exist

### Technical: Migration SQL
```sql
-- Insert subcategories under "Trailer Parts" for all users who have that category
INSERT INTO public.subcategories (category_id, user_id, name)
SELECT c.id, c.user_id, sub.name
FROM public.categories c
CROSS JOIN (
  VALUES
    ('Axles'),
    ('Brake Parts'),
    ('Couplers'),
    ('Electric Trailer Parts'),
    ('Hydraulics'),
    ('Jacks'),
    ('Tires and Rims'),
    ('Springs'),
    ('Vinyls'),
    ('Wiring')
) AS sub(name)
WHERE c.name = 'Trailer Parts'
ON CONFLICT (category_id, name) DO NOTHING;
```

No code file changes needed -- this is purely a data migration.

