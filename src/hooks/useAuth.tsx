import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isPartner: boolean;
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
  const [termsAccepted, setTermsAccepted] = useState(true); // default true to avoid flash

  const checkPartnerRole = async (userId: string) => {
    const { data } = await supabase.rpc('has_role', { _user_id: userId, _role: 'partner' });
    setIsPartner(!!data);
  };

  const checkTermsAccepted = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('terms_accepted').eq('user_id', userId).single();
    setTermsAccepted(data?.terms_accepted ?? false);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkPartnerRole(session.user.id), 0);
        setTimeout(() => checkTermsAccepted(session.user.id), 0);
      } else {
        setIsPartner(false);
        setTermsAccepted(true);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkPartnerRole(session.user.id);
        checkTermsAccepted(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
    <AuthContext.Provider value={{ user, session, loading, isPartner, termsAccepted, setTermsAccepted, signUp, signIn, signOut, becomePartner }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
