/**
 * Экспорт всех типов проекта
 */

export type {
  DegreeLevel,
  Tuition,
  TuitionInfo,
  TuitionGeneral,
  Program,
  Scholarship,
  Rating,
  Ranking,
  SocialMedia,
  Contacts,
  Admissions,
  Campus,
  ThreeDTourProvider,
  ThreeDTourSource,
  UniversityThreeDTour,
  International,
  Other,
  ParseMetadata,
  University,
  UniversitySummary,
  UniversityFilters,
} from './university.ts';

export {
  NO_INFO,
  isNoInfo,
  getOrNoInfo,
  createEmptyUniversity,
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

// Legacy v2 типы (для совместимости)
export type {
  ProgramTuition,
  ProgramV2,
  OtherInfo,
  UniversityProfileV2,
} from './university-profile-v2.ts';

export {
  isValidProfileV2,
  calculateCompleteness,
  getMissingFields,
} from './university-profile-v2.ts';
