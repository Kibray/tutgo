import { useState, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Camera, Plus, Trash2, ImageIcon, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_GALLERY = 10;

interface BusinessPhotoUploadProps {
  locationId: string;
  brandedIconUrl: string | null;
  gallery: string[] | null;
  onUpdate: (fields: { branded_icon_url?: string | null; gallery?: string[] }) => void;
}

const getPublicUrl = (path: string) =>
  supabase.storage.from('businesses').getPublicUrl(path).data.publicUrl;

const BusinessPhotoUpload = ({ locationId, brandedIconUrl, gallery, onUpdate }: BusinessPhotoUploadProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [galleryItems, setGalleryItems] = useState<string[]>(gallery || []);

  const validateFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Формат: JPG, PNG или WebP');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Максимум 5 МБ');
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${locationId}/${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('businesses').upload(path, file);
    if (error) { toast.error(error.message); return null; }
    return getPublicUrl(path);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;
    setUploading('cover');
    const url = await uploadFile(file, 'cover');
    if (url) {
      // Store cover as first gallery item
      const newGallery = [url, ...galleryItems.filter(g => g !== galleryItems[0] || galleryItems.length <= 1 ? true : true)];
      // Actually, use gallery[0] as cover convention - just prepend
      const updated = [url, ...galleryItems];
      if (updated.length > MAX_GALLERY) updated.pop();
      setGalleryItems(updated);
      await supabase.from('locations').update({ gallery: updated }).eq('id', locationId);
      onUpdate({ gallery: updated });
      toast.success('Обложка загружена');
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateFile(file)) return;
    setUploading('logo');
    const url = await uploadFile(file, 'logo');
    if (url) {
      await supabase.from('locations').update({ branded_icon_url: url }).eq('id', locationId);
      onUpdate({ branded_icon_url: url });
      toast.success('Логотип загружен');
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (galleryItems.length + files.length > MAX_GALLERY) {
      toast.error(`Максимум ${MAX_GALLERY} фото`);
      return;
    }
    setUploading('gallery');
    const newUrls: string[] = [];
    for (const file of files) {
      if (!validateFile(file)) continue;
      const url = await uploadFile(file, 'gallery');
      if (url) newUrls.push(url);
    }
    if (newUrls.length) {
      const updated = [...galleryItems, ...newUrls];
      setGalleryItems(updated);
      await supabase.from('locations').update({ gallery: updated }).eq('id', locationId);
      onUpdate({ gallery: updated });
      toast.success(`Добавлено ${newUrls.length} фото`);
    }
    setUploading(null);
    e.target.value = '';
  };

  const handleDeleteGalleryItem = async (url: string) => {
    const updated = galleryItems.filter(g => g !== url);
    setGalleryItems(updated);
    await supabase.from('locations').update({ gallery: updated }).eq('id', locationId);
    onUpdate({ gallery: updated });
    toast.success('Фото удалено');
  };

  const handleReorder = async (newOrder: string[]) => {
    setGalleryItems(newOrder);
    await supabase.from('locations').update({ gallery: newOrder }).eq('id', locationId);
    onUpdate({ gallery: newOrder });
  };

  const coverUrl = galleryItems.length > 0 ? galleryItems[0] : null;

  return (
    <div className="space-y-4">
      {/* Logo / Avatar */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Логотип</p>
        <div className="flex items-center gap-3">
          <button onClick={() => logoRef.current?.click()}
            className="w-16 h-16 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:border-primary transition-colors">
            {brandedIconUrl ? (
              <img src={brandedIconUrl} className="w-full h-full object-cover" alt="logo" />
            ) : (
              <Camera className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
          <div className="text-xs text-muted-foreground">
            <p>Круглый логотип компании</p>
            <p className="text-[10px]">JPG, PNG, WebP · до 5 МБ</p>
          </div>
          <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
        </div>
        {uploading === 'logo' && <p className="text-[10px] text-primary mt-1 animate-pulse">Загрузка...</p>}
      </div>

      {/* Cover Photo */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Обложка</p>
        <button onClick={() => coverRef.current?.click()}
          className="w-full h-32 rounded-xl bg-secondary border-2 border-dashed border-border flex flex-col items-center justify-center overflow-hidden hover:border-primary transition-colors">
          {coverUrl ? (
            <img src={coverUrl} className="w-full h-full object-cover" alt="cover" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Загрузить обложку</span>
            </>
          )}
        </button>
        <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleCoverUpload} />
        {uploading === 'cover' && <p className="text-[10px] text-primary mt-1 animate-pulse">Загрузка...</p>}
      </div>

      {/* Gallery */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">Галерея ({galleryItems.length}/{MAX_GALLERY})</p>
          {galleryItems.length < MAX_GALLERY && (
            <button onClick={() => galleryRef.current?.click()}
              className="flex items-center gap-1 text-xs text-primary font-medium">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          )}
        </div>
        <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleGalleryUpload} />
        {uploading === 'gallery' && <p className="text-[10px] text-primary mb-2 animate-pulse">Загрузка...</p>}

        {galleryItems.length > 0 ? (
          <Reorder.Group axis="x" values={galleryItems} onReorder={handleReorder}
            className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {galleryItems.map((url) => (
              <Reorder.Item key={url} value={url} className="relative flex-shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-secondary">
                  <img src={url} className="w-full h-full object-cover" alt="" />
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteGalleryItem(url); }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center">
                  <Trash2 className="w-3 h-3 text-destructive-foreground" />
                </button>
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                  <GripVertical className="w-3 h-3 text-white/70" />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <div className="flex items-center justify-center h-20 rounded-xl bg-secondary/50 border border-dashed border-border">
            <p className="text-[10px] text-muted-foreground">Перетаскивайте для сортировки</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessPhotoUpload;
