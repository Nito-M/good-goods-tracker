

# Update Parts CSV Import to Match New Format

## Problem
The current Parts CSV import expects 3 columns (Name, SKU, Description), but the CSV file has 4 columns: **Number**, **Description**, **Tags**, and **Unit Of Measure**. The column mapping needs to change to match.

## Column Mapping (New)

| CSV Column | Maps To |
|---|---|
| Col 0: Number (e.g. "Library Item: A1-001") | Part **name** |
| Col 1: Description (e.g. "A1 - 001 \| 14Ft Skid...") | Part **description** |
| Col 2: Tags (e.g. "Hopper Parts") | Displayed in preview only (parts don't have a tags system) |
| Col 3: Unit Of Measure (e.g. "Piece") | Displayed in preview only (parts don't have a unit field) |

The SKU will be auto-derived from the Number column (truncated to 100 chars) since the CSV doesn't have a dedicated SKU column.

## Changes

### File: `src/components/PartsCsvImport.tsx`

1. Update the `ParsedPart` interface to include `tags` and `unitOfMeasure` fields for preview display
2. Update the `parseCSV` function to map:
   - Col 0 -> `name`
   - Col 1 -> `description`
   - Col 2 -> `tags` (preview only)
   - Col 3 -> `unitOfMeasure` (preview only)
3. Update the SKU logic: derive SKU from the name (Col 0) instead of expecting a dedicated column
4. Update the preview UI to show tags and unit of measure badges
5. Update the expected columns help text from "Name, SKU, Description" to "Number, Description, Tags, Unit Of Measure"

No database changes are needed -- tags and unit of measure will be shown in preview but stored parts will use the existing schema (name, sku, description, folder).

