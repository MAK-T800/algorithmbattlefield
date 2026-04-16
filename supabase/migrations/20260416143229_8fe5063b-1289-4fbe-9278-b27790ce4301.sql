
-- Add topic, password, and current question tracking to rooms
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS topic text NOT NULL DEFAULT 'dsa';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS room_password text NOT NULL DEFAULT '';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS current_question_index integer NOT NULL DEFAULT 0;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS quiz_started boolean NOT NULL DEFAULT false;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS question_started_at timestamp with time zone;

-- Track individual answers per question per participant
CREATE TABLE public.room_answers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES public.room_participants(id) ON DELETE CASCADE,
  question_index integer NOT NULL,
  selected_option integer NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  answered_at timestamp with time zone NOT NULL DEFAULT now(),
  time_taken_ms integer NOT NULL DEFAULT 0,
  UNIQUE(room_id, participant_id, question_index)
);

ALTER TABLE public.room_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers" ON public.room_answers FOR SELECT USING (true);
CREATE POLICY "Anyone can submit answers" ON public.room_answers FOR INSERT WITH CHECK (true);

-- Add realtime for room_answers
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_answers;
