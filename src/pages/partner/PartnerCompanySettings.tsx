import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { usePreferences } from '@/hooks/usePreferences';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';

const tabs = [
  { id: 'main', labelKey: 'partner.tab_main' },
  { id: 'hours', labelKey: 'partner.tab_hours' },
  { id: 'photos', labelKey: 'partner.tab_photos' },
];

const PartnerCompanySettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = usePreferences();
  const [activeTab, setActiveTab] = useState('main');
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('locations').select('*').eq('owner_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setBusinesses(data || []));
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/partner')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('partner.company_settings')}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              {t(tab.labelKey)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'main' && (
          <div className="space-y-3">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('partner.no_services')}</p>
                <p className="text-xs mt-1">{t('partner.add_in_services')}</p>
              </div>
            ) : (
              businesses.map(biz => (
                <div key={biz.id} className="glass rounded-2xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">{biz.name}</h3>
                  <p className="text-xs text-muted-foreground">{biz.description || t('partner.no_desc')}</p>
                  {biz.address && <p className="text-xs text-muted-foreground">📍 {biz.address}</p>}
                  {biz.phone && <p className="text-xs text-muted-foreground">📞 {biz.phone}</p>}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t('partner.hours_coming')}</p>
            <p className="text-xs mt-1">{t('partner.hours_hint')}</p>
          </div>
        )}

        {activeTab === 'photos' && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">{t('partner.photos_coming')}</p>
            <p className="text-xs mt-1">{t('partner.photos_hint')}</p>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default PartnerCompanySettings;
