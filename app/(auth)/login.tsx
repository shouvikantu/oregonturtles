// app/(auth)/login.tsx
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  Image,
} from 'react-native';
import { supabase } from '../../supabase';
import { useTranslation } from '../../lib/i18n';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('login.alert.missing.title'), t('login.alert.missing.body'));
      return;
    }

    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert(t('login.alert.failed.title'), error.message);
        return;
      }
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('login.alert.failed.title'), e?.message ?? t('login.alert.failed.body'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <View style={styles.logoMark}>
            <Image
              source={require('../../assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.kicker}>{t('home.kicker')}</Text>
            <Text style={styles.heading}>{t('login.title')}</Text>
          </View>
        </View>
        <Text style={styles.supporting}>{t('login.subtitle')}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>{t('login.email')}</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder={t('login.emailPlaceholder')}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('login.password')}</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder={t('login.passwordPlaceholder')}
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Pressable
          onPress={onLogin}
          disabled={busy}
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>
            {busy ? t('login.loading') : t('login.button')}
          </Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('login.footerPrompt')}</Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={styles.footerLink}>{t('login.footerLink')}</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#e9f3ec',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#f7fbf8',
    borderRadius: 18,
    padding: 24,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#cde5d5',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  logo: { width: 32, height: 32 },
  kicker: {
    color: '#1f4e37',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1.2,
    fontSize: 12,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f2f24',
  },
  supporting: {
    fontSize: 15,
    color: '#1f3c2f',
    lineHeight: 22,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f2f24',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f0f7f2',
  },
  primaryButton: {
    backgroundColor: '#166534',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0f3f2d',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ecfdf3',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#1f3c2f',
  },
  footerLink: {
    color: '#0f766e',
    fontWeight: '600',
  },
});
