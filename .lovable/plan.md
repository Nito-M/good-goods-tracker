

## Show Full Job Description When Clicking Job Number

### What changes
In the Job Detail header, make the job number clickable. When tapped, toggle the visibility of the full job description below the header info.

### Technical Details

**File: `src/pages/Jobs.tsx` (JobDetail component)**

1. Add a `showDescription` boolean state: `const [showDescription, setShowDescription] = useState(false);`

2. Make the job number span clickable (line 293):
   - Change from: `<span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>`
   - Change to: `<button onClick={() => setShowDescription(v => !v)} className="text-xs font-mono text-muted-foreground hover:underline cursor-pointer">{job.jobNumber}</button>`

3. Add the description display right after the title line (after line 296), conditionally rendered:
   ```tsx
   {showDescription && job.description && (
     <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{job.description}</p>
   )}
   ```
   Using `whitespace-pre-wrap` so line breaks in the description are preserved and the full text is visible.

This is a small change -- one new state variable, one element swap, and one conditional block, all within the existing `JobDetail` function.
