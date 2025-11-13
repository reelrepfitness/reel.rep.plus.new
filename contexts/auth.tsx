import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/lib/utils";
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications";
import { createLogger } from "@/lib/logger";
import { analyticsService } from "@/lib/analytics";

const logger = createLogger('Auth');

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextValue>(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const ensureDailyLog = useCallback(async (userId: string) => {
    try {
      const today = formatDate(new Date());
      logger.info("Ensuring daily log for:", today);

      const { data: existingLog } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("user_id", userId)
        .eq("date", today)
        .single();

      if (!existingLog) {
        logger.info("Creating daily log for today");

        const { error } = await supabase.from("daily_logs").insert([
          {
            user_id: userId,
            date: today,
          },
        ]);

        if (error) {
          logger.error("Error creating daily log:", error.message || JSON.stringify(error));
        } else {
          logger.info("Daily log created");
        }
      } else {
        logger.info("Daily log already exists");
      }
    } catch (error) {
      logger.error("Error ensuring daily log:", error instanceof Error ? error.message : JSON.stringify(error));
    }
  }, []);

  const createUserRecord = useCallback(async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      
      const newProfile: Partial<User> = {
        user_id: userId,
        name: authUser.user?.user_metadata?.name || authUser.user?.email?.split("@")[0] || "משתמש",
        email: authUser.user?.email || "",
        role: "user",
        kcal_goal: 1240,
        protein_units: 3,
        carb_units: 3,
        fat_units: 1,
        veg_units: 4,
        fruit_units: 1,
        targets_override: false,
        water_daily_goal: 12,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (error) {
        logger.error("Error creating profile:", error.message || JSON.stringify(error));
        throw error;
      }

      logger.info("Profile created");
      setUser(data);

      await ensureDailyLog(userId);
    } catch (error) {
      logger.error("Failed to create profile:", error instanceof Error ? error.message : JSON.stringify(error));
      throw error;
    }
  }, [ensureDailyLog]);

  const loadUser = useCallback(async (userId: string) => {
    try {
      logger.info("Loading user profile for:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        logger.error("Error loading profile:", error.message);
        logger.error("Error details:", {
          code: error.code,
          details: error.details,
          hint: error.hint,
          full: JSON.stringify(error)
        });

        if (error.code === "PGRST116") {
          logger.info("Profile not found, creating new profile");
          await createUserRecord(userId);
          return;
        }

        throw error;
      }

      logger.info("Profile loaded:", data.email);
      setUser(data);

      await ensureDailyLog(userId);

      await registerForPushNotificationsAsync(userId);
    } catch (error) {
      logger.error("Failed to load profile:", error instanceof Error ? error.message : String(error));
      if (error && typeof error === 'object') {
        logger.error("Error details:", JSON.stringify(error, null, 2));
      }

      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [createUserRecord, ensureDailyLog]);

  useEffect(() => {
    logger.info("Initializing auth context");

    supabase.auth.getSession()
      .then(({ data: { session: currentSession } }) => {
        logger.info("Initial session:", currentSession?.user?.email || "none");
        setSession(currentSession);
        if (currentSession) {
          loadUser(currentSession.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((error) => {
        logger.error("Error getting initial session:", error);
        setSession(null);
        setUser(null);
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      logger.info("Auth state changed:", _event, currentSession?.user?.email || "none");
      setSession(currentSession);
      if (currentSession) {
        loadUser(currentSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string) => {
    logger.info("Signing in:", email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Sign in error:", error.message || JSON.stringify(error));
      throw error;
    }

    logger.info("Sign in successful");
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    logger.info("Signing up:", email);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      logger.error("Sign up error:", error.message || JSON.stringify(error));
      throw error;
    }

    logger.info("Sign up successful");
  }, []);

  const signOut = useCallback(async () => {
    logger.info("Signing out");
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Sign out error:", error.message || JSON.stringify(error));
      throw error;
    }

    logger.info("Sign out successful");
  }, []);

  return useMemo(() => ({
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
  }), [session, user, loading, signIn, signUp, signOut]);
});
