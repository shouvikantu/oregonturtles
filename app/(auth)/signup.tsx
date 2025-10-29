// app/(auth)/signup.tsx
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

export default function SignupScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Missing info', 'Please fill out first name, last name, email, and password.');
      return;
    }

    try {
      setBusy(true);

      const full_name = `${firstName} ${lastName}`.trim();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name,
            affiliation,
          },
        },
      });

      if (error) {
        Alert.alert('Sign up failed', error.message);
        return;
      }

      const userId = data.user?.id;
      if (userId && (await supabase.auth.getSession()).data.session) {
        const { error: upsertErr } = await supabase
          .from('profiles')
          .upsert(
            {
              id: userId,
              first_name: firstName,
              last_name: lastName,
              affiliation,
            },
            { onConflict: 'id' }
          );

        if (upsertErr) {
          console.warn('profiles upsert error:', upsertErr.message);
        }
      }

      if (!data.session) {
        Alert.alert('Check your email', 'We sent you a confirmation link to finish sign up.');
      } else {
        Alert.alert('Account created', 'Your account is ready. Please log in.');
      }

      router.replace('/(auth)/login');
    } catch (e: any) {
      Alert.alert('Sign up failed', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.heading}>Create your account</Text>
        <Text style={styles.supporting}>
          Become part of the network of volunteers and biologists monitoring turtle populations
          across Oregon.
        </Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder="Jane"
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              autoCapitalize="words"
              style={styles.input}
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Affiliation</Text>
          <TextInput
            value={affiliation}
            onChangeText={setAffiliation}
            placeholder="Oregon Dept. of Fish & Wildlife"
            autoCapitalize="words"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.org"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            style={styles.input}
            placeholderTextColor="#94a3b8"
          />
        </View>

        <Pressable
          onPress={onSignUp}
          disabled={busy}
          style={[styles.primaryButton, busy && styles.primaryButtonDisabled]}
        >
          <Text style={styles.primaryButtonText}>{busy ? 'Creating account…' : 'Sign up'}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Pressable>
              <Text style={styles.footerLink}>Log in</Text>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
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
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#f0fdf4',
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
    color: '#16a34a',
    fontWeight: '600',
  },
});
