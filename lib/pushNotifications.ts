import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";
import { handleNotificationNavigation, NotificationData } from "@/lib/deepLinking";
import { createLogger } from "@/lib/logger";
import { analyticsService } from "@/lib/analytics";

const logger = createLogger('PushNotifications');

type TokenCallback = (token: string, userId?: string) => void | Promise<void>;

let tokenCallback: TokenCallback | null = null;
let notificationListeners: {
  received?: Notifications.Subscription;
  response?: Notifications.Subscription;
} = {};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(
  userId?: string
): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      logger.warn("Failed to get push token - permission denied");
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;

    if (!projectId) {
      logger.error("Project ID not found in app config");
      return;
    }

    try {
      const pushTokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      token = pushTokenData.data;
      logger.info("Push token obtained:", token);

      if (token && userId) {
        await savePushToken(token, userId);
      }

      if (tokenCallback && token) {
        logger.info("Sending token to callback");
        await tokenCallback(token, userId);
      }
    } catch (error) {
      logger.error("Error getting push token:", error);
    }
  } else {
    logger.warn("Must use physical device for Push Notifications");
  }

  return token;
}

export function setupNotificationListeners() {
  notificationListeners.received =
    Notifications.addNotificationReceivedListener((notification) => {
      logger.info("Notification received", {
        title: notification.request.content.title,
        body: notification.request.content.body,
        data: notification.request.content.data
      });
    });

  notificationListeners.response =
    Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as NotificationData;

      logger.info("Notification tapped", {
        action: response.actionIdentifier,
        data
      });

      // Handle navigation when notification is tapped
      if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        handleNotificationNavigation(data);
      }
    });

  logger.info("Notification listeners setup complete");
}

export function removeNotificationListeners() {
  if (notificationListeners.received) {
    notificationListeners.received.remove();
    logger.info("Removed notification received listener");
  }

  if (notificationListeners.response) {
    notificationListeners.response.remove();
    logger.info("Removed notification response listener");
  }

  notificationListeners = {};
}

export function setTokenCallback(callback: TokenCallback) {
  logger.info("Token callback registered");
  tokenCallback = callback;
}

export async function savePushToken(token: string, userId: string) {
  try {
    logger.info("Saving push token to Supabase...");

    const deviceType = Platform.select({
      ios: "ios",
      android: "android",
      web: "web",
      default: "unknown",
    });

    const { error } = await supabase.from("push_tokens").upsert(
      {
        user_id: userId,
        token: token,
        device_type: deviceType,
        updated_at: new Date().toISOString(),
        last_used_at: new Date().toISOString(),
      },
      {
        onConflict: "token",
      }
    );

    if (error) {
      logger.error("Error saving push token:", error.message);
    } else {
      logger.info("Push token saved successfully");
    }
  } catch (error) {
    logger.error("Error saving push token:", error);
  }
}

export async function initializeNotifications(
  userId?: string,
  onTokenReceived?: TokenCallback
) {
  logger.info("Initializing push notifications...");

  if (onTokenReceived) {
    setTokenCallback(onTokenReceived);
  }

  setupNotificationListeners();

  const token = await registerForPushNotificationsAsync(userId);

  return token;
}

export function cleanupNotifications() {
  logger.info("Cleaning up notifications...");
  removeNotificationListeners();
  tokenCallback = null;
}
