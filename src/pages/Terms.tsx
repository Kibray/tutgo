import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

type DocLang = 'ru' | 'uz';

const content: Record<DocLang, { title: string; updated: string; sections: { heading: string; body: string }[] }> = {
  ru: {
    title: 'Пользовательское соглашение',
    updated: 'Версия 1.0 · Март 2026',
    sections: [
      {
        heading: '1. О сервисе',
        body: 'TutGo (tutgo.uz) — маркетплейс услуг Узбекистана. Платформа соединяет клиентов с поставщиками услуг в Ташкенте и других городах Узбекистана.\n\nОператор: TutGo, Ташкент, Узбекистан.\nСайт: tutgo.uz\nTelegram-бот: @TutGoUzBot',
      },
      {
        heading: '2. Регистрация',
        body: '• Сервис предназначен для лиц, достигших 18 лет.\n• Допускается только один аккаунт на одного пользователя.\n• Регистрация через Email, Google или Telegram означает полное согласие с настоящим Пользовательским соглашением и Политикой конфиденциальности.\n• Пользователь несёт ответственность за достоверность предоставленных данных.',
      },
      {
        heading: '3. Права клиентов',
        body: '• Искать услуги и бизнесы на карте и в каталоге.\n• Записываться на услуги онлайн.\n• Оставлять отзывы и оценки после визита.\n• Отменять записи в соответствии с политикой отмены.\n• Получать уведомления о статусе записей.\n• Приглашать друзей через реферальную систему.',
      },
      {
        heading: '4. Политика отмены записи',
        body: '• До 2 часов до начала — бесплатная отмена без последствий.\n• Менее чем за 2 часа — пользователь получает предупреждение.\n• 3 и более отмен подряд менее чем за 2 часа — временная блокировка возможности записи.\n• Неявка без отмены — автоматическое предупреждение бизнесу и пометка в истории клиента.',
      },
      {
        heading: '5. Права бизнеса (партнёров)',
        body: '• Размещать информацию о компании, услугах и ценах.\n• Управлять записями клиентов через панель управления.\n• Получать уведомления о новых записях и отменах.\n• Использовать CRM-инструменты: клиентскую базу, аналитику, управление персоналом.\n• Создавать акции и специальные предложения.\n• Управлять живой очередью.',
      },
      {
        heading: '6. Реферальная система',
        body: '• Клиенты могут приглашать друзей через персональную ссылку tutgo.uz/ref/[код].\n• Бизнес получает уникальную ссылку на свою страницу tutgo.uz/b/[slug].\n• Накрутка рефералов (фейковые аккаунты, боты, самоприглашения) строго запрещена и влечёт за собой блокировку аккаунта.\n• TutGo оставляет за собой право аннулировать реферальные бонусы при обнаружении злоупотреблений.',
      },
      {
        heading: '7. Telegram-уведомления',
        body: '• Подключение бота @TutGoUzBot означает согласие на получение автоматических уведомлений о записях, напоминаниях и акциях.\n• Для отключения уведомлений отправьте команду /stop боту @TutGoUzBot.\n• TutGo не несёт ответственности за задержки доставки сообщений, связанные с работой Telegram.',
      },
      {
        heading: '8. Email-уведомления',
        body: '• Письма отправляются с адреса info@tutgo.uz.\n• Отписаться от рассылки можно в настройках профиля в разделе «Уведомления».\n• Сервисные письма (подтверждение регистрации, восстановление пароля) не могут быть отключены.',
      },
      {
        heading: '9. Хранение данных',
        body: '• База данных: Supabase (дата-центр в Сингапуре).\n• Почтовый сервис: Zoho Mail (дата-центр в США).\n• Обработка данных осуществляется в соответствии с Законом Республики Узбекистан «О персональных данных» №547 от 2 июля 2019 года.\n• Подробнее — в Политике конфиденциальности.',
      },
      {
        heading: '10. Запрещённые действия',
        body: '• Рассылка спама и нежелательных сообщений.\n• Мошенничество и обман других пользователей.\n• Размещение фейковых отзывов.\n• Накрутка рефералов и счётчиков.\n• Попытки взлома системы, SQL-инъекции, DDoS-атаки.\n• Использование сервиса для нелегальной деятельности.\n\nНарушение данных правил влечёт блокировку аккаунта без предупреждения.',
      },
      {
        heading: '11. Ответственность',
        body: 'TutGo выступает исключительно в роли посредника между клиентом и бизнесом. Качество предоставляемых услуг является ответственностью партнёра (бизнеса).\n\nTutGo не несёт ответственности за:\n• Качество услуг, оказанных партнёрами.\n• Споры между клиентом и бизнесом.\n• Действия третьих лиц.',
      },
      {
        heading: '12. Форс-мажор',
        body: 'При технических сбоях, перебоях в работе серверов, стихийных бедствиях или иных обстоятельствах непреодолимой силы TutGo не несёт ответственности за временную недоступность сервиса.',
      },
      {
        heading: '13. Контакты',
        body: 'Email: info@tutgo.uz\nTelegram: @TutGoUzBot\nСайт: tutgo.uz\nАдрес: Узбекистан, Ташкент',
      },
    ],
  },
  uz: {
    title: 'Foydalanish shartlari',
    updated: 'Versiya 1.0 · Mart 2026',
    sections: [
      {
        heading: '1. Xizmat haqida',
        body: 'TutGo (tutgo.uz) — Oʻzbekiston xizmatlari marketpleysi. Platforma mijozlarni Toshkent va boshqa shaharlardagi xizmat koʻrsatuvchilar bilan bogʻlaydi.\n\nOperator: TutGo, Toshkent, Oʻzbekiston.\nSayt: tutgo.uz\nTelegram-bot: @TutGoUzBot',
      },
      {
        heading: '2. Roʻyxatdan oʻtish',
        body: '• Xizmat 18 yoshga toʻlgan shaxslar uchun moʻljallangan.\n• Bir foydalanuvchiga faqat bitta akkaunt ruxsat etiladi.\n• Email, Google yoki Telegram orqali roʻyxatdan oʻtish ushbu Foydalanish shartlari va Maxfiylik siyosatiga toʻliq rozilikni bildiradi.\n• Foydalanuvchi taqdim etilgan maʼlumotlarning toʻgʻriligi uchun javobgardir.',
      },
      {
        heading: '3. Mijozlar huquqlari',
        body: '• Xarita va katalogda xizmatlar va bizneslarni qidirish.\n• Onlayn xizmatlarga yozilish.\n• Tashrifdan keyin sharh va baho qoldirish.\n• Bekor qilish siyosatiga muvofiq bandlovlarni bekor qilish.\n• Bandlovlar holati haqida bildirishnomalar olish.\n• Referal tizimi orqali doʻstlarni taklif qilish.',
      },
      {
        heading: '4. Bandlovni bekor qilish siyosati',
        body: '• Boshlanishidan 2 soat oldin — bepul bekor qilish.\n• 2 soatdan kam vaqt qolganda — foydalanuvchi ogohlantirish oladi.\n• Ketma-ket 3 va undan koʻp bekor qilish — vaqtinchalik bloklash.\n• Bekor qilmasdan kelmaslik — biznesga avtomatik ogohlantirish.',
      },
      {
        heading: '5. Biznes (hamkorlar) huquqlari',
        body: '• Kompaniya, xizmatlar va narxlar haqida maʼlumot joylashtirish.\n• Boshqaruv paneli orqali mijozlar bandlovlarini boshqarish.\n• Yangi bandlovlar va bekor qilishlar haqida bildirishnomalar olish.\n• CRM vositalaridan foydalanish: mijozlar bazasi, analitika, xodimlarni boshqarish.\n• Aksiyalar va maxsus takliflar yaratish.',
      },
      {
        heading: '6. Referal tizimi',
        body: '• Mijozlar shaxsiy havola tutgo.uz/ref/[kod] orqali doʻstlarini taklif qilishlari mumkin.\n• Biznes oʻz sahifasiga noyob havola tutgo.uz/b/[slug] oladi.\n• Referallarni sun\'iy oshirish (soxta akkauntlar, botlar) qatʼiyan taqiqlanadi va akkountni bloklashga olib keladi.',
      },
      {
        heading: '7. Telegram bildirishnomalar',
        body: '• @TutGoUzBot botini ulash bandlovlar, eslatmalar va aksiyalar haqida avtomatik bildirishnomalar olishga rozilikni bildiradi.\n• Bildirishnomalarni oʻchirish uchun @TutGoUzBot botiga /stop buyruğini yuboring.',
      },
      {
        heading: '8. Email bildirishnomalar',
        body: '• Xatlar info@tutgo.uz manzilidan yuboriladi.\n• Profil sozlamalarining «Bildirishnomalar» boʻlimida obunani bekor qilish mumkin.',
      },
      {
        heading: '9. Maʼlumotlarni saqlash',
        body: '• Maʼlumotlar bazasi: Supabase (Singapur).\n• Pochta xizmati: Zoho Mail (AQSh).\n• Maʼlumotlarni qayta ishlash Oʻzbekiston Respublikasining «Shaxsiy maʼlumotlar toʻgʻrisida»gi №547-sonli Qonuniga muvofiq amalga oshiriladi.',
      },
      {
        heading: '10. Taqiqlangan harakatlar',
        body: '• Spam va kiruvchi xabarlar tarqatish.\n• Firibgarlik va boshqa foydalanuvchilarni aldash.\n• Soxta sharhlar joylashtirish.\n• Referallar va hisoblagichlarni sun\'iy oshirish.\n• Tizimni buzishga urinishlar.\n• Xizmatdan noqonuniy faoliyat uchun foydalanish.',
      },
      {
        heading: '11. Javobgarlik',
        body: 'TutGo faqat mijoz va biznes oʻrtasida vositachi sifatida ishlaydi. Koʻrsatilayotgan xizmatlar sifati hamkor (biznes) javobgarligida.',
      },
      {
        heading: '12. Fors-major',
        body: 'Texnik nosozliklar, server uzilishlari yoki boshqa engib boʻlmas holatlarda TutGo xizmatning vaqtinchalik ishlamasligi uchun javobgar emas.',
      },
      {
        heading: '13. Aloqa',
        body: 'Email: info@tutgo.uz\nTelegram: @TutGoUzBot\nSayt: tutgo.uz\nManzil: Oʻzbekiston, Toshkent',
      },
    ],
  },
};

const Terms = () => {
  const [lang, setLang] = useState<DocLang>('ru');
  const navigate = useNavigate();
  const doc = content[lang];

  return (
    <div className="min-h-screen bg-background pb-12">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <FileText className="w-5 h-5 text-primary" />
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
          <Link to="/privacy" className="text-xs text-primary hover:underline">
            {lang === 'ru' ? 'Политика конфиденциальности' : 'Maxfiylik siyosati'}
          </Link>
          <p className="text-[10px] text-muted-foreground">© 2026 TutGo. {lang === 'ru' ? 'Все права защищены.' : 'Barcha huquqlar himoyalangan.'}</p>
        </div>
      </div>
    </div>
  );
};

export default Terms;
