import {
  Baby,
  Dumbbell,
  Heart,
  Landmark,
  Moon,
  PartyPopper,
  Salad,
  ShoppingBag,
  Sparkles,
  Trees,
  Utensils,
  WalletCards,
  type LucideIcon,
} from 'lucide-react';

const PRESET_ICONS: Record<string, LucideIcon> = {
  relax: Sparkles,
  eat: Utensils,
  date: Heart,
  kids: Baby,
  active: Dumbbell,
  fun: PartyPopper,
  evening: Moon,
  cheap: WalletCards,
  'g-eat': Salad,
  'g-sights': Landmark,
  'g-sport': Dumbbell,
  'g-fun': PartyPopper,
  'g-parks': Trees,
  'g-shop': ShoppingBag,
  'g-kids': Baby,
  'g-evening': Moon,
};

interface DesktopPresetIconProps {
  presetId: string;
  compact?: boolean;
}

const DesktopPresetIcon = ({ presetId, compact = false }: DesktopPresetIconProps) => {
  const PresetIcon = PRESET_ICONS[presetId] ?? Sparkles;

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ${
        compact ? 'h-8 w-8' : 'h-10 w-10'
      }`}
      aria-hidden="true"
    >
      <PresetIcon size={compact ? 16 : 19} strokeWidth={1.8} />
    </span>
  );
};

export default DesktopPresetIcon;