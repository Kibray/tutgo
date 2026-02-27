import { motion } from 'framer-motion';
import { ArrowLeft, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import BottomNav from '@/components/BottomNav';

const PartnerStaff = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('partner.staff')}</h1>
        </div>

        <div className="text-center py-16 text-muted-foreground">
          <UserCog className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('partner.no_staff')}</p>
          <p className="text-xs mt-1">{t('partner.staff_hint')}</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerStaff;
