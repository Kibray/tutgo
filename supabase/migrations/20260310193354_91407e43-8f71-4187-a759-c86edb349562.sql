
UPDATE categories 
SET 
  name = 'Еда и напитки',
  icon = '🍽️',
  subcategories = '[
    {"id": "coffee", "name": "Кофейня", "icon": "☕"},
    {"id": "cafe", "name": "Кафе", "icon": "🍽️"},
    {"id": "restaurant", "name": "Ресторан", "icon": "🍷"},
    {"id": "fastfood", "name": "Фастфуд", "icon": "🍕"},
    {"id": "canteen", "name": "Столовая", "icon": "🥗"},
    {"id": "teahouse", "name": "Чайхана", "icon": "🧋"},
    {"id": "bakery", "name": "Кондитерская", "icon": "🍰"},
    {"id": "bar", "name": "Бар/Паб", "icon": "🍺"}
  ]'::jsonb
WHERE id = '833ae532-b1e5-4c26-81fd-3bad3784bb0f';
