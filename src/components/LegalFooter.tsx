import { Link } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';

const LegalFooter = () => {
  const { t } = usePreferences();
  return (
    <footer className="px-4 py-6 text-center border-t border-border mt-4">
      <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-muted-foreground">
        <Link to="/terms" className="hover:text-primary transition-colors">{t('legal.terms')}</Link>
        <span>·</span>
        <Link to="/terms-partner" className="hover:text-primary transition-colors">Для партнёров</Link>
        <span>·</span>
        <Link to="/privacy" className="hover:text-primary transition-colors">{t('legal.privacy')}</Link>
        <span>·</span>
        <Link to="/review-rules" className="hover:text-primary transition-colors">Отзывы</Link>
        <span>·</span>
        <Link to="/how-it-works" className="hover:text-primary transition-colors">❓ {t('legal.how_it_works')}</Link>
        <span>·</span>
        <a href="mailto:info@tutgo.uz" className="hover:text-primary transition-colors">info@tutgo.uz</a>
      </div>
      <p className="text-[10px] text-muted-foreground mt-2">© 2026 TutGo · Ташкент, Узбекистан</p>
    </footer>
  );
};

export default LegalFooter;
