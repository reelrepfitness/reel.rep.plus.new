import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createLogger } from '@/lib/logger';

const logger = createLogger('Usehomedata');

interface DailyLogData {
  id: string;
  total_kcal: number;
  total_protein_units: number;
  total_carb_units: number;
  total_fat_units: number;
  total_veg_units: number;
  total_fruit_units: number;
  water_glasses: number;
  cardio_minutes: number;
  strength_minutes: number;
}

interface ProfileData {
  id: string;
  name: string;
  kcal_goal: number | null;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  water_daily_goal: number;
  targets_override: boolean;
  target_template_id: string | null;
  weekly_cardio_minutes: number | null;
  weekly_strength_workouts: number | null;
}

interface TargetTemplateData {
  kcal_plan: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
}

export function useHomeData(selectedDate?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = selectedDate || formatDate(new Date());

  const profileQuery = useQuery({
    queryKey: ["profile", user?.user_id],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("No user");

      logger.info("[Home] Fetching profile for user_id:", user.user_id);

      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, name, kcal_goal, protein_units, carb_units, fat_units, veg_units, fruit_units, water_daily_goal, targets_override, target_template_id, weekly_cardio_minutes, weekly_strength_workouts"
        )
        .eq("user_id", user.user_id)
        .single();

      if (error) {
        logger.error("[Home] Profile error:", error);
        throw error;
      }

      logger.info("[Home] Profile loaded:", data);
      return data as ProfileData;
    },
    enabled: !!user?.user_id,
  });

  const targetTemplateQuery = useQuery({
    queryKey: ["targetTemplate", profileQuery.data?.target_template_id],
    queryFn: async () => {
      if (!profileQuery.data?.target_template_id) throw new Error("No template ID");

      logger.info("[Home] Fetching target template:", profileQuery.data.target_template_id);

      const { data, error } = await supabase
        .from("target_templates")
        .select("kcal_plan, protein_units, carb_units, fat_units, veg_units, fruit_units")
        .eq("id", profileQuery.data.target_template_id)
        .single();

      if (error) throw error;

      logger.info("[Home] Target template loaded:", data);
      return data as TargetTemplateData;
    },
    enabled: !!profileQuery.data?.target_template_id && !profileQuery.data?.targets_override,
  });

  const dailyLogQuery = useQuery({
    queryKey: ["dailyLog", user?.user_id, today],
    queryFn: async () => {
      if (!user?.user_id) throw new Error("No user");

      logger.info("[Home] Fetching daily log for:", today, "user_id:", user.user_id);

      const { data, error } = await supabase
        .from("daily_logs")
        .select(
          "id, total_kcal, total_protein_units, total_carb_units, total_fat_units, total_veg_units, total_fruit_units, water_glasses, cardio_minutes, strength_minutes"
        )
        .eq("user_id", user.user_id)
        .eq("date", today)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          logger.info("[Home] No daily log found, creating one");
          const { data: newLog, error: createError } = await supabase
            .from("daily_logs")
            .insert([{ user_id: user.user_id, date: today }])
            .select(
              "id, total_kcal, total_protein_units, total_carb_units, total_fat_units, total_veg_units, total_fruit_units, water_glasses, cardio_minutes, strength_minutes"
            )
            .single();

          if (createError) {
            logger.error("[Home] Daily log create error:", createError);
            throw createError;
          }
          logger.info("[Home] Daily log created");
          return newLog as DailyLogData;
        }
        logger.error("[Home] Daily log error:", error);
        throw error;
      }

      logger.info("[Home] Daily log loaded");
      return data as DailyLogData;
    },
    enabled: !!user?.user_id,
  });

  const updateWaterMutation = useMutation({
    mutationFn: async (waterGlasses: number) => {
      if (!dailyLogQuery.data?.id) throw new Error("No daily log");

      const { error } = await supabase
        .from("daily_logs")
        .update({ water_glasses: waterGlasses })
        .eq("id", dailyLogQuery.data.id);

      if (error) throw error;

      return waterGlasses;
    },
    onMutate: async (waterGlasses) => {
      await queryClient.cancelQueries({ queryKey: ["dailyLog", user?.user_id, today] });
      
      const previousLog = queryClient.getQueryData<DailyLogData>(["dailyLog", user?.user_id, today]);
      
      queryClient.setQueryData<DailyLogData>(
        ["dailyLog", user?.user_id, today],
        (old) => old ? { ...old, water_glasses: waterGlasses } : old!
      );
      
      return { previousLog };
    },
    onError: (err, newWater, context) => {
      if (context?.previousLog) {
        queryClient.setQueryData(["dailyLog", user?.user_id, today], context.previousLog);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyLog", user?.user_id, today] });
    },
  });

  const updateActivityMutation = useMutation({
    mutationFn: async ({
      cardio,
      strength,
    }: {
      cardio?: number;
      strength?: number;
    }) => {
      if (!dailyLogQuery.data?.id) throw new Error("No daily log");

      const updates: Partial<DailyLogData> = {};
      if (cardio !== undefined) updates.cardio_minutes = cardio;
      if (strength !== undefined) updates.strength_minutes = strength;

      const { error } = await supabase
        .from("daily_logs")
        .update(updates)
        .eq("id", dailyLogQuery.data.id);

      if (error) throw error;

      return updates;
    },
    onSuccess: (updates) => {
      queryClient.setQueryData(
        ["dailyLog", user?.user_id, today],
        (old: DailyLogData | undefined) =>
          old ? { ...old, ...updates } : undefined
      );
    },
  });

  const calorieGoal = profileQuery.data?.targets_override
    ? profileQuery.data.kcal_goal ?? 0
    : targetTemplateQuery.data?.kcal_plan ?? profileQuery.data?.kcal_goal ?? 0;

  const proteinGoal = profileQuery.data?.targets_override
    ? profileQuery.data.protein_units
    : targetTemplateQuery.data?.protein_units ?? profileQuery.data?.protein_units ?? 0;

  const carbGoal = profileQuery.data?.targets_override
    ? profileQuery.data.carb_units
    : targetTemplateQuery.data?.carb_units ?? profileQuery.data?.carb_units ?? 0;

  const fatGoal = profileQuery.data?.targets_override
    ? profileQuery.data.fat_units
    : targetTemplateQuery.data?.fat_units ?? profileQuery.data?.fat_units ?? 0;

  const vegGoal = profileQuery.data?.targets_override
    ? profileQuery.data.veg_units
    : targetTemplateQuery.data?.veg_units ?? profileQuery.data?.veg_units ?? 0;

  const fruitGoal = profileQuery.data?.targets_override
    ? profileQuery.data.fruit_units
    : targetTemplateQuery.data?.fruit_units ?? profileQuery.data?.fruit_units ?? 0;

  const calorieIntake = dailyLogQuery.data?.total_kcal ?? 0;

  return {
    profile: profileQuery.data,
    dailyLog: dailyLogQuery.data,
    isLoading: profileQuery.isLoading || dailyLogQuery.isLoading,
    isFetching: dailyLogQuery.isFetching,
    isUpdatingWater: updateWaterMutation.isPending,
    updateWater: updateWaterMutation.mutate,
    updateActivity: updateActivityMutation.mutate,
    goals: {
      calories: calorieGoal,
      protein: proteinGoal,
      carb: carbGoal,
      fat: fatGoal,
      veg: vegGoal,
      fruit: fruitGoal,
    },
    intake: {
      calories: calorieIntake,
    },
  };
}
