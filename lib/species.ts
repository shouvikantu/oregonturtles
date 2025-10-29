import type { ImageSourcePropType } from 'react-native';

import rawSpeciesData from '../data/species.json';
import { isSpecies, type RawSpeciesEntry, type Species, type SpeciesWithImage } from '../types/species';

const FALLBACK_IMAGE_KEY = 'assets/images/painted_turtle.png';

const SPECIES_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  'assets/images/painted_turtle.png': require('../assets/images/painted_turtle.png'),
  'assets/images/pond_turtle.png': require('../assets/images/pond_turtle.png'),
  'assets/images/turtle_red_eared.png': require('../assets/images/turtle_red_eared.png'),
  'assets/images/snapping_turtle.png': require('../assets/images/snapping_turtle.png'),
};

const normalizeImagePath = (path?: string) => (path ?? '').replace(/^\.\//, '');

const rawEntries = rawSpeciesData as RawSpeciesEntry[];

export const getSpeciesImage = (path?: string): ImageSourcePropType => {
  const normalized = normalizeImagePath(path);
  return SPECIES_IMAGE_MAP[normalized] ?? SPECIES_IMAGE_MAP[FALLBACK_IMAGE_KEY];
};

const speciesEntries: Species[] = rawEntries
  .filter(isSpecies)
  .map((entry) => ({
    ...entry,
    image: normalizeImagePath(entry.image),
  }));

const speciesWithImages: SpeciesWithImage[] = speciesEntries.map((entry) => ({
  ...entry,
  imageSource: getSpeciesImage(entry.image),
}));

export const listSpeciesWithImages = (): SpeciesWithImage[] => speciesWithImages;

export const findSpeciesById = (id: string): Species | undefined =>
  speciesEntries.find((entry) => entry.id === id);
