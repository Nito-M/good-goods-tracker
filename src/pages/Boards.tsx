import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Table2, Trash2, ArrowLeft, Building2 } from 'lucide-react';
import { useBoards } from '@/hooks/useBoards';
import { useCompanies, type Company } from '@/hooks/useCompanies';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';

export default function Boards() {
  const navigate = useNavigate();
  const { boards, loading: boardsLoading, createBoard, deleteBoard } = useBoards();
  const { companies, loading: companiesLoading, defaultCompany } = useCompanies();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);

  const loading = boardsLoading || companiesLoading;

  const selectedCompany = useMemo(
    () => companies.find((c) => c.id === selectedCompanyId) || null,
    [companies, selectedCompanyId],
  );

  const filteredBoards = useMemo(
    () => boards.filter((b) => b.company_id === selectedCompanyId),
    [boards, selectedCompanyId],
  );

  // Count boards per company for the picker
  const boardCounts = useMemo(() => {
    const map = new Map<string, number>();
    boards.forEach((b) => {
      if (b.company_id) map.set(b.company_id, (map.get(b.company_id) || 0) + 1);
    });
    return map;
  }, [boards]);

  const handleCreate = async () => {
    if (!selectedCompanyId) return;
    const board = await createBoard('Untitled Board', selectedCompanyId);
    if (board) navigate(`/boards/${board.id}`);
  };

  // ---------- Company picker view ----------
  if (!selectedCompanyId) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground mt-1">
            Choose a company to view its boards
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading…</div>
        ) : companies.length === 0 ? (
          <Card>
            <CardContent className="py-12 flex flex-col items-center text-center gap-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <div>
                <h3 className="font-semibold text-lg">No companies yet</h3>
                <p className="text-muted-foreground text-sm">
                  Add a company in Settings to start organizing boards.
                </p>
              </div>
              <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map((c) => (
              <CompanyTile
                key={c.id}
                company={c}
                boardCount={boardCounts.get(c.id) || 0}
                onSelect={() => setSelectedCompanyId(c.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---------- Boards-for-company view ----------
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCompanyId(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          {selectedCompany?.logoUrl ? (
            <img
              src={selectedCompany.logoUrl}
              alt={selectedCompany.name}
              className="h-10 w-10 rounded-md object-contain bg-muted/40 p-1"
            />
          ) : (
            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight truncate">
              {selectedCompany?.name} Boards
            </h1>
            <p className="text-muted-foreground text-sm">
              Customizable spreadsheets for {selectedCompany?.name}
            </p>
          </div>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : filteredBoards.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <Table2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No boards yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first board for {selectedCompany?.name}.
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4" />
              Create Board
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBoards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:border-primary transition-colors group"
              onClick={() => navigate(`/boards/${board.id}`)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Table2 className="h-5 w-5 text-primary shrink-0" />
                  <CardTitle className="truncate">{board.name}</CardTitle>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete board?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete "{board.name}" and all its data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteBoard(board.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Updated {format(new Date(board.updated_at), 'MMM d, yyyy')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyTile({
  company,
  boardCount,
  onSelect,
}: {
  company: Company;
  boardCount: number;
  onSelect: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary transition-colors group"
      onClick={onSelect}
    >
      <CardContent className="p-6 flex items-center gap-4">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="h-16 w-16 rounded-md object-contain bg-muted/40 p-2 shrink-0"
          />
        ) : (
          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center shrink-0">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
            {company.name}
          </h3>
          <p className="text-sm text-muted-foreground">
            {boardCount} {boardCount === 1 ? 'board' : 'boards'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
