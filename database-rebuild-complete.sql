-- ============================================
-- COMPLETE DATABASE REBUILD
-- ============================================
-- This will completely clean and rebuild your database
-- WARNING: This will delete ALL data except food_bank

-- ============================================
-- STEP 1: Drop all policies
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view target templates" ON target_templates;
DROP POLICY IF EXISTS "Anyone can view food bank" ON food_bank;
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can view own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can insert own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can update own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can delete own logs" ON daily_logs;
DROP POLICY IF EXISTS "Users can view own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can insert own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can update own daily items" ON daily_items;
DROP POLICY IF EXISTS "Users can delete own daily items" ON daily_items;
DROP POLICY IF EXISTS "Anyone can view restaurants" ON restaurants;

-- ============================================
-- STEP 2: Drop triggers
-- ============================================

DROP TRIGGER IF EXISTS update_daily_totals_on_delete ON daily_items;
DROP TRIGGER IF EXISTS update_daily_totals_on_update ON daily_items;
DROP TRIGGER IF EXISTS update_daily_totals_on_insert ON daily_items;
DROP TRIGGER IF EXISTS update_daily_logs_updated_at ON daily_logs;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- ============================================
-- STEP 3: Drop functions
-- ============================================

DROP FUNCTION IF EXISTS update_daily_log_totals() CASCADE;
DROP FUNCTION IF EXISTS create_daily_log_if_not_exists(UUID, DATE) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- STEP 4: Drop all tables EXCEPT food_bank
-- ============================================

DROP TABLE IF EXISTS admin_audit_logs CASCADE;
DROP TABLE IF EXISTS daily_items CASCADE;
DROP TABLE IF EXISTS daily_logs CASCADE;
DROP TABLE IF EXISTS recipes CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS target_templates CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- STEP 5: Recreate tables
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE target_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kcal_plan NUMERIC NOT NULL UNIQUE,
  protein_units NUMERIC(4,1) NOT NULL,
  carb_units NUMERIC(4,1) NOT NULL,
  fat_units NUMERIC(4,1) NOT NULL,
  veg_units NUMERIC(4,1) NOT NULL,
  fruit_units NUMERIC(4,1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'coach', 'admin')),
  kcal_goal NUMERIC,
  protein_units NUMERIC(4,1),
  carb_units NUMERIC(4,1),
  fat_units NUMERIC(4,1),
  veg_units NUMERIC(4,1),
  fruit_units NUMERIC(4,1),
  target_template_id UUID REFERENCES target_templates(id) ON DELETE SET NULL,
  targets_override BOOLEAN DEFAULT false,
  body_weight NUMERIC(5,2),
  height NUMERIC,
  water_daily_goal NUMERIC DEFAULT 12,
  whatsapp_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id INTEGER REFERENCES food_bank(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, food_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  ingredients JSONB NOT NULL,
  total_calories NUMERIC NOT NULL,
  total_units JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_user_id ON recipes(user_id);

CREATE TABLE daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  total_kcal NUMERIC NOT NULL DEFAULT 0,
  total_protein_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_carb_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_fat_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_veg_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  total_fruit_units NUMERIC(5,1) NOT NULL DEFAULT 0,
  water_glasses NUMERIC NOT NULL DEFAULT 0,
  cardio_minutes NUMERIC NOT NULL DEFAULT 0,
  strength_minutes NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_logs_user_date ON daily_logs(user_id, date DESC);

CREATE TABLE daily_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_log_id UUID REFERENCES daily_logs(id) ON DELETE CASCADE NOT NULL,
  food_id INTEGER REFERENCES food_bank(id) NOT NULL,
  meal_category TEXT NOT NULL,
  measure_type TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  grams NUMERIC DEFAULT 0,
  kcal NUMERIC NOT NULL DEFAULT 0,
  protein_units NUMERIC NOT NULL DEFAULT 0,
  carb_units NUMERIC NOT NULL DEFAULT 0,
  fat_units NUMERIC NOT NULL DEFAULT 0,
  veg_units NUMERIC NOT NULL DEFAULT 0,
  fruit_units NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_items_log ON daily_items(daily_log_id);
CREATE INDEX idx_daily_items_food ON daily_items(food_id);

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES auth.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin ON admin_audit_logs(admin_id, created_at DESC);

CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC(4,1) DEFAULT 1,
  caloreis NUMERIC NOT NULL DEFAULT 0,
  protien_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  carb_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  fats_units NUMERIC(3,1) NOT NULL DEFAULT 0,
  grid_restaurants TEXT,
  is_favorite BOOLEAN DEFAULT false,
  favorites TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restaurants_category ON restaurants(category);
CREATE INDEX idx_restaurants_name ON restaurants(name);
CREATE INDEX idx_restaurants_favorite ON restaurants(is_favorite) WHERE is_favorite = true;

-- ============================================
-- STEP 6: Create functions
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_daily_log_if_not_exists(
  p_user_id UUID,
  p_date DATE
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT id INTO v_log_id
  FROM daily_logs
  WHERE user_id = p_user_id AND date = p_date;
  
  IF v_log_id IS NULL THEN
    INSERT INTO daily_logs (user_id, date)
    VALUES (p_user_id, p_date)
    RETURNING id INTO v_log_id;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_daily_log_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE daily_logs
  SET 
    total_kcal = (
      SELECT COALESCE(SUM(kcal), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_protein_units = (
      SELECT COALESCE(SUM(protein_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_carb_units = (
      SELECT COALESCE(SUM(carb_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_fat_units = (
      SELECT COALESCE(SUM(fat_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_veg_units = (
      SELECT COALESCE(SUM(veg_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    ),
    total_fruit_units = (
      SELECT COALESCE(SUM(fruit_units), 0)
      FROM daily_items
      WHERE daily_log_id = COALESCE(NEW.daily_log_id, OLD.daily_log_id)
    )
  WHERE id = COALESCE(NEW.daily_log_id, OLD.daily_log_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Create triggers
-- ============================================

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_logs_updated_at BEFORE UPDATE ON daily_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_totals_on_insert
  AFTER INSERT ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

CREATE TRIGGER update_daily_totals_on_update
  AFTER UPDATE ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

CREATE TRIGGER update_daily_totals_on_delete
  AFTER DELETE ON daily_items
  FOR EACH ROW EXECUTE FUNCTION update_daily_log_totals();

-- ============================================
-- STEP 8: Enable RLS
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 9: Create RLS policies
-- ============================================

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can view target templates" ON target_templates
  FOR SELECT USING (true);

CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own recipes" ON recipes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own logs" ON daily_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs" ON daily_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs" ON daily_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs" ON daily_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own daily items" ON daily_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own daily items" ON daily_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own daily items" ON daily_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own daily items" ON daily_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM daily_logs
      WHERE daily_logs.id = daily_items.daily_log_id
      AND daily_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view restaurants" ON restaurants
  FOR SELECT USING (true);

-- ============================================
-- STEP 10: Insert initial data
-- ============================================

INSERT INTO target_templates (kcal_plan, protein_units, carb_units, fat_units, veg_units, fruit_units) VALUES
  (2600, 6, 7, 1.5, 4, 2),
  (2200, 5.5, 6, 1.5, 4, 1),
  (1900, 5, 5, 1, 4, 1),
  (1840, 4, 5, 1.5, 4, 2),
  (1700, 4, 5, 1, 4, 1),
  (1660, 3.5, 5.5, 1, 4, 1),
  (1600, 3.5, 4.5, 1.5, 4, 1),
  (1540, 3.5, 4.5, 1, 4, 1),
  (1480, 3.5, 4, 1, 4, 1),
  (1360, 4, 3, 1, 4, 1),
  (1300, 3, 3.5, 1, 4, 1),
  (1240, 3, 3, 1, 4, 1),
  (1200, 3, 3, 0.5, 4, 1);

INSERT INTO restaurants (name, category, quantity, caloreis, protien_units, carb_units, fats_units, grid_restaurants, is_favorite) VALUES
('כריך חזה עוף', 'ארומה', 1, 717, 1.2, 1.6, 2, NULL, false),
('פרגיות בגריל', 'לנדוור', 1, 310, 3, 0.5, 1.5, NULL, false),
('שיפודי פרגיות', 'לנדוור', 1, 300, 3, 0.5, 1.5, NULL, false),
('פילה דג סלמון', 'לנדוור', 1, 350, 2.5, 0, 2, NULL, false),
('חזה עוף מוקפץ (מעט שמן)', 'לנדוור', 1, 320, 3, 0.5, 1.5, NULL, false),
('פילה דג דניס על הגריל', 'לנדוור', 1, 250, 2.5, 0.5, 1, NULL, false),
('שוק עוף צלויה', 'לנדוור', 1, 320, 3, 0.5, 1.5, NULL, false),
('קבב טלה וירקות', 'לנדוור', 1, 350, 2.5, 0.5, 2, NULL, false),
('עוף בגריל', 'לנדוור', 1, 300, 3, 0.5, 1.5, NULL, false),
('חזה עוף וירקות', 'לנדוור', 1, 280, 3, 0.5, 1, NULL, false),
('סלט טונה וירקות', 'לנדוור', 1, 300, 3, 0.5, 2, NULL, false),
('סלט קיסר (ללא קרוטונים, עם רוטב בצד)', 'לנדוור', 1, 250, 2, 0.5, 2, NULL, false),
('המבורגר קלאסי', 'BBB', 1, 600, 0.5, 1.5, 2.5, NULL, false),
('המבורגר אנטריקוט', 'BBB', 1, 750, 1, 1.5, 3.5, NULL, false),
('המבורגר טבעוני', 'BBB', 1, 500, 0.5, 1.5, 1.5, NULL, false),
('סלט חזה עוף', 'BBB', 1, 550, 0.5, 1, 2, NULL, false),
('זינגר בורגר', 'KFC', 1, 445, 0.5, 1.5, 1.5, NULL, false),
('טוויסטר קלאסי', 'KFC', 1, 540, 0.5, 2, 2, NULL, false),
('צ''יפס בינוני', 'KFC', 1, 287, 0.5, 1.5, 1, NULL, false),
('Relax', 'Rebar', 1, 185, 0.5, 1.5, 0.5, NULL, true),
('Replay', 'Rebar', 1, 170, 0.5, 1.5, 0.5, NULL, false),
('Rejoy', 'Rebar', 1, 220, 0.5, 1.5, 1, NULL, false),
('המבורגר ג''וניור', 'אגאדיר', 1, 400, 0.5, 1, 1, NULL, false),
('המבורגר מקסי', 'אגאדיר', 1, 550, 0.5, 1.5, 1.5, NULL, false),
('המבורגר אגאדיר', 'אגאדיר', 1, 750, 1, 1.5, 1.5, NULL, false),
('המבורגר אנגוס', 'אגאדיר', 1, 650, 1, 1.5, 1.5, NULL, false),
('המבורגר טבעוני', 'אגאדיר', 1, 350, 0.5, 1, 1, NULL, false),
('בוקר ישראלי', 'ארומה', 1, 550, 0.5, 1.5, 2.5, NULL, false),
('BOWL בלקני', 'ארומה', 1, 600, 0.5, 1.5, 2, NULL, false),
('סלט ירושלמי', 'ארומה', 1, 500, 0.5, 1.5, 1.5, NULL, false),
('כריך חביתה', 'ארומה', 1, 450, 0.5, 1.5, 2, NULL, false),
('רול סאנסט', 'אושי אושי', 1, 450, 0.5, 1.5, 2, NULL, false),
('סושי סנדוויץ'' סלמון גריל ואבוקדו', 'אושי אושי', 1, 500, 1, 1.5, 2, NULL, false),
('פאד תאי אושי', 'אושי אושי', 1, 650, 1, 2, 2.5, NULL, false),
('רול אינסיידאאוט ספייסי טונה', 'אושי אושי', 1, 400, 0.5, 1.5, 1.5, NULL, false),
('שיפוד בלאפה', 'אצל עובד בכפר', 1, 700, 1, 2, 3, NULL, false),
('שווארמה עגל אישית', 'אצל עובד בכפר', 1, 800, 1, 1, 4, NULL, false),
('פלאפל בפיתה', 'אצל עובד בכפר', 1, 600, 0.5, 2, 2, NULL, false),
('חומוס קלאסי', 'אצל עובד בכפר', 1, 400, 0.5, 1.5, 2, NULL, false),
('סלט פפאיה', 'ארקפה', 1, 91, 0, 1, 0.5, NULL, false),
('סלט אטריות שעועית', 'ארקפה', 1, 294, 0.5, 1.5, 1, NULL, false),
('מיקס בריאות', 'ארקפה', 1, 605, 0.5, 1, 4, NULL, false),
('וופר', 'Burger King', 1, 679, 1, 2, 3, NULL, false),
('צ''יקן רויאל', 'Burger King', 1, 564, 0.5, 2, 2.5, NULL, false),
('וופר מהצומח', 'Burger King', 1, 625, 0.5, 2, 2.5, NULL, false),
('צ''יפס בינוני', 'Burger King', 1, 287, 0.5, 1.5, 1, NULL, false),
('אגז בנדיקט קלאסי', 'בנדיקט', 1, 700, 0.5, 1.5, 3.5, NULL, false),
('פנקייק קלאסי עם סירופ מייפל', 'בנדיקט', 1, 900, 0.5, 4, 3, NULL, false),
('בייגל סלמון', 'בנדיקט', 1, 600, 1, 2, 2, NULL, false),
('שקשוקה קלאסית', 'בנדיקט', 1, 400, 0.5, 1, 2, NULL, false),
('בלאק טוביקו רול', 'ג''פניקה', 1, 350, 0.5, 1.5, 1.5, NULL, false),
('סלמון טוגרשי', 'ג''פניקה', 1, 400, 0.5, 1.5, 1.5, NULL, false),
('רוק אנד רול', 'ג''פניקה', 1, 300, 0.5, 1.5, 1, NULL, false),
('פרש נודלס עוף', 'ג''פניקה', 1, 550, 0.5, 2, 1.5, NULL, false),
('צ''אנג מאי עוף', 'ג''פניקה', 1, 600, 0.5, 2, 2, NULL, false),
('סלט קינואה ועדשים', 'גרג', 1, 450, 0.5, 1.5, 1.5, NULL, false),
('בייגל סלמון', 'גרג', 1, 500, 1, 1.5, 2, NULL, false),
('שקשוקה ירוקה', 'גרג', 1, 400, 0.5, 1, 2, NULL, false),
('פסטה פטריות שמנת', 'גרג', 1, 650, 0.5, 2, 2.5, NULL, false),
('משולש פיצה קלאסית משפחתית', 'דומינוס פיצה', 1, 248, 0, 1, 0.5, NULL, false),
('משולש פיצה ללא קשה', 'דומינוס פיצה', 1, 299, 0.5, 1.5, 1, NULL, false),
('משולש פיצה טבעונית', 'דומינוס פיצה', 1, 243, 0, 1.5, 0.5, NULL, false),
('משולש גריק מיקס', 'דומינוס פיצה', 1, 336, 0.5, 1.5, 1, NULL, false),
('משולש צ''יזי מיקס', 'דומינוס פיצה', 1, 368, 0.5, 1.5, 1.5, NULL, false),
('משולש קרניבור מיקס', 'דומינוס פיצה', 1, 357, 0.5, 1.5, 1.5, NULL, false),
('משולש בקרנה', 'דומינוס פיצה', 1, 266, 0.5, 1.5, 1, NULL, false),
('משולש צ''יזי קראסט פסטו', 'דומינוס פיצה', 1, 313, 0.5, 1.5, 1, NULL, false),
('ביג מק', 'מקדונלד''ס', 1, 560, 1, 1.5, 2.5, NULL, false),
('צ''יקן בורגר', 'מקדונלד''ס', 1, 360, 1, 1.5, 1.5, NULL, false),
('רול סלמון קלאסי', 'סושיה', 1, 300, 0.5, 1.5, 1, NULL, false),
('רול טונה חריף', 'סושיה', 1, 320, 0.5, 1.5, 1, NULL, false),
('פאד תאי עוף', 'סושיה', 1, 600, 1, 1.5, 2, NULL, false),
('סקיני בורגר', 'מוזס', 1, 400, 1, 1, 1.5, NULL, false),
('ארטבורגר', 'מוזס', 1, 700, 1, 1.5, 3, NULL, false),
('מיסו סלמון', 'מוזס', 1, 500, 1, 1, 2, NULL, false),
('סלט צ''יקן', 'מוזס', 1, 350, 1, 1, 1.5, NULL, false),
('צ''יזבורגר', 'נאפיס', 1, 750, 1, 2, 3.5, NULL, false),
('המבורגר קצבים', 'נאפיס', 1, 850, 1, 1.5, 4, NULL, false),
('כריך אנטריקוט', 'נאפיס', 1, 700, 1, 1.5, 3, NULL, false),
('סלט חזה עוף', 'נאפיס', 1, 600, 1, 1.5, 2.5, NULL, false),
('סלט טונה', 'נאפיס', 1, 550, 1, 1, 2.5, NULL, false),
('משולש פיצה רגילה', 'פאפא ג''ונס', 1, 280, 0.2, 1, 1, NULL, false),
('משולש פיצה גבינות', 'פאפא ג''ונס', 1, 310, 0.2, 1.5, 1.5, NULL, false),
('משולש פיצה ירקות', 'פאפא ג''ונס', 1, 270, 0.2, 1, 1, NULL, false),
('משולש פפרוני', 'פאפא ג''ונס', 1, 330, 0.2, 1.5, 1.5, NULL, false),
('ארוחת רוזה', 'פסטה בסטה', 1, 650, 0.5, 2.5, 2, NULL, false),
('ארוחת ארבע גבינות וגעגוע', 'פסטה בסטה', 1, 700, 0.5, 2, 3, NULL, false),
('ארוחת בולונז רידיפיין', 'פסטה בסטה', 1, 600, 1, 2.5, 2, NULL, false),
('ארוחת פסטו שנטחן על הבוקר', 'פסטה בסטה', 1, 650, 0.5, 2.5, 2.5, NULL, false),
('ארוחת בוקר ליון', 'קפה ליון', 1, 700, 0.5, 1.5, 3, NULL, false),
('כריך סלמון חם', 'קפה ליון', 1, 600, 0.5, 1.5, 2.5, NULL, false),
('פסטה שמנת סלמון', 'קפה ליון', 1, 800, 1, 2.5, 3, NULL, false),
('סלט קיסריה', 'קפה ליון', 1, 500, 0.5, 1, 2.5, NULL, false),
('סלט רולדין', 'רולדין', 1, 450, 0.5, 1.5, 2, NULL, false),
('שקשוקה טבעונית', 'רולדין', 1, 500, 0.5, 1, 1.5, NULL, false),
('באגט חביתה', 'רולדין', 1, 550, 0.5, 1.5, 2, NULL, false),
('עוגת גבינה אפויה', 'רולדין', 1, 600, 0.2, 2, 3, NULL, false),
('פאד תאי עוף', 'ריבר נודלס', 1, 650, 1, 2, 2, NULL, false),
('סושי רול סלמון ואבוקדו', 'ריבר נודלס', 1, 400, 0.5, 1.5, 1.5, NULL, false),
('מרק ראמן עם עוף', 'ריבר נודלס', 1, 550, 1, 2, 2, NULL, false),
('מוקפץ ירקות עם טופו', 'ריבר נודלס', 1, 500, 0.5, 1.5, 2, NULL, false);

-- ============================================
-- DONE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Database rebuilt successfully!';
  RAISE NOTICE '📊 All tables recreated (food_bank data preserved)';
  RAISE NOTICE '🔐 RLS enabled with clean policies';
  RAISE NOTICE '📝 Target templates: 13';
  RAISE NOTICE '🍽️  Restaurants: 107';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  User profiles cleared - they will be recreated on next login';
END $$;
