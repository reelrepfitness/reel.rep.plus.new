/**
 * Deep Linking Service
 * Handles navigation from push notifications and external links
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { createLogger } from './logger';

const logger = createLogger('DeepLinking');

export interface NotificationData {
  screen?: string;
  params?: Record<string, any>;
  // Common notification types
  type?: 'meal' | 'workout' | 'measurement' | 'guide' | 'general';
  id?: string;
}

/**
 * Handle navigation from notification tap
 */
export function handleNotificationNavigation(data: NotificationData) {
  try {
    logger.info('Handling notification navigation:', data);

    if (!data || !data.screen) {
      logger.warn('No screen specified in notification data');
      // Default to home if no screen specified
      router.push('/(tabs)/home');
      return;
    }

    const { screen, params } = data;

    // Route mapping based on notification data
    switch (screen) {
      case 'meal-plan':
      case 'meals':
        router.push('/meal-plan');
        break;

      case 'measurements':
        router.push('/measurements');
        break;

      case 'guides':
        if (params?.guideId) {
          router.push(`/guides?id=${params.guideId}`);
        } else {
          router.push('/guides');
        }
        break;

      case 'profile':
        router.push('/(tabs)/profile');
        break;

      case 'food-bank':
        router.push('/food-bank');
        break;

      case 'barcode':
        router.push('/barcode');
        break;

      case 'restaurants':
        if (params?.restaurantId) {
          router.push(`/restaurant-menu?id=${params.restaurantId}`);
        } else {
          router.push('/restaurants');
        }
        break;

      case 'admin-notifications':
        router.push('/admin-notifications');
        break;

      case 'admin-dashboard':
        router.push('/admin-dashboard');
        break;

      case 'admin-clients':
        if (params?.clientId) {
          router.push(`/admin-edit-client?id=${params.clientId}`);
        } else {
          router.push('/admin-clients');
        }
        break;

      case 'home':
      default:
        router.push('/(tabs)/home');
        break;
    }

    logger.info(`Navigated to: ${screen}`);
  } catch (error) {
    logger.error('Error handling notification navigation:', error);
    // Fallback to home screen on error
    router.push('/(tabs)/home');
  }
}

/**
 * Handle deep link from external source (URL)
 */
export function handleDeepLink(url: string) {
  try {
    logger.info('Handling deep link:', url);

    const { hostname, path, queryParams } = Linking.parse(url);

    logger.info('Parsed link:', { hostname, path, queryParams });

    if (!path) {
      router.push('/(tabs)/home');
      return;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // Handle different deep link paths
    if (cleanPath === 'meal-plan' || cleanPath === 'meals') {
      router.push('/meal-plan');
    } else if (cleanPath === 'measurements') {
      router.push('/measurements');
    } else if (cleanPath === 'guides') {
      if (queryParams?.id) {
        router.push(`/guides?id=${queryParams.id}`);
      } else {
        router.push('/guides');
      }
    } else if (cleanPath === 'profile') {
      router.push('/(tabs)/profile');
    } else if (cleanPath.startsWith('admin')) {
      router.push(`/${cleanPath}`);
    } else {
      router.push('/(tabs)/home');
    }
  } catch (error) {
    logger.error('Error handling deep link:', error);
    router.push('/(tabs)/home');
  }
}

/**
 * Initialize deep linking listeners
 */
export function initializeDeepLinking() {
  // Handle initial URL if app was opened from a link
  Linking.getInitialURL().then((url) => {
    if (url) {
      logger.info('App opened with URL:', url);
      handleDeepLink(url);
    }
  });

  // Listen for incoming links while app is running
  const subscription = Linking.addEventListener('url', ({ url }) => {
    logger.info('Received deep link:', url);
    handleDeepLink(url);
  });

  return () => {
    subscription.remove();
  };
}

/**
 * Build notification payload for sending
 */
export function buildNotificationPayload(
  title: string,
  message: string,
  screen: string,
  params?: Record<string, any>
): { title: string; body: string; data: NotificationData } {
  return {
    title,
    body: message,
    data: {
      screen,
      params: params || {},
    },
  };
}
