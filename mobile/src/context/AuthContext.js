/**
 * Global auth — token persistence + Socket.IO lifecycle for notifications.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io } from 'socket.io-client';
import api, { getSocketUrl } from '../services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'fmh_token';
const USER_KEY = 'fmh_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const connectSocket = useCallback(() => {
    disconnectSocket();
    const s = io(getSocketUrl(), { transports: ['websocket'] });
    s.on('order:update', (payload) => {
      Alert.alert('Order update', payload?.message || 'Your order changed status.');
    });
    s.on('delivery:update', (payload) => {
      Alert.alert(
        'Delivery update',
        `Delivery ${payload?.deliveryStatus || ''} for order-related task.`
      );
    });
    socketRef.current = s;
  }, [disconnectSocket]);

  const hydrate = async () => {
    try {
      const [tokenJson, userJson] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (tokenJson && userJson) {
        setUser(JSON.parse(userJson));
        connectSocket();
      }
    } catch (e) {
      console.warn('hydrate auth', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrate();
    return () => disconnectSocket();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (!data.success) throw new Error(data.message || 'Login failed');
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY, JSON.stringify(data.user)],
    ]);
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const register = async ({ name, email, password, role }) => {
    const { data } = await api.post('/auth/register', { name, email, password, role });
    if (!data.token || !data.user) throw new Error(data.message || 'Register failed');
    await AsyncStorage.multiSet([
      [TOKEN_KEY, data.token],
      [USER_KEY, JSON.stringify(data.user)],
    ]);
    setUser(data.user);
    connectSocket();
    return data.user;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setUser(null);
    disconnectSocket();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      isRole: (...roles) => user && roles.includes(user.role),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
