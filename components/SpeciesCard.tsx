// components/SpeciesCard.tsx
import { Link } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';

import { useTranslation } from '../lib/i18n';

type Props = {
  id: string;
  name: string;
  image: ImageSourcePropType;
};

export default function SpeciesCard({ id, name, image }: Props) {
  const { t } = useTranslation();
  return (
    <Link href={`/species/${id}`} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        <View style={styles.content}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.cta}>{t('species.card.cta')}</Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderRadius: 18,
    backgroundColor: '#f7fbf8',
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
    borderWidth: 1,
    borderColor: '#cde5d5',
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.08,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#d9eadf',
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f2f24',
  },
  cta: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
