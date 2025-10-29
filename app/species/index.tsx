// app/species/index.tsx
import { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import SpeciesCard from '../../components/SpeciesCard';
import { listSpeciesWithImages } from '../../lib/species';
import type { SpeciesWithImage } from '../../types/species';

const SPECIES = listSpeciesWithImages();

export default function SpeciesIndex() {
  const renderSpecies = useCallback(
    ({ item }: { item: SpeciesWithImage }) => (
      <SpeciesCard id={item.id} name={item.commonName} image={item.imageSource} />
    ),
    []
  );

  const renderSeparator = useCallback(() => <View style={styles.separator} />, []);

  const renderEmpty = useCallback(
    () => <Text style={styles.emptyState}>No species available yet.</Text>,
    []
  );

  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <Text style={styles.kicker}>Field guide</Text>
        <Text style={styles.title}>Native & notable turtles</Text>
        <Text style={styles.subtitle}>
          Tap a species to learn key identification tips, habitat preferences, and management
          guidance.
        </Text>
      </View>
    ),
    []
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
  container: { padding: 24, flex: 1, backgroundColor: '#e2e8f0' },
  grid: { gap: 20, paddingBottom: 40 },
  separator: { height: 20 },
  centerEmpty: { flexGrow: 1, justifyContent: 'center' },
  emptyState: { textAlign: 'center', color: '#475569', fontSize: 16 },
  header: { marginBottom: 8, gap: 10, marginRight: 12 },
  kicker: {
    textTransform: 'uppercase',
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 1.4,
    fontSize: 13,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 16, lineHeight: 22, color: '#334155' },
});
