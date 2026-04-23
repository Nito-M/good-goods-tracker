create table if not exists public.board_merges (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  start_row_id uuid not null references public.board_rows(id) on delete cascade,
  end_row_id uuid not null references public.board_rows(id) on delete cascade,
  start_column_id uuid not null references public.board_columns(id) on delete cascade,
  end_column_id uuid not null references public.board_columns(id) on delete cascade,
  created_at timestamptz not null default now(),
  user_id uuid not null
);

create index if not exists board_merges_board_id_idx on public.board_merges(board_id);

alter table public.board_merges enable row level security;

create policy "board_merges_select"
  on public.board_merges
  for select
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_merges.board_id
        and (
          b.user_id = auth.uid()
          or exists (
            select 1 from public.board_member_access bma
            where bma.board_id = b.id and bma.user_id = auth.uid()
          )
          or (
            b.organization_id is not null and exists (
              select 1 from public.organization_members om
              where om.organization_id = b.organization_id
                and om.user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "board_merges_insert"
  on public.board_merges
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.boards b
      where b.id = board_merges.board_id
        and (
          b.user_id = auth.uid()
          or exists (
            select 1 from public.board_member_access bma
            where bma.board_id = b.id and bma.user_id = auth.uid()
          )
          or (
            b.organization_id is not null and exists (
              select 1 from public.organization_members om
              where om.organization_id = b.organization_id
                and om.user_id = auth.uid()
            )
          )
        )
    )
  );

create policy "board_merges_delete"
  on public.board_merges
  for delete
  using (
    exists (
      select 1 from public.boards b
      where b.id = board_merges.board_id
        and (
          b.user_id = auth.uid()
          or exists (
            select 1 from public.board_member_access bma
            where bma.board_id = b.id and bma.user_id = auth.uid()
          )
          or (
            b.organization_id is not null and exists (
              select 1 from public.organization_members om
              where om.organization_id = b.organization_id
                and om.user_id = auth.uid()
            )
          )
        )
    )
  );
