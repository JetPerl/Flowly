import Constants from 'expo-constants';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;
const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
const DEFAULT_URL = debuggerHost ? `http://${debuggerHost}:8080` : 'http://localhost:8080';

export const API_BASE_URL = ENV_API_URL || DEFAULT_URL;
export const API_PREFIX = '/api/v1';