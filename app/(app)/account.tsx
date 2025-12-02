// app/(app)/account.tsx
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { supabase } from '../../supabase';
import { useAuth } from '../_layout';
import { useTranslation } from '../../lib/i18n';

const formatLabel = (value: string | null | undefined, fallback: string) => {
  if (!value) return fallback;
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
  const { t } = useTranslation();
  const metadata = user?.user_metadata ?? {};
  const fullName =
    metadata.full_name || metadata.name || `${metadata.first_name ?? ''} ${metadata.last_name ?? ''}`.trim();
  const missingValue = t('common.missingValue');

  const translateActivity = (activity: string) => {
    const key = `observations.activity.${activity}` as any;
    return t(key) || activity;
  };

  const translateAction = (action?: string | null) => {
    if (!action) return '';
    const mapping: Record<string, string> = {
      Observed: t('observations.action.observed'),
      Moved: t('observations.action.moved'),
      Collected: t('observations.action.collected'),
      'Called local agency': t('observations.action.called'),
      Other: t('observations.action.other'),
    };
    return mapping[action] ?? action;
  };
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
        <Text style={styles.kicker}>{t('account.kicker')}</Text>
        <Text style={styles.title}>{t('account.title')}</Text>
        <Text style={styles.subtitle}>{t('account.subtitle')}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.name')}</Text>
          <Text style={styles.value}>{formatLabel(fullName, missingValue)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.email')}</Text>
          <Text style={styles.value}>{formatLabel(user?.email, missingValue)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t('account.affiliation')}</Text>
          <Text style={styles.value}>{formatLabel(metadata.affiliation, missingValue)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('account.edit.title')}</Text>
        <Text style={styles.cardCopy}>{t('account.edit.copy')}</Text>

        <Link href="/(app)/signout" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>{t('account.signOut')}</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('account.observations.title')}</Text>
        <Text style={styles.cardCopy}>{t('account.observations.copy')}</Text>

        {loadingObservations ? (
          <View style={styles.loaderRow}>
            <ActivityIndicator color="#1e40af" />
            <Text style={styles.loaderText}>{t('account.loading')}</Text>
          </View>
        ) : observationsError ? (
          <Text style={styles.errorText}>{t('account.error')}</Text>
        ) : observations.length === 0 ? (
          <Text style={styles.emptyText}>{t('account.empty')}</Text>
        ) : (
          <View style={styles.observationList}>
            {observations.map((observation) => (
              <View key={observation.id} style={styles.observationItem}>
                <Text style={styles.observationTitle}>{formatDate(observation.seen_at)}</Text>
                <Text style={styles.observationMeta}>
                  {t('account.observation.species')}{' '}
                  <Text style={styles.observationMetaStrong}>{observation.species_id}</Text>
                </Text>
                <Text style={styles.observationMeta}>
                  {t('account.observation.count')}{' '}
                  <Text style={styles.observationMetaStrong}>
                    {observation.count ?? t('account.observation.unknownCount')}
                  </Text>
                </Text>
                <Text style={styles.observationMeta}>
                  {t('account.observation.location')}{' '}
                  <Text style={styles.observationMetaStrong}>
                    {observation.location_name ||
                      `${observation.latitude.toFixed(4)}, ${observation.longitude.toFixed(4)}`}
                  </Text>
                </Text>
                {observation.activities?.length ? (
                  <Text style={styles.observationMeta}>
                    {t('account.observation.activity')}{' '}
                    <Text style={styles.observationMetaStrong}>
                      {observation.activities.map(translateActivity).join(', ')}
                    </Text>
                  </Text>
                ) : null}
                {observation.action_taken ? (
                  <Text style={styles.observationMeta}>
                    {t('account.observation.action')}{' '}
                    <Text style={styles.observationMetaStrong}>
                      {observation.action_taken === 'Other'
                        ? observation.action_other || t('account.observation.other')
                        : translateAction(observation.action_taken)}
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
    backgroundColor: '#e9f3ec',
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
    backgroundColor: '#f7fbf8',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
    borderWidth: 1,
    borderColor: '#cde5d5',
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
    borderColor: '#14532d',
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#166534',
  },
  secondaryButtonText: {
    color: '#ecfdf3',
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
    borderColor: '#cde5d5',
    borderRadius: 14,
    padding: 12,
    gap: 4,
    backgroundColor: '#f1f8f4',
  },
  observationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2f24',
  },
  observationMeta: {
    color: '#1f3c2f',
    fontSize: 14,
  },
  observationMetaStrong: {
    fontWeight: '600',
    color: '#166534',
  },
  observationNotes: {
    marginTop: 4,
    color: '#0f2f24',
    fontSize: 13,
    lineHeight: 18,
  },
});
