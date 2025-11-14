-- Create workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('strength', 'cardio')),
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS workout_logs_user_id_idx ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS workout_logs_date_idx ON workout_logs(log_date);
CREATE INDEX IF NOT EXISTS workout_logs_user_date_idx ON workout_logs(user_id, log_date);

-- Enable Row Level Security
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view their own workout logs" ON workout_logs;
CREATE POLICY "Users can view their own workout logs"
  ON workout_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own workout logs" ON workout_logs;
CREATE POLICY "Users can insert their own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own workout logs" ON workout_logs;
CREATE POLICY "Users can update their own workout logs"
  ON workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own workout logs" ON workout_logs;
CREATE POLICY "Users can delete their own workout logs"
  ON workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_workout_logs_updated_at ON workout_logs;
CREATE TRIGGER update_workout_logs_updated_at
  BEFORE UPDATE ON workout_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
