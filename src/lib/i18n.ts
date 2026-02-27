export type Lang = 'ru' | 'uz' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  // Bottom Nav
  'nav.home': { ru: 'Главная', uz: 'Bosh sahifa', en: 'Home' },
  'nav.deals': { ru: 'Акции', uz: 'Aksiyalar', en: 'Deals' },
  'nav.bookings': { ru: 'Записи', uz: 'Bandlovlar', en: 'Bookings' },
  'nav.business': { ru: 'Бизнес', uz: 'Biznes', en: 'Business' },
  'nav.profile': { ru: 'Профиль', uz: 'Profil', en: 'Profile' },

  // Profile
  'profile.title': { ru: 'Мой профиль', uz: 'Mening profilim', en: 'My Profile' },
  'profile.guest': { ru: 'Гость', uz: 'Mehmon', en: 'Guest' },
  'profile.login_full': { ru: 'Войдите для полного доступа', uz: "To'liq kirish uchun tizimga kiring", en: 'Sign in for full access' },
  'profile.login': { ru: 'Войти / Регистрация', uz: 'Kirish / Roʻyxatdan oʻtish', en: 'Sign In / Sign Up' },
  'profile.email_password': { ru: 'Email и пароль', uz: 'Email va parol', en: 'Email & password' },
  'profile.become_partner': { ru: 'Стать партнёром', uz: 'Hamkor boʻlish', en: 'Become Partner' },
  'profile.add_business': { ru: 'Добавьте свой бизнес в TUTGO', uz: 'Biznesingizni TUTGO ga qoʻshing', en: 'Add your business to TUTGO' },
  'profile.business_portal': { ru: 'Бизнес-портал', uz: 'Biznes portal', en: 'Business Portal' },
  'profile.manage_listings': { ru: 'Управление листингами', uz: 'Listinglarni boshqarish', en: 'Manage listings' },
  'profile.partner_badge': { ru: 'Партнёр', uz: 'Hamkor', en: 'Partner' },
  'profile.my_profile': { ru: 'Мой профиль', uz: 'Mening profilim', en: 'My Profile' },
  'profile.personal_info': { ru: 'Личная информация', uz: 'Shaxsiy maʼlumotlar', en: 'Personal information' },
  'profile.language': { ru: 'Язык', uz: 'Til', en: 'Language' },
  'profile.lang_options': { ru: "Русский, O'zbek, English", uz: "Ruscha, Oʻzbekcha, English", en: "Russian, Uzbek, English" },
  'profile.settings': { ru: 'Настройки', uz: 'Sozlamalar', en: 'Settings' },
  'profile.settings_desc': { ru: 'Уведомления, приватность', uz: 'Bildirishnomalar, maxfiylik', en: 'Notifications, privacy' },
  'profile.help': { ru: 'Помощь', uz: 'Yordam', en: 'Help' },
  'profile.help_desc': { ru: 'FAQ, связаться с нами', uz: 'FAQ, biz bilan bogʻlanish', en: 'FAQ, contact us' },
  'profile.sign_out': { ru: 'Выйти', uz: 'Chiqish', en: 'Sign Out' },
  'profile.signed_out': { ru: 'Вы вышли из аккаунта', uz: 'Siz akkauntdan chiqdingiz', en: 'Signed out' },
  'profile.partner_success': { ru: '🎉 Вы теперь партнёр!', uz: '🎉 Siz endi hamkorsiz!', en: '🎉 You are now a partner!' },
  'profile.partner_welcome': { ru: 'Добро пожаловать в бизнес-портал', uz: 'Biznes portalga xush kelibsiz', en: 'Welcome to the business portal' },
  'profile.version': { ru: 'TUTGO v1.0 · Сделано в Узбекистане 🇺🇿', uz: "TUTGO v1.0 · Oʻzbekistonda yaratilgan 🇺🇿", en: 'TUTGO v1.0 · Made in Uzbekistan 🇺🇿' },

  // Settings
  'settings.title': { ru: 'Настройки', uz: 'Sozlamalar', en: 'Settings' },
  'settings.dark_mode': { ru: 'Тёмная тема', uz: 'Qorong\'i rejim', en: 'Dark Mode' },
  'settings.dark_mode_desc': { ru: 'Тёмный интерфейс приложения', uz: 'Ilovaning qorongʻi interfeysi', en: 'Dark app interface' },
  'settings.notifications': { ru: 'Уведомления', uz: 'Bildirishnomalar', en: 'Notifications' },
  'settings.notifications_desc': { ru: 'Push-уведомления о записях', uz: 'Bandlovlar haqida bildirishnomalar', en: 'Push notifications for bookings' },
  'settings.language': { ru: 'Язык приложения', uz: 'Ilova tili', en: 'App Language' },
  'settings.saved': { ru: 'Настройки сохранены', uz: 'Sozlamalar saqlandi', en: 'Settings saved' },

  // Edit Profile
  'edit.title': { ru: 'Редактировать профиль', uz: 'Profilni tahrirlash', en: 'Edit Profile' },
  'edit.name': { ru: 'Имя', uz: 'Ism', en: 'Name' },
  'edit.phone': { ru: 'Телефон', uz: 'Telefon', en: 'Phone' },
  'edit.telegram': { ru: 'Telegram username', uz: 'Telegram username', en: 'Telegram username' },
  'edit.save': { ru: 'Сохранить', uz: 'Saqlash', en: 'Save' },
  'edit.saved': { ru: 'Профиль обновлён', uz: 'Profil yangilandi', en: 'Profile updated' },
  'edit.upload_avatar': { ru: 'Загрузить фото', uz: 'Rasm yuklash', en: 'Upload photo' },

  // Help
  'help.title': { ru: 'Помощь и FAQ', uz: 'Yordam va FAQ', en: 'Help & FAQ' },
  'help.q1': { ru: 'Как записаться на услугу?', uz: "Xizmatga qanday yozilish mumkin?", en: 'How to book a service?' },
  'help.a1': { ru: 'Выберите бизнес на карте, откройте его карточку и нажмите «Записаться». Выберите дату, время и подтвердите.', uz: "Xaritada biznesni tanlang, kartochkasini oching va «Bandlash» tugmasini bosing.", en: 'Select a business on the map, open its card and tap "Book". Choose date, time and confirm.' },
  'help.q2': { ru: 'Как стать партнёром?', uz: 'Qanday hamkor boʻlish mumkin?', en: 'How to become a partner?' },
  'help.a2': { ru: 'Перейдите в Профиль → Стать партнёром. После этого вам станет доступен раздел «Бизнес» для управления листингами.', uz: "Profilga oʻting → Hamkor boʻlish. Keyin sizga «Biznes» boʻlimi ochiladi.", en: 'Go to Profile → Become Partner. After that, the "Business" section will be available for managing listings.' },
  'help.q3': { ru: 'Как связаться с поддержкой?', uz: "Qoʻllab-quvvatlash bilan qanday bogʻlanish mumkin?", en: 'How to contact support?' },
  'help.a3': { ru: 'Напишите нам в Telegram: @tutgo_support', uz: 'Bizga Telegram orqali yozing: @tutgo_support', en: 'Write to us on Telegram: @tutgo_support' },
  'help.contact_support': { ru: 'Написать в поддержку', uz: 'Qoʻllab-quvvatlashga yozish', en: 'Contact Support' },

  // Partner Landing
  'partner_landing.title': { ru: 'TUTGO для бизнеса', uz: 'Biznes uchun TUTGO', en: 'TUTGO for Business' },
  'partner_landing.subtitle': { ru: 'Привлекайте клиентов через Telegram', uz: 'Telegram orqali mijozlarni jalb qiling', en: 'Attract customers via Telegram' },
  'partner_landing.benefit1': { ru: 'Покажите бизнес на карте Ташкента', uz: "Biznesingizni Toshkent xaritasida koʻrsating", en: 'Show your business on Tashkent map' },
  'partner_landing.benefit2': { ru: 'Прямая связь через Telegram', uz: 'Telegram orqali bevosita aloqa', en: 'Direct contact via Telegram' },
  'partner_landing.benefit3': { ru: 'Управляйте ценами и фото', uz: 'Narxlar va rasmlarni boshqaring', en: 'Manage prices and photos' },
  'partner_landing.benefit4': { ru: 'Аналитика просмотров и кликов', uz: "Koʻrishlar va kliklar analitikasi", en: 'Views and clicks analytics' },
  'partner_landing.cta': { ru: 'Стать партнёром', uz: 'Hamkor boʻlish', en: 'Become Partner' },
  'partner_landing.login_first': { ru: 'Сначала войдите в аккаунт', uz: 'Avval akkauntga kiring', en: 'Sign in first' },

  // Index
  'index.popular_nearby': { ru: 'Популярное рядом', uz: "Yaqin atrofda ommabop", en: 'Popular nearby' },
  'index.found': { ru: 'найдено', uz: 'topildi', en: 'found' },
  'index.nothing_found': { ru: 'Ничего не найдено. Попробуйте другой запрос.', uz: "Hech narsa topilmadi. Boshqa so'rov kiriting.", en: 'Nothing found. Try a different query.' },
  'index.collapse': { ru: 'Свернуть', uz: 'Yigʻish', en: 'Collapse' },
  'index.places_found': { ru: 'мест найдено', uz: 'joy topildi', en: 'places found' },

  // Categories
  'cat.all': { ru: 'Все', uz: 'Hammasi', en: 'All' },
  'cat.beauty': { ru: 'Красота', uz: 'Goʻzallik', en: 'Beauty' },
  'cat.medical': { ru: 'Медицина', uz: 'Tibbiyot', en: 'Medical' },
  'cat.tour': { ru: 'Туры', uz: 'Turlar', en: 'Tours' },
  'cat.cafe': { ru: 'Кофейни', uz: 'Qahvaxonalar', en: 'Cafes' },
  'cat.retail': { ru: 'Магазины', uz: 'Doʻkonlar', en: 'Shops' },
  'cat.service': { ru: 'Услуги', uz: 'Xizmatlar', en: 'Services' },
  'cat.office': { ru: 'Офисы', uz: 'Ofislar', en: 'Offices' },

  // Common
  'common.error': { ru: 'Ошибка', uz: 'Xatolik', en: 'Error' },
  'common.loading': { ru: 'Загрузка...', uz: 'Yuklanmoqda...', en: 'Loading...' },
  'common.back': { ru: 'Назад', uz: 'Orqaga', en: 'Back' },
};

export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] ?? translations[key]?.['ru'] ?? key;
}

export const LANG_LABELS: Record<Lang, string> = {
  ru: 'Русский',
  uz: "O'zbek",
  en: 'English',
};
