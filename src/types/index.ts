/**
 * Экспорт всех типов проекта
 */

export type {
  DegreeLevel,
  Tuition,
  Program,
  Scholarship,
  Rating,
  Contacts,
  Admissions,
  University,
  UniversitySummary,
  UniversityFilters,
} from './university.ts';

export type {
  UniversityRow,
  UniversityProfileRow,
  UniversitySourceRow,
  UpdateLogRow,
  SourceType,
  UpdateStatus,
  CreateUniversityInput,
  UpdateUniversityInput,
  CreateProfileInput,
  CreateSourceInput,
  CreateUpdateLogInput,
  UniversityWithProfile,
} from './database.ts';
