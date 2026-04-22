import { useState } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Calendar as CalIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function DateCell({ value, onSave }: DateCellProps) {
  const [open, setOpen] = useState(false);
  const parsed = value ? parseISO(value) : undefined;
  const date = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <div className="flex items-center px-2 py-1 gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn('h-8 px-2 flex-1 justify-start font-normal text-sm', !date && 'text-muted-foreground')}
          >
            <CalIcon className="h-3 w-3 mr-1" />
            {date ? format(date, 'PP') : '—'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) {
                onSave(format(d, 'yyyy-MM-dd'));
              }
              setOpen(false);
            }}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onSave('')}
          title="Clear"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
