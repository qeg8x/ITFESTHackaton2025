-- =============================================
-- Цифровой университет - Начальная схема БД
-- Version: 001
-- =============================================

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- Таблица: universities
-- Базовая информация об университетах
-- =============================================
CREATE TABLE universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    name_en VARCHAR(500),
    country VARCHAR(100) NOT NULL,
    city VARCHAR(200) NOT NULL,
    website_url VARCHAR(1000) NOT NULL,
    logo_url VARCHAR(1000),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы для universities
CREATE INDEX idx_universities_country ON universities(country);
CREATE INDEX idx_universities_city ON universities(city);
CREATE INDEX idx_universities_is_active ON universities(is_active);
CREATE INDEX idx_universities_name_search ON universities USING gin(to_tsvector('russian', name));
CREATE INDEX idx_universities_updated_at ON universities(updated_at DESC);

-- Уникальность по website_url
CREATE UNIQUE INDEX idx_universities_website_url ON universities(website_url);

-- =============================================
-- Таблица: university_profiles
-- JSON профили университетов (полные данные)
-- =============================================
CREATE TABLE university_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    profile_json JSONB NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'ru',
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы для university_profiles
CREATE INDEX idx_profiles_university_id ON university_profiles(university_id);
CREATE INDEX idx_profiles_language ON university_profiles(language);
CREATE INDEX idx_profiles_created_at ON university_profiles(created_at DESC);

-- Индекс для поиска по JSONB полям
CREATE INDEX idx_profiles_json_programs ON university_profiles USING gin((profile_json->'programs'));
CREATE INDEX idx_profiles_json_ratings ON university_profiles USING gin((profile_json->'ratings'));

-- Уникальность: один профиль на язык для университета (последняя версия)
CREATE UNIQUE INDEX idx_profiles_university_language_version 
    ON university_profiles(university_id, language, version);

-- =============================================
-- Таблица: university_sources
-- Источники данных для парсинга
-- =============================================
CREATE TABLE university_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    url VARCHAR(2000) NOT NULL,
    source_type VARCHAR(20) NOT NULL DEFAULT 'website' 
        CHECK (source_type IN ('website', 'api', 'manual')),
    current_hash VARCHAR(64),
    last_checked_at TIMESTAMP WITH TIME ZONE,
    last_parsed_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы для university_sources
CREATE INDEX idx_sources_university_id ON university_sources(university_id);
CREATE INDEX idx_sources_is_active ON university_sources(is_active);
CREATE INDEX idx_sources_last_checked_at ON university_sources(last_checked_at);

-- Уникальность по URL
CREATE UNIQUE INDEX idx_sources_url ON university_sources(url);

-- =============================================
-- Таблица: update_logs
-- Логи обновлений и парсинга
-- =============================================
CREATE TABLE update_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL REFERENCES university_sources(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
    changes_detected BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Индексы для update_logs
CREATE INDEX idx_logs_source_id ON update_logs(source_id);
CREATE INDEX idx_logs_status ON update_logs(status);
CREATE INDEX idx_logs_created_at ON update_logs(created_at DESC);

-- Партиционирование по времени (опционально для больших объемов)
-- CREATE INDEX idx_logs_created_at_month ON update_logs(date_trunc('month', created_at));

-- =============================================
-- Функция: автоматическое обновление updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для universities
CREATE TRIGGER trigger_universities_updated_at
    BEFORE UPDATE ON universities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- Представление: последний профиль университета
-- =============================================
CREATE VIEW v_latest_university_profiles AS
SELECT DISTINCT ON (university_id, language)
    up.id,
    up.university_id,
    up.profile_json,
    up.language,
    up.version,
    up.created_at,
    u.name,
    u.country,
    u.city,
    u.website_url,
    u.logo_url,
    u.is_active
FROM university_profiles up
JOIN universities u ON u.id = up.university_id
ORDER BY university_id, language, version DESC, created_at DESC;

-- =============================================
-- Комментарии к таблицам
-- =============================================
COMMENT ON TABLE universities IS 'Базовая информация об университетах';
COMMENT ON TABLE university_profiles IS 'JSON профили университетов с версионированием';
COMMENT ON TABLE university_sources IS 'Источники данных для парсинга (сайты, API)';
COMMENT ON TABLE update_logs IS 'Логи обновлений и результаты парсинга';

COMMENT ON COLUMN university_profiles.profile_json IS 'Полный профиль университета в формате JSON';
COMMENT ON COLUMN university_sources.current_hash IS 'SHA-256 хэш последнего контента для детекции изменений';
COMMENT ON COLUMN update_logs.processing_time_ms IS 'Время обработки в миллисекундах';
