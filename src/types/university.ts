/**
 * Типы для университета и профиля (версия 2)
 * Расширенная структура для JSONB хранения в PostgreSQL
 */

// ============================================
// Базовые типы
// ============================================

/**
 * Уровень образования
 */
export type DegreeLevel = 'Bachelor' | 'Master' | 'PhD' | 'Diploma';

/**
 * Значение "Нет информации" для пустых полей
 */
export const NO_INFO = 'Нет информации' as const;

// ============================================
// Стоимость обучения
// ============================================

/**
 * Информация о стоимости программы
 */
export interface TuitionInfo {
  amount: number | null;
  currency: string;
  per_year: boolean;
  additional_info?: string;
}

/**
 * Общая информация о стоимости (legacy alias)
 */
export type Tuition = TuitionInfo;

/**
 * Общая информация о стоимости обучения
 */
export interface TuitionGeneral {
  international_students?: string;
  domestic_students?: string;
  payment_options?: string;
  financial_aid?: string;
}

// ============================================
// Образовательные программы
// ============================================

/**
 * Образовательная программа (расширенная)
 */
export interface Program {
  id: string;
  name: string;
  degree_level: DegreeLevel | string;
  duration_years: number;
  language: string;
  description?: string;
  tuition?: TuitionInfo;
  admission_requirements?: string;
  language_requirements?: string;
  application_deadline?: string;
  career_outcomes?: string;
}

// ============================================
// Стипендии
// ============================================

/**
 * Стипендия
 */
export interface Scholarship {
  name: string;
  amount?: string;
  eligibility?: string;
  description?: string;
}

// ============================================
// Рейтинги
// ============================================

/**
 * Рейтинг университета
 */
export interface Ranking {
  source: string;
  rank?: number;
  year: number;
  category: string;
}

/**
 * Legacy alias для Rating
 */
export type Rating = Ranking;

// ============================================
// Контакты
// ============================================

/**
 * Социальные сети
 */
export interface SocialMedia {
  website?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  linkedin?: string;
}

/**
 * Контактная информация (расширенная)
 */
export interface Contacts {
  main_email?: string;
  admissions_email?: string;
  phone?: string;
  address?: string;
  social_media?: SocialMedia;
  /** @deprecated use main_email */
  email?: string;
}

// ============================================
// Поступление
// ============================================

/**
 * Требования к поступлению (расширенные)
 */
export interface Admissions {
  requirements?: string;
  english_proficiency?: string;
  test_requirements?: string;
  documents_needed?: string;
  application_process?: string;
  intake_dates?: string;
  /** @deprecated use intake_dates */
  start_date?: string;
  /** @deprecated use intake_dates */
  deadline?: string;
}

// ============================================
// Кампус
// ============================================

/**
 * Информация о кампусе
 */
export interface Campus {
  location?: string;
  facilities?: string;
  accommodation?: string;
  student_life?: string;
}

// ============================================
// Международное
// ============================================

/**
 * Информация для международных студентов
 */
export interface International {
  accepts_international: boolean;
  international_percentage?: number;
  visa_support?: string;
  exchange_programs?: string;
  languages_of_instruction: string[];
}

// ============================================
// Прочее
// ============================================

/**
 * Дополнительная информация
 */
export interface Other {
  accreditations?: string;
  notable_alumni?: string;
  research_focus?: string;
  special_programs?: string;
}

// ============================================
// Метаданные парсинга
// ============================================

/**
 * Метаданные о парсинге профиля
 */
export interface ParseMetadata {
  parsed_at: string;
  source_url: string;
  completeness_score: number;
  missing_fields: string[];
  notes?: string;
}

// ============================================
// Главный интерфейс университета
// ============================================

/**
 * Полный профиль университета (версия 2)
 * Совместим с JSONB хранением в PostgreSQL
 */
export interface University {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  website_url: string;
  logo_url?: string;
  description: string;
  mission?: string;
  founded_year?: number;
  student_count?: number;
  faculty_count?: number;
  
  // Основные разделы
  programs: Program[];
  tuition_general?: TuitionGeneral;
  scholarships?: Scholarship[];
  admissions?: Admissions;
  campus?: Campus;
  rankings?: Ranking[];
  contacts?: Contacts;
  international?: International;
  other?: Other;
  
  // Метаданные
  metadata?: ParseMetadata;
  
  // Timestamps
  updated_at: string;
  created_at?: string;
  
  /** @deprecated use tuition_general */
  tuition?: TuitionInfo;
  /** @deprecated use rankings */
  ratings?: Rating[];
}

// ============================================
// Вспомогательные типы
// ============================================

/**
 * Краткая информация об университете для списков
 */
export interface UniversitySummary {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  website_url?: string;
  logo_url?: string;
  description?: string;
  programs_count: number;
  top_ranking?: Ranking;
  /** @deprecated use top_ranking */
  top_rating?: Rating;
}

/**
 * Фильтры для поиска университетов
 */
export interface UniversityFilters {
  country?: string;
  city?: string;
  degree_level?: DegreeLevel;
  language?: string;
  max_tuition?: number;
  search_query?: string;
  has_scholarships?: boolean;
  accepts_international?: boolean;
}

// ============================================
// Утилиты
// ============================================

/**
 * Проверить является ли значение "Нет информации"
 */
export const isNoInfo = (value: unknown): boolean => {
  return value === NO_INFO || value === null || value === undefined || value === '';
};

/**
 * Получить значение или "Нет информации"
 */
export const getOrNoInfo = <T>(value: T | null | undefined): T | string => {
  return isNoInfo(value) ? NO_INFO : value as T;
};

/**
 * Создать пустой профиль университета
 */
export const createEmptyUniversity = (id: string, name: string): University => ({
  id,
  name,
  country: NO_INFO,
  city: NO_INFO,
  website_url: NO_INFO,
  description: NO_INFO,
  programs: [],
  updated_at: new Date().toISOString(),
});
