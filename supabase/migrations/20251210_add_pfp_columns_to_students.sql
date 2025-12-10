-- Add PFP2 columns to StudentsPhysio if they don't exist

-- Add pfp2_place_id column
ALTER TABLE "StudentsPhysio" 
ADD COLUMN IF NOT EXISTS "pfp2_place_id" TEXT;

-- Add pfp2_data column (JSONB for storing all PFP2 data)
ALTER TABLE "StudentsPhysio" 
ADD COLUMN IF NOT EXISTS "pfp2_data" JSONB;

-- Add comment for documentation
COMMENT ON COLUMN "StudentsPhysio"."pfp2_place_id" IS 'ID de la place PFP2 assignée';
COMMENT ON COLUMN "StudentsPhysio"."pfp2_data" IS 'Données complètes de l''affectation PFP2 (JSONB)';
