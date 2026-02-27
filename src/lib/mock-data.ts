export type BusinessType = 'beauty' | 'medical' | 'tour' | 'cafe' | 'retail' | 'service' | 'office';

export interface Service {
  id: string;
  name: string;
  category: BusinessType;
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
  lat: number;
  lng: number;
  maxCapacity?: number;
  seatsLeft?: number;
  meetingPoint?: { lat: number; lng: number; address: string };
  whatsIncluded?: string[];
  staffId?: string;
  bookable?: boolean;
  verified?: boolean;
  phone?: string;
  website?: string;
  telegram?: string;
  metadata?: Record<string, any>;
  is_promoted?: boolean;
  branded_icon_url?: string;
}

export interface Deal {
  id: string;
  serviceId: string;
  title: string;
  description: string;
  discountPercent: number;
  originalPrice: number;
  dealPrice: number;
  currency: string;
  category: BusinessType;
  validUntil: string;
  image: string;
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
  subcategories?: { id: string; name: string; icon?: string }[];
}

export const categories: Category[] = [
  {
    id: 'medical', name: 'Медицина', icon: '🏥', count: 78,
    subcategories: [
      { id: 'dental', name: 'Стоматология', icon: '🦷' },
      { id: 'lab', name: 'Анализы', icon: '🧪' },
      { id: 'clinic', name: 'Клиники', icon: '🏥' },
      { id: 'pharmacy', name: 'Аптеки 24/7', icon: '💊' },
    ],
  },
  {
    id: 'beauty', name: 'Красота', icon: '✨', count: 342,
    subcategories: [
      { id: 'barbershop', name: 'Барбершопы', icon: '💈' },
      { id: 'salon', name: 'Салоны красоты', icon: '💅' },
      { id: 'nails', name: 'Маникюр', icon: '💅' },
      { id: 'spa', name: 'SPA', icon: '🧖' },
    ],
  },
  {
    id: 'tour', name: 'Туры', icon: '🏔️', count: 64,
    subcategories: [
      { id: 'mountains', name: 'Горы' },
      { id: 'cities', name: 'Города' },
      { id: 'extreme', name: 'Экстрим' },
      { id: 'resorts', name: 'Зоны отдыха' },
    ],
  },
  {
    id: 'cafe', name: 'Кофейни', icon: '☕️', count: 128,
    subcategories: [
      { id: 'coffee', name: 'Кофе' },
      { id: 'restaurant', name: 'Рестораны' },
      { id: 'fastfood', name: 'Фастфуд' },
    ],
  },
  {
    id: 'retail', name: 'Магазины', icon: '🛍️', count: 95,
    subcategories: [
      { id: 'clothes', name: 'Одежда' },
      { id: 'electronics', name: 'Электроника' },
      { id: 'grocery', name: 'Продукты' },
    ],
  },
  {
    id: 'service', name: 'Услуги', icon: '🛠️', count: 156,
    subcategories: [
      { id: 'repair', name: 'Ремонт' },
      { id: 'cleaning', name: 'Уборка' },
      { id: 'delivery', name: 'Доставка' },
    ],
  },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'Премиум стрижка и укладка',
    category: 'beauty',
    subcategory: 'barbershop',
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
    is_promoted: true,
    verified: true,
    telegram: 'luxebeauty_tashkent',
  },
  {
    id: '2',
    name: 'Массаж всего тела',
    category: 'beauty',
    subcategory: 'spa',
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
    subcategory: 'dental',
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
    is_promoted: true,
    verified: true,
    telegram: 'smiledental_uz',
  },
  {
    id: '4',
    name: 'Тур по наследию Самарканда',
    category: 'tour',
    subcategory: 'cities',
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
    subcategory: 'mountains',
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
    is_promoted: true,
  },
  {
    id: '6',
    name: 'Гель-маникюр и педикюр',
    category: 'beauty',
    subcategory: 'nails',
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
    bookable: true,
  },
  {
    id: '7',
    name: 'Авторский кофе и десерты',
    category: 'cafe',
    subcategory: 'coffee',
    price: 25000,
    currency: 'сум',
    duration: 0,
    rating: 4.8,
    reviewCount: 312,
    image: '',
    businessName: 'Brew Lab Tashkent',
    address: 'ул. Шота Руставели, 5',
    city: 'Ташкент',
    lat: 41.3100,
    lng: 69.2650,
    bookable: false,
    verified: true,
    phone: '+998901234567',
    website: 'https://instagram.com/brewlab',
    telegram: 'brewlab_tashkent',
    metadata: { menu_url: 'https://brewlab.uz/menu', wifi: true },
  },
  {
    id: '8',
    name: 'Канцелярия и товары для офиса',
    category: 'retail',
    subcategory: 'electronics',
    price: 0,
    currency: 'сум',
    duration: 0,
    rating: 4.5,
    reviewCount: 87,
    image: '',
    businessName: 'PaperHouse',
    address: 'ул. Бабура, 33',
    city: 'Ташкент',
    lat: 41.3180,
    lng: 69.2800,
    bookable: false,
    verified: false,
    phone: '+998712345678',
    website: 'https://paperhouse.uz',
    metadata: { stock_status: 'in_stock', delivery: true },
  },
  {
    id: '9',
    name: 'Ремонт техники Apple',
    category: 'service',
    subcategory: 'repair',
    price: 100000,
    currency: 'сум',
    duration: 60,
    rating: 4.6,
    reviewCount: 145,
    image: '',
    businessName: 'iFix Tashkent',
    address: 'ул. Навои, 30',
    city: 'Ташкент',
    lat: 41.3120,
    lng: 69.2580,
    bookable: true,
    verified: true,
    phone: '+998933456789',
    telegram: 'ifix_tashkent',
    metadata: { brands: ['Apple', 'Samsung'] },
  },
];

export const deals: Deal[] = [
  {
    id: 'd1',
    serviceId: '1',
    title: 'Стрижка + укладка',
    description: 'Премиум стрижка со скидкой в Luxe Beauty Studio',
    discountPercent: 20,
    originalPrice: 150000,
    dealPrice: 120000,
    currency: 'сум',
    category: 'beauty',
    validUntil: '2026-03-15',
    image: '',
  },
  {
    id: 'd2',
    serviceId: '2',
    title: 'Массаж 90 мин',
    description: 'Полный массаж тела со скидкой',
    discountPercent: 15,
    originalPrice: 200000,
    dealPrice: 170000,
    currency: 'сум',
    category: 'beauty',
    validUntil: '2026-03-20',
    image: '',
  },
  {
    id: 'd3',
    serviceId: '4',
    title: 'Тур в Самарканд',
    description: 'Групповой тур по Регистану и окрестностям',
    discountPercent: 10,
    originalPrice: 350000,
    dealPrice: 315000,
    currency: 'сум',
    category: 'tour',
    validUntil: '2026-04-01',
    image: '',
  },
  {
    id: 'd4',
    serviceId: '3',
    title: 'Отбеливание зубов',
    description: 'Профессиональное отбеливание в Smile Dental',
    discountPercent: 25,
    originalPrice: 500000,
    dealPrice: 375000,
    currency: 'сум',
    category: 'medical',
    validUntil: '2026-03-10',
    image: '',
  },
  {
    id: 'd5',
    serviceId: '7',
    title: 'Кофе + десерт',
    description: 'Комбо-предложение в Brew Lab',
    discountPercent: 30,
    originalPrice: 45000,
    dealPrice: 31500,
    currency: 'сум',
    category: 'cafe',
    validUntil: '2026-03-31',
    image: '',
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

export const categoryEmoji: Record<string, string> = {
  tour: '🏔️',
  beauty: '✨',
  medical: '🏥',
  cafe: '☕️',
  retail: '🛍️',
  service: '🛠️',
  office: '🏢',
};

export const openDirections = (lat: number, lng: number, address: string) => {
  const tg = (window as any).Telegram?.WebApp;
  tg?.HapticFeedback?.impactOccurred('medium');
  const yandex = `https://yandex.uz/maps/?rtext=~${lat},${lng}&rtt=auto`;
  const google = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const twoGis = `https://2gis.uz/tashkent/directions/points/${lng},${lat}`;
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
