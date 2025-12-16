CREATE TABLE IF NOT EXISTS public.feedbackas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,
  instructions TEXT,
  correction_prompt TEXT,
  expected_answer TEXT,
  criteria JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  language TEXT DEFAULT 'fr',
  level TEXT,
  expected_length TEXT,
  scoring_enabled BOOLEAN DEFAULT false,
  max_score INTEGER,
  tone TEXT DEFAULT 'bienveillant',
  course_id TEXT,
  class_id TEXT,
  author_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbackas_status ON public.feedbackas(status);
CREATE INDEX IF NOT EXISTS idx_feedbackas_author ON public.feedbackas(author_id);
CREATE INDEX IF NOT EXISTS idx_feedbackas_course ON public.feedbackas(course_id);

DROP TRIGGER IF EXISTS trigger_update_feedbackas_updated_at ON public.feedbackas;
CREATE TRIGGER trigger_update_feedbackas_updated_at
  BEFORE UPDATE ON public.feedbackas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.feedbacka_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedbacka_id UUID NOT NULL REFERENCES public.feedbackas(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'error')),
  ai_result JSONB,
  score NUMERIC,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_feedbacka_submissions_feedbacka ON public.feedbacka_submissions(feedbacka_id);
CREATE INDEX IF NOT EXISTS idx_feedbacka_submissions_student ON public.feedbacka_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_feedbacka_submissions_status ON public.feedbacka_submissions(status);

ALTER TABLE public.feedbackas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacka_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedbackas_select_published" ON public.feedbackas;
CREATE POLICY "feedbackas_select_published"
  ON public.feedbackas
  FOR SELECT
  TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "feedbackas_author_all" ON public.feedbackas;
CREATE POLICY "feedbackas_author_all"
  ON public.feedbackas
  FOR ALL
  TO authenticated
  USING (author_id = auth.uid()::text)
  WITH CHECK (author_id = auth.uid()::text);

DROP POLICY IF EXISTS "feedbacka_submissions_student_select" ON public.feedbacka_submissions;
CREATE POLICY "feedbacka_submissions_student_select"
  ON public.feedbacka_submissions
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid()::text);

DROP POLICY IF EXISTS "feedbacka_submissions_student_insert" ON public.feedbacka_submissions;
CREATE POLICY "feedbacka_submissions_student_insert"
  ON public.feedbacka_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid()::text);

GRANT ALL ON TABLE public.feedbackas TO authenticated;
GRANT ALL ON TABLE public.feedbacka_submissions TO authenticated;
GRANT ALL ON TABLE public.feedbackas TO service_role;
GRANT ALL ON TABLE public.feedbacka_submissions TO service_role;

NOTIFY pgrst, 'reload schema';
