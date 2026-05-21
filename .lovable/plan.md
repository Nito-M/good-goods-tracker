Add NVIS as a label + link button to the Customer card on the Job Details (Information tab) in `src/pages/Jobs.tsx`.

### Change
- Import `ExternalLink` from `lucide-react`.
- In the Customer `<Card>` (around line 691, after the address block), add when `job.nvisLink` exists:

```tsx
{job.nvisLink && (
  <div className="flex items-center gap-2 text-sm">
    <span className="text-muted-foreground">NVIS:</span>
    <Button asChild variant="outline" size="sm" className="h-7">
      <a
        href={/^https?:\/\//i.test(job.nvisLink) ? job.nvisLink : `https://${job.nvisLink}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <ExternalLink className="h-3.5 w-3.5 mr-1" />
        Open Link
      </a>
    </Button>
  </div>
)}
```

- Also include `job.nvisLink` in the outer conditional on line 669 so the Customer card renders when only NVIS is set.