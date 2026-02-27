export interface Service {
  id: string;
  name: string;
  nameUz?: string;
  category: 'beauty' | 'medical' | 'tour';
  subcategory: string;
  price: number;
  currency: string;
  duration: number; // minutes
  rating: number;
  reviewCount: number;
  image: string;
  businessName: string;
  address: string;
  city: string;
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
  { id: 'beauty', name: 'Beauty', icon: '✂️', count: 342 },
  { id: 'nails', name: 'Nails', icon: '💅', count: 189 },
  { id: 'spa', name: 'Spa', icon: '🧖', count: 95 },
  { id: 'medical', name: 'Medical', icon: '🏥', count: 156 },
  { id: 'dental', name: 'Dental', icon: '🦷', count: 78 },
  { id: 'tours', name: 'Tours', icon: '🏔️', count: 64 },
  { id: 'massage', name: 'Massage', icon: '💆', count: 112 },
  { id: 'fitness', name: 'Fitness', icon: '🏋️', count: 43 },
];

export const services: Service[] = [
  {
    id: '1',
    name: 'Premium Haircut & Styling',
    category: 'beauty',
    subcategory: 'Haircut',
    price: 150000,
    currency: 'UZS',
    duration: 60,
    rating: 4.9,
    reviewCount: 234,
    image: '',
    businessName: 'Luxe Beauty Studio',
    address: 'Amir Temur St. 45',
    city: 'Tashkent',
  },
  {
    id: '2',
    name: 'Full Body Massage',
    category: 'beauty',
    subcategory: 'Massage',
    price: 200000,
    currency: 'UZS',
    duration: 90,
    rating: 4.8,
    reviewCount: 189,
    image: '',
    businessName: 'Zen Wellness Center',
    address: 'Navoi Ave 12',
    city: 'Tashkent',
  },
  {
    id: '3',
    name: 'Teeth Whitening',
    category: 'medical',
    subcategory: 'Dental',
    price: 500000,
    currency: 'UZS',
    duration: 45,
    rating: 4.7,
    reviewCount: 67,
    image: '',
    businessName: 'Smile Dental Clinic',
    address: 'Mustaqillik Ave 88',
    city: 'Tashkent',
  },
  {
    id: '4',
    name: 'Samarkand Heritage Tour',
    category: 'tour',
    subcategory: 'Cultural',
    price: 350000,
    currency: 'UZS',
    duration: 480,
    rating: 4.9,
    reviewCount: 412,
    image: '',
    businessName: 'Uzbek Adventures',
    address: 'Registan Square',
    city: 'Samarkand',
    maxCapacity: 20,
    seatsLeft: 7,
    meetingPoint: { lat: 39.6547, lng: 66.9597, address: 'Registan Square, Main Entrance' },
    whatsIncluded: ['Transport', 'Guide', 'Lunch', 'Museum tickets', 'Water'],
  },
  {
    id: '5',
    name: 'Chimgan Mountain Trek',
    category: 'tour',
    subcategory: 'Adventure',
    price: 250000,
    currency: 'UZS',
    duration: 600,
    rating: 4.8,
    reviewCount: 156,
    image: '',
    businessName: 'Mountain Spirit UZ',
    address: 'Chimgan Resort',
    city: 'Tashkent Region',
    maxCapacity: 15,
    seatsLeft: 4,
    meetingPoint: { lat: 41.5178, lng: 70.0011, address: 'Chorvoq Lake Parking' },
    whatsIncluded: ['Transport', 'Professional guide', 'Snacks', 'Safety equipment'],
  },
  {
    id: '6',
    name: 'Gel Manicure & Pedicure',
    category: 'beauty',
    subcategory: 'Nails',
    price: 120000,
    currency: 'UZS',
    duration: 75,
    rating: 4.6,
    reviewCount: 98,
    image: '',
    businessName: 'Nail Art Studio',
    address: 'Pushkin St. 22',
    city: 'Tashkent',
  },
];

export const staff: Staff[] = [
  { id: 's1', name: 'Dilnoza K.', avatar: '', role: 'Senior Stylist', rating: 4.9, reviewCount: 156 },
  { id: 's2', name: 'Aziz M.', avatar: '', role: 'Barber', rating: 4.8, reviewCount: 203 },
  { id: 's3', name: 'Malika R.', avatar: '', role: 'Nail Artist', rating: 4.7, reviewCount: 89 },
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
  return new Intl.NumberFormat('uz-UZ').format(price);
};
