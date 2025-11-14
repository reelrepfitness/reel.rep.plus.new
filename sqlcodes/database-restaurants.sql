-- Restaurants table
CREATE TABLE IF NOT EXISTS public.restaurants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  img_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Restaurant menu items table
CREATE TABLE IF NOT EXISTS public.restaurant_menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon_name TEXT, -- Name of the food icon (e.g., 'hamburger', 'pizza', 'salad')
  calories_per_unit NUMERIC NOT NULL DEFAULT 0,
  protein_units NUMERIC NOT NULL DEFAULT 0,
  carb_units NUMERIC NOT NULL DEFAULT 0,
  fat_units NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert restaurants with images
INSERT INTO public.restaurants (name, img_url) VALUES
  ('ארומה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/1_1_ofe1rc.webp'),
  ('רולדין', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/2_2_gpm68b.webp'),
  ('דומינוס פיצה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/3_2_ob3ydx.webp'),
  ('מקדונלד''ס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/4_2_nxyjtp.webp'),
  ('פאפא ג''ונס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/5_2_igaaqm.webp'),
  ('גרג', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/6_3_uqmjng.webp'),
  ('ארקפה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010648/7_4_uga2ot.webp'),
  ('בנדיקט', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010433/8_3_faicxp.webp'),
  ('Burger King', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010424/9_2_abahhp.webp'),
  ('אגאדיר', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010425/10_1_hcypsi.webp'),
  ('אושי אושי', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010431/11_1_nz4neh.webp'),
  ('Rebar', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010432/12_1_oidc3u.webp'),
  ('KFC', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010662/13_2_mjezie.webp'),
  ('קפה ליון', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012347/14_iyyeqt.webp'),
  ('לנדוור', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012348/15_uyrsen.webp'),
  ('ריבר נודלס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012347/16_btzqh8.webp'),
  ('מוזס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012348/17_bwdkav.webp'),
  ('פסטה בסטה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012347/18_waab4l.webp'),
  ('נאפיס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012349/19_zgbnbo.webp'),
  ('סושיה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012350/20_l0fjby.webp'),
  ('ג''פניקה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012350/21_wzwxex.webp'),
  ('אצל עובד בכפר', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012351/22_lwc3rk.webp'),
  ('BBB', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012348/23_pjykbr.webp');

-- Enable RLS
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menu_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for restaurants
CREATE POLICY "Allow public read access to restaurants" 
  ON public.restaurants FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert restaurants" 
  ON public.restaurants FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update restaurants" 
  ON public.restaurants FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete restaurants" 
  ON public.restaurants FOR DELETE 
  USING (auth.role() = 'authenticated');

-- RLS Policies for restaurant_menu_items
CREATE POLICY "Allow public read access to restaurant menu items" 
  ON public.restaurant_menu_items FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert restaurant menu items" 
  ON public.restaurant_menu_items FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update restaurant menu items" 
  ON public.restaurant_menu_items FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete restaurant menu items" 
  ON public.restaurant_menu_items FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON public.restaurants TO authenticated;
GRANT ALL ON public.restaurant_menu_items TO authenticated;
GRANT SELECT ON public.restaurants TO anon;
GRANT SELECT ON public.restaurant_menu_items TO anon;
