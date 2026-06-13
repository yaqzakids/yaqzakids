-- ============================================================================
-- Seed data: pillars, paths, articles, quizzes, badges, hero cards
-- Run AFTER 001_adventure_system.sql
-- ============================================================================

-- Clear any partial data from previous failed run
TRUNCATE TABLE path_articles CASCADE;
TRUNCATE TABLE quiz_questions CASCADE;
TRUNCATE TABLE quizzes CASCADE;
TRUNCATE TABLE path_progress CASCADE;
TRUNCATE TABLE article_progress CASCADE;
TRUNCATE TABLE child_hero_cards CASCADE;
TRUNCATE TABLE child_badges CASCADE;
TRUNCATE TABLE hero_cards CASCADE;
TRUNCATE TABLE badges CASCADE;
TRUNCATE TABLE adventure_paths CASCADE;
TRUNCATE TABLE articles CASCADE;
TRUNCATE TABLE pillars CASCADE;

-- ---------------------------------------------------------------------------
-- Pillars (7 required)
-- ---------------------------------------------------------------------------
INSERT INTO pillars (id, name, slug, description, icon, color, sort_order) VALUES
  ('11111111-1111-1111-1111-111111111101', 'Discover Allah''s Creation', 'discover-allahs-creation', 'Explore the wonders Allah placed in nature and the universe.', '🌍', '#4AAE8A', 1),
  ('11111111-1111-1111-1111-111111111102', 'World Explained', 'world-explained', 'Understand news and events happening around the world.', '📰', '#1B2F5E', 2),
  ('11111111-1111-1111-1111-111111111103', 'Character & Akhlaq', 'character-akhlaq', 'Build beautiful character the Prophetic way.', '💎', '#8B6BB1', 3),
  ('11111111-1111-1111-1111-111111111104', 'History & Civilizations', 'history-civilizations', 'Journey through civilizations and lessons from history.', '🏛️', '#F5A623', 4),
  ('11111111-1111-1111-1111-111111111105', 'Skills for Life', 'skills-for-life', 'Practical skills for thinking, learning, and living wisely.', '🛠️', '#2AAFA0', 5),
  ('11111111-1111-1111-1111-111111111106', 'Islamic History & Heroes', 'islamic-history-heroes', 'Meet the heroes who shaped our Ummah.', '⭐', '#E85D4A', 6),
  ('11111111-1111-1111-1111-111111111107', 'Quran & Reflection', 'quran-reflection', 'Reflect on Allah''s words and signs.', '📖', '#2AAFA0', 7);

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------
INSERT INTO badges (id, name, slug, description, icon) VALUES
  ('22222222-2222-2222-2222-222222222201', 'Truth Seeker', 'truth-seeker', 'Completed Search for Truth path', '🔍'),
  ('22222222-2222-2222-2222-222222222202', 'Creation Explorer', 'creation-explorer', 'Completed Wonders of Allah''s Creation', '🌿'),
  ('22222222-2222-2222-2222-222222222203', 'News Navigator', 'news-navigator', 'Completed Understanding the News', '📰'),
  ('22222222-2222-2222-2222-222222222204', 'Character Builder', 'character-builder', 'Completed Building Good Character', '💎'),
  ('22222222-2222-2222-2222-222222222205', 'History Explorer', 'history-explorer', 'Completed Ancient Egypt path', '🏺'),
  ('22222222-2222-2222-2222-222222222206', 'Critical Thinker', 'critical-thinker', 'Completed Spotting Fake News', '🧠'),
  ('22222222-2222-2222-2222-222222222207', 'Signs Observer', 'signs-observer', 'Completed Signs of Allah in Nature', '🌸');

-- ---------------------------------------------------------------------------
-- Adventure paths
-- ---------------------------------------------------------------------------
INSERT INTO adventure_paths (id, pillar_id, title, slug, description, difficulty_level, is_free, badge_reward_id, cover_image_url, sort_order) VALUES
  -- Pillar 6: Islamic History & Heroes
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111106', 'Search for Truth', 'search-for-truth', 'Follow four heroes who searched for truth before Islam and after.', 'easy', true, '22222222-2222-2222-2222-222222222201', 'https://i.ibb.co/gFRNB3Jk/Chat-GPT-Image-Jun-4-2026-02-42-51-PM.png', 1),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111106', 'Young Heroes Around the Prophet ﷺ', 'young-heroes-prophet', 'Meet the young companions who stood with the Prophet ﷺ.', 'medium', false, NULL, 'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png', 2),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111106', 'Courageous Women of Islam', 'courageous-women', 'Stories of brave Muslim women throughout history.', 'medium', false, NULL, 'https://i.ibb.co/gbjGZW8p/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png', 3),
  ('33333333-3333-3333-3333-333333333304', '11111111-1111-1111-1111-111111111106', 'Hidden Heroes of Islam', 'hidden-heroes', 'Lesser-known heroes whose deeds echo through time.', 'hard', false, NULL, 'https://i.ibb.co/tTgr2xFx/Chat-GPT-Image-Jun-3-2026-04-59-24-PM.png', 4),
  -- Other free paths (one per pillar)
  ('33333333-3333-3333-3333-333333333305', '11111111-1111-1111-1111-111111111101', 'Wonders of Allah''s Creation', 'wonders-creation', 'Discover oceans, mountains, animals, and skies.', 'easy', true, '22222222-2222-2222-2222-222222222202', 'https://i.ibb.co/8qrSkyC/Chat-GPT-Image-Jun-4-2026-02-47-03-PM.png', 1),
  ('33333333-3333-3333-3333-333333333306', '11111111-1111-1111-1111-111111111102', 'Understanding the News', 'understanding-news', 'Learn how to read news with curiosity and care.', 'medium', true, '22222222-2222-2222-2222-222222222203', 'https://i.ibb.co/Qwk4M1Q/Chat-GPT-Image-Jun-4-2026-02-40-30-PM.png', 1),
  ('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111103', 'Building Good Character', 'building-character', 'Practice honesty, kindness, and patience.', 'easy', true, '22222222-2222-2222-2222-222222222204', 'https://i.ibb.co/gFRNB3Jk/Chat-GPT-Image-Jun-4-2026-02-42-51-PM.png', 1),
  ('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111104', 'Ancient Egypt', 'ancient-egypt', 'Explore pyramids, the Nile, and lessons from a great civilization.', 'medium', true, '22222222-2222-2222-2222-222222222205', 'https://i.ibb.co/ns4zjTjM/Chat-GPT-Image-Jun-4-2026-02-44-34-PM.png', 1),
  ('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111105', 'Spotting Fake News', 'spotting-fake-news', 'Learn to question, check sources, and think clearly.', 'hard', true, '22222222-2222-2222-2222-222222222206', 'https://i.ibb.co/Fd0pV30/Chat-GPT-Image-Jun-4-2026-02-46-59-PM.png', 1),
  ('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111107', 'Signs of Allah in Nature', 'signs-in-nature', 'Find Allah''s signs in flowers, rain, and the changing seasons.', 'easy', true, '22222222-2222-2222-2222-222222222207', 'https://i.ibb.co/HDhQ9Wxk/Chat-GPT-Image-Jun-4-2026-02-47-50-PM.png', 1);

-- Hero cards (unlock on path completion)
INSERT INTO hero_cards (id, name, slug, description, image_url, unlock_path_id, sort_order) VALUES
  ('44444444-4444-4444-4444-444444444401', 'Salman the Seeker', 'salman-seeker', 'Hero card: Salman al-Farisi', 'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png', '33333333-3333-3333-3333-333333333301', 1),
  ('44444444-4444-4444-4444-444444444402', 'Nature Guardian', 'nature-guardian', 'Hero card: Creation path complete', 'https://i.ibb.co/8qrSkyC/Chat-GPT-Image-Jun-4-2026-02-47-03-PM.png', '33333333-3333-3333-3333-333333333305', 2);

-- ---------------------------------------------------------------------------
-- Search for Truth articles (4 articles)
-- ---------------------------------------------------------------------------
INSERT INTO articles (id, pillar_id, title, slug, excerpt, age_min, age_max, reading_time_minutes, is_premium, cover_image_url, published,
  content_explorer, content_discoverer, content_thinker, islamic_teaching, think_about_it, activity, source_name) VALUES
(
  '55555555-5555-5555-5555-555555555501',
  '11111111-1111-1111-1111-111111111106',
  'Salman al-Farisi — The Boy Who Searched for the Truth',
  'salman-al-farisi',
  'Salman grew up in Persia but never stopped asking: who is the true God?',
  5, 16, 6, false,
  'https://i.ibb.co/HfGGfqTb/Chat-GPT-Image-Jun-4-2026-02-40-58-PM.png', true,
  'Salman was a curious boy. He asked big questions about God. He traveled far to find answers. He met Christians and Jews who taught him about prophets. He kept searching until he found the Prophet Muhammad ﷺ in Medina!',
  'Salman al-Farisi was born in Persia into a Zoroastrian family. Despite his father''s status as a fire keeper, Salman questioned the worship of fire. He left home seeking truth, studied with Christian monks, and eventually heard about a prophet in Arabia. His long journey ended when he met the Prophet ﷺ and became a beloved companion.',
  'Salman al-Farisi exemplifies intellectual honesty and spiritual courage. His multi-stage search — Zoroastrianism, Christianity, Judaism — reflects a mind unwilling to accept inherited belief without examination. His story validates the Islamic principle that sincere truth-seeking (talab al-haqq) is a virtue, and that Islam welcomes those who arrive through reason and struggle.',
  'Allah loves those who sincerely seek the truth. Salman''s journey shows that asking questions is not weakness — it is worship when done with humility.',
  ARRAY['What big questions do you have about the world?', 'Why is it important to keep searching for truth?', 'How can we ask questions respectfully?'],
  'Draw a map of Salman''s journey from Persia to Medina. Label three places he stopped.',
  'Seerah & Companion Biographies'
),
(
  '55555555-5555-5555-5555-555555555502',
  '11111111-1111-1111-1111-111111111106',
  'Mus''ab ibn Umayr — The Rich Boy Who Gave Everything Away',
  'musab-ibn-umayr',
  'Mus''ab had the finest clothes in Makkah — then he chose Islam over wealth.',
  5, 16, 5, false,
  'https://i.ibb.co/gbjGZW8p/Chat-GPT-Image-Jun-3-2026-04-45-19-PM.png', true,
  'Mus''ab was very rich and wore beautiful clothes. When he became Muslim, his family took everything away. He wore old clothes but stayed happy because he had faith! The Prophet ﷺ chose him to teach Islam in Madinah.',
  'Mus''ab ibn Umayr was among the first Muslims in Makkah. His mother, Khunnas bint Malik, confiscated his wealth when he accepted Islam. Despite persecution, he became Islam''s first ambassador to Madinah, where he successfully invited the Aws and Khazraj tribes to Islam before the Hijra.',
  'Mus''ab represents the sacrifice of privilege for principle. His transformation from Makkan elite to barefoot da''i (caller) challenges materialism. He died at the Battle of Uhud holding the Muslim flag — a symbol of how early Muslims traded comfort for conviction.',
  'The Prophet ﷺ said the best of you in Jahiliyyah are the best in Islam when they learn. Mus''ab shows that status means nothing without faith.',
  ARRAY['What would be hard to give up for something you believe in?', 'How did Mus''ab show courage?', 'What does it mean to be a leader?'],
  'Write a letter from Mus''ab to his mother explaining why Islam matters to him.',
  'Seerah & Companion Biographies'
),
(
  '55555555-5555-5555-5555-555555555503',
  '11111111-1111-1111-1111-111111111106',
  'Abu Dharr al-Ghifari — Standing Alone for What Is Right',
  'abu-dharr-al-ghifari',
  'Abu Dharr spoke truth to power even when it was dangerous.',
  5, 16, 5, false,
  'https://i.ibb.co/tTgr2xFx/Chat-GPT-Image-Jun-3-2026-04-59-24-PM.png', true,
  'Abu Dharr was brave and honest. He told people when something was wrong, even powerful leaders. The Prophet ﷺ loved his honesty. Abu Dharr taught us to speak kindly but truthfully.',
  'Abu Dharr al-Ghifari came to Islam after hearing about the Prophet ﷺ. He is famous for his uncompromising stance against injustice and hoarding of wealth. He was exiled to Rabdhah where he lived simply until his death, never abandoning his principles.',
  'Abu Dharr embodies prophetic justice in an age of inequality. His famous hadith warning against hoarding wealth challenged the economic structures of his time. His exile illustrates the cost of moral clarity — and the Islamic duty to speak against systemic wrong even at personal expense.',
  'The best jihad is a word of truth before a tyrant. Abu Dharr lived this hadith with his life.',
  ARRAY['When is it hard to tell the truth?', 'How can we be honest and kind at the same time?', 'What does justice mean to you?'],
  'Role-play: one person is Abu Dharr, another is a friend. Practice speaking truth with kindness.',
  'Seerah & Companion Biographies'
),
(
  '55555555-5555-5555-5555-555555555504',
  '11111111-1111-1111-1111-111111111106',
  'Khabbab ibn al-Aratt — Patience Through Hardship',
  'khabbab-ibn-al-aratt',
  'Khabbab was tortured for his faith but never gave up hope.',
  5, 16, 5, false,
  'https://i.ibb.co/Qwk4M1Q/Chat-GPT-Image-Jun-4-2026-02-40-30-PM.png', true,
  'Khabbab was a slave who became Muslim. His cruel master hurt him badly on hot coals. He stayed patient and trusted Allah. Later, Islam spread and he was free!',
  'Khabbab ibn al-Aratt was an early convert who endured severe torture in Makkah, including being pressed against heated stones. He asked the Prophet ﷺ when Allah''s help would come — and soon after, Islam gained strength. He lived to see the triumph of the faith he suffered for.',
  'Khabbab''s story connects personal suffering to collective liberation. His question to the Prophet ﷺ ("Will there be relief?") is deeply human. The answer came not through instant rescue but through the gradual establishment of a community where such torture became unthinkable.',
  'With hardship comes ease (Quran 94:6). Khabbab teaches sabr — patience that trusts Allah''s timing.',
  ARRAY['What helps you stay patient when things are hard?', 'Why did early Muslims keep going?', 'How can we support friends who struggle?'],
  'Make a "patience jar" — write one thing you are grateful for each day for a week.',
  'Seerah & Companion Biographies'
);

-- Link Search for Truth articles to path
INSERT INTO path_articles (adventure_path_id, article_id, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555501', 1),
  ('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555502', 2),
  ('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555503', 3),
  ('33333333-3333-3333-3333-333333333301', '55555555-5555-5555-5555-555555555504', 4);

-- Placeholder articles for other free paths (1 each for UI testing)
INSERT INTO articles (id, pillar_id, title, slug, excerpt, age_min, age_max, reading_time_minutes, is_premium, published,
  content_explorer, content_discoverer, content_thinker, islamic_teaching, think_about_it, activity) VALUES
  ('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111101', 'The Amazing Ocean', 'amazing-ocean', 'Allah created vast oceans full of wonder.', 5, 16, 4, false, true,
   'The ocean is huge and blue! Fish swim deep below. Allah made it all.', 'Oceans cover 71% of Earth and hold mysteries we are still discovering.', 'Ocean ecosystems regulate climate and biodiversity — signs of divine design.', 'Allah says in the Quran: "And it is He who has released the two seas."', ARRAY['What is your favourite sea creature?'], 'Draw your favourite ocean animal.'),
  ('55555555-5555-5555-5555-555555555506', '11111111-1111-1111-1111-111111111102', 'What Is News?', 'what-is-news', 'News tells us what happened — but how do we understand it?', 5, 16, 4, false, true,
   'News is stories about things that happen in the world today!', 'News is information about current events, reported by journalists.', 'News literacy requires evaluating sources, bias, and framing.', 'Seek knowledge and verify information before sharing.', ARRAY['Where do you get news?'], 'Find one news story and list three facts.'),
  ('55555555-5555-5555-5555-555555555507', '11111111-1111-1111-1111-111111111103', 'The Honest Tongue', 'honest-tongue', 'Truthfulness is a mark of faith.', 5, 16, 4, false, true,
   'Being honest means telling the truth even when it is hard.', 'The Prophet ﷺ was known as Al-Amin — the trustworthy — before prophethood.', 'Honesty builds social trust; deception erodes communities.', 'Truthfulness leads to righteousness.', ARRAY['When is honesty difficult?'], 'Practice saying one honest compliment today.'),
  ('55555555-5555-5555-5555-555555555508', '11111111-1111-1111-1111-111111111104', 'Pyramids of Egypt', 'pyramids-egypt', 'Ancient wonders that still stand today.', 5, 16, 5, false, true,
   'The pyramids are giant triangle buildings in Egypt!', 'Built over 4,500 years ago, the pyramids reflect advanced ancient engineering.', 'Egyptian civilization influenced science, mathematics, and governance.', 'Travel and see the ruins of previous nations.', ARRAY['What would you ask an ancient Egyptian?'], 'Build a pyramid from blocks or paper.'),
  ('55555555-5555-5555-5555-555555555509', '11111111-1111-1111-1111-111111111105', 'Is It Real or Fake?', 'real-or-fake', 'Learn to spot misleading information online.', 5, 16, 5, false, true,
   'Some things on the internet are not true! Always ask a grown-up.', 'Fake news spreads faster than truth on social media. Check multiple sources.', 'Critical media literacy is essential in the digital age.', 'Verify before you share — the tongue can spread harm.', ARRAY['Have you ever seen something fake online?'], 'Spot-check one headline with two sources.'),
  ('55555555-5555-5555-5555-555555555510', '11111111-1111-1111-1111-111111111107', 'Rain Is a Blessing', 'rain-blessing', 'Every drop of rain is a sign from Allah.', 5, 16, 4, false, true,
   'Rain helps plants grow! It comes from clouds Allah sends.', 'The water cycle demonstrates interconnected natural systems.', 'Meteorology and faith both invite awe at natural order.', 'Allah sends rain as mercy and life for the earth.', ARRAY['What do you like about rainy days?'], 'Keep a rain journal for one week.');

INSERT INTO path_articles (adventure_path_id, article_id, sort_order) VALUES
  ('33333333-3333-3333-3333-333333333305', '55555555-5555-5555-5555-555555555505', 1),
  ('33333333-3333-3333-3333-333333333306', '55555555-5555-5555-5555-555555555506', 1),
  ('33333333-3333-3333-3333-333333333307', '55555555-5555-5555-5555-555555555507', 1),
  ('33333333-3333-3333-3333-333333333308', '55555555-5555-5555-5555-555555555508', 1),
  ('33333333-3333-3333-3333-333333333309', '55555555-5555-5555-5555-555555555509', 1),
  ('33333333-3333-3333-3333-333333333310', '55555555-5555-5555-5555-555555555510', 1);

-- ---------------------------------------------------------------------------
-- Quizzes (one question per article — legacy quizzes table schema)
-- ---------------------------------------------------------------------------
INSERT INTO quizzes (id, article_id, question_en, option_a_en, option_b_en, option_c_en, option_d_en, correct_answer) VALUES
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501',
   'Where was Salman al-Farisi born?',
   'Arabia', 'Persia', 'Syria', 'Egypt', 'B'),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555502',
   'What did Mus''ab ibn Umayr give up when he became Muslim?',
   'His name', 'His wealth and fine clothes', 'His language', 'Nothing at all', 'B'),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555503',
   'What was Abu Dharr al-Ghifari best known for?',
   'Hoarding wealth', 'Staying silent', 'Speaking truth even when it was dangerous', 'Being a merchant', 'C'),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555504',
   'What virtue does Khabbab ibn al-Aratt''s story teach us?',
   'Giving up easily', 'Patience (sabr) through hardship', 'Avoiding faith', 'Seeking revenge', 'B'),
  ('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555505',
   'Who created the oceans and everything in them?',
   'People', 'Allah', 'Accident', 'No one', 'B'),
  ('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555506',
   'What should you do before sharing a news story?',
   'Share it immediately', 'Check if it is true', 'Make it funnier', 'Ignore all news', 'B'),
  ('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555507',
   'What title was the Prophet Muhammad ﷺ known by before prophethood?',
   'Al-Amin (the Trustworthy)', 'Al-Faruq', 'Al-Siddiq', 'Al-Mustafa', 'A'),
  ('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555508',
   'Where are the Great Pyramids located?',
   'Iraq', 'Morocco', 'Egypt', 'Turkey', 'C'),
  ('66666666-6666-6666-6666-666666666609', '55555555-5555-5555-5555-555555555509',
   'What is the best first step when you see a surprising headline online?',
   'Share it right away', 'Check it with another reliable source', 'Ignore everything online', 'Change the headline', 'B'),
  ('66666666-6666-6666-6666-666666666610', '55555555-5555-5555-5555-555555555510',
   'What does rain help plants do?',
   'Sleep', 'Grow', 'Fly', 'Hide', 'B');
