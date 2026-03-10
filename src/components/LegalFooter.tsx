import { Link } from 'react-router-dom';

const LegalFooter = () => (
  <footer className="px-4 py-6 text-center border-t border-border mt-4">
    <div className="flex items-center justify-center gap-2 flex-wrap text-[11px] text-muted-foreground">
      <Link to="/terms" className="hover:text-primary transition-colors">Пользовательское соглашение</Link>
      <span>·</span>
      <Link to="/privacy" className="hover:text-primary transition-colors">Конфиденциальность</Link>
      <span>·</span>
      <a href="mailto:info@tutgo.uz" className="hover:text-primary transition-colors">info@tutgo.uz</a>
    </div>
    <p className="text-[10px] text-muted-foreground mt-2">© 2026 TutGo · Ташкент, Узбекистан</p>
  </footer>
);

export default LegalFooter;
