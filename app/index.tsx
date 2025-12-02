// app/index.tsx
import { Link } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '../lib/i18n';
import { useAuth } from './_layout';

const getDisplayName = (user: any) => {
  if (!user) return '';
  const metadata = user.user_metadata ?? {};
  return metadata.full_name || metadata.name || (user.email ? user.email.split('@')[0] : '');
};

export default function HomePage() {
  const { user, isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const displayName = getDisplayName(user);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.heroLeafOne} />
        <View style={styles.heroLeafTwo} />

        <View style={styles.heroBadgeRow}>
          <View style={styles.logoMark}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.kicker}>{t('home.kicker')}</Text>
            <Text style={styles.heroTagline}>{t('home.tagline')}</Text>
          </View>
        </View>

        <Text style={styles.title}>
          {isLoggedIn
            ? t('home.welcomeUser', { name: displayName || t('common.fieldResearcher') })
            : t('home.welcomeGuest')}
        </Text>
        <Text style={styles.subtitle}>
          {t('home.subtitle')}
        </Text>

        <View style={styles.ctaRow}>
          <Link href="/species" asChild>
            <Pressable style={styles.ctaPrimary}>
              <Text style={styles.ctaPrimaryText}>{t('home.ctaExplore')}</Text>
            </Pressable>
          </Link>
          <Link href="/(app)/observations" asChild>
            <Pressable style={styles.ctaSecondary}>
              <Text style={styles.ctaSecondaryText}>{t('home.ctaLogObservation')}</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.heroFeatureRow}>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>{t('home.feature.nativeHabitats.title')}</Text>
            <Text style={styles.heroChipValue}>{t('home.feature.nativeHabitats.value')}</Text>
          </View>
          <View style={styles.heroChip}>
            <Text style={styles.heroChipLabel}>{t('home.feature.fieldReady.title')}</Text>
            <Text style={styles.heroChipValue}>{t('home.feature.fieldReady.value')}</Text>
          </View>
        </View>

        <View style={styles.heroImageWrap}>
          <Image
            source={require('../assets/images/pond_turtle.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{t('home.stat.value')}</Text>
            <Text style={styles.heroStatLabel}>{t('home.stat.label')}</Text>
          </View>
        </View>

      </View>

      <View style={styles.natureStrip}>
        <Text style={styles.stripTitle}>{t('home.strip.title')}</Text>
        <Text style={styles.stripCopy}>{t('home.strip.copy')}</Text>
        <View style={styles.stripImages}>
          <Image
            source={require('../assets/images/painted_turtle.png')}
            style={styles.stripImage}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/images/pond_turtle.png')}
            style={styles.stripImage}
            resizeMode="contain"
          />
          <Image
            source={require('../assets/images/turtle_red_eared.png')}
            style={styles.stripImage}
            resizeMode="contain"
          />
        </View>
      </View>

      {!isLoggedIn ? (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>{t('home.auth.joinTitle')}</Text>
          <Text style={styles.cardCopy}>{t('home.auth.joinCopy')}</Text>
          <View style={styles.row}>
            <Link href="/(auth)/login" asChild>
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>{t('home.auth.login')}</Text>
              </Pressable>
            </Link>
            <Link href="/(auth)/signup" asChild>
              <Pressable style={styles.ctaGhost}>
                <Text style={styles.ctaGhostText}>{t('home.auth.signup')}</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      ) : (
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>{t('home.auth.signedInTitle')}</Text>
          <Text style={styles.cardCopy}>{t('home.auth.signedInCopy')}</Text>
          <View style={styles.row}>
            <Link href="/(app)/observations" asChild>
              <Pressable style={styles.ctaSecondary}>
                <Text style={styles.ctaSecondaryText}>{t('home.auth.recordObservation')}</Text>
              </Pressable>
            </Link>
            <Link href="/(app)/account" asChild>
              <Pressable style={styles.ctaGhost}>
                <Text style={styles.ctaGhostText}>{t('home.auth.accountInfo')}</Text>
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
    backgroundColor: '#e9f3ec',
  },
  hero: {
    backgroundColor: '#0f2f24',
    borderRadius: 20,
    padding: 24,
    gap: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  kicker: {
    color: '#cde5d5',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 1.6,
    fontSize: 12,
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
    flex: 1,
    backgroundColor: '#34d399',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaPrimaryText: {
    color: '#052e16',
    fontWeight: '700',
    fontSize: 16,
  },
  ctaSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#14532d',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: '#166534',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaSecondaryText: {
    color: '#ecfdf3',
    fontSize: 15,
    fontWeight: '700',
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  authCard: {
    backgroundColor: '#f7fbf8',
    borderRadius: 18,
    padding: 22,
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
  ctaGhost: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ecfeff',
  },
  ctaGhostText: {
    color: '#0f766e',
    fontSize: 15,
    fontWeight: '600',
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 260,
    height: 260,
    backgroundColor: '#1f6b4a',
    borderRadius: 999,
    opacity: 0.35,
  },
  heroLeafOne: {
    position: 'absolute',
    bottom: -50,
    left: -80,
    width: 220,
    height: 140,
    backgroundColor: '#14532d',
    borderRadius: 999,
    transform: [{ rotate: '-8deg' }],
    opacity: 0.35,
  },
  heroLeafTwo: {
    position: 'absolute',
    bottom: -20,
    right: -60,
    width: 200,
    height: 120,
    backgroundColor: '#0f766e',
    borderRadius: 999,
    transform: [{ rotate: '12deg' }],
    opacity: 0.28,
  },
  languageChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    backgroundColor: 'rgba(22, 101, 52, 0.85)',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  languageChipText: {
    color: '#ecfdf3',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.6,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#ecfeff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99f6e4',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  heroTagline: {
    color: '#d1fae5',
    fontSize: 14,
    fontWeight: '600',
  },
  heroFeatureRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  heroChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(190, 242, 100, 0.4)',
    backgroundColor: 'rgba(21, 128, 61, 0.18)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  heroChipLabel: {
    color: '#d9f99d',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  heroChipValue: {
    color: '#f8fafc',
    fontSize: 13,
    marginTop: 4,
  },
  heroImageWrap: {
    marginTop: 10,
    backgroundColor: 'rgba(240, 253, 244, 0.08)',
    borderRadius: 18,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  heroImage: {
    width: 120,
    height: 90,
  },
  heroStat: {
    flex: 1,
    gap: 4,
  },
  heroStatNumber: {
    color: '#bbf7d0',
    fontSize: 22,
    fontWeight: '800',
  },
  heroStatLabel: {
    color: '#ecfeff',
    fontSize: 14,
  },
  natureStrip: {
    backgroundColor: '#dff3e5',
    borderRadius: 18,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: '#b5dec6',
  },
  stripTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f2f24',
  },
  stripCopy: {
    fontSize: 14,
    color: '#1f3c2f',
  },
  stripImages: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  stripImage: {
    flex: 1,
    height: 80,
  },
});
