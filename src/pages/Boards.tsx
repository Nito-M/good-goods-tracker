import { useNavigate } from 'react-router-dom';
import { Plus, Table2, Trash2 } from 'lucide-react';
import { useBoards } from '@/hooks/useBoards';
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
  const { boards, loading, createBoard, deleteBoard } = useBoards();

  const handleCreate = async () => {
    const board = await createBoard();
    if (board) navigate(`/boards/${board.id}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Boards</h1>
          <p className="text-muted-foreground mt-1">
            Customizable spreadsheets for tracking anything
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          New Board
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading…</div>
      ) : boards.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center text-center gap-4">
            <Table2 className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No boards yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first board to start organizing data.
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
          {boards.map((board) => (
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
