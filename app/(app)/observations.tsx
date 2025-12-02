// app/(app)/observations.tsx
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTranslation } from '../../lib/i18n';
import { supabase } from '../../supabase';
import { useAuth } from '../_layout';


const ACTIVITY_OPTIONS = ['Basking', 'Nesting', 'Walking', 'Swimming', 'Other'] as const;

const SPECIES_OPTIONS = [
  {
    id: 'red-eared-slider',
    nameKey: 'observations.species.redEaredSlider.name',
    descriptionKey: 'observations.species.redEaredSlider.description',
  },
  {
    id: 'western-painted-turtle',
    nameKey: 'observations.species.westernPainted.name',
    descriptionKey: 'observations.species.westernPainted.description',
  },
  {
    id: 'northwestern-pond-turtle',
    nameKey: 'observations.species.northwesternPond.name',
    descriptionKey: 'observations.species.northwesternPond.description',
  },
  {
    id: 'common-snapping-turtle',
    nameKey: 'observations.species.commonSnapping.name',
    descriptionKey: 'observations.species.commonSnapping.description',
  },
  {
    id: 'unknown',
    nameKey: 'observations.species.unknown.name',
    descriptionKey: 'observations.species.unknown.description',
  },
] as const;

const ACTION_OPTIONS = ['Observed', 'Moved', 'Collected', 'Called local agency', 'Other'] as const;

const OBSERVATION_BUCKET = 'observations';
const OBSERVATIONS_TABLE = 'observations';

type ActivityOption = (typeof ACTIVITY_OPTIONS)[number];
type SpeciesId = (typeof SPECIES_OPTIONS)[number]['id'];
type ActionOption = (typeof ACTION_OPTIONS)[number];

type ObservationPhoto = {
  uri: string;
  name: string;
  mimeType?: string;
};

type TurtleDetail = {
  speciesId: SpeciesId;
  activities: Record<ActivityOption, boolean>;
  notes: string;
};

const createActivityState = () =>
  ACTIVITY_OPTIONS.reduce(
    (acc, option) => ({ ...acc, [option]: false }),
    {} as Record<ActivityOption, boolean>
  );

const createTurtleDetail = (): TurtleDetail => ({
  speciesId: 'unknown',
  activities: createActivityState(),
  notes: '',
});

export default function ObservationsScreen() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [photos, setPhotos] = useState<ObservationPhoto[]>([]);
  const [turtleDetails, setTurtleDetails] = useState<TurtleDetail[]>([createTurtleDetail()]);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [count, setCount] = useState('1');
  const [seenAt, setSeenAt] = useState<Date>(new Date());
  const [actionTaken, setActionTaken] = useState<ActionOption>('Observed');
  const [actionOther, setActionOther] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [activeActivityDropdown, setActiveActivityDropdown] = useState<number | null>(null);

  const displayName = useMemo(() => {
    if (!user) return t('common.fieldResearcher');
    const metadata = user.user_metadata ?? {};
    return (
      metadata.full_name ||
      metadata.name ||
      (user.email ? user.email.split('@')[0] : t('common.fieldResearcher'))
    );
  }, [t, user]);

  const formattedSeenAt = useMemo(
    () => seenAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    [seenAt]
  );

  const activityLabel = (option: ActivityOption) =>
    t(`observations.activity.${option}` as const);

  const actionLabels = useMemo(
    () => ({
      Observed: t('observations.action.observed'),
      Moved: t('observations.action.moved'),
      Collected: t('observations.action.collected'),
      'Called local agency': t('observations.action.called'),
      Other: t('observations.action.other'),
    }),
    [t]
  );

  const speciesOptions = useMemo(
    () =>
      SPECIES_OPTIONS.map((option) => ({
        ...option,
        translatedName: t(option.nameKey as any),
        translatedDescription: t(option.descriptionKey as any),
      })),
    [t]
  );

  const syncTurtleDetailCount = (desiredCount: number) => {
    setTurtleDetails((prev) => {
      if (desiredCount <= 0) {
        return [createTurtleDetail()];
      }
      if (desiredCount === prev.length) {
        return prev;
      }
      if (desiredCount > prev.length) {
        return [
          ...prev,
          ...Array.from({ length: desiredCount - prev.length }, () => createTurtleDetail()),
        ];
      }
      return prev.slice(0, desiredCount);
    });
    setActiveActivityDropdown((prev) => (prev !== null && prev >= desiredCount ? null : prev));
  };

  const handleCountChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, '');
    setCount(digitsOnly);
    if (!digitsOnly) {
      return;
    }
    const parsed = Number.parseInt(digitsOnly, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      syncTurtleDetailCount(parsed);
    }
  };

  const updateTurtleDetail = (index: number, partial: Partial<TurtleDetail>) => {
    setTurtleDetails((prev) =>
      prev.map((detail, detailIndex) => (detailIndex === index ? { ...detail, ...partial } : detail))
    );
  };

  const handleSpeciesSelect = (index: number, speciesId: SpeciesId) => {
    updateTurtleDetail(index, { speciesId });
  };

  const toggleTurtleActivity = (index: number, option: ActivityOption) => {
    setTurtleDetails((prev) =>
      prev.map((detail, detailIndex) => {
        if (detailIndex !== index) {
          return detail;
        }
        return {
          ...detail,
          activities: { ...detail.activities, [option]: !detail.activities[option] },
        };
      })
    );
  };

  const toggleActivityDropdown = (index: number) => {
    setActiveActivityDropdown((prev) => (prev === index ? null : index));
  };

  const getActivitiesLabel = (detail: TurtleDetail) => {
    const selected = ACTIVITY_OPTIONS.filter((option) => detail.activities[option]).map(activityLabel);
    if (!selected.length) {
      return t('observations.dropdown.placeholder');
    }
    return selected.join(', ');
  };

  const addPhotos = (assets: ImagePicker.ImagePickerAsset[]) => {
    if (!assets.length) return;
    setPhotos((prev) => [
      ...prev,
      ...assets.map((asset) => ({
        uri: asset.uri,
        name:
          asset.fileName ??
          asset.uri.split('/').pop() ??
          `observation_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`,
        mimeType: asset.mimeType ?? undefined,
      })),
    ]);
  };

  const handlePickFromLibrary = async () => {
    setIsPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('observations.alert.permission.library.title'),
          t('observations.alert.permission.library.body')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsMultipleSelection: true,
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled) {
        addPhotos(result.assets);
      }
    } catch (error: any) {
      Alert.alert(
        t('observations.alert.photoPickerError.title'),
        error?.message ?? t('observations.alert.photoPickerError.body')
      );
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsPickingPhoto(true);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert(
          t('observations.alert.permission.camera.title'),
          t('observations.alert.permission.camera.body')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
      });

      if (!result.canceled) {
        addPhotos(result.assets);
      }
    } catch (error: any) {
      Alert.alert(
        t('observations.alert.cameraError.title'),
        error?.message ?? t('observations.alert.cameraError.body')
      );
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          t('observations.alert.permission.location.title'),
          t('observations.alert.permission.location.body')
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch (error: any) {
      Alert.alert(
        t('observations.alert.locationError.title'),
        error?.message ?? t('observations.alert.locationError.body')
      );
    } finally {
      setIsLocating(false);
    }
  };

  const handlePickDateTime = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: seenAt,
        mode: 'date',
        onChange: (event, date) => {
          if (event.type !== 'set' || !date) return;

          const newDate = new Date(date);

          DateTimePickerAndroid.open({
            value: newDate,
            mode: 'time',
            is24Hour: false,
            onChange: (timeEvent, timeDate) => {
              if (timeEvent.type !== 'set' || !timeDate) return;
              const merged = new Date(newDate);
              merged.setHours(timeDate.getHours(), timeDate.getMinutes(), 0, 0);
              setSeenAt(merged);
            },
          });
        },
      });
      return;
    }

    setShowIOSPicker(true);
  };

  const handleIOSDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === 'set' && date) {
      setSeenAt(date);
    }
    if (event.type === 'set' || event.type === 'dismissed') {
      setShowIOSPicker(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert(t('observations.alert.signIn.title'), t('observations.alert.signIn.body'));
      return;
    }

    if (!photos.length) {
      Alert.alert(t('observations.alert.photos.title'), t('observations.alert.photos.body'));
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(t('observations.alert.location.title'), t('observations.alert.location.body'));
      return;
    }

    const countValue = Number.parseInt(count, 10);
    if (Number.isNaN(countValue) || countValue <= 0) {
      Alert.alert(t('observations.alert.count.title'), t('observations.alert.count.body'));
      return;
    }

    if (turtleDetails.length !== countValue) {
      Alert.alert(t('observations.alert.turtleMismatch.title'), t('observations.alert.turtleMismatch.body'));
      return;
    }

    if (actionTaken === 'Other' && !actionOther.trim()) {
      Alert.alert(t('observations.alert.actionOther.title'), t('observations.alert.actionOther.body'));
      return;
    }

    setIsSubmitting(true);

    try {
      const fileUrls: string[] = [];

      for (let index = 0; index < photos.length; index += 1) {
        const photo = photos[index];
        const response = await fetch(photo.uri);
        const arrayBuffer = await response.arrayBuffer();
        const extension =
          (photo.mimeType && photo.mimeType.split('/').pop()) ||
          photo.name.split('.').pop() ||
          'jpg';

        const path = `${user.id}/${Date.now()}_${index}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from(OBSERVATION_BUCKET)
          .upload(path, arrayBuffer, {
            cacheControl: '86400',
            upsert: false,
            contentType: photo.mimeType ?? 'image/jpeg',
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: publicData } = supabase.storage
          .from(OBSERVATION_BUCKET)
          .getPublicUrl(path);

        if (publicData?.publicUrl) {
          fileUrls.push(publicData.publicUrl);
        }
      }

      const baseObservation = {
        user_id: user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name: locationName.trim() || null,
        count: countValue,
        seen_at: seenAt.toISOString(),
        action_taken: actionTaken,
        action_other: actionTaken === 'Other' ? actionOther.trim() : null,
        additional_notes: additionalNotes.trim() || null,
        photo_urls: fileUrls,
      };

      const observationsToInsert = turtleDetails.map((detail, index) => {
        const selectedActivities = ACTIVITY_OPTIONS.filter((option) => detail.activities[option]);
        const trimmedNotes = detail.notes.trim();
        const noteLabel = t('observations.notePrefix', { number: index + 1 });

        return {
          ...baseObservation,
          species_id: detail.speciesId,
          activities: selectedActivities.length ? selectedActivities : null,
          notes:
            trimmedNotes.length > 0
              ? `${noteLabel}: ${trimmedNotes}`
              : countValue > 1
              ? noteLabel
              : null,
        };
      });

      const { error: insertError } = await supabase
        .from(OBSERVATIONS_TABLE)
        .insert(observationsToInsert);

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        t('observations.alert.submissionSuccess.title'),
        t('observations.alert.submissionSuccess.body'),
        [
          {
            text: t('observations.alert.submissionSuccess.cta'),
            style: 'default',
            onPress: () => router.replace('/'),
          },
        ],
        { cancelable: false }
      );

      setPhotos([]);
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setCount('1');
      setTurtleDetails([createTurtleDetail()]);
      setSeenAt(new Date());
      setActiveActivityDropdown(null);
      setActionTaken('Observed');
      setActionOther('');
      setAdditionalNotes('');
    } catch (error: any) {
      Alert.alert(
        t('observations.alert.submissionError.title'),
        error?.message ?? t('observations.alert.submissionError.body')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{t('observations.hero.kicker')}</Text>
          <Text style={styles.title}>{t('observations.hero.title')}</Text>
          <Text style={styles.subtitle}>{t('observations.hero.subtitle', { name: displayName })}</Text>
        </View>

        {/* Step 1 */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>{t('observations.stepLabel', { number: 1 })}</Text>
            <Text style={styles.stepTitle}>{t('observations.step1.title')}</Text>
          </View>
          <Text style={styles.stepInstruction}>{t('observations.step1.instruction')}</Text>
          <Text style={styles.stepSource}>{t('observations.step.source')}</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>{t('observations.step1.warningTitle')}</Text>
            <Text style={styles.warningCopy}>{t('observations.step1.warningCopy')}</Text>
            <Text style={styles.stepSource}>{t('observations.step.source')}</Text>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.uploadButton}
              onPress={handlePickFromLibrary}
              disabled={isPickingPhoto}
            >
              <Text style={styles.uploadButtonText}>
                {isPickingPhoto ? t('observations.photos.choose') : t('observations.photos.choose')}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.uploadButton, styles.primaryUploadButton]}
              onPress={handleTakePhoto}
              disabled={isPickingPhoto}
            >
              <Text style={[styles.uploadButtonText, styles.primaryUploadButtonText]}>
                {isPickingPhoto ? t('observations.photos.take') : t('observations.photos.take')}
              </Text>
            </Pressable>
          </View>
          {photos.length ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable style={styles.photoRemove} onPress={() => removePhoto(index)}>
                    <Text style={styles.photoRemoveText}>{t('observations.photos.remove')}</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Step 2 */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>{t('observations.stepLabel', { number: 2 })}</Text>
            <Text style={styles.stepTitle}>{t('observations.step2.title')}</Text>
          </View>
          <Text style={styles.stepInstruction}>{t('observations.step2.instruction')}</Text>
          <Text style={styles.stepSource}>{t('observations.step.source')}</Text>
          <Pressable
            style={[styles.uploadButton, styles.secondaryButton]}
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator color="#1e3a8a" />
            ) : (
              <Text style={styles.secondaryButtonText}>{t('observations.location.useCurrent')}</Text>
            )}
          </Pressable>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>{t('observations.location.latitude')}</Text>
                <TextInput
                  placeholder={t('observations.location.latPlaceholder')}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  value={latitude}
                  onChangeText={setLatitude}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>{t('observations.location.longitude')}</Text>
                <TextInput
                  placeholder={t('observations.location.lonPlaceholder')}
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  value={longitude}
                  onChangeText={setLongitude}
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>{t('observations.location.nameLabel')}</Text>
              <TextInput
                placeholder={t('observations.location.namePlaceholder')}
                style={styles.input}
                placeholderTextColor="#94a3b8"
                value={locationName}
                onChangeText={setLocationName}
              />
            </View>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>{t('observations.stepLabel', { number: 3 })}</Text>
            <Text style={styles.stepTitle}>{t('observations.step3.title')}</Text>
          </View>
          <Text style={styles.stepInstruction}>{t('observations.step3.instruction')}</Text>
          <Text style={styles.stepSource}>{t('observations.step.source')}</Text>

          <View style={styles.fieldGroup}>
            <View>
              <Text style={styles.label}>{t('observations.count.label')}</Text>
              <TextInput
                placeholder={t('observations.count.placeholder')}
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor="#94a3b8"
                value={count}
                onChangeText={handleCountChange}
              />
            </View>
          </View>

          {turtleDetails.map((detail, index) => {
            const hasSelectedActivities = ACTIVITY_OPTIONS.some((option) => detail.activities[option]);
            return (
              <View key={`turtle-${index}`} style={styles.turtleCard}>
                <Text style={styles.turtleHeader}>
                  {t('observations.turtle.header', { number: index + 1 })}
                </Text>

                <Text style={styles.label}>
                  {t('observations.turtle.speciesLabel', { number: index + 1 })}
                </Text>
                <View style={styles.speciesList}>
                  {speciesOptions.map((option) => {
                    const isSelected = detail.speciesId === option.id;
                    return (
                      <Pressable
                        key={`${option.id}-${index}`}
                        style={[styles.speciesCard, isSelected && styles.speciesCardSelected]}
                        onPress={() => handleSpeciesSelect(index, option.id)}
                      >
                        <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                          {isSelected ? <View style={styles.radioInner} /> : null}
                        </View>
                        <View style={styles.speciesContent}>
                          <Text style={styles.speciesName}>{option.translatedName}</Text>
                          <Text style={styles.speciesDescription}>{option.translatedDescription}</Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>

                <View>
                  <Text style={styles.label}>
                    {t('observations.turtle.activityLabel', { number: index + 1 })}
                  </Text>
                  <Pressable
                    style={[styles.dropdown, activeActivityDropdown === index && styles.dropdownOpen]}
                    onPress={() => toggleActivityDropdown(index)}
                  >
                    <Text
                      style={[styles.dropdownText, !hasSelectedActivities && styles.dropdownPlaceholder]}
                    >
                      {getActivitiesLabel(detail)}
                    </Text>
                  </Pressable>
                  {activeActivityDropdown === index ? (
                    <View style={styles.dropdownOptions}>
                      {ACTIVITY_OPTIONS.map((option) => (
                        <Pressable
                          key={`${option}-${index}`}
                          style={styles.checkboxRow}
                          onPress={() => toggleTurtleActivity(index, option)}
                        >
                          <View
                            style={[
                              styles.checkboxBox,
                              detail.activities[option] && styles.checkboxChecked,
                            ]}
                          >
                            {detail.activities[option] ? <View style={styles.checkboxDot} /> : null}
                          </View>
                          <Text style={styles.checkboxLabel}>{activityLabel(option)}</Text>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </View>

                <View>
                  <Text style={styles.label}>
                    {t('observations.turtle.notesLabel', { number: index + 1 })}
                  </Text>
                  <TextInput
                    multiline
                    numberOfLines={4}
                    placeholder={t('observations.turtle.notesPlaceholder')}
                    style={styles.textArea}
                    placeholderTextColor="#94a3b8"
                    value={detail.notes}
                    onChangeText={(text) => updateTurtleDetail(index, { notes: text })}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>{t('observations.when.title')}</Text>
          <View style={styles.fieldGroup}>
            <Pressable style={styles.datetimeButton} onPress={handlePickDateTime}>
              <Text style={styles.datetimeButtonText}>{formattedSeenAt}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>{t('observations.action.title')}</Text>
          <View style={styles.fieldGroup}>
            {ACTION_OPTIONS.map((option) => (
              <Pressable
                key={option}
                style={styles.radioRow}
                onPress={() => setActionTaken(option)}
              >
                <View style={[styles.radioOuter, actionTaken === option && styles.radioSelected]}>
                  {actionTaken === option ? <View style={styles.radioInner} /> : null}
                </View>
                <Text style={styles.checkboxLabel}>{actionLabels[option]}</Text>
              </Pressable>
            ))}
            {actionTaken === 'Other' ? (
              <TextInput
                placeholder={t('observations.action.otherPlaceholder')}
                style={styles.input}
                placeholderTextColor="#94a3b8"
                value={actionOther}
                onChangeText={setActionOther}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>{t('observations.additional.title')}</Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder={t('observations.additional.placeholder')}
            style={styles.textArea}
            placeholderTextColor="#94a3b8"
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
          />
        </View>

        <Pressable
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#f0fdf4" />
          ) : (
            <Text style={styles.submitButtonText}>{t('observations.submit')}</Text>
          )}
        </Pressable>
      </ScrollView>

      {Platform.OS === 'ios' && showIOSPicker ? (
        <Modal transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerModal}>
              <DateTimePicker
                value={seenAt}
                mode="datetime"
                display="spinner"
                onChange={handleIOSDateChange}
              />
              <Pressable style={styles.pickerDone} onPress={() => setShowIOSPicker(false)}>
                <Text style={styles.pickerDoneText}>{t('common.done')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </>
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
  },
  kicker: {
    color: '#cde5d5',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1.5,
    fontSize: 13,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  step: {
    backgroundColor: '#f7fbf8',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#cde5d5',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    backgroundColor: '#166534',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1.1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f2f24',
  },
  stepInstruction: {
    fontSize: 15,
    color: '#1f3c2f',
    lineHeight: 22,
  },
  stepSource: {
    fontSize: 13,
    color: '#1f4e37',
    fontStyle: 'italic',
  },
  warningBox: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fef3c7',
    gap: 6,
  },
  warningTitle: {
    color: '#92400e',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 13,
  },
  warningCopy: {
    color: '#92400e',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  uploadButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#0f766e',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  uploadButtonText: {
    color: '#0f766e',
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryUploadButton: {
    backgroundColor: '#166534',
    borderColor: '#166534',
  },
  primaryUploadButtonText: {
    color: '#ecfdf3',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoRemove: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  photoRemoveText: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    borderColor: '#0f766e',
    backgroundColor: '#d1fae5',
  },
  secondaryButtonText: {
    color: '#0f2f24',
    fontWeight: '700',
  },
  fieldGroup: {
    gap: 16,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 16,
  },
  fieldHalf: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f2f24',
  },
  input: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f2f24',
    backgroundColor: '#f0f7f2',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f2f24',
    backgroundColor: '#f0f7f2',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  speciesList: {
    gap: 12,
  },
  speciesCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#b5dec6',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#f7fbf8',
  },
  speciesCardSelected: {
    borderColor: '#166534',
    backgroundColor: '#e6f6ed',
  },
  speciesContent: {
    flex: 1,
    gap: 4,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2f24',
  },
  speciesDescription: {
    fontSize: 14,
    color: '#1f3c2f',
  },
  checkboxList: {
    gap: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#86efac',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#166534',
    backgroundColor: '#bbf7d0',
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#14532d',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#0f2f24',
    flex: 1,
  },
  turtleCard: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    backgroundColor: '#f7fbf8',
  },
  turtleHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f2f24',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f7fbf8',
  },
  dropdownOpen: {
    borderColor: '#166534',
  },
  dropdownText: {
    fontSize: 15,
    color: '#0f2f24',
  },
  dropdownPlaceholder: {
    color: '#1f3c2f',
  },
  dropdownOptions: {
    borderWidth: 1,
    borderColor: '#b5dec6',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#f7fbf8',
    marginTop: 8,
    gap: 10,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#86efac',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#14532d',
  },
  radioSelected: {
    borderColor: '#166534',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datetimeButton: {
    borderWidth: 1,
    borderColor: '#14532d',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f0f7f2',
  },
  datetimeButtonText: {
    color: '#0f2f24',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#0f3f2d',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#f0fdf4',
    fontWeight: '700',
    fontSize: 17,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  pickerDone: {
    marginTop: 12,
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563eb',
  },
});
