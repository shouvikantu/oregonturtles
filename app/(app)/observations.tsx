// app/(app)/observations.tsx
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import * as Location from 'expo-location';
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

import { supabase } from '../../supabase';
import { useAuth } from '../_layout';

const ACTIVITY_OPTIONS = ['Basking', 'Nesting', 'Walking', 'Swimming', 'Other'] as const;

const SPECIES_OPTIONS = [
  {
    id: 'red-eared-slider',
    name: 'Red-eared Slider',
    description: 'Non-native, yellow stripes with a red patch behind the eye.',
  },
  {
    id: 'western-painted-turtle',
    name: 'Western Painted Turtle',
    description: 'Native, bright plastron with red/orange edging.',
  },
  {
    id: 'northwestern-pond-turtle',
    name: 'Northwestern (Western) Pond Turtle',
    description: 'Native, muted brown/olive shell with creamy yellow underside.',
  },
  {
    id: 'common-snapping-turtle',
    name: 'Common Snapping Turtle',
    description: 'Non-native, powerful beak, rugged shell, ridged tail.',
  },
  {
    id: 'unknown',
    name: 'Unknown Turtle',
    description: 'Not sure? Choose this and add clues in the notes.',
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

const createActivityState = () =>
  ACTIVITY_OPTIONS.reduce(
    (acc, option) => ({ ...acc, [option]: false }),
    {} as Record<ActivityOption, boolean>
  );

export default function ObservationsScreen() {
  const { user } = useAuth();

  const [photos, setPhotos] = useState<ObservationPhoto[]>([]);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesId>('unknown');
  const [activity, setActivity] = useState<Record<ActivityOption, boolean>>(() => createActivityState());
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locationName, setLocationName] = useState('');
  const [count, setCount] = useState('');
  const [notes, setNotes] = useState('');
  const [seenAt, setSeenAt] = useState<Date>(new Date());
  const [actionTaken, setActionTaken] = useState<ActionOption>('Observed');
  const [actionOther, setActionOther] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isPickingPhoto, setIsPickingPhoto] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false);

  const displayName = useMemo(() => {
    if (!user) return 'field researcher';
    const metadata = user.user_metadata ?? {};
    return (
      metadata.full_name ||
      metadata.name ||
      (user.email ? user.email.split('@')[0] : 'field researcher')
    );
  }, [user]);

  const formattedSeenAt = useMemo(
    () => seenAt.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    [seenAt]
  );

  const toggleActivity = (option: ActivityOption) => {
    setActivity((prev) => ({ ...prev, [option]: !prev[option] }));
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
        Alert.alert('Permission needed', 'Media library access is required to pick photos.');
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
      Alert.alert('Photo picker error', error?.message ?? 'Unable to pick images right now.');
    } finally {
      setIsPickingPhoto(false);
    }
  };

  const handleTakePhoto = async () => {
    setIsPickingPhoto(true);
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (!cameraPermission.granted) {
        Alert.alert('Permission needed', 'Camera access is required to take photos.');
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
      Alert.alert('Camera error', error?.message ?? 'Unable to open the camera right now.');
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
        Alert.alert('Permission needed', 'Location access is required to fill coordinates.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      setLatitude(position.coords.latitude.toFixed(6));
      setLongitude(position.coords.longitude.toFixed(6));
    } catch (error: any) {
      Alert.alert('Location error', error?.message ?? 'Unable to fetch your location.');
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
      Alert.alert('Sign in required', 'Log in to record an observation.');
      return;
    }

    if (!photos.length) {
      Alert.alert('Add photos', 'Please attach at least one clear photo of the turtle(s).');
      return;
    }

    if (!latitude || !longitude) {
      Alert.alert(
        'Location needed',
        'Add coordinates of the sighting or use the current location shortcut.'
      );
      return;
    }

    const countValue = Number.parseInt(count, 10);
    if (Number.isNaN(countValue) || countValue <= 0) {
      Alert.alert('Check turtle count', 'Enter how many turtles you observed (use whole numbers).');
      return;
    }

    if (!selectedSpecies) {
      Alert.alert('Species required', 'Select the turtle that best matches what you saw.');
      return;
    }

    if (actionTaken === 'Other' && !actionOther.trim()) {
      Alert.alert('Add action details', 'Describe the action you took.');
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

      const activitiesSelected = ACTIVITY_OPTIONS.filter((option) => activity[option]);

      const { error: insertError } = await supabase.from(OBSERVATIONS_TABLE).insert({
        user_id: user.id,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        location_name: locationName.trim() || null,
        species_id: selectedSpecies,
        count: countValue,
        activities: activitiesSelected,
        notes: notes.trim() || null,
        seen_at: seenAt.toISOString(),
        action_taken: actionTaken,
        action_other: actionTaken === 'Other' ? actionOther.trim() : null,
        additional_notes: additionalNotes.trim() || null,
        photo_urls: fileUrls,
      });

      if (insertError) {
        throw insertError;
      }

      Alert.alert(
        'Observation submitted',
        'Thank you for supporting Oregon’s turtles!',
        [
          {
            text: 'Go home',
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
      setCount('');
      setNotes('');
      setSeenAt(new Date());
      setActivity(createActivityState());
      setActionTaken('Observed');
      setActionOther('');
      setAdditionalNotes('');
    } catch (error: any) {
      Alert.alert(
        'Submission error',
        error?.message ?? 'We could not save your observation right now.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Observation log</Text>
          <Text style={styles.title}>Share your sighting</Text>
          <Text style={styles.subtitle}>
            Thanks, {displayName}. Follow these steps so our biologists can verify and protect turtle
            habitats.
          </Text>
        </View>

        {/* Step 1 */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>Step 1</Text>
            <Text style={styles.stepTitle}>Upload photo(s)</Text>
          </View>
          <Text style={styles.stepInstruction}>
            Make sure much of the turtle(s) is/are visible including head and belly. If you find
            multiple turtles at once, make sure to include them all.
          </Text>
          <Text style={styles.stepSource}>— oregonturtles.org</Text>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>Warning</Text>
            <Text style={styles.warningCopy}>DO NOT DISTURB THE TURTLE(S) WHILE TAKING PICTURES</Text>
            <Text style={styles.stepSource}>— oregonturtles.org</Text>
          </View>
          <View style={styles.buttonRow}>
            <Pressable
              style={styles.uploadButton}
              onPress={handlePickFromLibrary}
              disabled={isPickingPhoto}
            >
              <Text style={styles.uploadButtonText}>
                {isPickingPhoto ? 'Opening library…' : 'Choose from library'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.uploadButton, styles.primaryUploadButton]}
              onPress={handleTakePhoto}
              disabled={isPickingPhoto}
            >
              <Text style={[styles.uploadButtonText, styles.primaryUploadButtonText]}>
                {isPickingPhoto ? 'Launching camera…' : 'Take a photo'}
              </Text>
            </Pressable>
          </View>
          {photos.length ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={`${photo.uri}-${index}`} style={styles.photoItem}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable style={styles.photoRemove} onPress={() => removePhoto(index)}>
                    <Text style={styles.photoRemoveText}>Remove</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {/* Step 2 */}
        <View style={styles.step}>
          <View style={styles.stepHeader}>
            <Text style={styles.stepBadge}>Step 2</Text>
            <Text style={styles.stepTitle}>Where did you see the turtle(s)?</Text>
          </View>
          <Text style={styles.stepInstruction}>
            Navigate to the location using the map and drop a pin there. Zoom in to be as accurate as
            possible.
          </Text>
          <Text style={styles.stepSource}>— oregonturtles.org</Text>
          <Pressable
            style={[styles.uploadButton, styles.secondaryButton]}
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator color="#1e3a8a" />
            ) : (
              <Text style={styles.secondaryButtonText}>Use my current location</Text>
            )}
          </Pressable>
          <View style={styles.fieldGroup}>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Latitude</Text>
                <TextInput
                  placeholder="45.5231"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  value={latitude}
                  onChangeText={setLatitude}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>Longitude</Text>
                <TextInput
                  placeholder="-122.6765"
                  keyboardType="decimal-pad"
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  value={longitude}
                  onChangeText={setLongitude}
                />
              </View>
            </View>
            <View>
              <Text style={styles.label}>Location name (optional)</Text>
              <TextInput
                placeholder="Crystal Springs Rhododendron Garden"
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
            <Text style={styles.stepBadge}>Step 3</Text>
            <Text style={styles.stepTitle}>Try to identify the turtle(s)</Text>
          </View>
          <Text style={styles.stepInstruction}>
            To add a turtle sighting, find the turtle that looks like the one you saw and tap on the
            picture. If you need help, select the Turtle ID tool. If you still don’t know, choose
            Unknown Turtle.
          </Text>
          <Text style={styles.stepSource}>— oregonturtles.org</Text>

          <View style={styles.speciesList}>
            {SPECIES_OPTIONS.map((option) => {
              const isSelected = selectedSpecies === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.speciesCard, isSelected && styles.speciesCardSelected]}
                  onPress={() => setSelectedSpecies(option.id)}
                >
                  <View style={[styles.radioOuter, isSelected && styles.radioSelected]}>
                    {isSelected ? <View style={styles.radioInner} /> : null}
                  </View>
                  <View style={styles.speciesContent}>
                    <Text style={styles.speciesName}>{option.name}</Text>
                    <Text style={styles.speciesDescription}>{option.description}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.fieldGroup}>
            <View>
              <Text style={styles.label}>How many?</Text>
              <TextInput
                placeholder="1"
                keyboardType="number-pad"
                style={styles.input}
                placeholderTextColor="#94a3b8"
                value={count}
                onChangeText={setCount}
              />
            </View>
            <View>
              <Text style={styles.label}>What were they doing?</Text>
              <View style={styles.checkboxList}>
                {ACTIVITY_OPTIONS.map((option) => (
                  <Pressable
                    key={option}
                    style={styles.checkboxRow}
                    onPress={() => toggleActivity(option)}
                  >
                    <View style={[styles.checkboxBox, activity[option] && styles.checkboxChecked]}>
                      {activity[option] ? <View style={styles.checkboxDot} /> : null}
                    </View>
                    <Text style={styles.checkboxLabel}>{option}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                multiline
                numberOfLines={4}
                placeholder="Describe markings, behavior, or anything notable."
                style={styles.textArea}
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>When did you see these turtles?</Text>
          <View style={styles.fieldGroup}>
            <Pressable style={styles.datetimeButton} onPress={handlePickDateTime}>
              <Text style={styles.datetimeButtonText}>{formattedSeenAt}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>Action taken</Text>
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
                <Text style={styles.checkboxLabel}>{option}</Text>
              </Pressable>
            ))}
            {actionTaken === 'Other' ? (
              <TextInput
                placeholder="If other, please explain."
                style={styles.input}
                placeholderTextColor="#94a3b8"
                value={actionOther}
                onChangeText={setActionOther}
              />
            ) : null}
          </View>
        </View>

        <View style={styles.step}>
          <Text style={styles.stepTitle}>Additional notes</Text>
          <TextInput
            multiline
            numberOfLines={5}
            placeholder="Anything else we should know about the sighting?"
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
            <Text style={styles.submitButtonText}>Submit observation</Text>
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
                <Text style={styles.pickerDoneText}>Done</Text>
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
    backgroundColor: '#e2e8f0',
  },
  hero: {
    backgroundColor: '#1e3a8a',
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  kicker: {
    color: '#bfdbfe',
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
    color: 'rgba(255,255,255,0.78)',
  },
  step: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
    gap: 16,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBadge: {
    backgroundColor: '#1e3a8a',
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
    color: '#0f172a',
  },
  stepInstruction: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  stepSource: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  warningBox: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#fee2e2',
    gap: 6,
  },
  warningTitle: {
    color: '#b91c1c',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 13,
  },
  warningCopy: {
    color: '#7f1d1d',
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
    borderColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  uploadButtonText: {
    color: '#2563eb',
    fontWeight: '700',
    textAlign: 'center',
  },
  primaryUploadButton: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  primaryUploadButtonText: {
    color: '#fff',
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
    borderColor: '#1e3a8a',
    backgroundColor: '#e0e7ff',
  },
  secondaryButtonText: {
    color: '#1e3a8a',
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
    color: '#1e293b',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#cbd5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  speciesList: {
    gap: 12,
  },
  speciesCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#cbd5f5',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  speciesCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#e0f2fe',
  },
  speciesContent: {
    flex: 1,
    gap: 4,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  speciesDescription: {
    fontSize: 14,
    color: '#475569',
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
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: '#2563eb',
    backgroundColor: '#dbeafe',
  },
  checkboxDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#334155',
    flex: 1,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#94a3b8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#2563eb',
  },
  radioSelected: {
    borderColor: '#2563eb',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  datetimeButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  datetimeButtonText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#14532d',
    shadowOpacity: 0.18,
    shadowRadius: 16,
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
