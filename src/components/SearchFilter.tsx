import { useState } from 'react';
import { Search, Check, ChevronsUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface TagOption {
  id: string;
  name: string;
  categoryName: string;
}

interface SearchFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  tagFilter?: string;
  onTagChange?: (value: string) => void;
  tagOptions?: TagOption[];
}

export function SearchFilter({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  categories,
  tagFilter,
  onTagChange,
  tagOptions,
}: SearchFilterProps) {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  const selectedCategoryLabel =
    categoryFilter === 'all' || !categoryFilter ? 'All Categories' : categoryFilter;

  const selectedTag = tagOptions?.find((t) => t.id === tagFilter);
  const selectedTagLabel = selectedTag
    ? `${selectedTag.categoryName}: ${selectedTag.name}`
    : 'All Tags';

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category combobox */}
      <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={categoryOpen}
            className="w-full sm:w-48 justify-between font-normal"
          >
            <span className="truncate">{selectedCategoryLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onCategoryChange('all');
                    setCategoryOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      categoryFilter === 'all' || !categoryFilter ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  All Categories
                </CommandItem>
                {categories.map((cat) => (
                  <CommandItem
                    key={cat}
                    value={cat}
                    onSelect={(val) => {
                      onCategoryChange(val);
                      setCategoryOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        categoryFilter === cat ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {cat}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Tag combobox */}
      {tagOptions && tagOptions.length > 0 && onTagChange && (
        <Popover open={tagOpen} onOpenChange={setTagOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={tagOpen}
              className="w-full sm:w-48 justify-between font-normal"
            >
              <span className="truncate">{selectedTagLabel}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tag found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="all"
                    onSelect={() => {
                      onTagChange('all');
                      setTagOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        !tagFilter || tagFilter === 'all' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    All Tags
                  </CommandItem>
                  {tagOptions.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={`${tag.categoryName} ${tag.name}`}
                      onSelect={() => {
                        onTagChange(tag.id);
                        setTagOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          tagFilter === tag.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="text-muted-foreground text-xs mr-1">{tag.categoryName}:</span>
                      {tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
