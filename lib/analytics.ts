/**
 * Analytics Service
 * Centralized event tracking using Firebase Analytics
 */

import analytics from '@react-native-firebase/analytics';
import { createLogger } from './logger';

const logger = createLogger('Analytics');

class AnalyticsService {
  private enabled: boolean = true;

  /**
   * Initialize analytics (called on app start)
   */
  async initialize() {
    try {
      await analytics().setAnalyticsCollectionEnabled(this.enabled);
      logger.info('Analytics initialized');
    } catch (error) {
      logger.error('Analytics initialization error:', error);
    }
  }

  /**
   * Enable or disable analytics collection
   */
  async setEnabled(enabled: boolean) {
    try {
      this.enabled = enabled;
      await analytics().setAnalyticsCollectionEnabled(enabled);
      logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      logger.error('Error setting analytics enabled state:', error);
    }
  }

  /**
   * Log a screen view
   */
  async logScreenView(screenName: string, screenClass?: string) {
    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
      logger.debug(`Screen view: ${screenName}`);
    } catch (error) {
      logger.error('Analytics screen view error:', error);
    }
  }

  /**
   * Log a custom event
   */
  async logEvent(eventName: string, params?: Record<string, any>) {
    try {
      await analytics().logEvent(eventName, params);
      logger.debug(`Event: ${eventName}`, params);
    } catch (error) {
      logger.error('Analytics event error:', error);
    }
  }

  /**
   * Set user ID for tracking
   */
  async setUserId(userId: string | null) {
    try {
      await analytics().setUserId(userId);
      logger.debug(`User ID set: ${userId || 'null'}`);
    } catch (error) {
      logger.error('Analytics setUserId error:', error);
    }
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string) {
    try {
      await analytics().setUserProperty(name, value);
      logger.debug(`User property set: ${name} = ${value}`);
    } catch (error) {
      logger.error('Analytics setUserProperty error:', error);
    }
  }

  // ===== AUTHENTICATION EVENTS =====

  async logSignUp(method: 'email' | 'google' | 'apple') {
    await this.logEvent('sign_up', { method });
  }

  async logLogin(method: 'email' | 'google' | 'apple') {
    await this.logEvent('login', { method });
  }

  async logLogout() {
    await this.logEvent('logout');
  }

  // ===== USER ENGAGEMENT EVENTS =====

  async logAppOpen() {
    await this.logEvent('app_open');
  }

  async logSessionStart() {
    await this.logEvent('session_start');
  }

  // ===== MEAL & NUTRITION EVENTS =====

  async logMealCreated(mealType?: string) {
    await this.logEvent('meal_created', { meal_type: mealType });
  }

  async logMealEdited() {
    await this.logEvent('meal_edited');
  }

  async logMealDeleted() {
    await this.logEvent('meal_deleted');
  }

  async logFoodAdded(category?: string) {
    await this.logEvent('food_added', { category });
  }

  async logMealPlanViewed() {
    await this.logEvent('meal_plan_viewed');
  }

  async logNutritionGoalSet(goalType: string, value: number) {
    await this.logEvent('nutrition_goal_set', { goal_type: goalType, value });
  }

  // ===== WORKOUT EVENTS =====

  async logWorkoutStarted(workoutType?: string) {
    await this.logEvent('workout_started', { workout_type: workoutType });
  }

  async logWorkoutCompleted(workoutType?: string, duration?: number) {
    await this.logEvent('workout_completed', {
      workout_type: workoutType,
      duration_minutes: duration,
    });
  }

  // ===== MEASUREMENT EVENTS =====

  async logMeasurementRecorded(measurementType: string) {
    await this.logEvent('measurement_recorded', { measurement_type: measurementType });
  }

  async logProgressPhotoUploaded() {
    await this.logEvent('progress_photo_uploaded');
  }

  // ===== NOTIFICATION EVENTS =====

  async logNotificationReceived(notificationType?: string) {
    await this.logEvent('notification_received', { notification_type: notificationType });
  }

  async logNotificationOpened(screen?: string) {
    await this.logEvent('notification_opened', { target_screen: screen });
  }

  async logNotificationPermissionGranted() {
    await this.logEvent('notification_permission_granted');
  }

  async logNotificationPermissionDenied() {
    await this.logEvent('notification_permission_denied');
  }

  // ===== ADMIN EVENTS =====

  async logAdminNotificationSent(recipientCount: number) {
    await this.logEvent('admin_notification_sent', { recipient_count: recipientCount });
  }

  async logClientAdded() {
    await this.logEvent('admin_client_added');
  }

  async logClientEdited() {
    await this.logEvent('admin_client_edited');
  }

  // ===== FEATURE USAGE EVENTS =====

  async logBarcodeScanned(success: boolean) {
    await this.logEvent('barcode_scanned', { success });
  }

  async logAIPhotoAnalysisUsed() {
    await this.logEvent('ai_photo_analysis_used');
  }

  async logGuideViewed(guideId: string) {
    await this.logEvent('guide_viewed', { guide_id: guideId });
  }

  async logRestaurantMenuViewed(restaurantId: number) {
    await this.logEvent('restaurant_menu_viewed', { restaurant_id: restaurantId });
  }

  async logFoodBankSearched(query: string) {
    await this.logEvent('food_bank_searched', { search_query: query });
  }

  // ===== ERROR EVENTS =====

  async logError(errorType: string, errorMessage: string) {
    await this.logEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
    });
  }

  async logAPIError(endpoint: string, statusCode?: number) {
    await this.logEvent('api_error', {
      endpoint,
      status_code: statusCode,
    });
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();

// Convenience export
export default analyticsService;
