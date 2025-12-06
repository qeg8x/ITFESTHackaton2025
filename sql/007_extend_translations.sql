-- =============================================
-- Цифровой университет - Миграция 007
-- Расширение переводов для profile_json
-- Version: 007
-- =============================================

-- =============================================
-- Функция для получения переведённого профиля
-- =============================================

CREATE OR REPLACE FUNCTION get_translated_profile(
  profile_json JSONB,
  lang TEXT DEFAULT 'ru'
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  translations JSONB;
BEGIN
  -- Получить блок переводов
  translations := profile_json -> 'translations' -> lang;
  
  -- Если нет переводов для языка, вернуть оригинал
  IF translations IS NULL THEN
    RETURN profile_json;
  END IF;
  
  -- Создать копию профиля с переведёнными полями
  result := profile_json;
  
  -- Заменить переводимые поля
  IF translations ? 'name' THEN
    result := jsonb_set(result, '{name}', translations -> 'name');
  END IF;
  
  IF translations ? 'description' THEN
    result := jsonb_set(result, '{description}', translations -> 'description');
  END IF;
  
  IF translations ? 'mission' THEN
    result := jsonb_set(result, '{mission}', translations -> 'mission');
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================
-- View с переводами профилей
-- =============================================

CREATE OR REPLACE VIEW v_latest_profiles_translated AS
SELECT 
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
  u.translations,
  -- Профили для разных языков
  get_translated_profile(up.profile_json, 'ru') as profile_ru,
  get_translated_profile(up.profile_json, 'kk') as profile_kk,
  get_translated_profile(up.profile_json, 'en') as profile_en
FROM university_profiles up
JOIN universities u ON u.id = up.university_id
WHERE u.is_active = true
ORDER BY up.university_id, up.version DESC, up.created_at DESC;

-- =============================================
-- Таблица для кэширования переводов UI
-- =============================================

CREATE TABLE IF NOT EXISTS ui_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lang VARCHAR(10) NOT NULL,
  namespace VARCHAR(50) NOT NULL,
  key VARCHAR(100) NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(lang, namespace, key)
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_ui_translations_lookup 
ON ui_translations(lang, namespace);

-- Триггер для обновления updated_at
CREATE TRIGGER trigger_ui_translations_updated_at
  BEFORE UPDATE ON ui_translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Комментарии
-- =============================================

COMMENT ON FUNCTION get_translated_profile IS 'Получить профиль с переведёнными полями для указанного языка';
COMMENT ON VIEW v_latest_profiles_translated IS 'Последние версии профилей с кэшированными переводами';
COMMENT ON TABLE ui_translations IS 'Кэш UI переводов для динамического контента';
