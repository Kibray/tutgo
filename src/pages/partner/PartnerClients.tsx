import { Users } from 'lucide-react';
import { usePreferences } from '@/hooks/usePreferences';
import PartnerLayout from '@/components/partner/PartnerLayout';

const PartnerClients = () => {
  const { t } = usePreferences();

  return (
    <PartnerLayout title={t('partner.clients')}>
      <div className="px-4">
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t('partner.no_clients')}</p>
          <p className="text-xs mt-1">{t('partner.clients_hint')}</p>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerClients;
