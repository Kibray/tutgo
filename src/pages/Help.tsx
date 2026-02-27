import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import BottomNav from '@/components/BottomNav';

const Help = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();

  const faqs = [
    { q: t('help.q1'), a: t('help.a1') },
    { q: t('help.q2'), a: t('help.a2') },
    { q: t('help.q3'), a: t('help.a3') },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </motion.button>
          <h1 className="text-lg font-bold font-display text-foreground">{t('help.title')}</h1>
        </div>

        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="glass rounded-lg border-none px-4">
              <AccordionTrigger className="text-sm font-medium text-foreground py-4 hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => window.open('https://t.me/tutgo_support', '_blank')}
          className="w-full mt-6 py-3 rounded-lg bg-[hsl(200,80%,55%)] text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {t('help.contact_support')}
        </motion.button>
      </div>
      <BottomNav />
    </div>
  );
};

export default Help;
