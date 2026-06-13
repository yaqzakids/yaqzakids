-- =============================================================================
-- 003_phase1_engagement.sql — Phase 1: Streaks, streak badges, mark_article_read
-- Run after 001_adventure_system.sql and 002_seed_adventure_data.sql
-- Does NOT modify 001 or 002
-- =============================================================================

-- ---------------------------------------------------------------------------
-- SECTION 1: child_streaks table
-- Tracks daily learning streak per child (updated when article is marked read)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS child_streaks CASCADE;

CREATE TABLE IF NOT EXISTS child_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_activity_date date,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_streaks_child ON child_streaks(child_profile_id);

ALTER TABLE child_streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS child_streaks_parent ON child_streaks;
CREATE POLICY child_streaks_parent ON child_streaks
  USING (child_profile_id IN (
    SELECT id FROM child_profiles WHERE parent_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- SECTION 2: Streak milestone badges
-- On Fire (7-day) and Diamond Streak (30-day)
-- ---------------------------------------------------------------------------
INSERT INTO badges (id, name, slug, description, icon, image_url)
VALUES
  (
    '77777777-7777-7777-7777-777777777701',
    'On Fire',
    'on-fire',
    'Maintained a 7-day learning streak',
    '🔥',
    NULL
  ),
  (
    '77777777-7777-7777-7777-777777777702',
    'Diamond Streak',
    'diamond-streak',
    'Maintained a 30-day learning streak',
    '💎',
    NULL
  )
ON CONFLICT (slug) DO NOTHING;

-- ---------------------------------------------------------------------------
-- SECTION 3: Streak helper — called from mark_article_read
-- Idempotent streak rewards via points_ledger unique constraint
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_child_streak(p_child_id uuid)
RETURNS child_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row child_streaks;
  v_today date := CURRENT_DATE;
  v_on_fire_badge uuid := '77777777-7777-7777-7777-777777777701';
  v_diamond_badge uuid := '77777777-7777-7777-7777-777777777702';
BEGIN
  -- Ensure streak row exists
  INSERT INTO child_streaks (child_profile_id, current_streak, longest_streak, last_activity_date)
  VALUES (p_child_id, 0, 0, NULL)
  ON CONFLICT (child_profile_id) DO NOTHING;

  SELECT * INTO v_row FROM child_streaks WHERE child_profile_id = p_child_id FOR UPDATE;

  -- Streak rules
  IF v_row.last_activity_date = v_today THEN
    -- Already active today — no streak change
    NULL;
  ELSIF v_row.last_activity_date = v_today - 1 THEN
    -- Consecutive day — increment
    v_row.current_streak := v_row.current_streak + 1;
  ELSE
    -- First activity or gap — reset to 1
    v_row.current_streak := 1;
  END IF;

  -- Always update last activity to today (even if streak unchanged)
  v_row.last_activity_date := v_today;

  IF v_row.current_streak > v_row.longest_streak THEN
    v_row.longest_streak := v_row.current_streak;
  END IF;

  UPDATE child_streaks SET
    current_streak = v_row.current_streak,
    longest_streak = v_row.longest_streak,
    last_activity_date = v_row.last_activity_date
  WHERE child_profile_id = p_child_id
  RETURNING * INTO v_row;

  -- Streak milestone rewards (idempotent via award_points ON CONFLICT)
  IF v_row.current_streak = 3 THEN
    PERFORM award_points(p_child_id, 25, '3-day-streak', 'streak', p_child_id);
  END IF;

  IF v_row.current_streak = 7 THEN
    PERFORM award_points(p_child_id, 50, '7-day-streak', 'streak', p_child_id);
    INSERT INTO child_badges (child_profile_id, badge_id)
    VALUES (p_child_id, v_on_fire_badge)
    ON CONFLICT (child_profile_id, badge_id) DO NOTHING;
  END IF;

  IF v_row.current_streak = 30 THEN
    PERFORM award_points(p_child_id, 200, '30-day-streak', 'streak', p_child_id);
    INSERT INTO child_badges (child_profile_id, badge_id)
    VALUES (p_child_id, v_diamond_badge)
    ON CONFLICT (child_profile_id, badge_id) DO NOTHING;
  END IF;

  RETURN v_row;
END;
$$;

-- ---------------------------------------------------------------------------
-- SECTION 4: Updated mark_article_read — adds streak tracking
-- Preserves all existing progression logic from 001
-- ---------------------------------------------------------------------------
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

  -- Update daily streak (Phase 1)
  PERFORM update_child_streak(p_child_id);

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

GRANT EXECUTE ON FUNCTION update_child_streak TO authenticated;
GRANT EXECUTE ON FUNCTION mark_article_read TO authenticated;
