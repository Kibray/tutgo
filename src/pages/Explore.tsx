import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Search } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { services } from '@/lib/mock-data';

const Explore = () => {
  const navigate = useNavigate();

  const cities = [
    { name: 'Tashkent', emoji: '🏙️', count: 4 },
    { name: 'Samarkand', emoji: '🕌', count: 1 },
    { name: 'Bukhara', emoji: '🏛️', count: 0 },
    { name: 'Khiva', emoji: '🏰', count: 0 },
    { name: 'Fergana', emoji: '🌄', count: 0 },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <h1 className="text-lg font-bold font-display text-foreground mb-1">Explore</h1>
        <p className="text-xs text-muted-foreground mb-4">Discover services across Uzbekistan</p>

        {/* Map placeholder */}
        <div className="glass rounded-lg h-48 flex items-center justify-center mb-6 relative overflow-hidden">
          <div className="text-center">
            <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Interactive map coming soon</p>
            <p className="text-[10px] text-muted-foreground mt-1">with react-leaflet-cluster</p>
          </div>
          {/* Dots representing services */}
          {[
            { top: '30%', left: '55%' },
            { top: '45%', left: '40%' },
            { top: '35%', left: '70%' },
          ].map((pos, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary animate-pulse-green"
              style={pos}
            />
          ))}
        </div>

        {/* Cities */}
        <h2 className="text-sm font-semibold text-foreground mb-3">Cities</h2>
        <div className="space-y-2">
          {cities.map((city, i) => (
            <motion.div
              key={city.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-lg p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
            >
              <span className="text-2xl">{city.emoji}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{city.name}</p>
                <p className="text-xs text-muted-foreground">{city.count} services</p>
              </div>
              <Search className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Explore;
