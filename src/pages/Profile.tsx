import { motion } from 'framer-motion';
import { User, Settings, Globe, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const Profile = () => {
  const menuItems = [
    { icon: User, label: 'My Profile', desc: 'Personal information' },
    { icon: Globe, label: 'Language', desc: 'English, Русский, O\'zbek' },
    { icon: Settings, label: 'Settings', desc: 'Notifications, privacy' },
    { icon: HelpCircle, label: 'Help & Support', desc: 'FAQ, contact us' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">Guest User</h1>
            <p className="text-xs text-muted-foreground">Tap to sign in via Telegram</p>
          </div>
        </motion.div>

        {/* Sign in CTA */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
          className="w-full glass rounded-lg p-4 flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 rounded-lg bg-[#2AABEE]/20 flex items-center justify-center text-xl">
            ✈️
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Connect Telegram</p>
            <p className="text-xs text-muted-foreground">Phone verification for booking</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* Menu */}
        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <item.icon className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>

        {/* Partner Access */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass rounded-lg p-4 flex items-center gap-3 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">
            B
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Business Portal</p>
            <p className="text-xs text-muted-foreground">Manage your listings & bookings</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/50 mt-8">
          TUTGO v1.0 · Made in Uzbekistan 🇺🇿
        </p>
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
