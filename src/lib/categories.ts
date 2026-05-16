export const getBizType = (categoryName: string): string => {
  const map: Record<string, string> = {
    // Legacy category names
    'Медицина': 'medical',
    'Красота': 'beauty',
    'Туры': 'tour',
    'Еда и напитки': 'cafe',
    'Кофейни': 'cafe',
    'Магазины': 'retail',
    'Услуги': 'service',
    // Partner onboarding BUSINESS_CATEGORIES
    'Барбершоп': 'beauty',
    'Салон красоты': 'beauty',
    'Спа и массаж': 'beauty',
    'Ногтевая студия': 'beauty',
    'Медицинская клиника': 'medical',
    'Стоматология': 'medical',
    'Ресторан': 'cafe',
    'Кафе': 'cafe',
    'Кофейня': 'cafe',
    'Фастфуд': 'cafe',
    'Магазин': 'retail',
    'Автосервис': 'auto',
    'Автомойка': 'auto',
    'Фитнес-клуб': 'fitness',
    'Спортивный клуб': 'fitness',
    'Школа и обучение': 'education',
    'Туристическое агентство': 'tour',
    'Отель': 'hotel',
    'Другое': 'service',
  };
  return map[categoryName] || 'service';
};
