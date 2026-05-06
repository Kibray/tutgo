import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { useToast } from '@/hooks/use-toast';
import {
  User, Briefcase, BookOpen, Settings, HelpCircle,
  ChevronRight, LogOut, Store, Lightbulb, CheckCircle2
} from 'lucide-react';
import TelegramLinkBlock from '@/components/TelegramLinkBlock';
import ReferralSection from '@/components/ReferralSection';
import InstagramConnectCard from '@/components/partner/InstagramConnectCard';
import LegalFooter from '@/components/LegalFooter';

const DesktopProfile = () => {
  const { user, isPartner, signOut } = useAuth();
  const { t } = usePreferences();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t('profile.signed_out') });
  };

  const systemItems = [
    { icon: Settings, label: t('profile.settings'), desc: t('profile.settings_desc'), route: '/settings' },
    { icon: HelpCircle, label: t('profile.help'), desc: t('profile.help_desc'), route: '/help' },
    { icon: Lightbulb, label: t('profile.how_it_works'), desc: t('profile.how_it_works_desc'), route: '/how-it-works' },
  ];

  const avatars = [
    { bg: '#f59e0b', letter: 'А' },
    { bg: '#3b82f6', letter: 'Б' },
    { bg: '#10b981', letter: 'В' },
    { bg: '#f87171', letter: 'Г' },
  ];

  const footerLinks = [
    { label: 'Пользовательское соглашение', to: '/terms' },
    { label: 'Для партнёров', to: '/terms-partner' },
    { label: 'Политика конфиденциальности', to: '/privacy' },
    { label: 'Отзывы', to: '/review-rules' },
    { label: 'Как это работает', to: '/how-it-works' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* HEADER */}
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div onClick={() => navigate('/')} style={{ fontWeight: 800, fontSize: 22, cursor: 'pointer', letterSpacing: '-0.5px', userSelect: 'none' }}>
          <span style={{ color: '#111' }}>TUT</span>
          <span style={{ color: '#2563EB' }}>GO</span>
        </div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#374151' }}>
              {user.user_metadata?.display_name || user.email?.split('@')[0]}
            </span>
            <button onClick={handleSignOut} style={{ fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}>
              Выйти
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, color: '#6b7280' }}>Уже есть аккаунт?</span>
            <button onClick={() => navigate('/auth')} style={{ border: '1px solid #2563EB', color: '#2563EB', background: '#fff', borderRadius: 8, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Войти
            </button>
          </div>
        )}
      </header>

      {/* MAIN */}
      {!user ? (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 24px' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: "url(https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600)", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(255,255,255,0.88)' }} />
          <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 8 }}>Кто вы?</h1>
            <p style={{ fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24, maxWidth: 440, lineHeight: 1.6 }}>
              Выберите тип аккаунта, чтобы получить доступ к возможностям TutGo
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: '100%', maxWidth: 820 }}>
              {[
                {
                  icon: <User size={28} color="#2563EB" />,
                  title: 'Пользователь',
                  subtitle: 'Ищите и бронируйте лучшие услуги рядом с вами',
                  features: ['Поиск услуг и заведений', 'Онлайн-запись в пару кликов', 'Отзывы и рейтинги', 'Удобное управление записями'],
                  btn: 'Я пользователь',
                  route: '/auth',
                },
                {
                  icon: <Briefcase size={28} color="#2563EB" />,
                  title: 'Бизнес',
                  subtitle: 'Управляйте своей компанией и привлекайте клиентов',
                  features: ['Управление записями и клиентами', 'Аналитика и статистика', 'Продвижение и акции', 'Увеличение потока клиентов'],
                  btn: 'Я владелец бизнеса',
                  route: '/auth/partner',
                },
              ].map((card) => (
                <div key={card.title} onClick={() => navigate(card.route)} style={{ background: '#fff', borderRadius: 16, padding: '24px 24px', border: '1px solid #e5e7eb', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 6, textAlign: 'center' }}>{card.title}</h3>
                  <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16, lineHeight: 1.5 }}>{card.subtitle}</p>
                  <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                    {card.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={15} color="#2563EB" />
                        <span style={{ fontSize: 13, color: '#374151' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); navigate(card.route); }} style={{ width: '100%', background: '#2563EB', color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 'auto' }}>
                    {card.btn}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center' }}>
              <div style={{ display: 'flex' }}>
                {avatars.map((a, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: '#fff', background: a.bg }}>
                    {a.letter}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                Более <span style={{ color: '#2563EB', fontWeight: 700 }}>10 000</span> пользователей доверяют TutGo
              </div>
            </div>

            <div style={{
              width: '100%', maxWidth: 820, marginTop: 16,
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 12, overflow: 'hidden'
            }}>
              {systemItems.map((item, i) => (
                <div
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  style={{
                    padding: '10px 16px', display: 'flex',
                    alignItems: 'center', gap: 12, cursor: 'pointer',
                    borderBottom: i < systemItems.length - 1
                      ? '1px solid #e5e7eb' : 'none',
                    background: '#fff'
                  }}
                >
                  <item.icon size={16} color="#6b7280" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                      {item.desc}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#9ca3af" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 24, flex: 1, width: '100%' }}>
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#eff6ff', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={32} color="#2563EB" />
              </div>
              {isPartner && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#2563EB', background: '#eff6ff', padding: '3px 10px', borderRadius: 20, marginBottom: 8 }}>
                  <Store size={12} /> Партнёр
                </div>
              )}
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                {user.user_metadata?.display_name || user.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{user.email}</div>
              <button onClick={handleSignOut} style={{ marginTop: 16, width: '100%', background: '#fff', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: 8, padding: 10, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <LogOut size={14} /> Выйти
              </button>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
              {systemItems.map((item, i) => (
                <div key={item.label} onClick={() => navigate(item.route)} style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: i < systemItems.length - 1 ? '1px solid #e5e7eb' : 'none', fontSize: 13, color: '#111' }}>
                  <item.icon size={16} color="#6b7280" />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <ChevronRight size={14} color="#9ca3af" />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div onClick={() => navigate('/bookings')} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={22} color="#2563EB" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Личный кабинет</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Записи и история</div>
              </div>
              <div onClick={() => isPartner ? navigate('/partner') : navigate('/partner-landing')} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={22} color="#2563EB" />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Бизнес-портал</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Управление компанией</div>
              </div>
            </div>

            <div style={{ background: '#eff6ff', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 36 }}>🎁</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1e40af' }}>Дарим 10% на первое посещение</div>
                <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 4 }}>Зарегистрируйтесь и получите скидку</div>
              </div>
              <button onClick={() => navigate('/auth')} style={{ background: '#2563EB', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Получить
              </button>
            </div>

            <TelegramLinkBlock />
            <ReferralSection />
            {isPartner && <InstagramConnectCard />}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #e5e7eb', padding: '16px 40px', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', fontSize: 12, color: '#9ca3af' }}>
          {footerLinks.map((l, i) => (
            <span key={l.to} style={{ display: 'inline-flex', gap: 8 }}>
              <a onClick={() => navigate(l.to)} style={{ cursor: 'pointer', color: '#9ca3af' }}>{l.label}</a>
              {i < footerLinks.length - 1 && <span>·</span>}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>© 2026 TutGo. Все права защищены.</div>
      </footer>
    </div>
  );
};

export default DesktopProfile;