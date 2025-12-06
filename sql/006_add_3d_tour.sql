-- =============================================
-- Цифровой университет - Миграция 006
-- Добавление поддержки 3D-туров
-- =============================================

ALTER TABLE universities
ADD COLUMN IF NOT EXISTS "3d_tour" JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_3d_tour_available
ON universities USING GIN(("3d_tour"->'available_sources'));
