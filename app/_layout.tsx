// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';

import type { Session, User } from '@supabase/supabase-js';

import { TranslationProvider, useTranslation } from '../lib/i18n';
import { supabase } from '../supabase';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoggedIn: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  isLoggedIn: false,
});

export const useAuth = () => useContext(AuthContext);

export default function RootLayout(): ReactNode {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setBooting(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user: session?.user ?? null, isLoggedIn: !!session }),
    [session]
  );

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <TranslationProvider>
      <AuthContext.Provider value={value}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
        >
          <DrawerContent />
        </KeyboardAvoidingView>
      </AuthContext.Provider>
    </TranslationProvider>
  );
}

const DrawerContent = () => {
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();

  return (
    <Drawer
      screenOptions={{
        drawerStyle: { backgroundColor: '#0f2f24', paddingTop: 12 },
        drawerActiveTintColor: '#ecfdf3',
        drawerInactiveTintColor: '#cde5d5',
        headerStyle: { backgroundColor: '#0f2f24' },
        headerTintColor: '#ecfdf3',
        headerRight: () => <LanguageButton />,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: t('drawer.home'),
          drawerLabel: t('drawer.home'),
        }}
      />

      <Drawer.Screen
        name="species/index"
        options={{ title: t('drawer.species'), drawerLabel: t('drawer.species') }}
      />
      <Drawer.Screen
        name="species/[id]"
        options={{
          title: t('drawer.speciesDetail'),
          drawerLabel: () => null,
          drawerItemStyle: { display: 'none' },
        }}
      />

      <Drawer.Protected guard={!isLoggedIn}>
        <Drawer.Screen
          name="(auth)/login"
          options={{ title: t('drawer.login'), drawerLabel: t('drawer.login') }}
        />
        <Drawer.Screen
          name="(auth)/signup"
          options={{ title: t('drawer.signup'), drawerLabel: t('drawer.signup') }}
        />
      </Drawer.Protected>

      <Drawer.Protected guard={isLoggedIn}>
        <Drawer.Screen
          name="(app)/observations"
          options={{ title: t('drawer.observations'), drawerLabel: t('drawer.observations') }}
        />
        <Drawer.Screen
          name="(app)/account"
          options={{ title: t('drawer.account'), drawerLabel: t('drawer.account') }}
        />
        <Drawer.Screen
          name="(app)/signout"
          options={{ title: t('drawer.signout'), drawerLabel: t('drawer.signout') }}
        />
      </Drawer.Protected>
    </Drawer>
  );
};

const LanguageButton = () => {
  const { locale, setLocale } = useTranslation();
  const cycleLocale = () => {
    const order: ('en' | 'es' | 'ru')[] = ['en', 'es', 'ru'];
    const currentIndex = order.indexOf(locale);
    const next = order[(currentIndex + 1) % order.length];
    setLocale(next);
  };

  return (
    <Pressable
      onPress={cycleLocale}
      style={{
        marginRight: 8,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#bbf7d0',
        backgroundColor: '#166534',
      }}
    >
      <Text style={{ color: '#ecfdf3', fontWeight: '700', fontSize: 12 }}>{locale.toUpperCase()}</Text>
    </Pressable>
  );
};
