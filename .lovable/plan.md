

## Fix Logo Upload for Companies

### Problem
The `logos` storage bucket is **private**, but the code uses `getPublicUrl()` which only works for public buckets. Additionally, there is no SELECT (read) policy on the logos bucket, so even signed URLs would fail without that fix.

### Solution

**1. Database Migration -- Add a SELECT policy to the logos storage bucket**

Add a storage RLS policy allowing authenticated users to read logos from the bucket (logos are branding assets displayed in documents):

```sql
CREATE POLICY "Anyone can view logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'logos');
```

**2. Code Change -- Use signed URLs instead of public URLs**

Update `src/pages/CompanyDetail.tsx` and `src/components/CompaniesSettings.tsx` to replace `getPublicUrl()` with `createSignedUrl()` using a 1-year expiry (consistent with how other branding assets work in the app).

In the `handleLogoUpload` function, change:
```typescript
// Before (broken)
const { data: { publicUrl } } = supabase.storage
  .from('logos')
  .getPublicUrl(filePath);
setLogoUrl(publicUrl);

// After (fixed)
const { data: signedData, error: signedError } = await supabase.storage
  .from('logos')
  .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

if (signedError || !signedData?.signedUrl) throw new Error('Failed to get signed URL');
setLogoUrl(signedData.signedUrl);
```

This change applies to both files that have the logo upload handler:
- `src/pages/CompanyDetail.tsx` (line 93-96)
- `src/components/CompaniesSettings.tsx` (line 109-112)

### Files to modify
- **Database migration** -- add SELECT policy on logos bucket
- **`src/pages/CompanyDetail.tsx`** -- switch to signed URL
- **`src/components/CompaniesSettings.tsx`** -- switch to signed URL

