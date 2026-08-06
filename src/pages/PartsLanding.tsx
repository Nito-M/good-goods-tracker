import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Puzzle, BookOpen, Layers, ChevronRight, Pencil, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useParts } from '@/hooks/useParts';

const STORAGE_KEY = 'parts-landing-names';

const defaultNames: Record<string, string> = {
  'parts-library': 'Parts Library',
  'parts-assemblies': 'Sub Assemblies',
};

// Sections whose name is fixed and cannot be renamed
const lockedNames = new Set(['parts-assemblies']);

function getSavedNames(): Record<string, string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const merged = saved ? { ...defaultNames, ...JSON.parse(saved) } : { ...defaultNames };
    // Locked sections always use their fixed name
    for (const key of lockedNames) merged[key] = defaultNames[key];
    return merged;
  } catch {
    return { ...defaultNames };
  }
}

function saveName(key: string, name: string) {
  const current = getSavedNames();
  current[key] = name;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function PartsLanding() {
  const navigate = useNavigate();
  const { parts } = useParts();
  const [names, setNames] = useState(getSavedNames);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKey(key);
    setEditValue(names[key]);
  };

  const saveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingKey && editValue.trim()) {
      saveName(editingKey, editValue.trim());
      setNames(prev => ({ ...prev, [editingKey]: editValue.trim() }));
    }
    setEditingKey(null);
  };

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKey(null);
  };

  const sections = [
    {
      key: 'parts-library',
      description: 'Browse and manage individual parts with SKU, images, and DXF drawings',
      icon: BookOpen,
      url: '/parts/library',
      stat: `${parts.length} part${parts.length !== 1 ? 's' : ''}`,
    },
    {
      key: 'parts-assemblies',
      description: 'Create reusable assemblies from your parts library',
      icon: Layers,
      url: '/parts/assemblies',
      stat: null,
    },
    {
      key: 'parts-assemblies-v2',
      description: 'Build a second assembly layer from Parts Library 1 and Parts Assemblies 1',
      icon: Layers,
      url: '/parts/assemblies-v2',
      stat: null,
    },
  ];

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center gap-3">
            <Puzzle className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-card-foreground">Parts</h1>
              <p className="text-xs text-muted-foreground">Choose a section</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <Card
              key={section.key}
              className="group cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => editingKey !== section.key && navigate(section.url)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingKey === section.key ? (
                      <div className="flex items-center gap-1.5 mb-1">
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="h-8 text-lg font-semibold px-2"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(e as any);
                            if (e.key === 'Escape') cancelEdit(e as any);
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={saveEdit}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-1">
                        <h3 className="font-semibold text-lg text-foreground">{names[section.key]}</h3>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          onClick={(e) => startEdit(section.key, e)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground mb-3">{section.description}</p>
                    {section.stat && (
                      <span className="text-xs text-muted-foreground">{section.stat}</span>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors mt-1 shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
