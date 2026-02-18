
## Change: Each Sales Order Item Creates Its Own Job (Titled by Item Name)

### The Problem

Currently, when you press "Create Job" on a single item in a Sales Order:
1. A **shared job** is created titled with the SO number (e.g. `SO-001`)
2. The item is then added as a **job_items row** inside that shared job

The user wants the opposite: pressing "Create Job" on an item should create a **new job titled with the item name** itself, with no items inserted into `job_items` at all. The item name becomes the job title, not a row inside the job.

Similarly, "Create All Jobs" should create **one separate job per item**, each titled with that item's name.

### What Changes

Only **`src/pages/SalesOrderDetail.tsx`** needs to be modified. No database schema changes are required.

#### Per-item "Create Job" (`handleCreateJobForItem`)
- Currently: calls `getOrCreateOrderJob()` (creates/reuses one shared SO-level job), then calls `addItemToJob()` (inserts a `job_items` row).
- After: creates a **new dedicated job** titled `item.itemName`, passing the item notes as the job description. Does **not** insert any `job_items` row. Records the link in `so_item_job_links` pointing to the new job.

#### "Create All Jobs" (`handleCreateAllJobs`)
- Currently: creates one shared job for the whole SO, adds all items as rows.
- After: iterates through each unlinked item and creates **one separate job per item**, each titled with the item name. Does not insert any `job_items` rows. Navigates to the Jobs list page after (since there's no single job to navigate to).

#### `getOrCreateOrderJob` / `addItemToJob`
- These helpers become unnecessary and will be removed/replaced with the simpler per-item job creation logic.

#### Button Label
- Remove the conditional `'Add to Job'` vs `'Create Job'` text — it will always say `'Create Job'` since every press makes a new job.

### Logic After the Change

```typescript
const handleCreateJobForItem = async (item: ExpandedItem) => {
  setCreatingJobFor(item.linkKey);
  try {
    // Each item gets its OWN job titled with the item name
    const job = await createJob(
      item.itemName,              // <-- Job title = item name
      item.notes || undefined,    // <-- Job description = item notes
      'open',
      {
        name: quote!.vendorName || undefined,
        email: vendor?.contact_email || undefined,
        phone: vendor?.contact_phone || undefined,
        address: vendor?.address || undefined,
      },
      dueDate ? dueDate.toISOString() : undefined,
      jobNumber || undefined
    );
    if (!job) return;

    // Record the link (no job_items row inserted)
    await supabase.from('so_item_job_links').upsert({
      quote_id: quote!.id,
      quote_item_id: item.quoteItemId,
      unit_index: item.unitIndex,
      job_id: job.id,
      status: 'open',
    }, { onConflict: 'quote_item_id,unit_index' });

    toast({ title: 'Job created', description: item.itemName });
    await fetchItemLinks();
  } finally {
    setCreatingJobFor(null);
  }
};

const handleCreateAllJobs = async () => {
  setCreating(true);
  try {
    for (const item of expandedItems) {
      if (itemLinks[item.linkKey]?.jobId) continue; // skip already-linked

      const job = await createJob(
        item.itemName,
        item.notes || undefined,
        'open',
        { name: quote!.vendorName || undefined, ... },
        dueDate ? dueDate.toISOString() : undefined,
        // no jobNumber here since each job is separate
      );
      if (!job) continue;

      await supabase.from('so_item_job_links').upsert({
        quote_id: quote!.id,
        quote_item_id: item.quoteItemId,
        unit_index: item.unitIndex,
        job_id: job.id,
        status: 'open',
      }, { onConflict: 'quote_item_id,unit_index' });
    }
    await fetchItemLinks();
    navigate('/jobs'); // go to jobs list since multiple jobs were created
  } finally {
    setCreating(false);
  }
};
```

### Also: Remove the `converted_to_job_id` link on the quote
Since jobs are now per-item (not a single shared order-level job), the `convertedToJobId` field on the quote is no longer updated. The "Job Created" badge in the header will instead be driven by whether any `so_item_job_links` exist for this order.

### Files to Modify
- **`src/pages/SalesOrderDetail.tsx`** — Rewrite `handleCreateJobForItem` and `handleCreateAllJobs`, remove `getOrCreateOrderJob` and `addItemToJob` helpers, update button label and header badge logic.
