import { useState, useRef } from 'react';
import { Camera, X, Plus, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaffPhotoManagerProps {
  staffId: string;
  photoUrl: string | null;
  portfolio: string[];
  onUpdate: (fields: { photo_url?: string | null; portfolio?: string[] }) => void;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const BUCKET = 'staff-photos';

const getPublicUrl = (path: string) =>
  `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;

const StaffPhotoManager = ({ staffId, photoUrl, portfolio, onUpdate }: StaffPhotoManagerProps) => {
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${staffId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      toast({ title: 'Ошибка загрузки', description: error.message, variant: 'destructive' });
      return null;
    }
    return getPublicUrl(path);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);

    // Delete old avatar file if exists
    if (photoUrl?.includes(`/${BUCKET}/`)) {
      const oldPath = photoUrl.split(`/${BUCKET}/`)[1];
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    }

    const url = await uploadFile(file, 'avatar');
    if (url) {
      const { error } = await supabase.from('staff').update({ photo_url: url }).eq('id', staffId);
      if (!error) onUpdate({ photo_url: url });
    }
    setUploadingAvatar(false);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const removeAvatar = async () => {
    if (photoUrl?.includes(`/${BUCKET}/`)) {
      const oldPath = photoUrl.split(`/${BUCKET}/`)[1];
      if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
    }
    const { error } = await supabase.from('staff').update({ photo_url: null }).eq('id', staffId);
    if (!error) onUpdate({ photo_url: null });
  };

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingPortfolio(true);

    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      const url = await uploadFile(file, 'portfolio');
      if (url) newUrls.push(url);
    }

    if (newUrls.length > 0) {
      const updated = [...portfolio, ...newUrls];
      const { error } = await supabase.from('staff').update({ portfolio: updated }).eq('id', staffId);
      if (!error) onUpdate({ portfolio: updated });
    }
    setUploadingPortfolio(false);
    if (portfolioInputRef.current) portfolioInputRef.current.value = '';
  };

  const removePortfolioItem = async (url: string) => {
    if (url.includes(`/${BUCKET}/`)) {
      const path = url.split(`/${BUCKET}/`)[1];
      if (path) await supabase.storage.from(BUCKET).remove([path]);
    }
    const updated = portfolio.filter(u => u !== url);
    const { error } = await supabase.from('staff').update({ portfolio: updated }).eq('id', staffId);
    if (!error) onUpdate({ portfolio: updated });
  };

  return (
    <div className="border-t border-border bg-muted/30 p-3 space-y-3">
      {/* Avatar section */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Фото профиля</p>
        <div className="flex items-center gap-3">
          <div className="relative">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center border-2 border-dashed border-border">
                <Camera className="w-5 h-5 text-muted-foreground" />
              </div>
            )}
            {photoUrl && (
              <button
                onClick={removeAvatar}
                className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="text-xs text-primary font-medium flex items-center gap-1 disabled:opacity-50"
          >
            {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            {photoUrl ? 'Изменить' : 'Загрузить'}
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
      </div>

      {/* Portfolio section */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Портфолио работ</p>
        <div className="flex flex-wrap gap-2">
          {portfolio.map((url, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
              <img src={url} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removePortfolioItem(url)}
                className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive/90 text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {portfolio.length < 10 && (
            <button
              onClick={() => portfolioInputRef.current?.click()}
              disabled={uploadingPortfolio}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {uploadingPortfolio ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="text-[9px] mt-0.5">Фото</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">До 10 фото — видны клиентам при выборе мастера</p>
        <input
          ref={portfolioInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handlePortfolioUpload}
        />
      </div>
    </div>
  );
};

export default StaffPhotoManager;