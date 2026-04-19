
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS timer_paused_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS timer_pause_offset_ms integer NOT NULL DEFAULT 0;
