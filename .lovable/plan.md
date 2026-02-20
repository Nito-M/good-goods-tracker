

# Fix: "Sq Ft" Quantity Unit Rejected by Database

## The Problem

The database has a check constraint called `valid_quantity_unit` that only allows these values:
`pcs`, `ft`, `m`, `yd`, `in`

**`sqft` is missing from this list.** Every time you save an item with "Sq Ft" selected, the database rejects it with an error, so the item keeps its old value ("Pieces").

## The Fix

One single database migration to add `sqft` to the allowed values:

- **Drop** the old `valid_quantity_unit` constraint
- **Re-create** it with `sqft` included: `pcs, ft, m, yd, in, sqft`

That's it. No code changes needed -- the app already sends `sqft` correctly, the database just wasn't accepting it.

## Technical Detail

```text
SQL Migration:
  ALTER TABLE inventory_items DROP CONSTRAINT valid_quantity_unit;
  ALTER TABLE inventory_items ADD CONSTRAINT valid_quantity_unit
    CHECK (quantity_unit IN ('pcs','ft','m','yd','in','sqft'));
```

Also need to update the `dimensions_unit` constraint (if one exists) to allow `ft` for the sheet size feature.

