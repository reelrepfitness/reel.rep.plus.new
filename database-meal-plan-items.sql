-- Create meal_plan_items table
CREATE TABLE IF NOT EXISTS public.meal_plan_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  food_id integer NOT NULL,
  meal_category text NOT NULL,
  quantity numeric(10, 2) NOT NULL DEFAULT 1,
  kcal numeric(10, 2) NOT NULL DEFAULT 0,
  protein_units numeric(10, 2) NOT NULL DEFAULT 0,
  carb_units numeric(10, 2) NOT NULL DEFAULT 0,
  fat_units numeric(10, 2) NOT NULL DEFAULT 0,
  veg_units numeric(10, 2) NOT NULL DEFAULT 0,
  fruit_units numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT meal_plan_items_pkey PRIMARY KEY (id),
  CONSTRAINT meal_plan_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE,
  CONSTRAINT meal_plan_items_food_id_fkey FOREIGN KEY (food_id) REFERENCES food_bank(id) ON DELETE CASCADE,
  CONSTRAINT meal_plan_items_meal_category_check CHECK (meal_category IN ('ארוחת בוקר', 'ארוחת ביניים', 'ארוחת צהריים', 'ארוחת ערב'))
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_user_id ON public.meal_plan_items USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_food_id ON public.meal_plan_items USING btree (food_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_meal_plan_items_meal_category ON public.meal_plan_items USING btree (meal_category) TABLESPACE pg_default;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meal_plan_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meal_plan_items_updated_at 
BEFORE UPDATE ON meal_plan_items 
FOR EACH ROW 
EXECUTE FUNCTION update_meal_plan_items_updated_at();

-- Enable RLS
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own meal plan items
CREATE POLICY "Users can view their own meal plan items"
  ON meal_plan_items FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all meal plan items
CREATE POLICY "Admins can view all meal plan items"
  ON meal_plan_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can insert meal plan items for any user
CREATE POLICY "Admins can insert meal plan items"
  ON meal_plan_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update meal plan items
CREATE POLICY "Admins can update meal plan items"
  ON meal_plan_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can delete meal plan items
CREATE POLICY "Admins can delete meal plan items"
  ON meal_plan_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
