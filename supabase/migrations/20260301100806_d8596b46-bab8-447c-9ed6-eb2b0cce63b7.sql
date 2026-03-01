
-- 1. Add missing columns to services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description text;

-- 2. Add client_name to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_name text;

-- 3. Add missing categories (Автосервис, Спорт, Обучение)
INSERT INTO public.categories (name, icon, sort_order, subcategories) VALUES
  ('Автосервис', '🚗', 7, '[{"id":"detailing","name":"Детейлинг"},{"id":"repair_auto","name":"Ремонт"},{"id":"tire","name":"Шиномонтаж"},{"id":"wash","name":"Мойка"}]'),
  ('Спорт', '🏋️', 8, '[{"id":"gym","name":"Тренажёрный зал"},{"id":"yoga","name":"Йога"},{"id":"swimming","name":"Бассейн"},{"id":"martial","name":"Единоборства"}]'),
  ('Обучение', '📚', 9, '[{"id":"languages","name":"Языки"},{"id":"it_courses","name":"IT курсы"},{"id":"tutoring","name":"Репетиторы"},{"id":"driving","name":"Автошкола"}]')
ON CONFLICT DO NOTHING;
