import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';

interface NetworkState {
  isOnline: boolean;
  pendingSales: number;
  isSyncing: boolean;
  setOnline: (online: boolean) => void;
  setPendingSales: (count: number) => void;
  setSyncing: (syncing: boolean) => void;
  init: () => () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isOnline: true,
  pendingSales: 0,
  isSyncing: false,

  setOnline: (online) => set({ isOnline: online }),
  setPendingSales: (count) => set({ pendingSales: count }),
  setSyncing: (syncing) => set({ isSyncing: syncing }),

  init: () => {
    // Listener inicial
    NetInfo.fetch().then((state) => {
      set({ isOnline: state.isConnected === true && state.isInternetReachable !== false });
    });

    // Suscripción continua
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      set({ isOnline: online });
    });

    return unsubscribe;
  },
}));
