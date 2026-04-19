-- Increase default max participants to 120
ALTER TABLE public.rooms ALTER COLUMN max_participants SET DEFAULT 120;

-- Bump existing rooms still using the old default
UPDATE public.rooms SET max_participants = 120 WHERE max_participants = 50;

-- Allow deleting rooms (host-driven; enforced in app layer)
CREATE POLICY "Anyone can delete rooms"
ON public.rooms
FOR DELETE
USING (true);