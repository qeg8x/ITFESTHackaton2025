-- =============================================
-- Цифровой университет - Миграция 003
-- Добавление колонок для фильтрации
-- Version: 003
-- =============================================

-- Добавление расширения для pg_trgm (fuzzy search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- Новые колонки для быстрой фильтрации
-- =============================================

-- Специализации/области обучения (JSON массив)
-- Примеры: ["STEM", "Business", "Medicine", "Arts", "Engineering", "Law"]
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]';

-- Уровни образования (JSON массив)
-- Примеры: ["Bachelor", "Master", "PhD", "Associate"]
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS degree_levels JSONB DEFAULT '[]';

-- Языки обучения (JSON массив)
-- Примеры: ["English", "Russian", "Kazakh", "German"]
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]';

-- Минимальная стоимость обучения (USD/год)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS min_tuition INTEGER;

-- Максимальная стоимость обучения (USD/год)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS max_tuition INTEGER;

-- Категория размера университета
-- Значения: "small" (< 5000), "medium" (5000-20000), "large" (> 20000)
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS size_category VARCHAR(50);

-- Рейтинги университета (JSON массив)
-- Примеры: [{"source": "QS", "rank": 150, "year": 2024}]
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS rankings JSONB DEFAULT '[]';

-- Принимает ли иностранных студентов
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS accepts_international BOOLEAN DEFAULT true;

-- Год основания
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS founded_year INTEGER;

-- Количество студентов
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS student_count INTEGER;

-- Время последней индексации для поиска
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =============================================
-- Индексы для быстрой фильтрации
-- =============================================

-- Индекс по специализациям (GIN для JSONB)
CREATE INDEX IF NOT EXISTS idx_universities_specializations 
ON universities USING GIN (specializations);

-- Индекс по языкам обучения
CREATE INDEX IF NOT EXISTS idx_universities_languages 
ON universities USING GIN (languages);

-- Индекс по уровням образования
CREATE INDEX IF NOT EXISTS idx_universities_degree_levels 
ON universities USING GIN (degree_levels);

-- Индекс по рейтингам
CREATE INDEX IF NOT EXISTS idx_universities_rankings 
ON universities USING GIN (rankings);

-- Индекс по стоимости обучения
CREATE INDEX IF NOT EXISTS idx_universities_tuition 
ON universities (min_tuition, max_tuition);

-- Индекс по размеру
CREATE INDEX IF NOT EXISTS idx_universities_size_category 
ON universities (size_category);

-- Индекс по принятию иностранцев
CREATE INDEX IF NOT EXISTS idx_universities_accepts_international 
ON universities (accepts_international);

-- Индекс по году основания
CREATE INDEX IF NOT EXISTS idx_universities_founded_year 
ON universities (founded_year);

-- Trigram индекс для fuzzy поиска по имени
CREATE INDEX IF NOT EXISTS idx_universities_name_trgm 
ON universities USING GIN (name gin_trgm_ops);

-- Trigram индекс для fuzzy поиска по английскому имени
CREATE INDEX IF NOT EXISTS idx_universities_name_en_trgm 
ON universities USING GIN (name_en gin_trgm_ops);

-- Комбинированный индекс для частых фильтров
CREATE INDEX IF NOT EXISTS idx_universities_country_active 
ON universities (country, is_active) 
WHERE is_active = true;

-- =============================================
-- Обновление view для последних профилей
-- =============================================

-- Пересоздаём view с новыми полями
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
    u.specializations,
    u.degree_levels,
    u.languages,
    u.min_tuition,
    u.max_tuition,
    u.size_category,
    u.rankings,
    u.accepts_international,
    u.founded_year,
    u.student_count
FROM university_profiles up
JOIN universities u ON u.id = up.university_id
ORDER BY university_id, language, version DESC, created_at DESC;

-- =============================================
-- Комментарии к новым колонкам
-- =============================================

COMMENT ON COLUMN universities.specializations IS 'Области специализации университета (JSONB массив)';
COMMENT ON COLUMN universities.degree_levels IS 'Предлагаемые уровни образования (JSONB массив)';
COMMENT ON COLUMN universities.languages IS 'Языки обучения (JSONB массив)';
COMMENT ON COLUMN universities.min_tuition IS 'Минимальная стоимость обучения в USD/год';
COMMENT ON COLUMN universities.max_tuition IS 'Максимальная стоимость обучения в USD/год';
COMMENT ON COLUMN universities.size_category IS 'Категория размера: small, medium, large';
COMMENT ON COLUMN universities.rankings IS 'Рейтинги университета (JSONB массив)';
COMMENT ON COLUMN universities.accepts_international IS 'Принимает ли иностранных студентов';
COMMENT ON COLUMN universities.founded_year IS 'Год основания университета';
COMMENT ON COLUMN universities.student_count IS 'Общее количество студентов';
COMMENT ON COLUMN universities.indexed_at IS 'Время последней индексации для поиска';
