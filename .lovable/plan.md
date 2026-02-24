

## Fix CSV Parser for Multi-Line Descriptions

The current CSV parser splits the file by newlines first, which breaks when a description cell contains multiple lines (as shown in your spreadsheet). The fix updates the parser to properly handle multi-line quoted fields.

### What Changes

**File: `src/components/AssemblyCsvImport.tsx`**

- Replace the `parseCSV` function with a version that processes characters one at a time across the entire file, instead of splitting by newlines first.
- This allows quoted fields (like long descriptions with line breaks) to be read correctly as a single cell value.
- The two-column format stays the same: column 1 = **Name**, column 2 = **Description**.

### Technical Detail

The current parser does `text.split(/\r?\n/)` which splits multi-line quoted descriptions into separate rows. The new parser will iterate character-by-character, tracking whether we're inside quotes, and only treating a newline as a row boundary when we're outside of quotes. This correctly handles CSV like:

```csv
Name,Description
"35' Gooseneck","Year: 2026
Model: GNRS-310EN1
Length & Width: 35' x 102""
GVWR up to: 34,500 lbs"
```

No other files or database changes needed.

