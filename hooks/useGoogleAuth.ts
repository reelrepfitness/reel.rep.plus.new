/**
 * Google Authentication Hook
 * Uses expo-auth-session for cross-platform Google Sign-In
 */

import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { createLogger } from '@/lib/logger';

const logger = createLogger('GoogleAuth');

// Complete discovery for proper session cleanup
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleSignIn(authentication?.idToken!);
    } else if (response?.type === 'error') {
      logger.error('Google Sign-In error:', response.error);
    }
  }, [response]);

  const handleGoogleSignIn = async (idToken: string) => {
    try {
      logger.info('Exchanging Google token with Supabase...');

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });

      if (error) {
        logger.error('Supabase Google auth error:', error);
        throw error;
      }

      logger.info('Google Sign-In completed successfully');
      return data;
    } catch (error) {
      logger.error('Error handling Google Sign-In:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!GOOGLE_WEB_CLIENT_ID && !GOOGLE_IOS_CLIENT_ID && !GOOGLE_ANDROID_CLIENT_ID) {
        throw new Error('Google OAuth not configured');
      }

      const result = await promptAsync();
      return result;
    } catch (error) {
      logger.error('Google Sign-In prompt error:', error);
      throw error;
    }
  };

  return {
    signInWithGoogle,
    request,
    response,
  };
}
