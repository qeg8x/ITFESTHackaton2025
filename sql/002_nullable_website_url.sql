-- =============================================
-- Миграция: website_url становится nullable
-- Version: 002
-- Описание: Разрешает NULL для website_url, 
--           обновляет существующие "Нет информации" на NULL
-- =============================================

-- 1. Убрать NOT NULL constraint с website_url
ALTER TABLE universities ALTER COLUMN website_url DROP NOT NULL;

-- 2. Обновить существующие записи с "Нет информации" на NULL
UPDATE universities 
SET website_url = NULL 
WHERE website_url = 'Нет информации';

-- 3. Изменить уникальный индекс для исключения NULL значений
-- (PostgreSQL по умолчанию уже игнорирует NULL в уникальных индексах,
--  но для явности создадим partial index)
DROP INDEX IF EXISTS idx_universities_website_url;
CREATE UNIQUE INDEX idx_universities_website_url 
    ON universities(website_url) 
    WHERE website_url IS NOT NULL;

-- 4. Комментарий к полю
COMMENT ON COLUMN universities.website_url IS 'URL официального сайта университета. NULL если сайт неизвестен.';
