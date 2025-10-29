// types/species.ts
import type { ImageSourcePropType } from 'react-native';

export type RawSpeciesEntry = {
  id: string;
  commonName?: string;
  native?: boolean;
  image?: string;
  description?: string[];
  habitat?: string[];
  status?: string[];
  range?: string[];
  regulations?: string[];
  impacts?: string[];
  source_url?: string;
  sectionTitle?: string;
  notes?: string[];
};

export type Species = RawSpeciesEntry & {
  commonName: string;
  image: string;
};

export type SpeciesWithImage = Species & {
  imageSource: ImageSourcePropType;
};

export const isSpecies = (entry: RawSpeciesEntry): entry is Species => {
  return typeof entry.commonName === 'string' && entry.commonName.length > 0 && typeof entry.image === 'string' && entry.image.length > 0;
};
