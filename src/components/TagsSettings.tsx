import { useState } from 'react';
import { Plus, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';

export function TagsSettings() {
  const { tagCategories, loading: categoriesLoading, addTagCategory, deleteTagCategory } = useTagCategories();
  const { tags, loading: tagsLoading, addTag, deleteTag, getTagsByCategory } = useTags();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newTagNames, setNewTagNames] = useState<Record<string, string>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [deleteTagId, setDeleteTagId] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await addTagCategory(newCategoryName);
    setNewCategoryName('');
  };

  const handleAddTag = async (e: React.FormEvent, categoryId: string) => {
    e.preventDefault();
    const name = newTagNames[categoryId] || '';
    await addTag(name, categoryId);
    setNewTagNames((prev) => ({ ...prev, [categoryId]: '' }));
  };

  const filteredCategories = tagCategories.filter((tc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (tc.name.toLowerCase().includes(q)) return true;
    // Also match if any tag in this category matches
    return getTagsByCategory(tc.id).some((t) => t.name.toLowerCase().includes(q));
  });

  const loading = categoriesLoading || tagsLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
          <CardDescription>Manage tag categories and tags for your inventory items</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add new category */}
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input
              placeholder="New tag category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Category
            </Button>
          </form>

          {/* Search */}
          {tagCategories.length > 0 && (
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}

          {loading ? (
            <div className="text-muted-foreground py-4 text-center">Loading...</div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-muted-foreground py-4 text-center">
              {tagCategories.length === 0 ? 'No tag categories yet.' : 'No results match your search.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((tc) => {
                const categoryTags = getTagsByCategory(tc.id);
                const isExpanded = expandedCategories.has(tc.id);

                return (
                  <div key={tc.id} className="border rounded-lg">
                    <div
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleCategory(tc.id)}
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{tc.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {categoryTags.length}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteCategoryId(tc.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-3 border-t">
                        {/* Add tag to this category */}
                        <form
                          onSubmit={(e) => handleAddTag(e, tc.id)}
                          className="flex gap-2 mt-3"
                        >
                          <Input
                            placeholder={`Add tag to "${tc.name}"...`}
                            value={newTagNames[tc.id] || ''}
                            onChange={(e) =>
                              setNewTagNames((prev) => ({ ...prev, [tc.id]: e.target.value }))
                            }
                            className="max-w-xs"
                          />
                          <Button type="submit" size="sm" className="gap-1">
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </form>

                        {categoryTags.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No tags in this category yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {categoryTags.map((tag) => (
                              <div
                                key={tag.id}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-md text-sm"
                              >
                                {tag.name}
                                <button
                                  onClick={() => setDeleteTagId(tag.id)}
                                  className="ml-1 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Category Confirmation */}
      <AlertDialog open={!!deleteCategoryId} onOpenChange={(open) => !open && setDeleteCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the category and all tags within it, including any assignments to items. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteCategoryId) deleteTagCategory(deleteCategoryId);
                setDeleteCategoryId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Tag Confirmation */}
      <AlertDialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tag?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tag from all items it's assigned to. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTagId) deleteTag(deleteTagId);
                setDeleteTagId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
