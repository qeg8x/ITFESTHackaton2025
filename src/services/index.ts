/**
 * Экспорт всех сервисов
 */

export {
  getAllUniversities,
  getUniversityById,
  getUniversityWithProfile,
  getUniversityProfile,
  updateUniversityProfile,
  logUpdateAttempt,
  getCountries,
  getCities,
} from './universities.service.ts';

export {
  fetchAndHashWebsite,
  markdownToUniversityProfile,
  checkAndUpdateWebsite,
  updateAllSources,
  ParserError,
} from './parser.service.ts';
