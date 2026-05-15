import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Image as ImageIcon, Loader2, Trash2, AlignLeft, AlignCenter, AlignRight, Video } from 'lucide-react';

type Align = 'left' | 'center' | 'right';

interface S {
  background_image_url: string | null;
  background_video_url: string | null;
  greeting_text: string;
  start_delay_ms: number;
  letter_stagger_ms: number;
  bg_animate_with_greeting: boolean;
  font_size_rem: number;
  position_x_pct: number;
  position_y_pct: number;
  text_align: Align;
  bg_dim_pct: number;
}

const DEFAULTS: S = {
  background_image_url: null,
  background_video_url: null,
  greeting_text: 'Welcome',
  start_delay_ms: 500,
  letter_stagger_ms: 50,
  bg_animate_with_greeting: false,
  font_size_rem: 8,
  position_x_pct: 50,
  position_y_pct: 50,
  text_align: 'center',
  bg_dim_pct: 40,
};

export function WelcomeScreenSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [s, setS] = useState<S>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('app_welcome_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (data) {
        setS({
          background_image_url: data.background_image_url,
          background_video_url: (data as any).background_video_url ?? null,
          greeting_text: data.greeting_text || 'Welcome',
          start_delay_ms: data.start_delay_ms ?? 500,
          letter_stagger_ms: data.letter_stagger_ms ?? 50,
          bg_animate_with_greeting: data.bg_animate_with_greeting ?? false,
          font_size_rem: Number(data.font_size_rem ?? 8),
          position_x_pct: data.position_x_pct ?? 50,
          position_y_pct: data.position_y_pct ?? 50,
          text_align: (data.text_align ?? 'center') as Align,
          bg_dim_pct: (data as any).bg_dim_pct ?? 40,
        });
      }
      setLoading(false);
    })();
  }, []);

  const persist = async (patch: Partial<S>) => {
    const { error } = await supabase
      .from('app_welcome_settings')
      .upsert({ id: 1, ...patch, updated_by: user?.id, updated_at: new Date().toISOString() });
    if (error) {
      toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const update = (patch: Partial<S>) => setS((prev) => ({ ...prev, ...patch }));

  const handleSaveAll = async () => {
    setSaving(true);
    const ok = await persist({
      greeting_text: s.greeting_text.trim() || 'Welcome',
      start_delay_ms: s.start_delay_ms,
      letter_stagger_ms: s.letter_stagger_ms,
      bg_animate_with_greeting: s.bg_animate_with_greeting,
      font_size_rem: s.font_size_rem,
      position_x_pct: s.position_x_pct,
      position_y_pct: s.position_y_pct,
      text_align: s.text_align,
      bg_dim_pct: s.bg_dim_pct,
      background_video_url: s.background_video_url,
    } as any);
    setSaving(false);
    if (ok) toast({ title: 'Welcome screen saved' });
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
      update({ background_image_url: url });
      toast({ title: 'Background updated' });
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleRemoveBg = async () => {
    const ok = await persist({ background_image_url: null });
    if (ok) {
      update({ background_image_url: null });
      toast({ title: 'Background removed' });
    }
  };

  if (loading) return null;

  const alignBtn = (val: Align, Icon: typeof AlignLeft) => (
    <Button
      key={val}
      type="button"
      variant={s.text_align === val ? 'default' : 'outline'}
      size="icon"
      onClick={() => update({ text_align: val })}
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Welcome Screen
        </CardTitle>
        <CardDescription>
          Super-admin-only. Customize the welcome page shown when users open the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Live preview */}
        <div
          className="relative w-full h-56 rounded-lg overflow-hidden border bg-black"
          style={
            s.background_image_url
              ? { backgroundImage: `url(${s.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-black" style={{ opacity: s.bg_dim_pct / 100 }} />
          <div
            className="absolute text-white font-black uppercase tracking-tighter drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)] whitespace-nowrap"
            style={{
              left: `${s.position_x_pct}%`,
              top: `${s.position_y_pct}%`,
              transform: 'translate(-50%, -50%)',
              fontSize: `${Math.max(0.6, s.font_size_rem * 0.22)}rem`,
              textAlign: s.text_align,
            }}
          >
            {s.greeting_text} {/* preview name placeholder */}<span className="opacity-80">Name</span>
          </div>
        </div>

        {/* Greeting text */}
        <div className="space-y-2">
          <Label htmlFor="welcome-greeting">Greeting text</Label>
          <Input
            id="welcome-greeting"
            value={s.greeting_text}
            onChange={(e) => update({ greeting_text: e.target.value })}
            placeholder="Welcome"
          />
          <p className="text-xs text-muted-foreground">
            The user's name is appended automatically.
          </p>
        </div>

        {/* Background image */}
        <div className="space-y-2">
          <Label>Background image</Label>
          <div className="flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="flex-1" />
            {s.background_image_url && (
              <Button variant="outline" size="icon" onClick={handleRemoveBg} title="Remove background">
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

        {/* Timing */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Greeting start delay</Label>
              <span className="text-xs text-muted-foreground">{(s.start_delay_ms / 1000).toFixed(1)}s</span>
            </div>
            <Slider
              min={0} max={10000} step={500}
              value={[s.start_delay_ms]}
              onValueChange={([v]) => update({ start_delay_ms: v })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Letter stagger speed</Label>
              <span className="text-xs text-muted-foreground">{s.letter_stagger_ms}ms</span>
            </div>
            <Slider
              min={20} max={200} step={10}
              value={[s.letter_stagger_ms]}
              onValueChange={([v]) => update({ letter_stagger_ms: v })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Keep background still until greeting starts</Label>
              <p className="text-xs text-muted-foreground">Background zoom only begins when the letters appear.</p>
            </div>
            <Switch
              checked={s.bg_animate_with_greeting}
              onCheckedChange={(v) => update({ bg_animate_with_greeting: v })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Background dim</Label>
              <span className="text-xs text-muted-foreground">{s.bg_dim_pct}%</span>
            </div>
            <Slider
              min={0} max={100} step={1}
              value={[s.bg_dim_pct]}
              onValueChange={([v]) => update({ bg_dim_pct: v })}
            />
          </div>
        </div>

        {/* Size */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Greeting size</Label>
            <span className="text-xs text-muted-foreground">{s.font_size_rem.toFixed(2)}rem</span>
          </div>
          <Slider
            min={2} max={12} step={0.25}
            value={[s.font_size_rem]}
            onValueChange={([v]) => update({ font_size_rem: v })}
          />
        </div>

        {/* Position */}
        <div className="space-y-3">
          <Label>Position</Label>
          <div className="grid grid-cols-3 gap-1 w-32">
            {[10, 50, 90].map((y) =>
              [10, 50, 90].map((x) => (
                <button
                  key={`${x}-${y}`}
                  type="button"
                  onClick={() => update({ position_x_pct: x, position_y_pct: y })}
                  className={`h-8 rounded border ${
                    s.position_x_pct === x && s.position_y_pct === y
                      ? 'bg-primary border-primary'
                      : 'bg-muted hover:bg-muted/70 border-border'
                  }`}
                  aria-label={`Position ${x}% ${y}%`}
                />
              ))
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs font-normal">Horizontal</Label>
              <span className="text-xs text-muted-foreground">{s.position_x_pct}%</span>
            </div>
            <Slider
              min={0} max={100} step={1}
              value={[s.position_x_pct]}
              onValueChange={([v]) => update({ position_x_pct: v })}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs font-normal">Vertical</Label>
              <span className="text-xs text-muted-foreground">{s.position_y_pct}%</span>
            </div>
            <Slider
              min={0} max={100} step={1}
              value={[s.position_y_pct]}
              onValueChange={([v]) => update({ position_y_pct: v })}
            />
          </div>
        </div>

        {/* Alignment */}
        <div className="space-y-2">
          <Label>Text alignment</Label>
          <div className="flex gap-2">
            {alignBtn('left', AlignLeft)}
            {alignBtn('center', AlignCenter)}
            {alignBtn('right', AlignRight)}
          </div>
        </div>

        <div className="pt-2">
          <Button onClick={handleSaveAll} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
