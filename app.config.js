module.exports = {
  expo: {
    name: "reel rep plus",
    slug: "reelrep-plus",
    version: "1.0.1",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "reelrepplus",
    userInterfaceStyle: "automatic",
    newArchEnabled: false,
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.reelrepplus.ios",
      buildNumber: "2",
      infoPlist: {
        NSCameraUsageDescription: "האפליקציה צריכה גישה למצלמה כדי לצלם תמונות התקדמות",
        NSMicrophoneUsageDescription: "האפליקציה צריכה גישה למיקרופון",
        NSPhotoLibraryUsageDescription: "האפליקציה צריכה גישה לתמונות כדי לשמור תמונות התקדמות",
        NSUserTrackingUsageDescription: "האפליקציה משתמשת בנתונים לשיפור החוויה שלך"
      },
      associatedDomains: [
        "applinks:reelrepplus.com"
      ]
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.reelrepplus.ios",
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "reelrepplus.com",
              pathPrefix: "/"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ],
      permissions: [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.REQUEST_INSTALL_PACKAGES"
      ]
    },
    web: {
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      [
        "expo-router",
        {
          origin: "https://rork.com/"
        }
      ],
      "expo-font",
      "expo-web-browser",
      [
        "expo-camera",
        {
          cameraPermission: "האפליקציה צריכה גישה למצלמה כדי לצלם תמונות התקדמות",
          microphonePermission: "האפליקציה צריכה גישה למיקרופון",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "האפליקציה צריכה גישה לתמונות כדי לשמור תמונות התקדמות"
        }
      ],
      [
        "expo-notifications",
        {
          color: "#ffffff",
          defaultChannel: "default",
          enableBackgroundRemoteNotifications: true
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    updates: {
      enabled: true,
      url: "https://u.expo.dev/d008d4d4-399d-4a34-84c4-4402d18c5b75",
      requestHeaders: {},
      checkAutomatically: "ALWAYS",
      fallbackToCacheTimeout: 0,
      useEmbeddedUpdate: true,
      assetPatternsToBeBundled: [],
      disableAntiBrickingMeasures: false
    },
    runtimeVersion: "1.0.0",
    extra: {
      router: {
        origin: "https://rork.com/"
      },
      eas: {
        projectId: "d008d4d4-399d-4a34-84c4-4402d18c5b75"
      },
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    }
  }
};
