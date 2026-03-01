-- ============================================
-- CandidateOS — Update & Storage Migration
-- Run this in Supabase SQL Editor AFTER the initial schema
-- ============================================


-- ============================================
-- 0. ASSESSMENTS TABLE (create if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 60,
  question_count INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  due_date TIMESTAMPTZ,
  topics TEXT[] DEFAULT '{}',
  difficulty TEXT NOT NULL DEFAULT 'Medium' CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  score INTEGER CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  responses JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add responses column if table already exists
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS responses JSONB DEFAULT NULL;

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Candidates can read assessments for their applications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates read own assessments'
  ) THEN
    CREATE POLICY "Candidates read own assessments" ON assessments FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = assessments.application_id
          AND applications.candidate_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Candidates can update their own assessment (start, submit score)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates update own assessments'
  ) THEN
    CREATE POLICY "Candidates update own assessments" ON assessments FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = assessments.application_id
          AND applications.candidate_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Recruiters can read assessments for their jobs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters read assessments'
  ) THEN
    CREATE POLICY "Recruiters read assessments" ON assessments FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.id = assessments.application_id
          AND j.recruiter_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ============================================
-- 1. STORAGE BUCKET: Resumes
-- ============================================

-- Create the bucket (public = false means files need auth to read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own resumes
CREATE POLICY "Users upload own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can read their own resumes
CREATE POLICY "Users read own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own resumes
CREATE POLICY "Users update own resumes"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own resumes
CREATE POLICY "Users delete own resumes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resumes'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Recruiters can read resumes of candidates who applied to their jobs
CREATE POLICY "Recruiters read applicant resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes'
  AND EXISTS (
    SELECT 1 FROM applications a
    JOIN jobs j ON j.id = a.job_id
    WHERE a.candidate_id::text = (storage.foldername(name))[1]
      AND j.recruiter_id = auth.uid()
  )
);


-- ============================================
-- 2. FIX: Allow candidates to insert their own application stages
-- (needed when applying to a job — creates the initial "Applied" stage)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can insert own stages'
  ) THEN
    CREATE POLICY "Candidates can insert own stages" ON application_stages FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM applications
        WHERE applications.id = application_stages.application_id
          AND applications.candidate_id = auth.uid()
      )
    );
  END IF;
END $$;


-- ============================================
-- 3. FIX: Allow candidates to update their own applications
-- (needed for updating status from client side)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Candidates can update own applications'
  ) THEN
    CREATE POLICY "Candidates can update own applications" ON applications FOR UPDATE
    USING (auth.uid() = candidate_id);
  END IF;
END $$;


-- ============================================
-- 4. FIX: Allow assessments insert by recruiters
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Recruiters can create assessments'
  ) THEN
    CREATE POLICY "Recruiters can create assessments" ON assessments FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM applications a
        JOIN jobs j ON j.id = a.job_id
        WHERE a.id = assessments.application_id
          AND j.recruiter_id = auth.uid()
      )
    );
  END IF;
END $$;


-- ============================================
-- 5. Enable Realtime on application_stages too
-- ============================================

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE application_stages;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;


-- ============================================
-- 6. Create indexes for common query patterns
-- ============================================

CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_application_stages_app ON application_stages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_app ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_copilot_user ON copilot_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_app ON assessments(application_id);


-- ============================================
-- 7. SEED DATA: Sample demo jobs
--    These are inserted without a recruiter_id
--    so candidates have jobs to browse immediately.
--    Replace recruiter_id with a real UUID after
--    creating a recruiter account.
-- ============================================

-- First, create a system/demo recruiter profile (if you haven't signed up as recruiter yet)
-- This uses a fixed UUID — replace with your actual recruiter user ID after signup.
-- If the insert fails (no matching auth.users), just skip this section.

-- INSERT INTO profiles (id, full_name, email, role, company_name, profile_completeness)
-- VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Demo Recruiter',
--   'recruiter@demo.com',
--   'recruiter',
--   'TechCorp Inc.',
--   100
-- ) ON CONFLICT (id) DO NOTHING;

-- To seed demo jobs, first sign up as a recruiter, then run:
-- Replace YOUR_RECRUITER_UUID with your actual user ID from Supabase Auth > Users

/*
INSERT INTO jobs (recruiter_id, title, company_name, location, salary_range, description, requirements, status) VALUES
  ('YOUR_RECRUITER_UUID', 'Senior Frontend Engineer', 'TechCorp Inc.', 'Bangalore, India (Remote)', '₹18L – ₹28L', 'We are looking for a Senior Frontend Engineer to lead our React-based product team. You will architect new features, mentor junior developers, and work closely with design and product teams.', ARRAY['React', 'TypeScript', '3+ years experience', 'System Design'], 'active'),
  ('YOUR_RECRUITER_UUID', 'Full Stack Developer', 'StartupXYZ', 'Mumbai, India', '₹12L – ₹20L', 'Join our fast-growing startup as a Full Stack Developer. Build features end-to-end using React and Node.js. Perfect for someone who thrives in ambiguity and loves shipping fast.', ARRAY['React', 'Node.js', 'PostgreSQL', 'REST APIs'], 'active'),
  ('YOUR_RECRUITER_UUID', 'AI/ML Engineer', 'DataMinds AI', 'Hyderabad, India (Hybrid)', '₹22L – ₹35L', 'Work on cutting-edge AI products. Design and deploy ML models for production use cases in NLP and computer vision.', ARRAY['Python', 'PyTorch', 'NLP', 'MLOps', 'AWS'], 'active'),
  ('YOUR_RECRUITER_UUID', 'Product Designer', 'DesignHub', 'Remote', '₹15L – ₹24L', 'Shape the future of our product experience. We need a designer who thinks in systems, loves user research, and can ship pixel-perfect designs.', ARRAY['Figma', 'User Research', 'Design Systems', 'Prototyping'], 'active'),
  ('YOUR_RECRUITER_UUID', 'Backend Engineer (Go)', 'CloudScale Systems', 'Pune, India', '₹20L – ₹30L', 'Build high-performance distributed systems in Go. You will work on our core platform handling millions of requests per second.', ARRAY['Go', 'Distributed Systems', 'Kubernetes', 'gRPC'], 'active');
*/

-- ============================================
-- Done! After running this:
-- 1. Sign up as a recruiter in the app
-- 2. Copy your user ID from Supabase Auth > Users
-- 3. Uncomment the seed INSERT above
-- 4. Replace YOUR_RECRUITER_UUID and run it
-- 5. Candidates can now browse and apply to jobs!
-- ============================================
