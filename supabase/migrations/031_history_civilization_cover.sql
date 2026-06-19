-- Use curated History & Civilization cover illustration
UPDATE adventure_paths
SET cover_image_url = '/paths/covers/history-civilization.png'
WHERE public_slug = 'history-civilization'
   OR slug = 'ancient-egypt';
