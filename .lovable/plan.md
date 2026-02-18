
## Create One Job Per Item When Converting a Sales Order

### What Changes

Currently, clicking "Create Job" on a Sales Order creates a single job with all quote items bundled inside it. The new behaviour will create one separate job per item on the quote, where each job:
- Has the item name as its title
- Uses the item's description/notes as the job description
- Contains just that one item in its job_items list
- Inherits the customer info, due date, and quote number context

### File to Modify

**`src/pages/SalesOrderDetail.tsx`** — only the `handleCreateJob` function changes.

### Logic Changes

**Before** (one job, all items):
```
1. createJob(quoteTitle, ...)
2. insert ALL quote items into job_items for that one job
3. link quote → job
```

**After** (one job per item):
```
For each quote item:
  1. createJob(item.itemName, item.notes, ...)
  2. insert just that single item into job_items
  3. on the last item: link quote → first created job (for the "Job Created" badge)
```

The `jobNumber` input field will be used as a **prefix** for the first job; subsequent jobs auto-generate their numbers. For example, if the user types `JOB-500`, the first item gets `JOB-500` and the rest auto-generate sequentially.

The `dueDate` and customer info (name, phone, email, address) are copied to every job created.

### Detailed Code Plan

Inside `handleCreateJob`:

```typescript
const handleCreateJob = async () => {
  if (!quote || quote.items.length === 0) return;
  setCreating(true);
  try {
    let firstJobId: string | null = null;

    for (let i = 0; i < quote.items.length; i++) {
      const item = quote.items[i];

      const job = await createJob(
        item.itemName,                         // title = item name
        item.notes || undefined,               // description = item notes/description
        'open',
        {
          name: quote.vendorName || undefined,
          email: vendor?.contact_email || undefined,
          phone: vendor?.contact_phone || undefined,
          address: vendor?.address || undefined,
        },
        dueDate ? dueDate.toISOString() : undefined,
        i === 0 ? (jobNumber || undefined) : undefined  // only apply manual # to first job
      );

      if (!job) continue;

      if (i === 0) firstJobId = job.id;

      // Add only this item to this job
      await supabase.from('job_items').insert({
        job_id: job.id,
        inventory_item_id: item.inventoryItemId || null,
        item_name: item.itemName,
        sku: item.sku || '',
        quantity: item.quantity,
        unit_price: item.unitPrice,
        notes: item.notes || null,
      });
    }

    // Link quote to first job for the "Job Created" badge
    if (firstJobId) {
      await supabase
        .from('quotes')
        .update({ converted_to_job_id: firstJobId } as any)
        .eq('id', quote.id);

      navigate(`/jobs/${firstJobId}`);
    }
  } catch (err) {
    console.error('Error creating jobs:', err);
    toast({ title: 'Error creating jobs', variant: 'destructive' });
  } finally {
    setCreating(false);
  }
};
```

### Edge Cases Handled

- If a quote has 1 item, behaviour is identical to before (one job created).
- If `createJob` fails for one item, it logs and continues rather than aborting all jobs.
- The `jobNumber` input only applies to the first job; subsequent jobs auto-number via the database trigger (JOB-XXXX).
- The "Job Created" badge on the sales order links to the first job created.
- Navigation goes to the first job after all jobs are created.

### No Database Changes Needed

The `jobs` and `job_items` tables already support this — no migrations required.
