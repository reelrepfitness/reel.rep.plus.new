-- Update restaurants table with new data
-- Clear existing restaurants first
DELETE FROM public.restaurants;

-- Insert updated restaurants list
INSERT INTO public.restaurants (name, img_url) VALUES
  ('ארומה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/1_1_ofe1rc.webp'),
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
  ('רולדין', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/2_2_gpm68b.webp'),
  ('סושיה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012350/20_l0fjby.webp'),
  ('ג''פניקה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012350/21_wzwxex.webp'),
  ('אצל עובד בכפר', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012351/22_lwc3rk.webp'),
  ('BBB', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760012348/23_pjykbr.webp'),
  ('דומינוס פיצה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/3_2_ob3ydx.webp'),
  ('מקדונלד''ס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/4_2_nxyjtp.webp'),
  ('פאפא ג''ונס', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/5_2_igaaqm.webp'),
  ('גרג', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010418/6_3_uqmjng.webp'),
  ('ארקפה', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010648/7_4_uga2ot.webp'),
  ('בנדיקט', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010433/8_3_faicxp.webp'),
  ('Burger King', 'https://res.cloudinary.com/dtffqhujt/image/upload/v1760010424/9_2_abahhp.webp');
