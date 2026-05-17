import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

interface LegalSection {
  heading: string;
  body: string;
}

interface LegalPageLayoutProps {
  title: string;
  subtitle: string;
  sections: LegalSection[];
  effectiveDate?: string;
}

const legalLinks = [
  { to: '/terms', label: 'Условия использования' },
  { to: '/terms-partner', label: 'Соглашение с партнёрами' },
  { to: '/privacy', label: 'Политика конфиденциальности' },
  { to: '/review-rules', label: 'Правила публикации отзывов' },
];

const LegalPageLayout = ({
  title,
  subtitle,
  sections,
  effectiveDate = '13 марта 2026 года',
}: LegalPageLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#060810] pb-16">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#060810]/80 backdrop-blur-xl border-b border-border px-6 py-4 flex items-center gap-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm hidden sm:inline">Назад</span>
        </motion.button>
        <div
          onClick={() => navigate('/')}
          className="flex-1 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span className="font-display text-lg font-bold text-[#00ff87]">TUTGO</span>
          <span className="text-muted-foreground text-xs">.UZ</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="px-6 max-w-[780px] mx-auto">
        {/* Title block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-10 pb-8 border-b border-border/50"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-white/60">{subtitle}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>TutGo (tutgo.uz)</span>
            <span>·</span>
            <span>г. Ташкент, Республика Узбекистан</span>
          </div>
        </motion.div>

        {/* Sections */}
        <div className="py-8 space-y-8">
          {sections.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <h2 className="text-base font-bold text-[#00ff87] mb-3">{s.heading}</h2>
              <div className="text-sm text-white/60 leading-relaxed whitespace-pre-line">{s.body}</div>
            </motion.div>
          ))}
        </div>

        {/* Effective date */}
        <div className="border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Действует с {effectiveDate}
          </p>
        </div>

        {/* Footer links */}
        <div className="mt-8 border-t border-border/50 pt-6 pb-8">
          <p className="text-xs text-muted-foreground mb-4 text-center">Документы</p>
          <div className="flex flex-wrap justify-center gap-3">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-white/40 hover:text-[#00ff87] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-4 text-center">
            © 2026 TutGo. Все права защищены.
          </p>
          <p className="text-[10px] text-muted-foreground text-center">
            Email: info@tutgo.uz · Telegram: @TutGoUzBot
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPageLayout;
