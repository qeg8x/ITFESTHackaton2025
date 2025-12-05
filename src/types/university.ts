/**
 * Уровень образования
 */
export type DegreeLevel = 'Bachelor' | 'Master' | 'PhD';

/**
 * Стоимость обучения
 */
export interface Tuition {
  amount: number;
  currency: string;
  per_year?: boolean;
}

/**
 * Образовательная программа
 */
export interface Program {
  id: string;
  name: string;
  degree_level: DegreeLevel;
  duration_years: number;
  language: string;
  tuition?: Tuition;
  admission_requirements?: string;
}

/**
 * Стипендия
 */
export interface Scholarship {
  name: string;
  amount?: number;
  currency?: string;
  description?: string;
}

/**
 * Рейтинг университета
 */
export interface Rating {
  source: string;
  rank: number;
  year: number;
}

/**
 * Контактная информация
 */
export interface Contacts {
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Требования к поступлению
 */
export interface Admissions {
  requirements: string;
  start_date?: string;
  deadline?: string;
}

/**
 * Профиль университета (полная структура для JSON)
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
  programs: Program[];
  tuition?: Tuition;
  admissions: Admissions;
  scholarships?: Scholarship[];
  contacts: Contacts;
  ratings?: Rating[];
  updated_at: string;
}

/**
 * Краткая информация об университете для списков
 */
export interface UniversitySummary {
  id: string;
  name: string;
  country: string;
  city: string;
  logo_url?: string;
  programs_count: number;
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
}
