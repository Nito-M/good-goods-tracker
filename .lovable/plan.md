# Plan: Expand Notes with Standard Notes-App Features

The current Notes page (`src/pages/Notes.tsx`) supports: title + markdown content, 8 colors, pinning, search, edit/delete. Below are the standard features popular notes apps (Google Keep, Apple Notes, Evernote, Notion, OneNote, Bear, Notesnook) offer that we can add. You pick which ones you want — I'll then implement.

## Organization
1. **Labels / Tags** — multiple per note, filter sidebar by tag (Keep, Evernote, Bear).
2. **Notebooks / Folders** — group notes into folders, optional nesting (Evernote, Notion, Bear).
3. **Archive** — hide without deleting (Keep, Apple Notes).
4. **Trash / Recycle bin** — soft delete with 30-day restore (Keep, Apple Notes).
5. **Favorites / Starred** — separate from pinned (Notion, Bear).
6. **Sort options** — by title, date created, date modified, manual drag-to-reorder.
7. **View toggle** — grid vs. list view (Keep).

## Content types
8. **Checklists / To-do inside a note** — interactive checkboxes (Keep, Apple Notes).
9. **Image attachments** — upload images embedded in note (all major apps).
10. **File attachments** — PDFs, docs (Evernote, OneNote).
11. **Voice memos / audio recording** (Keep, Apple Notes).
12. **Drawings / handwriting / sketch** (Apple Notes, OneNote).
13. **Tables** inside notes (Notion, Apple Notes).
14. **Code blocks with syntax highlighting** (Bear, Notion).
15. **Rich text WYSIWYG editor** instead of markdown shortcuts (Apple Notes, Notion).
16. **Live markdown preview** side-by-side (Bear, Obsidian).

## Reminders & dates
17. **Reminders / due dates** with notifications (Keep, Apple Notes).
18. **Recurring reminders** (Keep).
19. **Location-based reminders** (Keep, Apple Notes).

## Collaboration & sharing
20. **Share note with another org member** — view or edit (Keep, Notion).
21. **Public share link** — read-only URL (Notion, Bear).
22. **Real-time co-editing** (Notion, Google Docs-style).
23. **Comments / mentions** on notes (Notion, Evernote).
24. **Activity / version history** — see edits over time (Notion, Evernote).

## Discovery
25. **Full-text search across content** (already partial — could add highlighting + filters by color/tag/date).
26. **Recently viewed / recently edited** section.
27. **Backlinks / linked notes** — `[[note title]]` references (Obsidian, Bear, Notion).
28. **Tags autocomplete** while typing `#tag` in body (Bear).

## Security & privacy
29. **Lock individual notes** with PIN/password (Apple Notes, Bear, Notesnook).
30. **End-to-end encryption** for sensitive notes (Notesnook, Standard Notes).

## Productivity
31. **Templates** — reusable note skeletons (Notion, Evernote).
32. **Pin to top of OS** / floating widget (Keep) — out of scope for web.
33. **Quick-capture floating button** from anywhere in the app.
34. **Keyboard shortcuts** (new note, search, save, navigate).
35. **Word/character count** in editor.
36. **Focus / distraction-free mode** (Bear).
37. **Export note** as Markdown / PDF / plain text.
38. **Import** from .md / .txt / Evernote .enex.
39. **Bulk actions** — multi-select to pin/color/delete/archive several at once.

## Display & customization
40. **Dark mode tinted note colors** (already done — could refine).
41. **Custom note backgrounds / cover images** (Notion).
42. **Custom emoji icon per note** (Notion).
43. **Card size toggle** — small / medium / large.

## AI features (using built-in Lovable AI, no API key needed)
44. **AI summarize** a long note.
45. **AI rewrite / improve writing**.
46. **AI translate** a note.
47. **AI generate to-do list** from a note's content.
48. **AI ask questions** across all your notes (semantic search).
49. **Auto-tag** suggestions from AI.

---

## Recommended starter pack (if you want a balanced set without going overboard)
- Tags (#1)
- Archive + Trash (#3, #4)
- Checklists inside notes (#8)
- Image attachments (#9)
- Reminders with due dates (#17)
- Share with org members (#20)
- Templates (#31)
- Bulk actions (#39)
- AI summarize + rewrite (#44, #45)

Tell me which numbers you want and I'll build them.