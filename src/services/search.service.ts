/**
 * Сервис поиска с кэшированием и rate limiting
 */

import { logger } from '../utils/logger.ts';
import { query, queryOne } from '../config/database.ts';
import { 
  checkUniversityExists, 
  createUniversityFromSearch,
  type UniversitySearchResult 
} from './university-search.service.ts';
import type { University } from '../types/university.ts';

/**
 * Результат поиска в БД
 */
export interface DbSearchResult {
  id: string;
  name: string;
  name_en?: string;
  country: string;
  city: string;
  score: number;
  programs_count: number;
  completeness: number;
}

/**
 * Кэш поиска в БД (5 минут)
 */
const dbSearchCache = new Map<string, { results: DbSearchResult[]; exactMatch: boolean; timestamp: number }>();
const DB_CACHE_TTL = 1000 * 60 * 5; // 5 минут

/**
 * Кэш AI верификации (1 час)
 */
const aiVerifyCache = new Map<string, { result: UniversitySearchResult; timestamp: number }>();
const AI_CACHE_TTL = 1000 * 60 * 60; // 1 час

/**
 * Rate limiting для AI запросов
 */
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 минута
const RATE_LIMIT_MAX = 10; // максимум запросов за окно

/**
 * Очистить все кэши
 */
export const clearAllCaches = (): void => {
  dbSearchCache.clear();
  aiVerifyCache.clear();
  logger.debug('Search caches cleared');
};

/**
 * Нормализовать строку для ключа кэша
 */
const normalizeKey = (str: string): string => {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Проверить rate limit
 */
const checkRateLimit = (ip: string): { allowed: boolean; remaining: number; resetIn: number } => {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetIn: RATE_LIMIT_WINDOW };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    const resetIn = RATE_LIMIT_WINDOW - (now - record.windowStart);
    return { allowed: false, remaining: 0, resetIn };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: RATE_LIMIT_MAX - record.count, 
    resetIn: RATE_LIMIT_WINDOW - (now - record.windowStart) 
  };
};

/**
 * Вычислить score совпадения
 */
const calculateScore = (name: string, searchQuery: string): number => {
  const nameLower = name.toLowerCase();
  const queryLower = searchQuery.toLowerCase();

  // Точное совпадение
  if (nameLower === queryLower) return 100;

  // Начинается с запроса
  if (nameLower.startsWith(queryLower)) return 90;

  // Содержит запрос
  if (nameLower.includes(queryLower)) return 75;

  // Слова совпадают
  const nameWords = nameLower.split(/\s+/);
  const queryWords = queryLower.split(/\s+/);
  const matchedWords = queryWords.filter((qw) => 
    nameWords.some((nw) => nw.includes(qw) || qw.includes(nw))
  );
  
  if (matchedWords.length > 0) {
    return Math.round(50 + (matchedWords.length / queryWords.length) * 30);
  }

  return 30;
};

/**
 * Поиск университетов в БД
 */
export const searchUniversitiesInDb = async (
  name: string,
  limit: number = 5
): Promise<{ results: DbSearchResult[]; exactMatch: boolean }> => {
  const cacheKey = normalizeKey(name);

  // Проверить кэш
  const cached = dbSearchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < DB_CACHE_TTL) {
    logger.debug('DB search cache hit', { name });
    return { results: cached.results.slice(0, limit), exactMatch: cached.exactMatch };
  }

  logger.debug('Searching universities in DB', { name, limit });

  const results = await query<{
    id: string;
    name: string;
    name_en: string | null;
    country: string;
    city: string;
    profile_json: { programs?: unknown[]; metadata?: { completeness_score?: number } } | null;
  }>(
    `SELECT u.id, u.name, u.name_en, u.country, u.city, up.profile_json
     FROM universities u
     LEFT JOIN LATERAL (
       SELECT profile_json FROM university_profiles 
       WHERE university_id = u.id 
       ORDER BY version DESC LIMIT 1
     ) up ON true
     WHERE u.name ILIKE $1 
        OR u.name_en ILIKE $1
        OR u.name ILIKE $2
     ORDER BY 
       CASE WHEN LOWER(u.name) = LOWER($3) OR LOWER(u.name_en) = LOWER($3) THEN 0
            WHEN u.name ILIKE $2 OR u.name_en ILIKE $2 THEN 1
            ELSE 2 END,
       u.name
     LIMIT $4`,
    [`%${name}%`, `${name}%`, name, Math.min(limit, 20)]
  );

  const mappedResults: DbSearchResult[] = results.map((r) => ({
    id: r.id,
    name: r.name,
    name_en: r.name_en ?? undefined,
    country: r.country,
    city: r.city,
    score: Math.max(
      calculateScore(r.name, name),
      r.name_en ? calculateScore(r.name_en, name) : 0
    ),
    programs_count: r.profile_json?.programs?.length ?? 0,
    completeness: r.profile_json?.metadata?.completeness_score ?? 0,
  }));

  // Сортировать по score
  mappedResults.sort((a, b) => b.score - a.score);

  const exactMatch = mappedResults.some((r) => r.score === 100);

  // Сохранить в кэш
  dbSearchCache.set(cacheKey, { results: mappedResults, exactMatch, timestamp: Date.now() });

  logger.debug('DB search completed', { 
    name, 
    resultsCount: mappedResults.length, 
    exactMatch 
  });

  return { results: mappedResults.slice(0, limit), exactMatch };
};

/**
 * Верификация университета через AI с rate limiting
 */
export const verifyUniversityWithAI = async (
  name: string,
  clientIp: string = 'unknown'
): Promise<{ result: UniversitySearchResult | null; rateLimited: boolean; remaining?: number; resetIn?: number }> => {
  // Rate limit check
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded for AI verify', { ip: clientIp });
    return { 
      result: null, 
      rateLimited: true, 
      remaining: rateLimit.remaining,
      resetIn: rateLimit.resetIn 
    };
  }

  const cacheKey = normalizeKey(name);

  // Проверить кэш
  const cached = aiVerifyCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
    logger.debug('AI verify cache hit', { name });
    return { 
      result: cached.result, 
      rateLimited: false, 
      remaining: rateLimit.remaining 
    };
  }

  logger.info('Verifying university via AI', { name, ip: clientIp });

  try {
    const result = await checkUniversityExists(name);

    // Сохранить в кэш
    aiVerifyCache.set(cacheKey, { result, timestamp: Date.now() });

    // Логировать поиск
    await logSearch(name, 'ai_verify', result.found, clientIp);

    return { 
      result, 
      rateLimited: false, 
      remaining: rateLimit.remaining 
    };
  } catch (err) {
    logger.error('AI verification failed', { name, error: err });
    throw err;
  }
};

/**
 * Создать университет из результата AI поиска
 */
export const createUniversityFromAIResult = async (
  searchResult: UniversitySearchResult,
  clientIp: string = 'unknown'
): Promise<University> => {
  // Проверить что университета нет в БД
  const { results, exactMatch } = await searchUniversitiesInDb(
    searchResult.official_name || '', 
    1
  );

  if (exactMatch || (results.length > 0 && results[0].score >= 90)) {
    throw new Error(`University already exists in database: ${results[0]?.name}`);
  }

  logger.info('Creating university from AI result', { 
    name: searchResult.official_name,
    ip: clientIp 
  });

  const university = await createUniversityFromSearch(searchResult);

  // Очистить кэш поиска
  dbSearchCache.clear();

  // Логировать создание
  await logSearch(
    searchResult.official_name || 'Unknown',
    'create',
    true,
    clientIp,
    university.id
  );

  return university;
};

/**
 * Логировать поиск в БД (для аналитики)
 */
const logSearch = async (
  searchQuery: string,
  action: 'db_search' | 'ai_verify' | 'create',
  success: boolean,
  clientIp: string,
  resultId?: string
): Promise<void> => {
  try {
    // Используем update_logs для хранения логов поиска
    // В реальном проекте лучше создать отдельную таблицу search_logs
    const sourceResult = await queryOne<{ id: string }>(
      'SELECT id FROM university_sources LIMIT 1'
    );

    if (sourceResult) {
      await query(
        `INSERT INTO update_logs (source_id, status, changes_detected, error_message)
         VALUES ($1, 'success', false, $2)`,
        [
          sourceResult.id,
          JSON.stringify({
            type: 'search_log',
            action,
            query: searchQuery,
            success,
            client_ip: clientIp,
            result_id: resultId,
            timestamp: new Date().toISOString(),
          }),
        ]
      );
    }
  } catch (err) {
    logger.warn('Failed to log search', { error: err });
  }
};

/**
 * Получить статистику поиска
 */
export const getSearchStats = (): {
  dbCacheSize: number;
  aiCacheSize: number;
  rateLimitEntries: number;
} => {
  return {
    dbCacheSize: dbSearchCache.size,
    aiCacheSize: aiVerifyCache.size,
    rateLimitEntries: rateLimitMap.size,
  };
};
