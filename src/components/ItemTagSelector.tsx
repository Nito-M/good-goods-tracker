import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, X } from 'lucide-react';
import { useTagCategories } from '@/hooks/useTagCategories';
import { useTags } from '@/hooks/useTags';
import { cn } from '@/lib/utils';

interface ItemTagSelectorProps {
  selectedTagIds: string[];
  onTagsChange: (tagIds: string[]) => void;
}

export function ItemTagSelector({ selectedTagIds, onTagsChange }: ItemTagSelectorProps) {
  const { tagCategories, loading: catLoading } = useTagCategories();
  const { tags, loading: tagsLoading, getTagsByCategory } = useTags();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  if (catLoading || tagsLoading) return null;
  if (tagCategories.length === 0) return null;

  // Only show categories that have tags
  const availableCategories = tagCategories.filter((tc) => getTagsByCategory(tc.id).length > 0);
  if (availableCategories.length === 0) return null;

  const selectedCategory = availableCategories.find((c) => c.id === selectedCategoryId);
  const categoryTags = selectedCategoryId ? getTagsByCategory(selectedCategoryId) : [];

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onTagsChange([...selectedTagIds, tagId]);
    }
  };

  // Selected tags summary
  const selectedTags = selectedTagIds
    .map((id) => tags.find((t) => t.id === id))
    .filter(Boolean) as { id: string; name: string; tag_category_id: string }[];

  return (
    <div className="space-y-3">
      {/* Tag Category selector */}
      <div className="space-y-2">
        <Label>Tag Category</Label>
        <Select value={selectedCategoryId || '__none__'} onValueChange={(v) => setSelectedCategoryId(v === '__none__' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select tag category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Select tag category</SelectItem>
            {availableCategories.map((tc) => (
              <SelectItem key={tc.id} value={tc.id}>{tc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tags dropdown - only visible when a category is selected */}
      {selectedCategoryId && categoryTags.length > 0 && (
        <div className="space-y-2">
          <Label>Tags — {selectedCategory?.name}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  'w-full justify-between font-normal',
                  !categoryTags.some((t) => selectedTagIds.includes(t.id)) && 'text-muted-foreground'
                )}
              >
                <span className="truncate">
                  {(() => {
                    const sel = categoryTags.filter((t) => selectedTagIds.includes(t.id));
                    return sel.length === 0 ? 'Select tags' : sel.map((t) => t.name).join(', ');
                  })()}
                </span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
              <div className="max-h-60 overflow-y-auto">
                {categoryTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag.id)}
                        className="h-4 w-4"
                      />
                      {tag.name}
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Selected tags badges */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="text-xs gap-1">
              {tag.name}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleTag(tag.id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
