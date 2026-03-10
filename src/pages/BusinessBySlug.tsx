import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const BusinessBySlug = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) { setError(true); return; }

    const resolve = async () => {
      // Track click
      supabase.from('referral_clicks' as any).insert({
        referral_type: 'business',
        referral_code: slug,
        location_slug: slug,
      }).then(() => {});

      // Find location by slug
      const { data } = await supabase
        .from('locations')
        .select('id')
        .eq('slug' as any, slug)
        .single();

      if (data?.id) {
        navigate(`/service/${data.id}`, { replace: true });
      } else {
        setError(true);
      }
    };

    resolve();
  }, [slug, navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <h1 className="text-lg font-bold text-foreground mb-2">Компания не найдена</h1>
          <p className="text-sm text-muted-foreground mb-4">Ссылка недействительна или компания удалена</p>
          <button onClick={() => navigate('/')} className="text-sm text-primary font-medium">
            На главную →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-primary" />
    </div>
  );
};

export default BusinessBySlug;
