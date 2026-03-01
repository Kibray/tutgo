
-- Add working_hours jsonb column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS working_hours jsonb DEFAULT NULL;

-- Example structure:
-- {
--   "monday":    { "start": "14:00", "end": "22:00" },
--   "tuesday":   { "start": "10:00", "end": "19:00" },
--   ...
-- }
-- If a day key is missing, the staff member doesn't work that day.
-- NULL means schedule not configured yet.
