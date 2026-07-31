import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCompanies } from '@/hooks/useCompanies';
import { useCategories } from '@/hooks/useCategories';
import {
  SettingValue,
  WIDGET_SIZE_LABELS,
  WidgetDefinition,
  WidgetSettingField,
  WidgetSettings,
  WidgetSize,
  resolveSettings,
} from '@/lib/dashboard/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  definition: WidgetDefinition;
  title: string;
  size: WidgetSize;
  settings: WidgetSettings | undefined;
  onSave: (patch: { title: string; size: WidgetSize; settings: WidgetSettings }) => void;
}

export function WidgetSettingsDialog({
  open,
  onOpenChange,
  definition,
  title,
  size,
  settings,
  onSave,
}: Props) {
  const { companies } = useCompanies();
  const { categories } = useCategories();
  const [titleDraft, setTitleDraft] = useState(title);
  const [sizeDraft, setSizeDraft] = useState<WidgetSize>(size);
  const [values, setValues] = useState<WidgetSettings>(() => resolveSettings(definition, settings));

  useEffect(() => {
    if (open) {
      setTitleDraft(title);
      setSizeDraft(size);
      setValues(resolveSettings(definition, settings));
    }
  }, [open, title, size, definition, settings]);

  const dynamicOptions = useMemo(
    () => ({
      companies: [
        { value: 'all', label: 'All businesses' },
        ...companies.map((c) => ({ value: c.id, label: c.name })),
      ],
      categories: [
        { value: 'all', label: 'All categories' },
        ...(categories || []).map((c) => ({
          value: typeof c === 'string' ? c : c.name,
          label: typeof c === 'string' ? c : c.name,
        })),
      ],
    }),
    [companies, categories]
  );

  const set = (key: string, value: SettingValue) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const renderField = (f: WidgetSettingField) => {
    const value = values[f.key];
    const options = f.optionsSource ? dynamicOptions[f.optionsSource] : f.options || [];

    if (f.type === 'switch') {
      return (
        <div key={f.key} className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-sm">{f.label}</Label>
            {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
          </div>
          <Switch checked={value !== false} onCheckedChange={(v) => set(f.key, v)} />
        </div>
      );
    }

    if (f.type === 'select') {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label className="text-sm">{f.label}</Label>
          <Select value={String(value ?? '')} onValueChange={(v) => set(f.key, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
        </div>
      );
    }

    return (
      <div key={f.key} className="space-y-1.5">
        <Label className="text-sm">{f.label}</Label>
        <Input
          type={f.type === 'number' ? 'number' : 'text'}
          min={f.min}
          max={f.max}
          step={f.step}
          value={String(value ?? '')}
          onChange={(e) =>
            set(f.key, f.type === 'number' ? Number(e.target.value) : e.target.value)
          }
        />
        {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{definition.label} settings</DialogTitle>
          <DialogDescription>{definition.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-sm">Widget title</Label>
            <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Size</Label>
            <Select value={sizeDraft} onValueChange={(v) => setSizeDraft(v as WidgetSize)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(WIDGET_SIZE_LABELS) as WidgetSize[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {WIDGET_SIZE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(definition.settings?.length ?? 0) > 0 && (
            <div className="space-y-4 border-t border-border pt-4">
              {definition.settings!.map(renderField)}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave({ title: titleDraft, size: sizeDraft, settings: values });
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
