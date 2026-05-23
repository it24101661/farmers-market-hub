/**
 * Axios client — JWT attached from AsyncStorage on every request.
 */
import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const baseURL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('fmh_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Base URL without /api suffix — for sockets */
export function getSocketUrl() {
  return Constants.expoConfig?.extra?.socketUrl || 'http://localhost:5000';
}

export default api;
