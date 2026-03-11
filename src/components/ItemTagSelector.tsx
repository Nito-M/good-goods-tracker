import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
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
    <div className="space-y-3">
      {tagCategories.map((tc) => {
        const categoryTags = getTagsByCategory(tc.id);
        if (categoryTags.length === 0) return null;

        const selectedInCategory = categoryTags.filter((t) => selectedTagIds.includes(t.id));
        const label = selectedInCategory.length === 0
          ? `Select ${tc.name}`
          : selectedInCategory.map((t) => t.name).join(', ');

        return (
          <div key={tc.id} className="space-y-2">
            <Label>{tc.name}</Label>
            <TagDropdown
              label={label}
              tags={categoryTags}
              selectedTagIds={selectedTagIds}
              onToggle={toggleTag}
            />
          </div>
        );
      })}
    </div>
  );
}

function TagDropdown({
  label,
  tags,
  selectedTagIds,
  onToggle,
}: {
  label: string;
  tags: { id: string; name: string }[];
  selectedTagIds: string[];
  onToggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasSelection = tags.some((t) => selectedTagIds.includes(t.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'w-full justify-between font-normal',
            !hasSelection && 'text-muted-foreground'
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
        <div className="max-h-60 overflow-y-auto">
          {tags.map((tag) => {
            const isSelected = selectedTagIds.includes(tag.id);
            return (
              <label
                key={tag.id}
                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggle(tag.id)}
                  className="h-4 w-4"
                />
                {tag.name}
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
