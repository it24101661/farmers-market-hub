export default {
  expo: {
    name: 'Farmers Market Hub',
    slug: 'farmers-market-hub',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    plugins: [
      "expo-image"
    ],
    splash: {
      resizeMode: 'contain',
      backgroundColor: '#e8f5e9',
    },
    ios: {
      supportsTablet: true,
    },
    android: {},
    extra: {
      apiUrl: "http://192.168.8.147:5000/api",
      socketUrl: "http://192.168.8.147:5000",
    }
  },
};