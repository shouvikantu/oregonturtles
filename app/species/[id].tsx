// app/species/[id].tsx
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { findSpeciesById, getSpeciesImage } from '../../lib/species';
import { useTranslation } from '../../lib/i18n';

const SPECIES_NAME_KEYS: Record<string, string> = {
  'red-eared-slider': 'observations.species.redEaredSlider.name',
  'western-painted-turtle': 'observations.species.westernPainted.name',
  'northwestern-pond-turtle': 'observations.species.northwesternPond.name',
  'common-snapping-turtle': 'observations.species.commonSnapping.name',
};

export default function SpeciesDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const speciesIdParam = params.id;
  const speciesId = Array.isArray(speciesIdParam) ? speciesIdParam[0] : speciesIdParam;
  const species = speciesId ? findSpeciesById(speciesId) : undefined;
  const { t } = useTranslation();

  if (!species) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>{t('species.detail.missing')}</Text>
        <Link href="/species" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>{t('species.detail.return')}</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const handleSourcePress = () => {
    if (!species.source_url) return;
    Linking.openURL(species.source_url).catch(() => {});
  };
  const displayName =
    (species && SPECIES_NAME_KEYS[species.id] && t(SPECIES_NAME_KEYS[species.id] as any)) ||
    species?.commonName ||
    '';

  return (
    <>
      <Stack.Screen options={{ title: displayName }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Link href="/species" asChild>
          <Pressable style={styles.inlineBack}>
            <Text style={styles.inlineBackText}>{t('species.detail.back')}</Text>
          </Pressable>
        </Link>

        <View style={styles.card}>
          <Image source={getSpeciesImage(species.image)} style={styles.image} resizeMode="cover" />
          <View style={styles.header}>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={[styles.badge, species.native ? styles.native : styles.nonNative]}>
              {species.native ? t('species.detail.native') : t('species.detail.nonNative')}
            </Text>
          </View>

          <Section title={t('species.detail.description')} items={species.description} />
          <Section title={t('species.detail.habitat')} items={species.habitat} />
          <Section title={t('species.detail.status')} items={species.status} />
          <Section title={t('species.detail.range')} items={species.range} />
          <Section title={t('species.detail.impacts')} items={species.impacts} />
          <Section title={t('species.detail.regulations')} items={species.regulations} />

          {species.source_url ? (
            <Pressable onPress={handleSourcePress}>
              <Text style={styles.link}>{t('species.detail.source', { url: species.source_url })}</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </>
  );
}

function Section({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.section}>{title}</Text>
      {items.map((t, i) => (
        <Text key={`${title}-${i}`} style={styles.item}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 16,
    backgroundColor: '#e9f3ec',
  },
  missing: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },
  missingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  inlineBack: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#166534',
  },
  inlineBackText: {
    color: '#ecfdf3',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#f7fbf8',
    borderRadius: 20,
    overflow: 'hidden',
    gap: 16,
    paddingBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
    borderWidth: 1,
    borderColor: '#cde5d5',
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#d9eadf',
  },
  header: {
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f2f24',
  },
  badge: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  native: {
    color: '#0f766e',
  },
  nonNative: {
    color: '#9a3412',
  },
  sectionBlock: {
    paddingHorizontal: 20,
    gap: 6,
    marginTop: 6,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f2f24',
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
    color: '#1f3c2f',
  },
  link: {
    marginTop: 12,
    paddingHorizontal: 20,
    color: '#0f766e',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#166534',
  },
  backButtonText: {
    color: '#ecfdf3',
    fontWeight: '700',
  },
});
