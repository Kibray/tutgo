export interface Service {
  id: string;
  name: string;
  category: 'beauty' | 'medical' | 'tour';
  subcategory: string;
  price: number;
  currency: string;
  duration: number;
  rating: number;
  reviewCount: number;
  image: string;
  businessName: string;
  address: string;
  city: string;
  lat?: number;
  lng?: number;
  maxCapacity?: number;
  seatsLeft?: number;
  meetingPoint?: { lat: number; lng: number; address: string };
  whatsIncluded?: string[];
  staffId?: string;
}

export interface Staff {
  id: string;
  name: string;
  avatar: string;
  role: string;
  rating: number;
  reviewCount: number;
}

export interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export const categories: Category[] = [
  { id: 'beauty', name: 'Красота', icon: '✂️', count: 342 },
  { id: 'nails', name: 'Маникюр', icon: '💅', count: 189 },
  { id: 'spa', name: 'Спа', icon: '🧖', count: 95 },
  { id: 'medical', name: 'Медицина', icon: '🏥', count: 156 },
  { id: 'dental', name: 'Стоматология', icon: '🦷', count: 78 },
  { id: 'tours', name: 'Туры', icon: '🏔️', count: 64 },
  { id: 'massage', name: 'Массаж', icon: '💆', count: 112 },
  { id: 'fitness', name: 'Фитнес', icon: '🏋️', count: 43 },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'Премиум стрижка и укладка',
    category: 'beauty',
    subcategory: 'Haircut',
    price: 150000,
    currency: 'сум',
    duration: 60,
    rating: 4.9,
    reviewCount: 234,
    image: '',
    businessName: 'Luxe Beauty Studio',
    address: 'ул. Амира Темура, 45',
    city: 'Ташкент',
    lat: 41.3111,
    lng: 69.2797,
  },
  {
    id: '2',
    name: 'Массаж всего тела',
    category: 'beauty',
    subcategory: 'Massage',
    price: 200000,
    currency: 'сум',
    duration: 90,
    rating: 4.8,
    reviewCount: 189,
    image: '',
    businessName: 'Zen Wellness Center',
    address: 'пр. Навои, 12',
    city: 'Ташкент',
    lat: 41.3150,
    lng: 69.2550,
  },
  {
    id: '3',
    name: 'Отбеливание зубов',
    category: 'medical',
    subcategory: 'Dental',
    price: 500000,
    currency: 'сум',
    duration: 45,
    rating: 4.7,
    reviewCount: 67,
    image: '',
    businessName: 'Smile Dental Clinic',
    address: 'пр. Мустакиллик, 88',
    city: 'Ташкент',
    lat: 41.3200,
    lng: 69.2900,
  },
  {
    id: '4',
    name: 'Тур по наследию Самарканда',
    category: 'tour',
    subcategory: 'Cultural',
    price: 350000,
    currency: 'сум',
    duration: 480,
    rating: 4.9,
    reviewCount: 412,
    image: '',
    businessName: 'Uzbek Adventures',
    address: 'Площадь Регистан',
    city: 'Самарканд',
    lat: 39.6547,
    lng: 66.9597,
    maxCapacity: 20,
    seatsLeft: 7,
    meetingPoint: { lat: 39.6547, lng: 66.9597, address: 'Площадь Регистан, главный вход' },
    whatsIncluded: ['Транспорт', 'Гид', 'Обед', 'Билеты в музеи', 'Вода'],
  },
  {
    id: '5',
    name: 'Поход на Чимган',
    category: 'tour',
    subcategory: 'Adventure',
    price: 250000,
    currency: 'сум',
    duration: 600,
    rating: 4.8,
    reviewCount: 156,
    image: '',
    businessName: 'Mountain Spirit UZ',
    address: 'Курорт Чимган',
    city: 'Ташкентская область',
    lat: 41.5178,
    lng: 70.0011,
    maxCapacity: 15,
    seatsLeft: 4,
    meetingPoint: { lat: 41.5178, lng: 70.0011, address: 'Парковка у озера Чарвак' },
    whatsIncluded: ['Транспорт', 'Профессиональный гид', 'Перекус', 'Снаряжение'],
  },
  {
    id: '6',
    name: 'Гель-маникюр и педикюр',
    category: 'beauty',
    subcategory: 'Nails',
    price: 120000,
    currency: 'сум',
    duration: 75,
    rating: 4.6,
    reviewCount: 98,
    image: '',
    businessName: 'Nail Art Studio',
    address: 'ул. Пушкина, 22',
    city: 'Ташкент',
    lat: 41.3050,
    lng: 69.2700,
  },
];

export const staff: Staff[] = [
  { id: 's1', name: 'Дильноза К.', avatar: '', role: 'Старший стилист', rating: 4.9, reviewCount: 156 },
  { id: 's2', name: 'Азиз М.', avatar: '', role: 'Барбер', rating: 4.8, reviewCount: 203 },
  { id: 's3', name: 'Малика Р.', avatar: '', role: 'Мастер маникюра', rating: 4.7, reviewCount: 89 },
];

export const generateTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  for (let h = 9; h <= 20; h++) {
    for (const m of ['00', '30']) {
      const time = `${h.toString().padStart(2, '0')}:${m}`;
      slots.push({
        id: `slot-${time}`,
        time,
        available: Math.random() > 0.3,
      });
    }
  }
  return slots;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price);
};

export const openDirections = (lat: number, lng: number, address: string) => {
  const tg = (window as any).Telegram?.WebApp;
  tg?.HapticFeedback?.impactOccurred('medium');

  // Try Yandex Maps first (priority for UZ), then Google, then 2GIS
  const yandex = `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const twoGis = `https://2gis.uz/tashkent/directions/points/${lng},${lat}`;

  // On mobile Telegram, these universal links will prompt native app chooser
  const popup = tg?.showPopup;
  if (popup) {
    tg.showPopup(
      {
        title: 'Проложить маршрут',
        message: address,
        buttons: [
          { id: 'yandex', type: 'default', text: 'Яндекс Карты' },
          { id: 'google', type: 'default', text: 'Google Maps' },
          { id: '2gis', type: 'default', text: '2GIS' },
        ],
      },
      (id: string) => {
        if (id === 'yandex') tg.openLink(yandex);
        else if (id === 'google') tg.openLink(google);
        else if (id === '2gis') tg.openLink(twoGis);
      }
    );
  } else {
    window.open(yandex, '_blank');
  }
};

export const copyAddress = (address: string) => {
  const tg = (window as any).Telegram?.WebApp;
  tg?.HapticFeedback?.impactOccurred('light');
  navigator.clipboard.writeText(address);
};
