import { useNavigate } from 'react-router-dom';
import { Puzzle, BookOpen, Layers, ChevronRight, BookOpenCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useParts } from '@/hooks/useParts';
import { useParts2 } from '@/hooks/useParts2';

export function PartsLanding() {
  const navigate = useNavigate();
  const { parts } = useParts();
  const { parts: parts2 } = useParts2();

  const sections = [
    {
      title: 'Parts Library',
      description: 'Browse and manage individual parts with SKU, images, and DXF drawings',
      icon: BookOpen,
      url: '/parts/library',
      stat: `${parts.length} part${parts.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Parts Library 2',
      description: 'A second independent parts library for additional part management',
      icon: BookOpenCheck,
      url: '/parts/library2',
      stat: `${parts2.length} part${parts2.length !== 1 ? 's' : ''}`,
    },
    {
      title: 'Parts Assemblies',
      description: 'Create reusable assemblies from your parts library',
      icon: Layers,
      url: '/parts/assemblies',
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
              key={section.title}
              className="group cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => navigate(section.url)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg bg-primary/10 p-3">
                    <section.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground mb-1">{section.title}</h3>
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
