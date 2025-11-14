-- Import body measurements from CSV data
-- Run this SQL in your Supabase SQL Editor

-- Insert measurements for איוון זייצב (user_id: 37701a98-ebe4-4131-b640-8f6a5752701c)
INSERT INTO public.body_measurements (
  user_id,
  measurement_date,
  body_weight,
  body_fat_mass,
  lean_mass,
  body_fat_percentage,
  shoulder_circumference,
  waist_circumference,
  arm_circumference,
  thigh_circumference,
  notes,
  created_at,
  updated_at
) VALUES
  (
    '37701a98-ebe4-4131-b640-8f6a5752701c',
    '2025-11-04',
    76,
    6,
    70,
    12.24,
    100,
    77,
    36,
    62,
    '',
    '2025-11-04 21:11:45.459023+00',
    '2025-11-04 21:11:45.459023+00'
  ),
  (
    '37701a98-ebe4-4131-b640-8f6a5752701c',
    '2025-09-10',
    80,
    9,
    71,
    15.26,
    113,
    87,
    37,
    60,
    '',
    '2025-11-04 20:41:23.404874+00',
    '2025-11-04 20:41:23.404874+00'
  )
ON CONFLICT (user_id, measurement_date) DO UPDATE SET
  body_weight = EXCLUDED.body_weight,
  body_fat_mass = EXCLUDED.body_fat_mass,
  lean_mass = EXCLUDED.lean_mass,
  body_fat_percentage = EXCLUDED.body_fat_percentage,
  shoulder_circumference = EXCLUDED.shoulder_circumference,
  waist_circumference = EXCLUDED.waist_circumference,
  arm_circumference = EXCLUDED.arm_circumference,
  thigh_circumference = EXCLUDED.thigh_circumference,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Insert measurements for גילי שחר (user_id: 4c36548d-97d2-4f4c-93f5-425b99d169d9)
INSERT INTO public.body_measurements (
  user_id,
  measurement_date,
  body_weight,
  body_fat_mass,
  lean_mass,
  body_fat_percentage,
  shoulder_circumference,
  waist_circumference,
  arm_circumference,
  thigh_circumference,
  notes,
  created_at,
  updated_at
) VALUES
  (
    '4c36548d-97d2-4f4c-93f5-425b99d169d9',
    '2025-08-17',
    65,
    10.5,
    54.5,
    34.8,
    NULL,
    77,
    32,
    54,
    '',
    NOW(),
    NOW()
  ),
  (
    '4c36548d-97d2-4f4c-93f5-425b99d169d9',
    '2025-09-14',
    65,
    10.5,
    54.5,
    33,
    NULL,
    80,
    31,
    54,
    '',
    NOW(),
    NOW()
  ),
  (
    '4c36548d-97d2-4f4c-93f5-425b99d169d9',
    '2025-09-28',
    64,
    9.6,
    54.34,
    31.8,
    NULL,
    80,
    31,
    54,
    '',
    NOW(),
    NOW()
  ),
  (
    '4c36548d-97d2-4f4c-93f5-425b99d169d9',
    '2025-10-28',
    64,
    9.6,
    54.1,
    32.3,
    NULL,
    78,
    30.5,
    54,
    '',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id, measurement_date) DO UPDATE SET
  body_weight = EXCLUDED.body_weight,
  body_fat_mass = EXCLUDED.body_fat_mass,
  lean_mass = EXCLUDED.lean_mass,
  body_fat_percentage = EXCLUDED.body_fat_percentage,
  shoulder_circumference = EXCLUDED.shoulder_circumference,
  waist_circumference = EXCLUDED.waist_circumference,
  arm_circumference = EXCLUDED.arm_circumference,
  thigh_circumference = EXCLUDED.thigh_circumference,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Insert measurements for נעמי ירימי (user_id: 9470668d-d098-42ad-9ef9-be68aefc1a18)
INSERT INTO public.body_measurements (
  user_id,
  measurement_date,
  body_weight,
  body_fat_mass,
  lean_mass,
  body_fat_percentage,
  shoulder_circumference,
  waist_circumference,
  arm_circumference,
  thigh_circumference,
  notes,
  created_at,
  updated_at
) VALUES
  (
    '9470668d-d098-42ad-9ef9-be68aefc1a18',
    '2025-10-23',
    62,
    7.1,
    52.9,
    29,
    NULL,
    75,
    30,
    56,
    '',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id, measurement_date) DO UPDATE SET
  body_weight = EXCLUDED.body_weight,
  body_fat_mass = EXCLUDED.body_fat_mass,
  lean_mass = EXCLUDED.lean_mass,
  body_fat_percentage = EXCLUDED.body_fat_percentage,
  shoulder_circumference = EXCLUDED.shoulder_circumference,
  waist_circumference = EXCLUDED.waist_circumference,
  arm_circumference = EXCLUDED.arm_circumference,
  thigh_circumference = EXCLUDED.thigh_circumference,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Insert measurements for אורית ביטון (user_id: 36077a95-b8b3-48e4-bfdd-75cc0fdee59b)
INSERT INTO public.body_measurements (
  user_id,
  measurement_date,
  body_weight,
  body_fat_mass,
  lean_mass,
  body_fat_percentage,
  shoulder_circumference,
  waist_circumference,
  arm_circumference,
  thigh_circumference,
  notes,
  created_at,
  updated_at
) VALUES
  (
    '36077a95-b8b3-48e4-bfdd-75cc0fdee59b',
    '2025-05-22',
    59,
    6.4,
    52.6,
    31.4,
    NULL,
    74,
    27,
    56,
    '',
    NOW(),
    NOW()
  ),
  (
    '36077a95-b8b3-48e4-bfdd-75cc0fdee59b',
    '2025-07-13',
    58,
    6.4,
    51.6,
    26.9,
    NULL,
    77,
    26,
    53,
    '',
    NOW(),
    NOW()
  ),
  (
    '36077a95-b8b3-48e4-bfdd-75cc0fdee59b',
    '2025-08-01',
    56.8,
    5.8,
    51,
    25.5,
    NULL,
    75,
    26,
    53,
    '',
    NOW(),
    NOW()
  ),
  (
    '36077a95-b8b3-48e4-bfdd-75cc0fdee59b',
    '2025-08-19',
    56.8,
    5.2,
    51.6,
    23.8,
    NULL,
    75,
    25,
    53,
    '',
    NOW(),
    NOW()
  ),
  (
    '36077a95-b8b3-48e4-bfdd-75cc0fdee59b',
    '2025-09-09',
    56.2,
    5,
    51.2,
    22.1,
    NULL,
    75,
    25,
    52,
    '',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id, measurement_date) DO UPDATE SET
  body_weight = EXCLUDED.body_weight,
  body_fat_mass = EXCLUDED.body_fat_mass,
  lean_mass = EXCLUDED.lean_mass,
  body_fat_percentage = EXCLUDED.body_fat_percentage,
  shoulder_circumference = EXCLUDED.shoulder_circumference,
  waist_circumference = EXCLUDED.waist_circumference,
  arm_circumference = EXCLUDED.arm_circumference,
  thigh_circumference = EXCLUDED.thigh_circumference,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Verify the imported data
SELECT 
  bm.user_id,
  p.name,
  bm.measurement_date,
  bm.body_weight,
  bm.body_fat_percentage,
  bm.created_at
FROM public.body_measurements bm
LEFT JOIN public.profiles p ON bm.user_id = p.user_id
ORDER BY bm.user_id, bm.measurement_date DESC;
