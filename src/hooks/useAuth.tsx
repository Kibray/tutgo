import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPartner: boolean;
  isRecovery: boolean;
  setIsRecovery: (v: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  partnerTermsAccepted: boolean;
  setPartnerTermsAccepted: (v: boolean) => void;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  becomePartner: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPartner, setIsPartner] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [partnerTermsAccepted, setPartnerTermsAccepted] = useState(false);

  const checkPartnerRole = async (userId: string) => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'partner' });
    setIsPartner(!!data);
  };

  const checkTermsAccepted = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('terms_accepted, partner_terms_accepted').eq('user_id', userId).single();
    setTermsAccepted(data?.terms_accepted ?? false);
    setPartnerTermsAccepted((data as any)?.partner_terms_accepted ?? false);
  };

  useEffect(() => {
    let mounted = true;

    const initUser = async (userId: string) => {
      await Promise.all([checkPartnerRole(userId), checkTermsAccepted(userId)]);
      if (mounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setIsRecovery(true);
      }
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        initUser(session.user.id);
      } else {
        setIsPartner(false);
        setTermsAccepted(true);
        setPartnerTermsAccepted(true);
        if (mounted) setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        initUser(session.user.id);
      } else {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: `${window.location.origin}/profile`,
        data: { display_name: displayName || 'Пользователь' } 
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const becomePartner = async () => {
    const { error } = await supabase.rpc('become_partner');
    if (!error && user) {
      setIsPartner(true);
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isPartner, isRecovery, setIsRecovery, termsAccepted, setTermsAccepted, partnerTermsAccepted, setPartnerTermsAccepted, signUp, signIn, signOut, becomePartner }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
