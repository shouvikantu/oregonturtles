// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, View } from 'react-native';

import type { Session, User } from '@supabase/supabase-js';

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
    <AuthContext.Provider value={value}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 16 : 0}
      >
        <Drawer
          screenOptions={{
            drawerStyle: { backgroundColor: '#0d1b2a', paddingTop: 12 },
            drawerActiveTintColor: '#fff',
            drawerInactiveTintColor: '#cbd5f5',
            headerStyle: { backgroundColor: '#0d1b2a' },
            headerTintColor: '#fff',
          }}
        >
          <Drawer.Screen
            name="index"
            options={{
              title: 'Home',
              drawerLabel: 'Home',
            }}
          />

          <Drawer.Screen
            name="species/index"
            options={{ title: 'Species', drawerLabel: 'Species' }}
          />
          <Drawer.Screen
            name="species/[id]"
            options={{
              title: 'Species detail',
              drawerLabel: () => null,
              drawerItemStyle: { display: 'none' },
            }}
          />

          <Drawer.Protected guard={!value.isLoggedIn}>
            <Drawer.Screen
              name="(auth)/login"
              options={{ title: 'Log in', drawerLabel: 'Log in' }}
            />
            <Drawer.Screen
              name="(auth)/signup"
              options={{ title: 'Sign up', drawerLabel: 'Sign up' }}
            />
          </Drawer.Protected>

          <Drawer.Protected guard={value.isLoggedIn}>
            <Drawer.Screen
              name="(app)/observations"
              options={{ title: 'Observations', drawerLabel: ' Record Observations' }}
            />
            <Drawer.Screen
              name="(app)/account"
              options={{ title: 'Account info', drawerLabel: 'Account info' }}
            />
            <Drawer.Screen
              name="(app)/signout"
              options={{ title: 'Sign out', drawerLabel: 'Sign out' }}
            />
          </Drawer.Protected>
        </Drawer>
      </KeyboardAvoidingView>
    </AuthContext.Provider>
  );
}
