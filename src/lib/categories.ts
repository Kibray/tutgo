export const getBizType = (categoryName: string): string => {
  const map: Record<string, string> = {
    'Медицина': 'medical', 'Красота': 'beauty', 'Туры': 'tour',
    'Еда и напитки': 'cafe', 'Кофейни': 'cafe', 'Магазины': 'retail', 'Услуги': 'service',
  };
  return map[categoryName] || 'service';
};
