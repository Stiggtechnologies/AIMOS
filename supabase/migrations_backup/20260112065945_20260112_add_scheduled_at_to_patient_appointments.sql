/*
  # Add scheduled_at column to patient_appointments

  This migration adds the missing `scheduled_at` column to the patient_appointments table
  that is referenced in multiple services for filtering appointments by schedule date.

  1. New Columns
    - `scheduled_at` (timestamptz) - Combined timestamp of appointment_date and start_time

  2. Data Migration
    - Populate scheduled_at from existing appointment_date and start_time columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'patient_appointments' AND column_name = 'scheduled_at'
  ) THEN
    ALTER TABLE patient_appointments ADD COLUMN scheduled_at timestamptz;
    
    UPDATE patient_appointments
    SET scheduled_at = appointment_date::timestamptz + start_time::interval
    WHERE appointment_date IS NOT NULL AND start_time IS NOT NULL;
    
    ALTER TABLE patient_appointments ALTER COLUMN scheduled_at SET NOT NULL;
    
    CREATE INDEX IF NOT EXISTS idx_patient_appointments_scheduled_at 
    ON patient_appointments(scheduled_at);
  END IF;
END $$;
