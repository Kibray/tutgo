export type BusinessType = 'beauty' | 'medical' | 'tour' | 'cafe' | 'retail' | 'service' | 'office';

export interface LocationItem {
  id: string;
  name: string;
  business_type: string;
  sub_category: string | null;
  price_from: number | null;
  currency: string | null;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  telegram: string | null;
  website: string | null;
  verified: boolean | null;
  is_promoted: boolean | null;
  branded_icon_url: string | null;
  gallery: string[] | null;
  amenities: any;
  metadata: any;
  owner_id: string;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  description: string | null;
  queue_enabled?: boolean;
}

export const categoryEmoji: Record<string, string> = {
  tour: '🏔️',
  beauty: '✨',
  medical: '🏥',
  cafe: '☕️',
  retail: '🛍️',
  service: '🛠️',
  office: '🏢',
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price);
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
