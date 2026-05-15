import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

export function WelcomeScreenSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bgUrl, setBgUrl] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('Welcome');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_welcome_settings')
        .select('background_image_url, greeting_text')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setBgUrl(data.background_image_url);
        setGreeting(data.greeting_text || 'Welcome');
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (patch: { background_image_url?: string | null; greeting_text?: string }) => {
    const { error } = await supabase
      .from('app_welcome_settings')
      .upsert({ id: 1, ...patch, updated_by: user?.id, updated_at: new Date().toISOString() });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSaveGreeting = async () => {
    setSaving(true);
    const ok = await persist({ greeting_text: greeting.trim() || 'Welcome' });
    setSaving(false);
    if (ok) toast({ title: 'Greeting saved' });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `bg-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('welcome-images')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      toast({ title: 'Upload failed', description: upErr.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('welcome-images').getPublicUrl(path);
    const url = pub.publicUrl;
    const ok = await persist({ background_image_url: url });
    if (ok) {
      setBgUrl(url);
      toast({ title: 'Background updated' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleRemove = async () => {
    const ok = await persist({ background_image_url: null });
    if (ok) {
      setBgUrl(null);
      toast({ title: 'Background removed' });
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Welcome Screen
        </CardTitle>
        <CardDescription>
          Super-admin-only. Customize the greeting and background image shown when users open the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="welcome-greeting">Greeting text</Label>
          <div className="flex gap-2">
            <Input
              id="welcome-greeting"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Welcome"
            />
            <Button onClick={handleSaveGreeting} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            The user's name is appended automatically. e.g. "{greeting || 'Welcome'} John"
          </p>
        </div>

        <div className="space-y-2">
          <Label>Background image</Label>
          {bgUrl && (
            <div
              className="w-full h-48 rounded-lg border bg-muted bg-cover bg-center"
              style={{ backgroundImage: `url(${bgUrl})` }}
            />
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="flex-1"
            />
            {bgUrl && (
              <Button variant="outline" size="icon" onClick={handleRemove} title="Remove background">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
          {uploading && (
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" /> Uploading...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
