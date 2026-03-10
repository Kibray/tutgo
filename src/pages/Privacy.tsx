import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

type DocLang = 'ru' | 'uz';

const content: Record<DocLang, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  ru: {
    title: 'Политика конфиденциальности',
    updated: 'Версия 1.0 · Март 2026',
    sections: [
      {
        heading: '1. Какие данные мы собираем',
        body: '• Имя и фамилия (при регистрации).\n• Email-адрес.\n• Номер телефона (опционально).\n• Геолокация (для отображения ближайших услуг).\n• История записей и отзывов.\n• Telegram chat_id и username (при подключении бота).\n• Реферальный код.\n• IP-адрес и данные устройства.\n• Предпочтения (язык, тема оформления, настройки уведомлений).',
      },
      {
        heading: '2. Как мы используем данные',
        body: '• Для записи к специалистам и управления бронированиями.\n• Для отправки уведомлений (Email и Telegram) о статусе записей.\n• Для напоминаний о предстоящих визитах.\n• Для улучшения качества сервиса и персонализации.\n• Для работы реферальной системы.\n• Для аналитики и статистики (в обезличенном виде).',
      },
      {
        heading: '3. Cookies и технологии отслеживания',
        body: '• Технические cookies — для авторизации и поддержания сессии.\n• Google Auth cookies — при входе через Google.\n• Аналитические cookies — для понимания поведения пользователей.\n\nВы можете отключить cookies в настройках браузера, однако это может повлиять на работу сервиса.',
      },
      {
        heading: '4. Передача данных третьим лицам',
        body: 'Мы НЕ передаём ваши персональные данные третьим лицам, за исключением:\n\n• Партнёра (бизнеса), к которому вы записались — передаётся только имя, телефон и детали записи.\n• По требованию законодательства Республики Узбекистан.\n\nМы не продаём, не сдаём в аренду и не обмениваем ваши данные.',
      },
      {
        heading: '5. Право на удаление данных',
        body: 'Вы имеете право запросить полное удаление ваших персональных данных.\n\nДля этого отправьте запрос на info@tutgo.uz с указанием email, привязанного к аккаунту. Мы обработаем запрос в течение 30 рабочих дней.',
      },
      {
        heading: '6. Хранение данных',
        body: '• База данных: Supabase (дата-центр в Сингапуре).\n• Почтовый сервис: Zoho Mail (дата-центр в США).\n• Данные передаются по защищённому протоколу HTTPS.\n• Доступ к базе данных ограничен политиками Row Level Security (RLS).\n\nОбработка данных осуществляется в соответствии с Законом Республики Узбекистан «О персональных данных» №547 от 2 июля 2019 года.',
      },
      {
        heading: '7. Безопасность',
        body: '• Все данные передаются по зашифрованному каналу (TLS/SSL).\n• Пароли хранятся в хешированном виде и недоступны даже администраторам.\n• Применяются политики Row Level Security для изоляции данных пользователей.\n• Регулярный аудит безопасности.',
      },
      {
        heading: '8. Изменения политики',
        body: 'Мы оставляем за собой право обновлять настоящую Политику конфиденциальности. При существенных изменениях мы уведомим пользователей через Telegram-бот @TutGoUzBot и/или email.\n\nПродолжение использования сервиса после уведомления означает согласие с обновлённой политикой.',
      },
      {
        heading: '9. Контакты',
        body: 'По вопросам конфиденциальности обращайтесь:\n\nEmail: info@tutgo.uz\nTelegram: @TutGoUzBot\nСайт: tutgo.uz\nАдрес: Узбекистан, Ташкент',
      },
    ],
  },
  uz: {
    title: 'Maxfiylik siyosati',
    updated: 'Versiya 1.0 · Mart 2026',
    sections: [
      {
        heading: '1. Qanday maʼlumotlarni yigʻamiz',
        body: '• Ism va familiya (roʻyxatdan oʻtishda).\n• Email manzil.\n• Telefon raqami (ixtiyoriy).\n• Geolokatsiya (yaqin xizmatlarni koʻrsatish uchun).\n• Bandlovlar va sharhlar tarixi.\n• Telegram chat_id va username (botni ulashda).\n• Referal kodi.\n• IP manzil va qurilma maʼlumotlari.',
      },
      {
        heading: '2. Maʼlumotlardan qanday foydalanamiz',
        body: '• Mutaxassislarga yozilish va bron qilishni boshqarish uchun.\n• Bandlovlar holati haqida bildirishnomalar (Email va Telegram) yuborish uchun.\n• Kelgusi tashriflar haqida eslatmalar uchun.\n• Xizmat sifatini yaxshilash va shaxsiylash tish uchun.',
      },
      {
        heading: '3. Cookies',
        body: '• Texnik cookies — avtorizatsiya va sessiyani saqlash uchun.\n• Google Auth cookies — Google orqali kirishda.\n• Analitik cookies — foydalanuvchi xatti-harakatlarini tushunish uchun.',
      },
      {
        heading: '4. Uchinchi tomonlarga maʼlumot uzatish',
        body: 'Biz shaxsiy maʼlumotlaringizni uchinchi tomonlarga UZATMAYMIZ, bundan mustasno:\n\n• Siz yozilgan hamkor (biznes) — faqat ism, telefon va bandlov tafsilotlari uzatiladi.\n• Oʻzbekiston Respublikasi qonunchiligi talabiga binoan.',
      },
      {
        heading: '5. Maʼlumotlarni oʻchirish huquqi',
        body: 'Siz shaxsiy maʼlumotlaringizni toʻliq oʻchirilishini soʻrashga haqsiz.\n\nBuning uchun info@tutgo.uz manziliga akkauntga bogʻlangan emailni koʻrsatib soʻrov yuboring. Biz soʻrovni 30 ish kuni ichida koʻrib chiqamiz.',
      },
      {
        heading: '6. Maʼlumotlarni saqlash',
        body: '• Maʼlumotlar bazasi: Supabase (Singapur).\n• Pochta xizmati: Zoho Mail (AQSh).\n• Maʼlumotlar HTTPS himoyalangan protokol orqali uzatiladi.\n\nOʻzbekiston Respublikasining «Shaxsiy maʼlumotlar toʻgʻrisida»gi №547-sonli Qonuniga muvofiq.',
      },
      {
        heading: '7. Xavfsizlik',
        body: '• Barcha maʼlumotlar shifrlangan kanal (TLS/SSL) orqali uzatiladi.\n• Parollar xeshlangan holda saqlanadi.\n• Row Level Security siyosatlari qoʻllaniladi.',
      },
      {
        heading: '8. Siyosat oʻzgarishlari',
        body: 'Biz ushbu Maxfiylik siyosatini yangilash huquqini saqlab qolamiz. Muhim oʻzgarishlar haqida @TutGoUzBot va/yoki email orqali xabar beramiz.',
      },
      {
        heading: '9. Aloqa',
        body: 'Email: info@tutgo.uz\nTelegram: @TutGoUzBot\nSayt: tutgo.uz\nManzil: Oʻzbekiston, Toshkent',
      },
    ],
  },
};

const Privacy = () => {
  const [lang, setLang] = useState<DocLang>('ru');
  const navigate = useNavigate();
  const doc = content[lang];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-sm font-bold text-foreground flex-1">{doc.title}</h1>
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          {(['ru', 'uz'] as DocLang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${lang === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-2xl mx-auto space-y-6">
        <p className="text-[11px] text-muted-foreground">{doc.updated}</p>
        {doc.sections.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <h2 className="text-sm font-bold text-foreground mb-2">{s.heading}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
          </motion.div>
        ))}

        <div className="border-t border-border pt-6 mt-8 text-center space-y-2">
          <Link to="/terms" className="text-xs text-primary hover:underline">
            {lang === 'ru' ? 'Пользовательское соглашение' : 'Foydalanish shartlari'}
          </Link>
          <p className="text-[10px] text-muted-foreground">© 2026 TutGo. {lang === 'ru' ? 'Все права защищены.' : 'Barcha huquqlar himoyalangan.'}</p>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
