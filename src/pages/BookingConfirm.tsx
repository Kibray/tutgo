import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Calendar, Clock, MapPin, User } from 'lucide-react';
import { formatPrice, staff } from '@/lib/mock-data';

const BookingConfirm = () => {
  const navigate = useNavigate();
  const { state } = useLocation() as any;

  if (!state?.service) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p>No booking data</p>
          <button onClick={() => navigate('/')} className="text-primary mt-2 text-sm">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const { service, date, time, seats } = state;
  const staffMember = staff.find((s) => s.id === state.staff);
  const d = new Date(date);
  const isTour = service.category === 'tour';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6"
      >
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center glow-green">
          <Check className="w-6 h-6 text-accent-foreground" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold font-display text-foreground text-center"
      >
        Booking Confirmed!
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass rounded-lg p-5 mt-6 w-full max-w-sm space-y-3"
      >
        <h3 className="font-semibold text-foreground text-sm">{service.name}</h3>
        <p className="text-xs text-muted-foreground">{service.businessName}</p>

        <div className="border-t border-border pt-3 space-y-2.5">
          <Row icon={Calendar} label="Date" value={d.toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })} />
          <Row icon={Clock} label="Time" value={time} />
          <Row icon={MapPin} label="Location" value={`${service.address}, ${service.city}`} />
          {staffMember && <Row icon={User} label="Specialist" value={staffMember.name} />}
          {isTour && <Row icon={User} label="Seats" value={`${seats}`} />}
        </div>

        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="text-lg font-bold text-gradient-green">
            {formatPrice(service.price * (seats || 1))} {service.currency}
          </span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate('/')}
        className="mt-8 w-full max-w-sm py-3.5 bg-primary text-accent-foreground rounded-lg font-semibold text-sm glow-green"
      >
        Back to Home
      </motion.button>
    </div>
  );
};

const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
  <div className="flex items-center gap-3">
    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
    <span className="text-xs text-muted-foreground w-20">{label}</span>
    <span className="text-xs text-foreground font-medium">{value}</span>
  </div>
);

export default BookingConfirm;
