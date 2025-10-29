// app/(app)/account.tsx
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../supabase';
import { useAuth } from '../_layout';

const formatLabel = (value?: string | null) => {
  if (!value) return '—';
  return value;
};

type Observation = {
  id: string;
  seen_at: string;
  species_id: string;
  count: number;
  location_name: string | null;
  latitude: number;
  longitude: number;
  activities: string[] | null;
  notes: string | null;
  action_taken: string | null;
  action_other: string | null;
  additional_notes: string | null;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
};

export default function AccountScreen() {
  const { user } = useAuth();
  const metadata = user?.user_metadata ?? {};
  const fullName =
    metadata.full_name || metadata.name || `${metadata.first_name ?? ''} ${metadata.last_name ?? ''}`.trim();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [observationsError, setObservationsError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadObservations = async () => {
      if (!user?.id) {
        setObservations([]);
        return;
      }

      setLoadingObservations(true);
      setObservationsError(null);

      const { data, error } = await supabase
        .from('observations')
        .select(
          'id, seen_at, species_id, count, location_name, latitude, longitude, activities, notes, action_taken, action_other, additional_notes'
        )
        .eq('user_id', user.id)
        .order('seen_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        setObservationsError(error.message);
      } else {
        setObservations((data as Observation[]) ?? []);
      }

      setLoadingObservations(false);
    };

    loadObservations();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Account</Text>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>
          Update your details in Supabase to keep your conservation credits accurate.
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{formatLabel(fullName)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{formatLabel(user?.email)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Affiliation</Text>
          <Text style={styles.value}>{formatLabel(metadata.affiliation)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Need to make changes?</Text>
        <Text style={styles.cardCopy}>
          Profile edits live in our Supabase dashboard. Reach out if you&apos;d like us to refresh
          your details or invite collaborators.
        </Text>

        <Link href="/(app)/signout" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Sign out</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your observations</Text>
        <Text style={styles.cardCopy}>
          Here&apos;s a quick look at the sightings you&apos;ve logged so far.
        </Text>

        {loadingObservations ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#1e40af" />
            <Text style={styles.loaderText}>Loading your observations…</Text>
          </View>
        ) : observationsError ? (
          <Text style={styles.errorText}>
            We couldn&apos;t load your observations right now. Try again later.
          </Text>
        ) : observations.length === 0 ? (
          <Text style={styles.emptyText}>
            No observations recorded yet. Head to Observations to share your first sighting!
          </Text>
        ) : (
          <View style={styles.observationList}>
            {observations.map((observation) => (
              <View key={observation.id} style={styles.observationItem}>
                <Text style={styles.observationTitle}>{formatDate(observation.seen_at)}</Text>
                <Text style={styles.observationMeta}>
                  Species: <Text style={styles.observationMetaStrong}>{observation.species_id}</Text>
                </Text>
                <Text style={styles.observationMeta}>
                  Count:{' '}
                  <Text style={styles.observationMetaStrong}>{observation.count ?? 'Unknown'}</Text>
                </Text>
                <Text style={styles.observationMeta}>
                  Location:{' '}
                  <Text style={styles.observationMetaStrong}>
                    {observation.location_name ||
                      `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`}
                  </Text>
                </Text>
                {observation.activities?.length ? (
                  <Text style={styles.observationMeta}>
                    Activity:{' '}
                    <Text style={styles.observationMetaStrong}>
                      {observation.activities.join(', ')}
                    </Text>
                  </Text>
                ) : null}
                {observation.action_taken ? (
                  <Text style={styles.observationMeta}>
                    Action:{' '}
                    <Text style={styles.observationMetaStrong}>
                      {observation.action_taken === 'Other'
                        ? observation.action_other || 'Other'
                        : observation.action_taken}
                    </Text>
                  </Text>
                ) : null}
                {observation.notes ? (
                  <Text style={styles.observationNotes}>{observation.notes}</Text>
                ) : null}
                {observation.additional_notes ? (
                  <Text style={styles.observationNotes}>{observation.additional_notes}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    gap: 24,
    backgroundColor: '#e2e8f0',
  },
  header: {
    gap: 8,
  },
  kicker: {
    textTransform: 'uppercase',
    color: '#475569',
    fontWeight: '600',
    letterSpacing: 1.2,
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: '#334155',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  value: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardCopy: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 21,
  },
  secondaryButton: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dc2626',
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#dc2626',
    fontWeight: '700',
    fontSize: 15,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  loaderText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  errorText: {
    color: '#b91c1c',
    fontWeight: '600',
    lineHeight: 20,
  },
  emptyText: {
    color: '#475569',
    fontStyle: 'italic',
  },
  observationList: {
    gap: 12,
  },
  observationItem: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: '#f8fafc',
  },
  observationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  observationMeta: {
    color: '#334155',
    fontSize: 14,
  },
  observationMetaStrong: {
    fontWeight: '600',
    color: '#1e3a8a',
  },
  observationNotes: {
    marginTop: 4,
    color: '#0f172a',
    fontSize: 13,
    lineHeight: 18,
  },
});
