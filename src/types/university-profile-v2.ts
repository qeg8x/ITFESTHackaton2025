/**
 * Типы для расширенного профиля университета (v2)
 * Соответствует структуре JSON из промпта university-parser-v2
 */

/**
 * Информация о стоимости обучения программы
 */
export interface ProgramTuition {
  amount: number | null;
  currency: string;
  per_year: boolean;
  additional_info: string;
}

/**
 * Образовательная программа (расширенная)
 */
export interface ProgramV2 {
  id: string;
  name: string;
  degree_level: 'Bachelor' | 'Master' | 'PhD' | 'Diploma' | string;
  duration_years: number;
  language: string;
  description: string;
  tuition: ProgramTuition;
  admission_requirements: string;
  language_requirements: string;
  application_deadline: string;
  career_outcomes: string;
}

/**
 * Общая информация о стоимости
 */
export interface TuitionGeneral {
  international_students: string;
  domestic_students: string;
  payment_options: string;
  financial_aid: string;
}

/**
 * Стипендия
 */
export interface Scholarship {
  name: string;
  amount: string;
  eligibility: string;
  description: string;
}

/**
 * Информация о поступлении
 */
export interface Admissions {
  requirements: string;
  english_proficiency: string;
  test_requirements: string;
  documents_needed: string;
  application_process: string;
  intake_dates: string;
}

/**
 * Информация о кампусе
 */
export interface Campus {
  location: string;
  facilities: string;
  accommodation: string;
  student_life: string;
}

/**
 * Рейтинг
 */
export interface Ranking {
  source: string;
  rank: number | null;
  year: number;
  category: string;
}

/**
 * Социальные сети
 */
export interface SocialMedia {
  website: string;
  facebook: string;
  twitter: string;
  instagram: string;
  linkedin: string;
}

/**
 * Контакты
 */
export interface Contacts {
  main_email: string;
  admissions_email: string;
  phone: string;
  address: string;
  social_media: SocialMedia;
}

/**
 * Международная информация
 */
export interface International {
  accepts_international: boolean;
  international_percentage: number | null;
  visa_support: string;
  exchange_programs: string;
  languages_of_instruction: string[];
}

/**
 * Прочая информация
 */
export interface OtherInfo {
  accreditations: string;
  notable_alumni: string;
  research_focus: string;
  special_programs: string;
}

/**
 * Метаданные парсинга
 */
export interface ParseMetadata {
  parsed_at: string;
  source_url: string;
  completeness_score: number;
  missing_fields: string[];
  notes: string;
}

/**
 * Полный профиль университета (v2)
 */
export interface UniversityProfileV2 {
  name: string;
  name_en: string | null;
  country: string;
  city: string;
  website_url: string;
  logo_url: string | null;
  description: string;
  mission: string;
  founded_year: number | null;
  student_count: number | null;
  faculty_count: number | null;
  
  programs: ProgramV2[];
  tuition_general: TuitionGeneral;
  scholarships: Scholarship[];
  admissions: Admissions;
  campus: Campus;
  rankings: Ranking[];
  contacts: Contacts;
  international: International;
  other: OtherInfo;
  metadata: ParseMetadata;
}

/**
 * Проверить является ли объект валидным профилем v2
 */
export const isValidProfileV2 = (obj: unknown): obj is UniversityProfileV2 => {
  if (!obj || typeof obj !== 'object') return false;
  
  const profile = obj as Record<string, unknown>;
  
  // Проверить обязательные поля
  const requiredFields = ['name', 'country', 'city', 'programs', 'contacts'];
  
  for (const field of requiredFields) {
    if (!(field in profile)) {
      return false;
    }
  }
  
  // Проверить что programs - массив
  if (!Array.isArray(profile.programs)) {
    return false;
  }
  
  return true;
};

/**
 * Вычислить процент заполненности профиля
 */
export const calculateCompleteness = (profile: UniversityProfileV2): number => {
  const NO_INFO = 'Нет информации';
  let total = 0;
  let filled = 0;
  
  const checkField = (value: unknown): void => {
    total++;
    if (value !== null && value !== NO_INFO && value !== '' && value !== undefined) {
      if (Array.isArray(value) && value.length > 0) {
        filled++;
      } else if (!Array.isArray(value)) {
        filled++;
      }
    }
  };
  
  // Базовые поля
  checkField(profile.name);
  checkField(profile.name_en);
  checkField(profile.description);
  checkField(profile.mission);
  checkField(profile.founded_year);
  checkField(profile.student_count);
  checkField(profile.faculty_count);
  
  // Программы
  checkField(profile.programs.length > 0 ? profile.programs : null);
  
  // Контакты
  checkField(profile.contacts?.main_email);
  checkField(profile.contacts?.phone);
  checkField(profile.contacts?.address);
  
  // Поступление
  checkField(profile.admissions?.requirements);
  checkField(profile.admissions?.documents_needed);
  
  // Стоимость
  checkField(profile.tuition_general?.international_students);
  
  // Стипендии
  checkField(profile.scholarships?.length > 0 ? profile.scholarships : null);
  
  return Math.round((filled / total) * 100);
};

/**
 * Получить список незаполненных полей
 */
export const getMissingFields = (profile: UniversityProfileV2): string[] => {
  const NO_INFO = 'Нет информации';
  const missing: string[] = [];
  
  const check = (value: unknown, name: string): void => {
    if (value === null || value === NO_INFO || value === '' || value === undefined) {
      missing.push(name);
    } else if (Array.isArray(value) && value.length === 0) {
      missing.push(name);
    }
  };
  
  check(profile.description, 'description');
  check(profile.mission, 'mission');
  check(profile.founded_year, 'founded_year');
  check(profile.student_count, 'student_count');
  check(profile.programs, 'programs');
  check(profile.contacts?.main_email, 'contacts.main_email');
  check(profile.contacts?.phone, 'contacts.phone');
  check(profile.admissions?.requirements, 'admissions.requirements');
  check(profile.tuition_general?.international_students, 'tuition_general');
  check(profile.scholarships, 'scholarships');
  
  return missing;
};
