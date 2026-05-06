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
        <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 24px 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: "url(https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600)", backgroundSize: 'cover', backgroundPosition: 'center' }} />
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'rgba(255,255,255,0.82)' }} />
          <div style={{ position: 'relative', zIndex: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111', textAlign: 'center', marginBottom: 6 }}>Кто вы?</h1>
            <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24, maxWidth: 360 }}>
              Выберите тип аккаунта, чтобы получить доступ к возможностям TutGo
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, width: '100%', maxWidth: 920 }}>
              {[
                {
                  icon: <User size={32} color="#fff" />,
                  iconBg: 'linear-gradient(135deg, #667eea, #764ba2)',
                  glow: 'rgba(118, 75, 162, 0.25)',
                  title: 'Пользователь',
                  subtitle: 'Ищите и бронируйте лучшие услуги рядом с вами',
                  features: ['Поиск услуг и заведений', 'Онлайн-запись в пару кликов', 'Отзывы и рейтинги', 'Удобное управление записями'],
                  btn: 'Я пользователь',
                  route: '/auth',
                },
                {
                  icon: <Briefcase size={32} color="#fff" />,
                  iconBg: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                  glow: 'rgba(79, 172, 254, 0.25)',
                  title: 'Бизнес',
                  subtitle: 'Управляйте своей компанией и привлекайте клиентов',
                  features: ['Управление записями и клиентами', 'Аналитика и статистика', 'Продвижение и акции', 'Увеличение потока клиентов'],
                  btn: 'Я владелец бизнеса',
                  route: '/auth/partner',
                },
              ].map((card) => (
                <div
                  key={card.title}
                  onClick={() => navigate(card.route)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 20px 50px -12px ${card.glow}, 0 8px 24px rgba(0,0,0,0.08)`; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.18)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(17,24,39,0.06), 0 2px 6px rgba(17,24,39,0.04)'; e.currentTarget.style.borderColor = 'rgba(229,231,235,0.9)'; }}
                  style={{ position: 'relative', background: '#fff', borderRadius: 24, padding: '56px 32px', border: '1px solid rgba(229,231,235,0.9)', boxShadow: '0 8px 28px rgba(17,24,39,0.06), 0 2px 6px rgba(17,24,39,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease', overflow: 'hidden' }}
                >
                  <div aria-hidden style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: card.iconBg, opacity: 0.08, filter: 'blur(8px)' }} />
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, boxShadow: `0 10px 24px -6px ${card.glow}` }}>
                    {card.icon}
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>{card.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, lineHeight: 1.5 }}>{card.subtitle}</p>
                  <div style={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 36 }}>
                    {card.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={16} color="#2563EB" strokeWidth={2.4} />
                        <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); navigate(card.route); }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.08)'; e.currentTarget.style.boxShadow = '0 10px 24px -6px rgba(37,99,235,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; e.currentTarget.style.boxShadow = '0 6px 16px -4px rgba(37,99,235,0.35)'; }}
                    style={{ marginTop: 'auto', width: '100%', height: 50, background: 'linear-gradient(135deg, #2563EB, #1d4ed8)', color: '#fff', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: 'pointer', transition: 'filter 0.15s ease, box-shadow 0.2s ease', boxShadow: '0 6px 16px -4px rgba(37,99,235,0.35)', letterSpacing: '0.01em' }}
                  >
                    {card.btn}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 24, marginTop: 16, alignItems: 'center', justifyContent: 'center' }}>
              {systemItems.map((item, idx) => (
                <span key={item.route} style={{ display: 'inline-flex', alignItems: 'center', gap: 24 }}>
                  <span
                    onClick={() => navigate(item.route)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#2563EB';
                      const svg = e.currentTarget.querySelector('svg'); if (svg) (svg as SVGElement).style.color = '#2563EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#6b7280';
                      const svg = e.currentTarget.querySelector('svg'); if (svg) (svg as SVGElement).style.color = '#9ca3af';
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}
                  >
                    <item.icon size={14} color="#9ca3af" />
                    {item.label}
                  </span>
                  {idx < systemItems.length - 1 && <span style={{ color: '#d1d5db', fontSize: 12 }}>•</span>}
                </span>
              ))}
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
              <div style={{ display: 'flex' }}>
                {avatars.map((a, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid #fff', marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', background: a.bg }}>
                    {a.letter}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#374151' }}>
                Более <span style={{ color: '#2563EB', fontWeight: 700 }}>10 000</span> пользователей доверяют TutGo
              </div>
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