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
} from 'react-native';
import { supabase } from '../../supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Enter both your email address and password.');
      return;
    }

    try {
      setBusy(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Login failed', error.message);
        return;
      }
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Login failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.supporting}>
          Sign in to manage your sightings and access member resources.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.org"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Pressable
          onPress={onLogin}
          disabled={busy}
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Logging in…' : 'Log in'}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>
          <Link href="/(auth)/signup" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Sign up</Text>
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
    backgroundColor: '#0f172a',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: '#020617',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
  },
  supporting: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#fff',
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
    color: '#475569',
  },
  footerLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
});
