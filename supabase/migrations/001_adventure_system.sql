-- ============================================================================
-- Yaqza Kids Adventure Path System
-- Migration 001: pillars, paths, articles, quizzes, progress, badges, points
-- Run in Supabase SQL Editor (or via supabase db push when CLI is configured)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Helper: check if parent has paid membership
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_paid_member(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND plan IN ('family_monthly', 'family_yearly', 'homeschool', 'school')
  );
$$;

-- ---------------------------------------------------------------------------
-- Extend child_profiles with points (Stars in UI)
-- ---------------------------------------------------------------------------
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS points integer NOT NULL DEFAULT 0;

-- ---------------------------------------------------------------------------
-- Legacy rename (preserves marketing-site articles if they exist)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'articles' AND column_name = 'title_en'
  ) THEN
    ALTER TABLE IF EXISTS quizzes DROP CONSTRAINT IF EXISTS quizzes_article_id_fkey;
    ALTER TABLE IF EXISTS progress DROP CONSTRAINT IF EXISTS progress_article_id_fkey;
    ALTER TABLE IF EXISTS missions DROP CONSTRAINT IF EXISTS missions_article_id_fkey;
    ALTER TABLE articles RENAME TO articles_legacy;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Pillars
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  color text DEFAULT '#2AAFA0',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Badges (created before paths for FK)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  icon text,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Hero cards
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hero_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  image_url text,
  unlock_path_id uuid, -- set after adventure_paths exists
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Adventure paths
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS adventure_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  difficulty_level text NOT NULL DEFAULT 'medium'
    CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  is_free boolean NOT NULL DEFAULT false,
  badge_reward_id uuid REFERENCES badges(id) ON DELETE SET NULL,
  cover_image_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hero_cards
  DROP CONSTRAINT IF EXISTS hero_cards_unlock_path_id_fkey;
ALTER TABLE hero_cards
  ADD CONSTRAINT hero_cards_unlock_path_id_fkey
  FOREIGN KEY (unlock_path_id) REFERENCES adventure_paths(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Adventure articles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pillar_id uuid NOT NULL REFERENCES pillars(id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  age_min integer NOT NULL DEFAULT 5,
  age_max integer NOT NULL DEFAULT 16,
  reading_time_minutes integer NOT NULL DEFAULT 5,
  is_premium boolean NOT NULL DEFAULT true,
  cover_image_url text,
  published boolean NOT NULL DEFAULT false,
  content_explorer text,
  content_discoverer text,
  content_thinker text,
  islamic_teaching text,
  think_about_it text[] DEFAULT '{}',
  activity text,
  source_name text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Path ↔ Article ordering
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS path_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adventure_path_id uuid NOT NULL REFERENCES adventure_paths(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (adventure_path_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_path_articles_path ON path_articles(adventure_path_id, sort_order);

-- ---------------------------------------------------------------------------
-- Quizzes & questions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Article Quiz',
  passing_score integer NOT NULL DEFAULT 70,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- [{ "text": "...", "is_correct": true/false }]
  explanation text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON quiz_questions(quiz_id, sort_order);

-- ---------------------------------------------------------------------------
-- Progress tracking (per child)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS article_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  read_completed boolean NOT NULL DEFAULT false,
  quiz_passed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, article_id)
);

CREATE TABLE IF NOT EXISTS path_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  adventure_path_id uuid NOT NULL REFERENCES adventure_paths(id) ON DELETE CASCADE,
  total_articles integer NOT NULL DEFAULT 0,
  completed_articles integer NOT NULL DEFAULT 0,
  completion_percentage numeric(5,2) NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, adventure_path_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score_percentage numeric(5,2) NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  attempt_number integer NOT NULL DEFAULT 1,
  answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_child ON quiz_attempts(child_profile_id, quiz_id);

-- ---------------------------------------------------------------------------
-- Badges & hero cards earned (per child)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS child_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, badge_id)
);

CREATE TABLE IF NOT EXISTS child_hero_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  hero_card_id uuid NOT NULL REFERENCES hero_cards(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, hero_card_id)
);

-- ---------------------------------------------------------------------------
-- Points ledger (Stars in UI — points in DB)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS points_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  points integer NOT NULL CHECK (points > 0),
  reason text NOT NULL,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (child_profile_id, source_type, source_id, reason)
);

CREATE INDEX IF NOT EXISTS idx_points_ledger_child ON points_ledger(child_profile_id);

-- ---------------------------------------------------------------------------
-- Points constants (documented in comments)
-- read article = 10 | quiz pass = 25 | path complete = 100 | badge = 50
-- ---------------------------------------------------------------------------

-- Award points idempotently; updates child_profiles.points
CREATE OR REPLACE FUNCTION award_points(
  p_child_id uuid,
  p_points integer,
  p_reason text,
  p_source_type text,
  p_source_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted integer;
BEGIN
  INSERT INTO points_ledger (child_profile_id, points, reason, source_type, source_id)
  VALUES (p_child_id, p_points, p_reason, p_source_type, p_source_id)
  ON CONFLICT (child_profile_id, source_type, source_id, reason) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted > 0 THEN
    UPDATE child_profiles SET points = points + p_points WHERE id = p_child_id;
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Recalculate path progress for a child on a given path
CREATE OR REPLACE FUNCTION recalculate_path_progress(
  p_child_id uuid,
  p_path_id uuid
)
RETURNS path_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_completed integer;
  v_pct numeric(5,2);
  v_row path_progress;
  v_badge_id uuid;
  v_inserted integer;
BEGIN
  SELECT COUNT(*) INTO v_total
  FROM path_articles WHERE adventure_path_id = p_path_id;

  SELECT COUNT(*) INTO v_completed
  FROM path_articles pa
  JOIN article_progress ap ON ap.article_id = pa.article_id
  WHERE pa.adventure_path_id = p_path_id
    AND ap.child_profile_id = p_child_id
    AND ap.read_completed = true
    AND ap.quiz_passed = true;

  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100, 2) ELSE 0 END;

  INSERT INTO path_progress (
    child_profile_id, adventure_path_id, total_articles, completed_articles,
    completion_percentage, completed, completed_at, updated_at
  )
  VALUES (
    p_child_id, p_path_id, v_total, v_completed, v_pct,
    (v_total > 0 AND v_completed >= v_total),
    CASE WHEN v_total > 0 AND v_completed >= v_total THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (child_profile_id, adventure_path_id) DO UPDATE SET
    total_articles = EXCLUDED.total_articles,
    completed_articles = EXCLUDED.completed_articles,
    completion_percentage = EXCLUDED.completion_percentage,
    completed = EXCLUDED.completed,
    completed_at = CASE
      WHEN EXCLUDED.completed AND path_progress.completed_at IS NULL THEN now()
      WHEN EXCLUDED.completed THEN path_progress.completed_at
      ELSE NULL
    END,
    updated_at = now()
  RETURNING * INTO v_row;

  IF v_row.completed THEN
    -- Path completion: 100 points
    PERFORM award_points(p_child_id, 100, 'path_complete', 'adventure_path', p_path_id);

    -- Badge reward
    SELECT badge_reward_id INTO v_badge_id FROM adventure_paths WHERE id = p_path_id;
    IF v_badge_id IS NOT NULL THEN
      INSERT INTO child_badges (child_profile_id, badge_id)
      VALUES (p_child_id, v_badge_id)
      ON CONFLICT (child_profile_id, badge_id) DO NOTHING;
      GET DIAGNOSTICS v_inserted = ROW_COUNT;
      IF v_inserted > 0 THEN
        PERFORM award_points(p_child_id, 50, 'badge_unlock', 'badge', v_badge_id);
      END IF;
    END IF;

    -- Unlock hero cards tied to this path
    INSERT INTO child_hero_cards (child_profile_id, hero_card_id)
    SELECT p_child_id, hc.id FROM hero_cards hc
    WHERE hc.unlock_path_id = p_path_id
    ON CONFLICT (child_profile_id, hero_card_id) DO NOTHING;
  END IF;

  RETURN v_row;
END;
$$;

-- Mark article as read; awards 10 points once
CREATE OR REPLACE FUNCTION mark_article_read(
  p_child_id uuid,
  p_article_id uuid
)
RETURNS article_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row article_progress;
  v_path_id uuid;
BEGIN
  INSERT INTO article_progress (child_profile_id, article_id, read_completed, updated_at)
  VALUES (p_child_id, p_article_id, true, now())
  ON CONFLICT (child_profile_id, article_id) DO UPDATE SET
    read_completed = true,
    updated_at = now()
  RETURNING * INTO v_row;

  PERFORM award_points(p_child_id, 10, 'article_read', 'article', p_article_id);

  -- If already quiz passed, mark article complete
  IF v_row.quiz_passed THEN
    UPDATE article_progress
    SET completed_at = COALESCE(completed_at, now()), updated_at = now()
    WHERE id = v_row.id
    RETURNING * INTO v_row;
  END IF;

  -- Recalculate all paths containing this article
  FOR v_path_id IN
    SELECT adventure_path_id FROM path_articles WHERE article_id = p_article_id
  LOOP
    PERFORM recalculate_path_progress(p_child_id, v_path_id);
  END LOOP;

  RETURN v_row;
END;
$$;

-- Record quiz attempt; on pass (>=70%) update progress and award 25 points
CREATE OR REPLACE FUNCTION record_quiz_attempt(
  p_child_id uuid,
  p_quiz_id uuid,
  p_score_percentage numeric,
  p_answers jsonb DEFAULT NULL
)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempt_num integer;
  v_passed boolean;
  v_article_id uuid;
  v_row quiz_attempts;
  v_path_id uuid;
  v_ap article_progress;
BEGIN
  SELECT COALESCE(MAX(attempt_number), 0) + 1 INTO v_attempt_num
  FROM quiz_attempts
  WHERE child_profile_id = p_child_id AND quiz_id = p_quiz_id;

  v_passed := p_score_percentage >= 70;

  INSERT INTO quiz_attempts (
    child_profile_id, quiz_id, score_percentage, passed, attempt_number, answers
  )
  VALUES (p_child_id, p_quiz_id, p_score_percentage, v_passed, v_attempt_num, p_answers)
  RETURNING * INTO v_row;

  SELECT article_id INTO v_article_id FROM quizzes WHERE id = p_quiz_id;

  IF v_passed AND v_article_id IS NOT NULL THEN
    INSERT INTO article_progress (child_profile_id, article_id, quiz_passed, updated_at)
    VALUES (p_child_id, v_article_id, true, now())
    ON CONFLICT (child_profile_id, article_id) DO UPDATE SET
      quiz_passed = true,
      updated_at = now()
    RETURNING * INTO v_ap;

    PERFORM award_points(p_child_id, 25, 'quiz_pass', 'quiz', p_quiz_id);

    -- Article complete when both read and quiz passed
    UPDATE article_progress
    SET completed_at = now(), updated_at = now()
    WHERE child_profile_id = p_child_id AND article_id = v_article_id
      AND read_completed = true AND quiz_passed = true AND completed_at IS NULL;

    UPDATE child_profiles
    SET total_quizzes_completed = total_quizzes_completed + 1
    WHERE id = p_child_id;

    FOR v_path_id IN
      SELECT adventure_path_id FROM path_articles WHERE article_id = v_article_id
    LOOP
      PERFORM recalculate_path_progress(p_child_id, v_path_id);
    END LOOP;
  END IF;

  RETURN v_row;
END;
$$;

-- Can child access path?
CREATE OR REPLACE FUNCTION can_access_path(p_user_id uuid, p_path_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM adventure_paths ap
    WHERE ap.id = p_path_id
      AND (ap.is_free = true OR is_paid_member(p_user_id))
  );
$$;

-- Can child access article (via path membership or free path)
CREATE OR REPLACE FUNCTION can_access_article(p_user_id uuid, p_article_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    is_paid_member(p_user_id)
    OR EXISTS (
      SELECT 1 FROM path_articles pa
      JOIN adventure_paths ap ON ap.id = pa.adventure_path_id
      WHERE pa.article_id = p_article_id AND ap.is_free = true
    )
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE pillars ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventure_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE hero_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE path_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_hero_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;

-- Public read for published content metadata
CREATE POLICY "pillars_public_read" ON pillars FOR SELECT USING (true);
CREATE POLICY "badges_public_read" ON badges FOR SELECT USING (true);
CREATE POLICY "hero_cards_public_read" ON hero_cards FOR SELECT USING (true);
CREATE POLICY "paths_public_read" ON adventure_paths FOR SELECT USING (true);
CREATE POLICY "path_articles_public_read" ON path_articles FOR SELECT USING (true);

-- Articles: published metadata visible; full content gated in app via can_access_article
CREATE POLICY "articles_published_read" ON articles FOR SELECT USING (published = true);

CREATE POLICY "quizzes_public_read" ON quizzes FOR SELECT USING (true);
CREATE POLICY "quiz_questions_public_read" ON quiz_questions FOR SELECT USING (true);

-- Parent owns child progress
CREATE POLICY "article_progress_parent" ON article_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

CREATE POLICY "path_progress_parent" ON path_progress FOR ALL
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

CREATE POLICY "quiz_attempts_parent" ON quiz_attempts FOR ALL
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

CREATE POLICY "child_badges_parent" ON child_badges FOR ALL
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

CREATE POLICY "child_hero_cards_parent" ON child_hero_cards FOR ALL
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

CREATE POLICY "points_ledger_parent" ON points_ledger FOR SELECT
  USING (EXISTS (SELECT 1 FROM child_profiles c WHERE c.id = child_profile_id AND c.parent_id = auth.uid()));

-- Grant execute on RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION award_points TO authenticated;
GRANT EXECUTE ON FUNCTION recalculate_path_progress TO authenticated;
GRANT EXECUTE ON FUNCTION mark_article_read TO authenticated;
GRANT EXECUTE ON FUNCTION record_quiz_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_path TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_article TO authenticated;
GRANT EXECUTE ON FUNCTION is_paid_member TO authenticated;
