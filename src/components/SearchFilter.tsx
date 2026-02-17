import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={categoryFilter} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {tagOptions && tagOptions.length > 0 && onTagChange && (
        <Select value={tagFilter || 'all'} onValueChange={onTagChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {tagOptions.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.categoryName}: {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
