/*
  # Scheduler AI Overlays: User Preferences & Insight Management

  1. New Tables
    - `scheduler_insight_dismissals`: Track dismissed insights per user/appointment
    - `scheduler_insight_snooze`: Track snoozed insights with expiration
    - `scheduler_insight_preferences`: User preferences for overlay types
    - `scheduler_data_freshness`: Track data staleness for failure mode UX

  2. Security
    - Enable RLS on all tables
    - Users can only manage their own dismissals and preferences
    - Read-only access to freshness status

  3. Indexes
    - Fast lookup by user_id + insight_id + appointment_id
    - Fast lookup by snooze expiration time
*/

-- Dismissed insights (per user, can be re-enabled)
CREATE TABLE IF NOT EXISTS scheduler_insight_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  insight_id text NOT NULL,
  appointment_id uuid,
  dismissed_at timestamptz DEFAULT now(),
  dismissed_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduler_insight_dismissals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dismissed insights"
  ON scheduler_insight_dismissals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can dismiss insights"
  ON scheduler_insight_dismissals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undismiss insights"
  ON scheduler_insight_dismissals FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_dismissals_user_insight
  ON scheduler_insight_dismissals(user_id, insight_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_dismissals_appointment
  ON scheduler_insight_dismissals(appointment_id);

-- Snoozed insights (temporary hiding with expiration)
CREATE TABLE IF NOT EXISTS scheduler_insight_snooze (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  insight_id text NOT NULL,
  appointment_id uuid,
  snoozed_at timestamptz DEFAULT now(),
  snooze_until timestamptz NOT NULL,
  snooze_duration_minutes int NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheduler_insight_snooze ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own snoozed insights"
  ON scheduler_insight_snooze FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can snooze insights"
  ON scheduler_insight_snooze FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsnooze insights"
  ON scheduler_insight_snooze FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_snooze_user_expiration
  ON scheduler_insight_snooze(user_id, snooze_until);

CREATE INDEX IF NOT EXISTS idx_scheduler_snooze_appointment
  ON scheduler_insight_snooze(appointment_id);

-- User preferences for overlay visibility
CREATE TABLE IF NOT EXISTS scheduler_insight_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  clinic_id uuid,
  no_show_risk_enabled boolean DEFAULT true,
  capacity_gap_enabled boolean DEFAULT true,
  overbooking_enabled boolean DEFAULT true,
  schedule_instability_enabled boolean DEFAULT true,
  min_confidence_threshold int DEFAULT 70,
  show_explanations boolean DEFAULT true,
  auto_dismiss_low_confidence boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, clinic_id)
);

ALTER TABLE scheduler_insight_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON scheduler_insight_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON scheduler_insight_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can create own preferences"
  ON scheduler_insight_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduler_preferences_user_clinic
  ON scheduler_insight_preferences(user_id, clinic_id);

-- Track data freshness for failure mode UX
CREATE TABLE IF NOT EXISTS scheduler_data_freshness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  data_type text NOT NULL, -- 'appointments', 'providers', 'schedule_blocks'
  last_refreshed timestamptz,
  is_stale boolean DEFAULT false,
  stale_since timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_id, data_type)
);

ALTER TABLE scheduler_data_freshness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view data freshness"
  ON scheduler_data_freshness FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_scheduler_freshness_clinic_type
  ON scheduler_data_freshness(clinic_id, data_type);
