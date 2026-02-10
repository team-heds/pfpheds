-- Étend StudentsPhysio pour les notes PFP, absences et remarques

ALTER TABLE public."StudentsPhysio"
  ADD COLUMN IF NOT EXISTS year text,
  ADD COLUMN IF NOT EXISTS pfp1a text,
  ADD COLUMN IF NOT EXISTS pfp1b text,
  ADD COLUMN IF NOT EXISTS pfp2 text,
  ADD COLUMN IF NOT EXISTS pfp3 text,
  ADD COLUMN IF NOT EXISTS pfp4 text,
  ADD COLUMN IF NOT EXISTS pfp1a_retake text,
  ADD COLUMN IF NOT EXISTS pfp1b_retake text,
  ADD COLUMN IF NOT EXISTS pfp2_retake text,
  ADD COLUMN IF NOT EXISTS pfp3_retake text,
  ADD COLUMN IF NOT EXISTS pfp4_retake text,
  ADD COLUMN IF NOT EXISTS pfp1a_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp1b_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp2_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp3_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp4_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp1a_remarques text,
  ADD COLUMN IF NOT EXISTS pfp1b_remarques text,
  ADD COLUMN IF NOT EXISTS pfp2_remarques text,
  ADD COLUMN IF NOT EXISTS pfp3_remarques text,
  ADD COLUMN IF NOT EXISTS pfp4_remarques text,
  ADD COLUMN IF NOT EXISTS absences numeric(4,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS remarques text,
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL;

UPDATE public."StudentsPhysio"
SET year = '2025'
WHERE year IS NULL;

ALTER TABLE public."StudentsPhysio"
  ALTER COLUMN year SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'studentsphysio_year_format'
  ) THEN
    ALTER TABLE public."StudentsPhysio"
      ADD CONSTRAINT studentsphysio_year_format CHECK (year ~ '^\d{4}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS studentsphysio_user_year_key
  ON public."StudentsPhysio" (user_id, year);
