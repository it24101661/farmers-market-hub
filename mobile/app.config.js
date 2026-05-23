export default {
  expo: {
    name: "Farmers Market Hub",
    slug: "farmers-market-hub",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    plugins: [
      "expo-image"
    ],
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    android: {
      package: "com.sasindi123.farmersmarkethub",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      }
    },
    ios: {
      bundleIdentifier: "com.sasindi123.farmersmarkethub",
      supportsTablet: true
    },
    extra: {
      apiUrl: "https://farmers-market-hub.onrender.com/api",
      socketUrl: "https://farmers-market-hub.onrender.com",
      eas: {
        projectId: "ad327b03-d458-4454-948a-e79cc28e8e71"
      }
    }
  }
};