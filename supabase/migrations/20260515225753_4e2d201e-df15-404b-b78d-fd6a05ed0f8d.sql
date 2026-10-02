ALTER TABLE public.app_welcome_settings
  ADD COLUMN IF NOT EXISTS start_delay_ms integer NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS letter_stagger_ms integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS bg_animate_with_greeting boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS font_size_rem numeric NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS position_x_pct integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS position_y_pct integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS text_align text NOT NULL DEFAULT 'center';

DO $$ BEGIN
  ALTER TABLE public.app_welcome_settings
    ADD CONSTRAINT app_welcome_settings_text_align_chk CHECK (text_align IN ('left','center','right'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;