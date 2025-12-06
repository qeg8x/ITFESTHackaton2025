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
  calculateCompletenessScore,
  extractAllPrograms,
  ParserError,
} from './parser.service.ts';

export {
  createUniversity,
  deleteUniversity,
  updateUniversityProfile as adminUpdateProfile,
  patchUniversityProfile,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  validateUniversity,
  validateProgram,
  calculateDiffs,
  listUniversitiesForAdmin,
  type AdminOperationResult,
  type ChangesDiff,
} from './admin.service.ts';

export {
  logAdminAction,
  createAuditLogger,
  getRecentAdminActions,
  type AdminActionType,
  type AuditRecord,
} from './audit.service.ts';

export {
  checkUniversityExists,
  searchUniversityByName,
  createUniversityFromSearch,
  findOrCreateUniversity,
  clearSearchCache,
  type UniversitySearchResult,
  type SearchResult,
} from './university-search.service.ts';

export {
  searchUniversitiesInDb,
  verifyUniversityWithAI,
  createUniversityFromAIResult,
  clearAllCaches,
  getSearchStats,
  type DbSearchResult,
} from './search.service.ts';
