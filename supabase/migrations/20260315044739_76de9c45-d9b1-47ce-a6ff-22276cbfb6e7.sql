
INSERT INTO public.transport_routes (from_city, to_city, transport_type, transport_name, departure_time, arrival_time, duration_minutes, price_per_seat, total_seats, available_seats, amenities)
VALUES
  ('Ташкент', 'Самарканд', 'bus', 'TashBus Express', '08:00', '12:30', 270, 50000, 45, 42, ARRAY['❄️ Кондиционер', '🧳 Багаж', '🔌 USB зарядка']),
  ('Ташкент', 'Самарканд', 'minibus', 'SamarFast', '09:00', '12:00', 180, 80000, 14, 8, ARRAY['❄️ Кондиционер', '🧳 Багаж', '🔌 USB зарядка', '☕ Вода']),
  ('Ташкент', 'Самарканд', 'suv', 'VIP Transfer', '10:00', '13:00', 180, 200000, 4, 3, ARRAY['❄️ Кондиционер', '🧳 Багаж', '🔌 USB зарядка', '☕ Вода', '💺 VIP салон']),
  ('Ташкент', 'Бухара', 'bus', 'BukharaLine', '07:00', '13:00', 360, 80000, 45, 40, ARRAY['❄️ Кондиционер', '🧳 Багаж', '🔌 USB зарядка', '☕ Вода']);
