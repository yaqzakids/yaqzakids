-- Daily Challenge game: one attempt per child per day
CREATE TABLE IF NOT EXISTS daily_challenge_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_profile_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE,
  question_id uuid REFERENCES quiz_questions(id),
  selected_answer text,
  is_correct boolean,
  attempted_at date DEFAULT CURRENT_DATE,
  UNIQUE(child_profile_id, attempted_at)
);

ALTER TABLE daily_challenge_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS daily_challenge_parent ON daily_challenge_attempts;
CREATE POLICY daily_challenge_parent ON daily_challenge_attempts
  FOR ALL
  USING (
    child_profile_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  )
  WITH CHECK (
    child_profile_id IN (
      SELECT id FROM child_profiles WHERE parent_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION submit_daily_challenge(
  p_child_id uuid,
  p_question_id uuid,
  p_selected_answer text
)
RETURNS daily_challenge_attempts
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_existing daily_challenge_attempts;
  v_options jsonb;
  v_is_correct boolean := false;
  v_row daily_challenge_attempts;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM child_profiles WHERE id = p_child_id AND parent_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized child profile';
  END IF;

  SELECT * INTO v_existing
  FROM daily_challenge_attempts
  WHERE child_profile_id = p_child_id AND attempted_at = v_today;

  IF FOUND THEN
    RAISE EXCEPTION 'Already attempted today';
  END IF;

  SELECT options INTO v_options FROM quiz_questions WHERE id = p_question_id;
  IF v_options IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  SELECT bool_or(
    (elem->>'text') = p_selected_answer
    AND COALESCE((elem->>'is_correct')::boolean, false)
  )
  INTO v_is_correct
  FROM jsonb_array_elements(v_options) AS elem;

  v_is_correct := COALESCE(v_is_correct, false);

  INSERT INTO daily_challenge_attempts (
    child_profile_id, question_id, selected_answer, is_correct, attempted_at
  )
  VALUES (p_child_id, p_question_id, p_selected_answer, v_is_correct, v_today)
  RETURNING * INTO v_row;

  IF v_is_correct THEN
    PERFORM award_points(p_child_id, 50, 'daily_challenge', 'daily_challenge', v_row.id);
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION submit_daily_challenge TO authenticated;
