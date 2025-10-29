// app/(app)/signout.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../supabase';

export default function SignOutScreen() {
  const router = useRouter();

  useEffect(() => {
    const doSignOut = async () => {
      try {
        await supabase.auth.signOut();
      } finally {
        router.replace('/(auth)/login');
      }
    };

    doSignOut();
  }, [router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator color="#2563eb" />
        <Text style={styles.label}>Signing you out…</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#020617',
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  label: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
});
