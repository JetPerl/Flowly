import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// @ts-ignore
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import CrossIcon from '../../../../assets/icons/menu/cross.svg';
import CheckIcon from '../../../../assets/icons/menu/check.svg';
import { GlassButton } from '../../../../src/components/LiquidHeaderActions';
import {
  getCurrentLocation,
  requestLocationPermission,
  type ReverseGeocodeResult,
  type UserLocationEvent,
} from '../../../../src/location/locationService';
import { useTransactionDraft } from './_TransactionDraftContext';

type LocationSearchResult = {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
};

const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';
const NOMINATIM_USER_AGENT = 'FlowlyApp/1.0';

const COLORS = {
  textMain: '#212121',
  textSecondary: '#757575',
  purple: '#2BAF8C',
};

const defaultRegion: Region = {
  latitude: 53.9023,
  longitude: 27.5619,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

const runNominatimSearch = async (
  query: string,
  region?: Region,
  limit = 12,
): Promise<LocationSearchResult[]> => {
  const params = [
    'format=jsonv2',
    'addressdetails=0',
    `limit=${limit}`,
    'accept-language=ru',
    `q=${encodeURIComponent(query)}`,
  ];

  if (region) {
    const latHalf = region.latitudeDelta / 2;
    const lngHalf = region.longitudeDelta / 2;
    const north = region.latitude + latHalf;
    const south = region.latitude - latHalf;
    const east = region.longitude + lngHalf;
    const west = region.longitude - lngHalf;
    params.push('bounded=1', `viewbox=${west},${north},${east},${south}`);
  }

  const url = `${NOMINATIM_ENDPOINT}/search?${params.join('&')}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': NOMINATIM_USER_AGENT } });
    if (!res.ok) {
      console.warn('Nominatim search status', res.status);
      return [];
    }
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .map((item: any) => {
        const latNum = Number(item?.lat);
        const lngNum = Number(item?.lon);
        if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return null;
        const display = typeof item?.display_name === 'string' ? item.display_name : '';
        const [firstLine, ...rest] = display
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean);
        const title = item?.name || firstLine || query;
        const subtitle = rest.join(', ');
        return {
          title,
          subtitle,
          lat: latNum,
          lng: lngNum,
        };
      })
      .filter(Boolean) as LocationSearchResult[];
  } catch (err) {
    console.warn('Nominatim search error', err);
    return [];
  }
};

const formatAddressLabel = (title: string, subtitle?: string) =>
  subtitle ? `${title}, ${subtitle}` : title;

export default function TransactionLocationScreen() {
  const router = useRouter();
  const { draft, setPlace } = useTransactionDraft();
  const [mapRegion, setMapRegion] = useState<Region>(defaultRegion);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(
    draft.placeLat && draft.placeLng
      ? { lat: draft.placeLat, lng: draft.placeLng }
      : null,
  );
  const [selectedAddress, setSelectedAddress] = useState<ReverseGeocodeResult | null>(null);
  const [locationSearch, setLocationSearch] = useState('');
  const [locationResults, setLocationResults] = useState<LocationSearchResult[]>([]);
  const [locationSearchLoading, setLocationSearchLoading] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    requestLocationPermission()
      .then(granted => setLocationPermissionGranted(granted))
      .catch(err => console.warn('Location permission error', err));
  }, []);

  useEffect(() => {
    if (!locationPermissionGranted) return;
    getCurrentLocation()
      .then(coords => {
        if (!coords) return;
        setMapRegion({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        setSelectedLocation({ lat: coords.lat, lng: coords.lng });
        mapRef.current?.animateToRegion?.({
          latitude: coords.lat,
          longitude: coords.lng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
      })
      .catch(err => console.warn('Location error', err));
  }, [locationPermissionGranted]);

  const handleUserLocationChange = useCallback(
    (event: UserLocationEvent) => {
      const coord = event?.nativeEvent?.coordinate;
      if (!coord) return;

      setMapRegion(prev => ({
        latitude: coord.latitude,
        longitude: coord.longitude,
        latitudeDelta: prev.latitudeDelta,
        longitudeDelta: prev.longitudeDelta,
      }));
    },
    [],
  );

  const selectLocationResult = (item: LocationSearchResult) => {
    setSelectedLocation({ lat: item.lat, lng: item.lng });
    setSelectedAddress({
      title: item.title,
      subtitle: item.subtitle,
      fullLabel: formatAddressLabel(item.title, item.subtitle),
    });
    setLocationResults([]);
    setLocationSearch(item.title);
    mapRef.current?.animateToRegion?.({
      latitude: item.lat,
      longitude: item.lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    });
  };

  const handleSave = () => {
    if (selectedAddress && selectedLocation) {
      setPlace(
        formatAddressLabel(selectedAddress.title, selectedAddress.subtitle),
        selectedLocation.lat,
        selectedLocation.lng,
      );
    } else if (selectedLocation) {
      setPlace('Выбранная точка', selectedLocation.lat, selectedLocation.lng);
    }
    router.back();
  };

  const handleSearch = useCallback(
    async (query: string) => {
      const normalized = query.trim();
      if (!normalized) {
        setLocationResults([]);
        return;
      }
      setLocationSearchLoading(true);
      const results = await runNominatimSearch(normalized, mapRegion);
      setLocationResults(results);
      setLocationSearchLoading(false);
    },
    [mapRegion],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Место',
        }}
      />

      <View style={styles.header}>
        <GlassButton
          size={44}
          onPress={() => router.back()}
          icon={<CrossIcon width={20} height={20} stroke={COLORS.textMain} />}
        />
        <Text style={styles.headerTitle}>Место</Text>
        <GlassButton
          size={44}
          onPress={handleSave}
          disabled={!selectedLocation}
          icon={
            <CheckIcon
              width={18}
              height={18}
              stroke={selectedLocation ? COLORS.textMain : COLORS.textSecondary}
            />
          }
        />
      </View>

      <View style={styles.searchWrapper}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Выберите место или адрес"
          placeholderTextColor={COLORS.textSecondary}
          value={locationSearch}
          onChangeText={text => {
            setLocationSearch(text);
            setLocationResults([]);
          }}
          onSubmitEditing={e => handleSearch(e.nativeEvent.text)}
          returnKeyType="search"
        />
        {locationSearchLoading ? (
          <ActivityIndicator size="small" color={COLORS.purple} style={{ marginLeft: 6 }} />
        ) : null}
        {locationSearch.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setLocationSearch('');
              setLocationResults([]);
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <CrossIcon width={16} height={16} stroke={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={mapRegion}
          onRegionChangeComplete={region => setMapRegion(region)}
          showsUserLocation
          followsUserLocation
          onUserLocationChange={handleUserLocationChange}
          onLongPress={e => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            setSelectedLocation({ lat: latitude, lng: longitude });
            setSelectedAddress(null);
          }}
        >
          {selectedLocation ? (
            <Marker
              coordinate={{
                latitude: selectedLocation.lat,
                longitude: selectedLocation.lng,
              }}
            />
          ) : null}
        </MapView>
        <LinearGradient
          colors={[
            'rgba(255,255,255,0.96)',
            'rgba(255,255,255,0.88)',
            'rgba(255,255,255,0.0)',
          ]}
          style={styles.mapGradient}
          pointerEvents="none"
        />
      </View>

      {locationResults.length > 0 ? (
        <View style={styles.suggestions}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {locationResults.map((item, idx) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lng}-${idx}`}
                style={styles.suggestionRow}
                activeOpacity={0.7}
                onPress={() => selectLocationResult(item)}
              >
                <Text style={styles.suggestionTitle}>{item.title}</Text>
                <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.infoCard}>
        {selectedAddress ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoPin}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>{selectedAddress.title}</Text>
              {selectedAddress.subtitle ? (
                <Text style={styles.infoSubtitle}>{selectedAddress.subtitle}</Text>
              ) : null}
            </View>
          </View>
        ) : selectedLocation ? (
          <Text style={styles.infoPlaceholder}>Выбрана точка на карте</Text>
        ) : (
          <Text style={styles.infoPlaceholder}>Долгий тап по карте или выберите подсказку</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textMain,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    backgroundColor: '#F7F7F9',
    marginBottom: 10,
  },
  searchIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.textMain,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  suggestions: {
    position: 'absolute',
    top: 150,
    left: 16,
    right: 16,
    maxHeight: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  suggestionRow: {
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  infoCard: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoPin: {
    fontSize: 18,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textMain,
  },
  infoSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoPlaceholder: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
});
