-- ============ sport_courts ============
CREATE TABLE public.sport_courts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 2,
  price_per_hour NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UZS',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sport_courts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sport courts"
  ON public.sport_courts FOR SELECT
  USING (true);

CREATE POLICY "Owners can manage sport courts"
  ON public.sport_courts FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.locations l WHERE l.id = sport_courts.location_id AND l.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.locations l WHERE l.id = sport_courts.location_id AND l.owner_id = auth.uid()));

CREATE INDEX idx_sport_courts_location ON public.sport_courts(location_id);

-- ============ sport_games ============
CREATE TABLE public.sport_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  court_id UUID NOT NULL REFERENCES public.sport_courts(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  sport_type TEXT NOT NULL,
  skill_level TEXT NOT NULL CHECK (skill_level IN ('beginner','amateur','pro')),
  game_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_players INTEGER NOT NULL,
  current_players INTEGER NOT NULL DEFAULT 1,
  price_per_person NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'UZS',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','finished','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sport_games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sport games"
  ON public.sport_games FOR SELECT
  USING (true);

CREATE POLICY "Authenticated can create sport games"
  ON public.sport_games FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creator can update sport games"
  ON public.sport_games FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE INDEX idx_sport_games_court ON public.sport_games(court_id);
CREATE INDEX idx_sport_games_location ON public.sport_games(location_id);
CREATE INDEX idx_sport_games_date ON public.sport_games(game_date);

-- ============ game_participants ============
CREATE TABLE public.game_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.sport_games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'joined' CHECK (status IN ('joined','left')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (game_id, user_id)
);

ALTER TABLE public.game_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON public.game_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own participation"
  ON public.game_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own participation"
  ON public.game_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own participation"
  ON public.game_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX idx_game_participants_game ON public.game_participants(game_id);
CREATE INDEX idx_game_participants_user ON public.game_participants(user_id);

-- ============ appointments.game_id ============
ALTER TABLE public.appointments
  ADD COLUMN game_id UUID REFERENCES public.sport_games(id) ON DELETE SET NULL;

-- ============ trigger: keep current_players + status in sync ============
CREATE OR REPLACE FUNCTION public.sync_game_player_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INTEGER;
  v_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'joined' THEN
    UPDATE public.sport_games
      SET current_players = current_players + 1
      WHERE id = NEW.game_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'left' AND OLD.status = 'joined' THEN
    UPDATE public.sport_games
      SET current_players = GREATEST(current_players - 1, 0)
      WHERE id = NEW.game_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'joined' AND OLD.status = 'left' THEN
    UPDATE public.sport_games
      SET current_players = current_players + 1
      WHERE id = NEW.game_id;
  END IF;

  -- recompute status open/full
  SELECT max_players, current_players INTO v_max, v_count
    FROM public.sport_games WHERE id = COALESCE(NEW.game_id, OLD.game_id);

  IF v_max IS NOT NULL THEN
    IF v_count >= v_max THEN
      UPDATE public.sport_games
        SET status = 'full'
        WHERE id = COALESCE(NEW.game_id, OLD.game_id)
          AND status IN ('open','full');
    ELSE
      UPDATE public.sport_games
        SET status = 'open'
        WHERE id = COALESCE(NEW.game_id, OLD.game_id)
          AND status = 'full';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_game_participants_sync
AFTER INSERT OR UPDATE ON public.game_participants
FOR EACH ROW EXECUTE FUNCTION public.sync_game_player_count();