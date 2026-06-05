-- Yaqza Kids Supabase Schema
-- Run this in your Supabase SQL Editor

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent', 'admin')),
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  created_at timestamptz DEFAULT now()
);

-- Child profiles
CREATE TABLE IF NOT EXISTS child_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_group text NOT NULL CHECK (age_group IN ('explorer', 'discoverer', 'thinker')),
  avatar text,
  language text DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  xp_points integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_active_date date,
  total_articles_read integer DEFAULT 0,
  total_quizzes_completed integer DEFAULT 0,
  badges text[] DEFAULT '{}'
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  title_fr text,
  title_ar text,
  summary_en_6_8 text,
  summary_en_9_12 text,
  summary_en_13_16 text,
  whats_happening_en_6_8 text,
  whats_happening_en_9_12 text,
  whats_happening_en_13_16 text,
  why_it_matters_en_6_8 text,
  why_it_matters_en_9_12 text,
  why_it_matters_en_13_16 text,
  history_context_en_6_8 text,
  history_context_en_9_12 text,
  history_context_en_13_16 text,
  islamic_teaching_en_6_8 text,
  islamic_teaching_en_9_12 text,
  islamic_teaching_en_13_16 text,
  think_about_it_en_6_8 text[],
  think_about_it_en_9_12 text[],
  think_about_it_en_13_16 text[],
  activity_en_6_8 text,
  activity_en_9_12 text,
  activity_en_13_16 text,
  category text NOT NULL,
  image_url text,
  source text,
  source_url text,
  source_url_2 text,
  source_url_3 text,
  reading_time_minutes integer DEFAULT 5,
  xp_reward_explorer integer DEFAULT 10,
  xp_reward_discoverer integer DEFAULT 25,
  xp_reward_thinker integer DEFAULT 50,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_featured boolean DEFAULT false,
  is_top_story boolean DEFAULT false,
  published_date date
);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  question_en text NOT NULL,
  option_a_en text NOT NULL,
  option_b_en text NOT NULL,
  option_c_en text NOT NULL,
  option_d_en text NOT NULL,
  correct_answer text NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  xp_reward integer DEFAULT 10
);

-- Progress
CREATE TABLE IF NOT EXISTS progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid REFERENCES child_profiles(id) ON DELETE CASCADE,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  completed boolean DEFAULT false,
  quiz_score integer,
  xp_earned integer DEFAULT 0,
  completed_date date
);

-- Missions
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en text NOT NULL,
  article_id uuid REFERENCES articles(id) ON DELETE CASCADE,
  xp_reward integer NOT NULL,
  date date NOT NULL,
  age_group text CHECK (age_group IN ('explorer', 'discoverer', 'thinker'))
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('free', 'family_monthly', 'family_yearly', 'homeschool', 'school')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  start_date date NOT NULL,
  end_date date,
  stripe_subscription_id text,
  stripe_customer_id text
);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Parents can manage own children" ON child_profiles FOR ALL USING (auth.uid() = parent_id);

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can read published articles" ON articles FOR SELECT USING (status = 'published');
CREATE POLICY "Public can read quizzes for published articles" ON quizzes FOR SELECT USING (true);

-- Auto-create profile trigger (optional)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, language)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Parent'), 'parent', 'en');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
