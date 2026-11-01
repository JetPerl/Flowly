import 'react-native-gesture-handler';
import 'react-native-reanimated';
import React, {useCallback} from 'react';

// Require Reanimated as CJS module so we can attach missing exports before other imports run.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Reanimated = require('react-native-reanimated');

if (!Reanimated.useWorkletCallback) {
  // Polyfill useWorkletCallback for libs (e.g. bottom-sheet) expecting it.
  const polyfill = (fn, deps) =>
    useCallback((...args) => {
      'worklet';
      return fn(...args);
    }, deps ?? []);

  Reanimated.useWorkletCallback = polyfill;
  // ensure default export also carries the polyfill if consumers reach there
  if (Reanimated.default && !Reanimated.default.useWorkletCallback) {
    Reanimated.default.useWorkletCallback = polyfill;
  }
}

// Allow passing Google Maps key via env (useful for JS geocoding/search requests)
const expoPublicGoogleMapsKey =
  process?.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? process?.env?.GOOGLE_MAPS_API_KEY;

if (!globalThis.GOOGLE_MAPS_API_KEY && expoPublicGoogleMapsKey) {
  globalThis.GOOGLE_MAPS_API_KEY = expoPublicGoogleMapsKey;
}

// Load the Expo Router entry after polyfills/env setup.
import 'expo-router/entry';
