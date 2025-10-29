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

export default function SpeciesDetail() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const speciesIdParam = params.id;
  const speciesId = Array.isArray(speciesIdParam) ? speciesIdParam[0] : speciesIdParam;
  const species = speciesId ? findSpeciesById(speciesId) : undefined;

  if (!species) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>Species not found.</Text>
        <Link href="/species" asChild>
          <Pressable style={styles.backButton}>
            <Text style={styles.backButtonText}>Return to field guide</Text>
          </Pressable>
        </Link>
      </View>
    );
  }

  const handleSourcePress = () => {
    if (!species.source_url) return;
    Linking.openURL(species.source_url).catch(() => {});
  };

  return (
    <>
      <Stack.Screen options={{ title: species.commonName }} />
      <ScrollView contentContainerStyle={styles.container}>
        <Link href="/species" asChild>
          <Pressable style={styles.inlineBack}>
            <Text style={styles.inlineBackText}>← Back to species</Text>
          </Pressable>
        </Link>

        <View style={styles.card}>
          <Image source={getSpeciesImage(species.image)} style={styles.image} resizeMode="cover" />
          <View style={styles.header}>
            <Text style={styles.title}>{species.commonName}</Text>
            <Text style={[styles.badge, species.native ? styles.native : styles.nonNative]}>
              {species.native ? 'Native species' : 'Non-native species'}
            </Text>
          </View>

          <Section title="Description" items={species.description} />
          <Section title="Habitat" items={species.habitat} />
          <Section title="Status" items={species.status} />
          <Section title="Range" items={species.range} />
          <Section title="Impacts" items={species.impacts} />
          <Section title="Regulations" items={species.regulations} />

          {species.source_url ? (
            <Pressable onPress={handleSourcePress}>
              <Text style={styles.link}>Source: {species.source_url}</Text>
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
    backgroundColor: '#e2e8f0',
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
    backgroundColor: '#1e3a8a',
  },
  inlineBackText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    gap: 16,
    paddingBottom: 20,
    shadowColor: '#0f172a',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 5,
  },
  image: {
    width: '100%',
    height: 240,
    backgroundColor: '#cbd5f5',
  },
  header: {
    paddingHorizontal: 20,
    gap: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  native: {
    color: '#047857',
  },
  nonNative: {
    color: '#b91c1c',
  },
  sectionBlock: {
    paddingHorizontal: 20,
    gap: 6,
    marginTop: 6,
  },
  section: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  item: {
    fontSize: 15,
    lineHeight: 22,
    color: '#334155',
  },
  link: {
    marginTop: 12,
    paddingHorizontal: 20,
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1e3a8a',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});
