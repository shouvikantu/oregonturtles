// app/species/index.tsx
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import SpeciesCard from '../../components/SpeciesCard';
import { listSpeciesWithImages } from '../../lib/species';
import type { SpeciesWithImage } from '../../types/species';
import { useTranslation } from '../../lib/i18n';

const SPECIES = listSpeciesWithImages();
const SPECIES_NAME_KEYS: Record<string, string> = {
  'red-eared-slider': 'observations.species.redEaredSlider.name',
  'western-painted-turtle': 'observations.species.westernPainted.name',
  'northwestern-pond-turtle': 'observations.species.northwesternPond.name',
  'common-snapping-turtle': 'observations.species.commonSnapping.name',
};

export default function SpeciesIndex() {
  const { t } = useTranslation();
  const renderSpecies = useCallback(
    ({ item }: { item: SpeciesWithImage }) => (
      <SpeciesCard
        id={item.id}
        name={SPECIES_NAME_KEYS[item.id] ? t(SPECIES_NAME_KEYS[item.id] as any) : item.commonName}
        image={item.imageSource}
      />
    ),
    [t]
  );

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderEmpty = useCallback(
    () => <Text style={styles.emptyState}>{t('species.index.empty')}</Text>,
    [t]
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text style={styles.kicker}>{t('species.index.kicker')}</Text>
        <Text style={styles.title}>{t('species.index.title')}</Text>
        <Text style={styles.subtitle}>{t('species.index.subtitle')}</Text>
      </View>
    ),
    [t]
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={[styles.grid, SPECIES.length === 0 && styles.centerEmpty]}
        data={SPECIES}
        renderItem={renderSpecies}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={renderSeparator}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, flex: 1, backgroundColor: '#e9f3ec' },
  grid: { gap: 20, paddingBottom: 40 },
  separator: { height: 20 },
  centerEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { textAlign: 'center', color: '#1f3c2f', fontSize: 16 },
  header: { marginBottom: 8, gap: 10, marginRight: 12 },
  kicker: {
    textTransform: 'uppercase',
    color: '#1f4e37',
    fontWeight: '700',
    letterSpacing: 1.4,
    fontSize: 13,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0f2f24' },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#1f3c2f' },
});
