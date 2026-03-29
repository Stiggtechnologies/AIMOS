/*
  # Enable RLS on Public Tables Without It
  
  9 tables in the public schema had RLS disabled, exposing all their data
  to any authenticated user without restriction. This migration:
  
  1. Enables RLS on all 9 affected tables
  2. Creates restrictive policies allowing authenticated access
  
  Tables fixed:
  - billing_records
  - services
  - bookings
  - capacity_rules
  - follow_up_tasks
  - front_desk_tasks
  - visit_plans
  - google_ads_campaigns
  - growth_analytics
*/

-- billing_records
ALTER TABLE billing_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_records_select"
  ON billing_records FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "billing_records_insert"
  ON billing_records FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "billing_records_update"
  ON billing_records FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "billing_records_delete"
  ON billing_records FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- services
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select"
  ON services FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "services_insert"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "services_update"
  ON services FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "services_delete"
  ON services FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings_select"
  ON bookings FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "bookings_insert"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "bookings_update"
  ON bookings FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "bookings_delete"
  ON bookings FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- capacity_rules
ALTER TABLE capacity_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capacity_rules_select"
  ON capacity_rules FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "capacity_rules_insert"
  ON capacity_rules FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "capacity_rules_update"
  ON capacity_rules FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "capacity_rules_delete"
  ON capacity_rules FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- follow_up_tasks
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follow_up_tasks_select"
  ON follow_up_tasks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "follow_up_tasks_insert"
  ON follow_up_tasks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "follow_up_tasks_update"
  ON follow_up_tasks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "follow_up_tasks_delete"
  ON follow_up_tasks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- front_desk_tasks
ALTER TABLE front_desk_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "front_desk_tasks_select"
  ON front_desk_tasks FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "front_desk_tasks_insert"
  ON front_desk_tasks FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "front_desk_tasks_update"
  ON front_desk_tasks FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "front_desk_tasks_delete"
  ON front_desk_tasks FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- visit_plans
ALTER TABLE visit_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_plans_select"
  ON visit_plans FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "visit_plans_insert"
  ON visit_plans FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "visit_plans_update"
  ON visit_plans FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "visit_plans_delete"
  ON visit_plans FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- google_ads_campaigns
ALTER TABLE google_ads_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_ads_campaigns_select"
  ON google_ads_campaigns FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "google_ads_campaigns_insert"
  ON google_ads_campaigns FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "google_ads_campaigns_update"
  ON google_ads_campaigns FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "google_ads_campaigns_delete"
  ON google_ads_campaigns FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- growth_analytics
ALTER TABLE growth_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "growth_analytics_select"
  ON growth_analytics FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

CREATE POLICY "growth_analytics_insert"
  ON growth_analytics FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "growth_analytics_update"
  ON growth_analytics FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "growth_analytics_delete"
  ON growth_analytics FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
