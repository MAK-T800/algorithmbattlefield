
-- Rooms table
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  host_name TEXT NOT NULL,
  problem_id INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  max_participants INTEGER NOT NULL DEFAULT 50,
  started_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Anyone can create rooms" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rooms" ON public.rooms FOR UPDATE USING (true);

-- Room participants table
CREATE TABLE public.room_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  score INTEGER NOT NULL DEFAULT 0,
  solve_time_ms INTEGER,
  submitted_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'coding' CHECK (status IN ('coding', 'submitted', 'spectating')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, session_id)
);

ALTER TABLE public.room_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants" ON public.room_participants FOR SELECT USING (true);
CREATE POLICY "Anyone can join rooms" ON public.room_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update participants" ON public.room_participants FOR UPDATE USING (true);
CREATE POLICY "Anyone can leave rooms" ON public.room_participants FOR DELETE USING (true);

-- Submissions table
CREATE TABLE public.submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.room_participants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  execution_time_ms INTEGER,
  efficiency_score INTEGER NOT NULL DEFAULT 0,
  test_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can create submissions" ON public.submissions FOR INSERT WITH CHECK (true);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;

-- Index for fast room lookups
CREATE INDEX idx_rooms_code ON public.rooms(room_code);
CREATE INDEX idx_participants_room ON public.room_participants(room_id);
CREATE INDEX idx_submissions_room ON public.submissions(room_id);
