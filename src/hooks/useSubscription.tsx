import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  plan: 'free' | 'pro' | 'enterprise';
  isEarlyAdopter: boolean;
  trialEndsAt: Date | null;
  daysLeft: number | null;
  isPro: boolean;
  loading: boolean;
}

export const useSubscription = (): SubscriptionData => {
  const { user } = useAuth();
  const [data, setData] = useState<SubscriptionData>({
    plan: 'free',
    isEarlyAdopter: false,
    trialEndsAt: null,
    daysLeft: null,
    isPro: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) { setData(d => ({ ...d, loading: false })); return; }

    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data: sub }) => {
        if (!sub) {
          setData(d => ({ ...d, loading: false }));
          return;
        }

        const plan = (sub.plan as 'free' | 'pro' | 'enterprise') || 'free';
        const trialEndsAt = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null;
        const now = new Date();
        const daysLeft = trialEndsAt
          ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / 86400000))
          : null;
        const isPro = plan === 'pro' && (!trialEndsAt || trialEndsAt > now);

        setData({
          plan,
          isEarlyAdopter: !!sub.is_early_adopter,
          trialEndsAt,
          daysLeft,
          isPro,
          loading: false,
        });
      });
  }, [user]);

  return data;
};
