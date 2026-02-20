-- Add reminder_time column to medications (stores UTC hour as "HH:MM", e.g. "08:00")
ALTER TABLE public.medications
ADD COLUMN reminder_time text DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.medications.reminder_time IS 'UTC time for daily push reminder in HH:MM format, null = no reminder';