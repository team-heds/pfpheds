-- Table pour stocker les notes PFP, absences et remarques par étudiant/année

CREATE TABLE IF NOT EXISTS public."StudentsPhysio" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year text NOT NULL CHECK (year ~ '^\d{4}$'),

  pfp1a text,
  pfp1b text,
  pfp2 text,
  pfp3 text,
  pfp4 text,

  pfp1a_retake text,
  pfp1b_retake text,
  pfp2_retake text,
  pfp3_retake text,
  pfp4_retake text,

  pfp1a_absences numeric(4,1),
  pfp1b_absences numeric(4,1),
  pfp2_absences numeric(4,1),
  pfp3_absences numeric(4,1),
  pfp4_absences numeric(4,1),

  pfp1a_remarques text,
  pfp1b_remarques text,
  pfp2_remarques text,
  pfp3_remarques text,
  pfp4_remarques text,

  absences numeric(4,1) DEFAULT 0,
  remarques text,

  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  UNIQUE (user_id, year)
);

COMMENT ON TABLE public."StudentsPhysio" IS 'Notes PFP, absences et remarques par étudiant et année';
COMMENT ON COLUMN public."StudentsPhysio".year IS 'Année académique (ex: 2025, 2026)';
COMMENT ON COLUMN public."StudentsPhysio".absences IS 'Total absences (jours ou demi-journées)';
COMMENT ON COLUMN public."StudentsPhysio".remarques IS 'Remarques générales';
