// app/(app)/signout.tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../supabase';
import { useTranslation } from '../../lib/i18n';

export default function SignOutScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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
        <ActivityIndicator color="#166534" />
        <Text style={styles.label}>{t('signout.label')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f3ec',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#f7fbf8',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#cde5d5',
  },
  label: {
    fontSize: 16,
    color: '#0f2f24',
    fontWeight: '600',
  },
  indicator: {
    color: '#166534',
  },
});
