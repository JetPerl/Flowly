import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'flowly:avatarUri';
const DEFAULT_AVATAR = require('../../assets/icon.png');

type AvatarContextValue = {
  avatarUri: string | null;
  avatarSource: { uri: string } | number;
  setAvatar: (uri: string | null) => Promise<void>;
  resetAvatar: () => Promise<void>;
  loading: boolean;
};

const AvatarContext = createContext<AvatarContextValue | undefined>(undefined);

export const AvatarProvider = ({ children }: { children: ReactNode }) => {
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) setAvatarUri(stored);
      } catch (e) {
        console.warn('Avatar load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const persist = useCallback(async (uri: string | null) => {
    try {
      if (uri) {
        await AsyncStorage.setItem(STORAGE_KEY, uri);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Avatar persist error', e);
    }
  }, []);

  const setAvatar = useCallback(
    async (uri: string | null) => {
      setAvatarUri(uri);
      await persist(uri);
    },
    [persist],
  );

  const resetAvatar = useCallback(async () => {
    await setAvatar(null);
  }, [setAvatar]);

  const avatarSource = useMemo(
    () => (avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR),
    [avatarUri],
  );

  const value = useMemo<AvatarContextValue>(
    () => ({
      avatarUri,
      avatarSource,
      setAvatar,
      resetAvatar,
      loading,
    }),
    [avatarUri, avatarSource, setAvatar, resetAvatar, loading],
  );

  return <AvatarContext.Provider value={value}>{children}</AvatarContext.Provider>;
};

export const useAvatar = (): AvatarContextValue => {
  const ctx = useContext(AvatarContext);
  if (!ctx) {
    throw new Error('useAvatar must be used within AvatarProvider');
  }
  return ctx;
};

export { DEFAULT_AVATAR };