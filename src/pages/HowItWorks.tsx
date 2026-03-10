import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';

const HowItWorks = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<'client' | 'business'>('client');
  const [key, setKey] = useState(0);

  return (
    <div className="min-h-screen" style={{ background: '#080c14' }}>
      {/* Top bar with back + toggle */}
      <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 pt-4 pb-2" style={{ background: '#080c14' }}>
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#0d1520' }}>
          <ArrowLeft className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex rounded-xl overflow-hidden" style={{ background: '#0d1520', border: '1px solid #1a2940' }}>
          {(['client', 'business'] as const).map((r) => (
            <button key={r} onClick={() => { setRole(r); setKey(k => k + 1); }}
              className="px-4 py-2 text-xs font-medium transition-all"
              style={{
                background: role === r ? 'linear-gradient(135deg, #00ff87, #00c6ff)' : 'transparent',
                color: role === r ? '#000' : '#9ca3af',
              }}>
              {r === 'client' ? '👤 Для клиентов' : '🏢 Для бизнеса'}
            </button>
          ))}
        </div>
        <div className="w-9" />
      </div>

      <OnboardingFlow key={key} forceRole={role} isPreview onComplete={() => navigate(-1)} />
    </div>
  );
};

export default HowItWorks;
