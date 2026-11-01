import { Platform } from 'react-native';

// Для симулятора iOS на Mac используется localhost, для реального девайса — IP вашей Wi-Fi сети
export const API_BASE_URL = Platform.OS === 'ios' 
  ? 'http://localhost:8080' 
  : 'http://192.168.0.135:8080';