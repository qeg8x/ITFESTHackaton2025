-- =============================================
-- Цифровой университет - Миграция 004
-- Добавление колонки translations для многоязычности
-- Version: 004
-- =============================================

-- =============================================
-- Колонка translations для университетов
-- =============================================

-- Добавить колонку translations (JSONB)
-- Структура:
-- {
--   "ru": { "name": "...", "description": "...", "mission": "..." },
--   "kk": { "name": "...", "description": "...", "mission": "..." },
--   "en": { "name": "...", "description": "...", "mission": "..." }
-- }
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;

-- Предпочитаемый язык отображения
ALTER TABLE universities 
ADD COLUMN IF NOT EXISTS display_language VARCHAR(10) DEFAULT 'en';

-- Индекс для поиска по переводам
CREATE INDEX IF NOT EXISTS idx_universities_translations 
ON universities USING GIN (translations);

-- =============================================
-- Колонка translations для программ в профиле
-- =============================================

-- Примечание: переводы программ хранятся внутри profile_json
-- в university_profiles таблице. Отдельная колонка не нужна.

-- =============================================
-- Функция для извлечения перевода
-- =============================================

-- Функция для получения перевода поля с fallback
CREATE OR REPLACE FUNCTION get_translated_field(
  translations_json JSONB,
  field_name TEXT,
  lang TEXT,
  fallback TEXT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- Попробовать получить перевод на запрошенном языке
  result := translations_json -> lang ->> field_name;
  
  IF result IS NOT NULL AND result != '' THEN
    RETURN result;
  END IF;
  
  -- Fallback на русский
  IF lang != 'ru' THEN
    result := translations_json -> 'ru' ->> field_name;
    IF result IS NOT NULL AND result != '' THEN
      RETURN result;
    END IF;
  END IF;
  
  -- Fallback на английский
  IF lang != 'en' THEN
    result := translations_json -> 'en' ->> field_name;
    IF result IS NOT NULL AND result != '' THEN
      RETURN result;
    END IF;
  END IF;
  
  -- Вернуть fallback значение
  RETURN fallback;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- View для университетов с переводами
-- =============================================

CREATE OR REPLACE VIEW v_universities_translated AS
SELECT 
  id,
  name,
  name_en,
  country,
  city,
  website_url,
  translations,
  -- Вспомогательные поля для разных языков
  COALESCE(translations -> 'ru' ->> 'name', name) as name_ru,
  COALESCE(translations -> 'kk' ->> 'name', name) as name_kk,
  COALESCE(translations -> 'en' ->> 'name', name_en, name) as name_translated_en,
  specializations,
  languages,
  degree_levels,
  min_tuition,
  max_tuition,
  size_category,
  accepts_international,
  founded_year,
  student_count,
  is_active,
  created_at,
  updated_at
FROM universities
WHERE is_active = true;

-- =============================================
-- Комментарии
-- =============================================

COMMENT ON COLUMN universities.translations IS 'Переводы полей университета (name, description, mission) на разные языки в формате JSONB';
COMMENT ON FUNCTION get_translated_field IS 'Получить перевод поля с fallback на другие языки';
COMMENT ON VIEW v_universities_translated IS 'Университеты с вспомогательными полями для переводов';

-- =============================================
-- Миграция существующих данных
-- =============================================

-- Заполнить базовые переводы для существующих университетов
-- (name_en копируется в translations.en.name)
UPDATE universities
SET translations = jsonb_build_object(
  'ru', jsonb_build_object('name', name),
  'en', jsonb_build_object('name', COALESCE(name_en, name))
)
WHERE translations IS NULL AND name IS NOT NULL;
