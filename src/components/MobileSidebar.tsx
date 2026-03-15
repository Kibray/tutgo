import { Home, Map, Globe, Bus, Plane, Hotel, Tag, Heart, Users, Star, MessageSquare, Plus, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sheet, SheetContent, SheetClose } from '@/components/ui/sheet';
import { usePreferences } from '@/hooks/usePreferences';

const navGroups = [
  {
    label: 'Навигация',
    items: [
      { id: '/', icon: Home, label: 'Главная' },
      { id: '/map', icon: Map, label: 'Карта' },
    ],
  },
  {
    label: 'Сервисы',
    items: [
      { id: '/tours', icon: Globe, label: 'Туры' },
      { id: '/transport', icon: Bus, label: 'Транспорт' },
      { id: '/flights', icon: Plane, label: 'Билеты' },
      { id: '/stay', icon: Hotel, label: 'Жильё' },
    ],
  },
  {
    label: 'Личное',
    items: [
      { id: '/deals', icon: Tag, label: 'Акции' },
      { id: '/favorites', icon: Heart, label: 'Избранное' },
      { id: '/queue', icon: Users, label: 'Живая очередь' },
      { id: '/reviews', icon: Star, label: 'Отзывы' },
      { id: '/friends', icon: MessageSquare, label: 'Друзья' },
    ],
  },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MobileSidebar = ({ open, onOpenChange }: MobileSidebarProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { t } = usePreferences();

  const handleNav = (id: string) => {
    const tg = (window as any).Telegram?.WebApp;
    tg?.HapticFeedback?.selectionChanged();
    if (id === '/map') navigate('/');
    else navigate(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] bg-background border-border p-0 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 onClick={() => { navigate('/'); onOpenChange(false); }} className="text-lg font-bold font-display text-foreground cursor-pointer">
            TUT<span className="text-gradient-green">GO</span>
          </h2>
          <SheetClose className="w-8 h-8 rounded-lg bg-secondary/60 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </SheetClose>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 mb-1.5">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.id || (item.id === '/map' && pathname === '/');
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNav(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div className="p-3 border-t border-border">
          <button
            onClick={() => { navigate('/partner-landing'); onOpenChange(false); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить бизнес
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileSidebar;
