-- =============================================
-- Цифровой университет - Миграция 005
-- Расширение полей университета
-- Version: 005
-- =============================================

-- =============================================
-- Новые колонки для "Об университете"
-- =============================================

-- Руководство университета
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS leadership TEXT;

-- Достижения и награды
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS achievements TEXT;

-- Аккредитации
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS accreditations TEXT;

-- Известные выпускники
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS notable_alumni TEXT;

-- Направления исследований
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS research_focus TEXT;

-- Специальные программы
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS special_programs TEXT;

-- =============================================
-- Координаты для карты
-- =============================================

-- Широта
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Долгота
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Описание расположения кампуса
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS campus_location TEXT;

-- Индекс для геопоиска
CREATE INDEX IF NOT EXISTS idx_universities_coordinates 
ON universities(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- =============================================
-- Медиа контент
-- =============================================

-- Фотографии кампуса (JSONB массив URL)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS campus_photos JSONB DEFAULT '[]';

-- Видео (JSONB массив с URL и названиями)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]';

-- =============================================
-- Комментарии
-- =============================================

COMMENT ON COLUMN universities.leadership IS 'Руководство университета (ректор, президент, вице-президенты)';
COMMENT ON COLUMN universities.achievements IS 'Достижения и награды университета';
COMMENT ON COLUMN universities.accreditations IS 'Аккредитации и сертификаты';
COMMENT ON COLUMN universities.notable_alumni IS 'Известные выпускники';
COMMENT ON COLUMN universities.research_focus IS 'Направления научных исследований';
COMMENT ON COLUMN universities.special_programs IS 'Специальные программы (honors, accelerated и т.д.)';
COMMENT ON COLUMN universities.latitude IS 'Широта главного кампуса';
COMMENT ON COLUMN universities.longitude IS 'Долгота главного кампуса';
COMMENT ON COLUMN universities.campus_location IS 'Описание расположения кампуса';
COMMENT ON COLUMN universities.campus_photos IS 'Массив URL фотографий кампуса (JSONB)';
COMMENT ON COLUMN universities.videos IS 'Массив видео университета (JSONB: [{url, title}])';

-- =============================================
-- Обновление view
-- =============================================

DROP VIEW IF EXISTS v_latest_university_profiles;

CREATE VIEW v_latest_university_profiles AS
SELECT DISTINCT ON (university_id, language)
    up.id,
    up.university_id,
    up.profile_json,
    up.language,
    up.version,
    up.created_at,
    u.name,
    u.name_en,
    u.country,
    u.city,
    u.website_url,
    u.logo_url,
    u.is_active,
    u.leadership,
    u.achievements,
    u.accreditations,
    u.notable_alumni,
    u.research_focus,
    u.special_programs,
    u.latitude,
    u.longitude,
    u.campus_location,
    u.campus_photos,
    u.videos,
    u.specializations,
    u.languages,
    u.degree_levels,
    u.min_tuition,
    u.max_tuition,
    u.size_category,
    u.translations
FROM university_profiles up
JOIN universities u ON u.id = up.university_id
ORDER BY university_id, language, version DESC, created_at DESC;
