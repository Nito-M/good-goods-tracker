import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';

interface ItemTagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function ItemTagSelector({ selectedTagIds, onTagsChange }: ItemTagSelectorProps) {
  const { tagCategories, loading: catLoading } = useTagCategories();
  const { tags, loading: tagsLoading, getTagsByCategory } = useTags();

  if (catLoading || tagsLoading) return null;
  if (tagCategories.length === 0) return null;

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tagCategories.map((tc) => {
          const categoryTags = getTagsByCategory(tc.id);
          if (categoryTags.length === 0) return null;

          return (
            <div key={tc.id} className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">{tc.name}</p>
              <div className="flex flex-wrap gap-2">
                {categoryTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer border transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'bg-muted/50 border-transparent hover:bg-muted'
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag.id)}
                        className="h-3.5 w-3.5"
                      />
                      {tag.name}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Show selected tags summary */}
        {selectedTagIds.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-2">Selected ({selectedTagIds.length})</p>
            <div className="flex flex-wrap gap-1">
              {selectedTagIds.map((tagId) => {
                const tag = tags.find((t) => t.id === tagId);
                if (!tag) return null;
                return (
                  <Badge key={tagId} variant="secondary" className="text-xs">
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
