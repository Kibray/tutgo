import { motion } from 'framer-motion';

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <motion.div
      className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    />
  </div>
);

export default PageLoader;
