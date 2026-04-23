import { supabase } from '@/integrations/supabase/client';

export interface CopyBoardOptions {
  sourceBoardId: string;
  targetCompanyId: string;
  newName: string;
  userId: string;
}

export interface CopyBoardResult {
  newBoardId: string;
  organizationId: string;
}

/**
 * Deep-copies a board (columns, rows, cells, merges, row notes, note entries)
 * into the target company. The new board's organization is derived from
 * a shared org between the current user and the target company's owner.
 *
 * Not copied: cell files (storage), note image attachments, column permissions,
 * row activity history, connect-column links.
 */
export async function copyBoard({
  sourceBoardId,
  targetCompanyId,
  newName,
  userId,
}: CopyBoardOptions): Promise<CopyBoardResult> {
  // 1. Resolve target company + shared organization
  const { data: company, error: companyErr } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('id', targetCompanyId)
    .single();
  if (companyErr || !company) throw new Error('Target company not found');

  // Find an org that both the current user and the company owner belong to
  const { data: myOrgs } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId);
  const { data: ownerOrgs } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', company.user_id);

  const myOrgIds = new Set((myOrgs || []).map((o) => o.organization_id));
  const sharedOrg = (ownerOrgs || []).find((o) => myOrgIds.has(o.organization_id));
  if (!sharedOrg) {
    throw new Error("You don't have access to that company's organization");
  }
  const organizationId = sharedOrg.organization_id;

  // 2. Fetch all source data in parallel
  const [
    { data: srcCols, error: colsErr },
    { data: srcRows, error: rowsErr },
    { data: srcBoard, error: boardErr },
  ] = await Promise.all([
    supabase.from('board_columns').select('*').eq('board_id', sourceBoardId),
    supabase.from('board_rows').select('*').eq('board_id', sourceBoardId),
    supabase.from('boards').select('*').eq('id', sourceBoardId).single(),
  ]);
  if (colsErr) throw colsErr;
  if (rowsErr) throw rowsErr;
  if (boardErr || !srcBoard) throw new Error('Source board not found');

  const srcColIds = (srcCols || []).map((c) => c.id);
  const srcRowIds = (srcRows || []).map((r) => r.id);

  const [
    { data: srcCells, error: cellsErr },
    { data: srcMerges, error: mergesErr },
    { data: srcNotes, error: notesErr },
    { data: srcNoteEntries, error: entriesErr },
  ] = await Promise.all([
    srcRowIds.length
      ? supabase.from('board_cells').select('*').in('row_id', srcRowIds)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('board_merges').select('*').eq('board_id', sourceBoardId),
    srcRowIds.length
      ? supabase.from('board_row_notes').select('*').in('row_id', srcRowIds)
      : Promise.resolve({ data: [], error: null }),
    srcRowIds.length
      ? supabase.from('board_row_note_entries').select('*').in('row_id', srcRowIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (cellsErr) throw cellsErr;
  if (mergesErr) throw mergesErr;
  if (notesErr) throw notesErr;
  if (entriesErr) throw entriesErr;

  // 3. Create new board
  const newBoardId = crypto.randomUUID();
  const { error: insertBoardErr } = await supabase.from('boards').insert({
    id: newBoardId,
    user_id: userId,
    organization_id: organizationId,
    company_id: targetCompanyId,
    name: newName,
    // group_by_column_id set after columns are inserted
  });
  if (insertBoardErr) throw insertBoardErr;

  // 4. Insert columns with new ids, build map
  const colMap = new Map<string, string>();
  const newCols = (srcCols || []).map((c) => {
    const newId = crypto.randomUUID();
    colMap.set(c.id, newId);
    // Reset cross-board connect config (links don't transfer cleanly)
    let options = c.options;
    if (c.type === 'connect') {
      options = {} as typeof options;
    }
    return {
      id: newId,
      board_id: newBoardId,
      name: c.name,
      type: c.type,
      position: c.position,
      width: c.width,
      notes: c.notes,
      options,
      per_row_options: c.per_row_options,
      text_align: c.text_align,
    };
  });
  if (newCols.length) {
    const { error } = await supabase.from('board_columns').insert(newCols);
    if (error) throw error;
  }

  // 5. Insert rows with new ids, build map
  const rowMap = new Map<string, string>();
  const newRows = (srcRows || []).map((r) => {
    const newId = crypto.randomUUID();
    rowMap.set(r.id, newId);
    return {
      id: newId,
      board_id: newBoardId,
      position: r.position,
    };
  });
  if (newRows.length) {
    const { error } = await supabase.from('board_rows').insert(newRows);
    if (error) throw error;
  }

  // 6. Insert cells, merges, notes, note entries — all remapped
  const newCells = (srcCells || [])
    .map((c) => {
      const colId = colMap.get(c.column_id);
      const rowId = rowMap.get(c.row_id);
      if (!colId || !rowId) return null;
      return {
        column_id: colId,
        row_id: rowId,
        value: c.value,
        text_align: c.text_align,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (newCells.length) {
    // Chunk to avoid payload limits
    const chunkSize = 500;
    for (let i = 0; i < newCells.length; i += chunkSize) {
      const { error } = await supabase
        .from('board_cells')
        .insert(newCells.slice(i, i + chunkSize));
      if (error) throw error;
    }
  }

  const newMerges = (srcMerges || [])
    .map((m) => {
      const sc = colMap.get(m.start_column_id);
      const ec = colMap.get(m.end_column_id);
      const sr = rowMap.get(m.start_row_id);
      const er = rowMap.get(m.end_row_id);
      if (!sc || !ec || !sr || !er) return null;
      return {
        board_id: newBoardId,
        user_id: userId,
        start_column_id: sc,
        end_column_id: ec,
        start_row_id: sr,
        end_row_id: er,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (newMerges.length) {
    const { error } = await supabase.from('board_merges').insert(newMerges);
    if (error) throw error;
  }

  const newNotes = (srcNotes || [])
    .map((n) => {
      const rowId = rowMap.get(n.row_id);
      if (!rowId) return null;
      return {
        row_id: rowId,
        user_id: userId,
        content: n.content,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (newNotes.length) {
    const { error } = await supabase.from('board_row_notes').insert(newNotes);
    if (error) throw error;
  }

  const newEntries = (srcNoteEntries || [])
    .map((e) => {
      const rowId = rowMap.get(e.row_id);
      if (!rowId) return null;
      return {
        row_id: rowId,
        user_id: userId,
        content: e.content,
        position: e.position,
        // image_path / image_url intentionally omitted (storage not duplicated)
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
  if (newEntries.length) {
    const { error } = await supabase
      .from('board_row_note_entries')
      .insert(newEntries);
    if (error) throw error;
  }

  // 7. Remap group_by_column_id if set
  if (srcBoard.group_by_column_id) {
    const newGroupId = colMap.get(srcBoard.group_by_column_id);
    if (newGroupId) {
      await supabase
        .from('boards')
        .update({ group_by_column_id: newGroupId })
        .eq('id', newBoardId);
    }
  }

  // 8. Grant access to creator
  await supabase
    .from('board_member_access')
    .upsert(
      { board_id: newBoardId, user_id: userId },
      { onConflict: 'board_id,user_id' },
    );

  return { newBoardId, organizationId };
}
