// app/index.tsx
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';

import { useAuth } from './_layout';

const getDisplayName = (user: any) => {
  if (!user) return '';
  const metadata = user.user_metadata ?? {};
  return metadata.full_name || metadata.name || (user.email ? user.email.split('@')[0] : '');
};

export default function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const displayName = getDisplayName(user);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Oregon Turtle Conservancy</Text>
        <Text style={styles.title}>
          {isLoggedIn ? `Welcome, ${displayName || 'friend'}!` : 'Welcome to Oregon Turtles'}
        </Text>
        <Text style={styles.subtitle}>
          Protecting native turtle habitats through research, restoration, and community science.
        </Text>

        <Link href="/species" asChild>
          <Pressable style={styles.ctaPrimary}>
            <Text style={styles.ctaPrimaryText}>Explore Species</Text>
          </Pressable>
        </Link>
      </View>

      {!isLoggedIn ? (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>Join the community</Text>
          <Text style={styles.cardCopy}>
            Create an account to log your observations and stay current on conservation work across
            Oregon.
          </Text>
          <View style={styles.row}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>Log in</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <Pressable style={styles.ctaGhost}>
                <Text style={styles.ctaGhostText}>Sign up</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      ) : (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>You&apos;re signed in</Text>
          <Text style={styles.cardCopy}>
            Visit Species to refresh your field ID skills, or share a new sighting from the field in
            Observations.
          </Text>
          <View style={styles.row}>
            <Link href="/(app)/observations" asChild>
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>Record observation</Text>
              </Pressable>
            </Link>
            <Link href="/(app)/account" asChild>
              <Pressable style={styles.ctaGhost}>
                <Text style={styles.ctaGhostText}>Account info</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
    backgroundColor: '#f1f5f9',
  },
  hero: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  kicker: {
    color: '#bfdbfe',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1.5,
    fontSize: 13,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
  },
  ctaPrimary: {
    marginTop: 12,
    backgroundColor: '#38bdf8',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaPrimaryText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  authCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardCopy: {
    fontSize: 15,
    lineHeight: 21,
    color: '#334155',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  ctaSecondary: {
    flex: 1,
    backgroundColor: '#1e40af',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaSecondaryText: {
    color: '#e0f2fe',
    fontSize: 15,
    fontWeight: '600',
  },
  ctaGhost: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e40af',
    paddingVertical: 12,
    alignItems: 'center',
  },
  ctaGhostText: {
    color: '#1e3a8a',
    fontSize: 15,
    fontWeight: '600',
  },
});
