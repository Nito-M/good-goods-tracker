import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, MapPin, CalendarClock, Weight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJobs } from '@/hooks/useJobs';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  'in-production': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'welding-done': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'painting-done': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  finished: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  'on-hold': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function JobDescription() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { jobs, loading, updateJob } = useJobs();

  const job = jobs.find(j => j.id === jobId);
  const [weightInput, setWeightInput] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  useEffect(() => {
    if (job) setWeightInput(job.weight != null ? String(job.weight) : '');
  }, [job?.id, job?.weight]);

  const handleSaveWeight = async () => {
    if (!job) return;
    setSavingWeight(true);
    await updateJob(job.id, { weight: weightInput.trim() === '' ? null : Number(weightInput) });
    setSavingWeight(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Job not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-24 items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold tracking-tight text-card-foreground">{job.title}</h1>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{job.jobNumber}</span>
                <Badge className={statusColors[job.status] || ''}>{job.status}</Badge>
                {job.dueDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    Due: {(() => { const dt = new Date(job.dueDate); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 12).toLocaleDateString(); })()}
                  </span>
                )}
                {job.weight != null && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    {job.weight} lbs
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {job.description ? (
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description provided.</p>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Weight className="h-4 w-4" /> Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <Label htmlFor="job-weight" className="text-xs text-muted-foreground">Weight (lbs)</Label>
            <div className="flex gap-2 mt-1 max-w-sm">
              <Input
                id="job-weight"
                type="number"
                step="0.01"
                inputMode="decimal"
                placeholder="e.g. 1500"
                value={weightInput}
                onChange={e => setWeightInput(e.target.value)}
              />
              <Button onClick={handleSaveWeight} disabled={savingWeight}>
                {savingWeight ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {(job.customerName || job.customerEmail || job.customerPhone || job.customerAddress || job.nvisLink) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.customerName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{job.customerName}</span>
                </div>
              )}
              {job.customerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`mailto:${job.customerEmail}`} className="text-primary hover:underline">{job.customerEmail}</a>
                </div>
              )}
              {job.customerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <a href={`tel:${job.customerPhone}`} className="text-primary hover:underline">{job.customerPhone}</a>
                </div>
              )}
              {job.customerAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="whitespace-pre-line">{job.customerAddress}</span>
                </div>
              )}
              {job.nvisLink && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">NVIS:</span>
                  <a
                    href={/^https?:\/\//i.test(job.nvisLink) ? job.nvisLink : `https://${job.nvisLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate"
                  >
                    {job.nvisLink}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
