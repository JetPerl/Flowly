import type { Dispatch, RefObject, SetStateAction } from 'react';
import { Platform } from 'react-native';
import * as ExpoLocation from 'expo-location';
import type MapView from 'react-native-maps';
import type { Region } from 'react-native-maps';

export type LocationCoords = { lat: number; lng: number };
export type ReverseGeocodeResult = {
  title: string;
  subtitle?: string;
  fullLabel: string;
};

type SetState<T> = Dispatch<SetStateAction<T>>;

export type UserLocationEvent = {
  nativeEvent?: {
    coordinate?: {
      latitude: number;
      longitude: number;
    };
  };
};

type LocationOptionsWithTimeout = ExpoLocation.LocationOptions & {
  maximumAge?: number;
  timeout?: number;
};

const LOCATION_OPTIONS: LocationOptionsWithTimeout = {
  accuracy: ExpoLocation.Accuracy.High,
  maximumAge: 0,
  timeInterval: 0,
  timeout: 15000,
  mayShowUserSettingsDialog: true,
};

export const requestLocationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
    return status === ExpoLocation.PermissionStatus.GRANTED;
  } catch (err) {
    console.warn('Не удалось запросить доступ к геолокации', err);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationCoords | null> => {
  if (Platform.OS === 'web') return null;

  return new Promise(resolve => {
    ExpoLocation.getForegroundPermissionsAsync()
      .then(({ status }) => {
        if (status !== ExpoLocation.PermissionStatus.GRANTED) {
          resolve(null);
          return;
        }
        return ExpoLocation.getCurrentPositionAsync(LOCATION_OPTIONS);
      })
      .then(pos => {
        if (!pos) {
          resolve(null);
          return;
        }
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      })
      .catch(err => {
        console.warn('Геолокация не получена', err);
        resolve(null);
      });
  });
};

type ApplyCurrentLocationParams = {
  mapRef: RefObject<MapView | null>;
  runReverseGeocode: (lat: number, lng: number) => Promise<ReverseGeocodeResult | null>;
  setCurrentLocation: SetState<LocationCoords | null>;
  setSelectedLocation: SetState<LocationCoords | null>;
  setMapRegion: SetState<Region>;
  clearLocationResults: () => void;
  setSelectedAddress: SetState<ReverseGeocodeResult | null>;
  updateSelectedOperation: (patch: { place: string }) => void;
  setLocationSearch: (value: string) => void;
  fallbackLocation?: LocationCoords;
  ignoreLocation?: (lat: number, lng: number) => boolean;
  setSelectedLocationFromCurrent?: boolean;
  fillSearchWithResolvedTitle?: boolean;
  applySelection?: boolean;
};

export const applyCurrentLocation = async ({
  mapRef,
  runReverseGeocode,
  setCurrentLocation,
  setSelectedLocation,
  setMapRegion,
  clearLocationResults,
  setSelectedAddress,
  updateSelectedOperation,
  setLocationSearch,
  fallbackLocation,
  ignoreLocation,
  setSelectedLocationFromCurrent = true,
  fillSearchWithResolvedTitle = true,
  applySelection = true,
}: ApplyCurrentLocationParams): Promise<LocationCoords | null> => {
  const coords = await getCurrentLocation();
  if (!coords) {
    if (fallbackLocation) {
      setCurrentLocation(fallbackLocation);
      if (setSelectedLocationFromCurrent) {
        setSelectedLocation(fallbackLocation);
      }
    }
    return fallbackLocation || null;
  }

  if (ignoreLocation && ignoreLocation(coords.lat, coords.lng)) {
    if (!fallbackLocation) {
      return null;
    }
    setCurrentLocation(fallbackLocation);
    if (setSelectedLocationFromCurrent) {
      setSelectedLocation(fallbackLocation);
    }
    const fallbackRegion = {
      latitude: fallbackLocation.lat,
      longitude: fallbackLocation.lng,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    };
    setMapRegion(fallbackRegion);
    mapRef.current?.animateToRegion(fallbackRegion, 280);
    clearLocationResults();
    if (applySelection) {
      const resolved = await runReverseGeocode(fallbackLocation.lat, fallbackLocation.lng);
      if (resolved) {
        setSelectedAddress(resolved);
        updateSelectedOperation({
          place: resolved.fullLabel,
        });
        if (fillSearchWithResolvedTitle) {
          setLocationSearch(resolved.title);
        }
      }
    }
    return fallbackLocation;
  }

  const { lat, lng } = coords;
  setCurrentLocation({ lat, lng });
  if (setSelectedLocationFromCurrent) {
    setSelectedLocation({ lat, lng });
  }
  const region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };
  setMapRegion(region);
  mapRef.current?.animateToRegion(region, 280);
  clearLocationResults();
  if (!applySelection) {
    return coords;
  }
  const resolved = await runReverseGeocode(lat, lng);
  if (resolved) {
    setSelectedAddress(resolved);
    updateSelectedOperation({
      place: resolved.fullLabel,
    });
    if (fillSearchWithResolvedTitle) {
      setLocationSearch(resolved.title);
    }
  }

  return coords;
};

type LocationChangeParams = {
  mapRef: RefObject<MapView | null>;
  runReverseGeocode: (lat: number, lng: number) => Promise<ReverseGeocodeResult | null>;
  setCurrentLocation: SetState<LocationCoords | null>;
  setSelectedLocation: SetState<LocationCoords | null>;
  setMapRegion: SetState<Region>;
  clearLocationResults: () => void;
  setSelectedAddress: SetState<ReverseGeocodeResult | null>;
  updateSelectedOperation: (patch: { place: string }) => void;
  setLocationSearch: (value: string) => void;
  locationLockedByUser: boolean;
  ignoreLocation?: (lat: number, lng: number) => boolean;
  setSelectedLocationFromCurrent?: boolean;
  fillSearchWithResolvedTitle?: boolean;
  applySelection?: boolean;
};

export const createUserLocationChangeHandler =
  ({
    mapRef,
    runReverseGeocode,
    setCurrentLocation,
    setSelectedLocation,
    setMapRegion,
    clearLocationResults,
    setSelectedAddress,
    updateSelectedOperation,
    setLocationSearch,
    locationLockedByUser,
    ignoreLocation,
    setSelectedLocationFromCurrent = true,
    fillSearchWithResolvedTitle = true,
    applySelection = true,
  }: LocationChangeParams) =>
  async (event: UserLocationEvent) => {
    const coord = event?.nativeEvent?.coordinate;
    if (!coord) return;

    if (ignoreLocation && ignoreLocation(coord.latitude, coord.longitude)) {
      return;
    }

    const coords = { lat: coord.latitude, lng: coord.longitude };
    setCurrentLocation(coords);
    if (locationLockedByUser) return;

    const region = {
      latitude: coord.latitude,
      longitude: coord.longitude,
      latitudeDelta: 0.006,
      longitudeDelta: 0.006,
    };

    if (setSelectedLocationFromCurrent) {
      setSelectedLocation(coords);
    }
    setMapRegion(region);
    mapRef.current?.animateToRegion(region, 240);
    clearLocationResults();
    if (!applySelection) {
      return;
    }
    const resolved = await runReverseGeocode(coord.latitude, coord.longitude);
    if (resolved) {
      setSelectedAddress(resolved);
      updateSelectedOperation({ place: resolved.fullLabel });
      if (fillSearchWithResolvedTitle) {
        setLocationSearch(resolved.title);
      }
    }
  };
