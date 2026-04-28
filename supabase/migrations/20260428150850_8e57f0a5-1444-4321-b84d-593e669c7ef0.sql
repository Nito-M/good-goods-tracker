
-- Add new columns to notes
ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS notes_deleted_at_idx ON public.notes(deleted_at);
CREATE INDEX IF NOT EXISTS notes_archived_idx ON public.notes(archived);
CREATE INDEX IF NOT EXISTS notes_reminder_at_idx ON public.notes(reminder_at);

-- Tags table (org-scoped via creator)
CREATE TABLE IF NOT EXISTS public.note_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'default',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS note_tags_user_id_idx ON public.note_tags(user_id);

ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view note_tags"
  ON public.note_tags FOR SELECT TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Users insert own note_tags"
  ON public.note_tags FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Org members update note_tags"
  ON public.note_tags FOR UPDATE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));
CREATE POLICY "Org members delete note_tags"
  ON public.note_tags FOR DELETE TO authenticated
  USING (public.users_share_org(auth.uid(), user_id));

-- Tag assignments
CREATE TABLE IF NOT EXISTS public.note_tag_assignments (
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.note_tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);
CREATE INDEX IF NOT EXISTS note_tag_assignments_tag_idx ON public.note_tag_assignments(tag_id);

ALTER TABLE public.note_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view note_tag_assignments"
  ON public.note_tag_assignments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));
CREATE POLICY "Org members insert note_tag_assignments"
  ON public.note_tag_assignments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));
CREATE POLICY "Org members delete note_tag_assignments"
  ON public.note_tag_assignments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));

-- Attachments
CREATE TABLE IF NOT EXISTS public.note_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text,
  size_bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS note_attachments_note_idx ON public.note_attachments(note_id);

ALTER TABLE public.note_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view note_attachments"
  ON public.note_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));
CREATE POLICY "Users insert own note_attachments"
  ON public.note_attachments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));
CREATE POLICY "Org members delete note_attachments"
  ON public.note_attachments FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.notes n WHERE n.id = note_id AND public.users_share_org(auth.uid(), n.user_id)));

-- Storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('note-attachments', 'note-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members view note-attachments storage"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'note-attachments'
    AND public.users_share_org(auth.uid(), (storage.foldername(name))[1]::uuid)
  );
CREATE POLICY "Users upload own note-attachments storage"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'note-attachments'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );
CREATE POLICY "Users delete own note-attachments storage"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'note-attachments'
    AND auth.uid() = (storage.foldername(name))[1]::uuid
  );
