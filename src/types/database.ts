import type { University } from './university.ts';

/**
 * Строка таблицы universities
 */
export interface UniversityRow {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  city: string;
  website_url: string;
  logo_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Строка таблицы university_profiles (JSONB профиль)
 */
export interface UniversityProfileRow {
  id: string;
  university_id: string;
  profile_json: University;
  language: string;
  version: number;
  created_at: Date;
}

/**
 * Строка таблицы university_sources (источники данных)
 */
export interface UniversitySourceRow {
  id: string;
  university_id: string;
  url: string;
  source_type: SourceType;
  current_hash: string | null;
  last_checked_at: Date | null;
  last_parsed_at: Date | null;
  is_active: boolean;
  created_at: Date;
}

/**
 * Тип источника данных
 */
export type SourceType = 'website' | 'api' | 'manual';

/**
 * Статус обновления
 */
export type UpdateStatus = 'pending' | 'success' | 'failed' | 'skipped';

/**
 * Строка таблицы update_logs (логи обновлений)
 */
export interface UpdateLogRow {
  id: string;
  source_id: string;
  status: UpdateStatus;
  changes_detected: boolean;
  error_message: string | null;
  processing_time_ms: number | null;
  created_at: Date;
}

/**
 * Входные данные для создания университета
 */
export interface CreateUniversityInput {
  name: string;
  name_en?: string;
  country: string;
  city: string;
  website_url: string;
  logo_url?: string;
}

/**
 * Входные данные для обновления университета
 */
export interface UpdateUniversityInput {
  name?: string;
  name_en?: string;
  country?: string;
  city?: string;
  website_url?: string;
  logo_url?: string;
  is_active?: boolean;
}

/**
 * Входные данные для создания профиля
 */
export interface CreateProfileInput {
  university_id: string;
  profile_json: University;
  language: string;
}

/**
 * Входные данные для создания источника
 */
export interface CreateSourceInput {
  university_id: string;
  url: string;
  source_type: SourceType;
}

/**
 * Входные данные для создания лога
 */
export interface CreateUpdateLogInput {
  source_id: string;
  status: UpdateStatus;
  changes_detected: boolean;
  error_message?: string;
  processing_time_ms?: number;
}

/**
 * Университет с профилем (JOIN результат)
 */
export interface UniversityWithProfile extends UniversityRow {
  profile: University | null;
}
