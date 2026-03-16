-- Add student_count column to classes table for workload coefficient calculation
ALTER TABLE classes ADD COLUMN IF NOT EXISTS student_count integer DEFAULT 0;
COMMENT ON COLUMN classes.student_count IS 'Number of students in the class, used for workload coefficient calculation (Pilier 1.1)';

-- Add activity_type column to planning_time_slots for structured activity type
ALTER TABLE planning_time_slots ADD COLUMN IF NOT EXISTS activity_type varchar DEFAULT 'Cours';
COMMENT ON COLUMN planning_time_slots.activity_type IS 'Structured activity type: Cours, Atelier, Examen, Cours Asynchrone, Autre';
