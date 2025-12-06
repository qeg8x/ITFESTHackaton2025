/**
 * Сервис поиска и проверки существования университетов
 * Включает autocomplete функциональность
 */

import { logger } from '../utils/logger.ts';
import { callOllamaForJson } from '../utils/ollama.client.ts';
import { query, queryOne, transaction } from '../config/database.ts';
import { NO_INFO, type University } from '../types/university.ts';
import type { PoolClient } from 'postgres';

/**
 * Результат автодополнения
 */
export interface AutocompleteResult {
  id?: string;
  name: string;
  country: string;
  found_in_db: boolean;
  source: 'db' | 'ollama';
}

/**
 * Ответ autocomplete API
 */
export interface AutocompleteResponse {
  results: AutocompleteResult[];
  query: string;
  total: number;
  cache_hit: boolean;
}

/**
 * Программа из результата поиска
 */
export interface SearchResultProgram {
  name: string;
  degree_level: string;
  duration_years: number;
  language: string;
}

/**
 * Контакты из результата поиска
 */
export interface SearchResultContacts {
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Требования к поступлению из результата поиска
 */
export interface SearchResultAdmissions {
  requirements?: string;
  english_proficiency?: string;
  intake_dates?: string;
}

/**
 * Рейтинг из результата поиска
 */
export interface SearchResultRanking {
  source: string;
  rank?: number;
  year: number;
}

/**
 * Стипендия из результата поиска
 */
export interface SearchResultScholarship {
  name: string;
  description?: string;
}

/**
 * Стоимость обучения из результата поиска
 */
export interface SearchResultTuition {
  international_students?: string;
  domestic_students?: string;
}

/**
 * Результат поиска университета через ИИ (расширенный)
 */
export interface UniversitySearchResult {
  // Базовые поля
  found: boolean;
  confidence: number;
  official_name: string | null;
  official_name_en: string | null;
  country: string | null;
  city: string | null;
  website: string | null;
  reasoning: string;
  alternatives: string[];
  
  // Расширенные поля
  description?: string;
  mission?: string;
  founded_year?: number | null;
  student_count?: number | null;
  programs?: SearchResultProgram[];
  contacts?: SearchResultContacts;
  admissions?: SearchResultAdmissions;
  rankings?: SearchResultRanking[];
  scholarships?: SearchResultScholarship[];
  tuition?: SearchResultTuition;
}

/**
 * Результат поиска в системе
 */
export interface SearchResult {
  inDb: boolean;
  aiResult?: UniversitySearchResult;
  data?: University;
  error?: string;
}

/**
 * Кэш результатов поиска (сессионный)
 */
const searchCache = new Map<string, { result: UniversitySearchResult; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 30; // 30 минут

/**
 * Кэш результатов autocomplete
 */
const autocompleteCache = new Map<string, { results: AutocompleteResult[]; timestamp: number }>();
const AUTOCOMPLETE_CACHE_TTL = 1000 * 60 * 60; // 1 час

/**
 * Rate limiter для autocomplete (по IP)
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 минута

/**
 * Очистить кэш поиска
 */
export const clearSearchCache = (): void => {
  searchCache.clear();
  logger.debug('University search cache cleared');
};

/**
 * Нормализовать строку для поиска
 */
const normalizeSearchQuery = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[«»"']/g, '');
};

/**
 * Загрузить промпт для поиска
 */
const loadSearchPrompt = async (): Promise<string> => {
  try {
    const promptPath = new URL('../prompts/university-search.prompt.md', import.meta.url);
    return await Deno.readTextFile(promptPath);
  } catch (err) {
    logger.warn('Failed to load search prompt, using inline', { error: err });
    return `You are a university knowledge assistant.
Determine if a university exists and return JSON:
{
  "found": boolean,
  "confidence": number (0-100),
  "official_name": "string or null",
  "official_name_en": "string or null", 
  "country": "string or null",
  "city": "string or null",
  "website": "string or null",
  "reasoning": "string",
  "alternatives": []
}
Only return JSON, nothing else.
Analyze:`;
  }
};

/**
 * Проверить существование университета через ИИ
 * @param name - название университета для проверки
 * @returns результат проверки
 */
export const checkUniversityExists = async (name: string): Promise<UniversitySearchResult> => {
  // Валидация
  if (!name || name.trim().length < 2) {
    throw new Error('University name must be at least 2 characters');
  }

  const normalizedName = normalizeSearchQuery(name);
  
  // Проверить кэш
  const cached = searchCache.get(normalizedName);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    logger.debug('University search cache hit', { name: normalizedName });
    return cached.result;
  }

  logger.info('Checking university existence via AI', { name });

  const promptTemplate = await loadSearchPrompt();
  const fullPrompt = `${promptTemplate}\n\n${name}`;

  let lastError: Error | null = null;
  const maxRetries = 3;

  // Retry логика
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`AI search attempt ${attempt}/${maxRetries}`);
      
      const result = await callOllamaForJson<UniversitySearchResult>(fullPrompt);

      // Валидация результата
      const validated = validateSearchResult(result);
      
      // Сохранить в кэш
      searchCache.set(normalizedName, { result: validated, timestamp: Date.now() });
      
      logger.info('University search completed', {
        name,
        found: validated.found,
        confidence: validated.confidence,
        official_name: validated.official_name,
      });

      return validated;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      logger.warn(`AI search attempt ${attempt} failed`, { error: lastError.message });
      
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw new Error(`Failed to check university after ${maxRetries} attempts: ${lastError?.message}`);
};

/**
 * Валидировать и нормализовать результат поиска
 */
const validateSearchResult = (result: Partial<UniversitySearchResult>): UniversitySearchResult => {
  return {
    // Базовые поля
    found: Boolean(result.found),
    confidence: typeof result.confidence === 'number' 
      ? Math.min(100, Math.max(0, result.confidence)) 
      : 0,
    official_name: result.official_name || null,
    official_name_en: result.official_name_en || null,
    country: result.country || null,
    city: result.city || null,
    website: result.website && isValidUrl(result.website) ? result.website : null,
    reasoning: result.reasoning || 'No reasoning provided',
    alternatives: Array.isArray(result.alternatives) ? result.alternatives : [],
    
    // Расширенные поля
    description: result.description || undefined,
    mission: result.mission || undefined,
    founded_year: typeof result.founded_year === 'number' ? result.founded_year : null,
    student_count: typeof result.student_count === 'number' ? result.student_count : null,
    programs: Array.isArray(result.programs) ? result.programs.map(p => ({
      name: p.name || 'Unknown',
      degree_level: p.degree_level || 'Bachelor',
      duration_years: p.duration_years || 4,
      language: p.language || 'Unknown',
    })) : [],
    contacts: result.contacts ? {
      email: result.contacts.email || undefined,
      phone: result.contacts.phone || undefined,
      address: result.contacts.address || undefined,
    } : undefined,
    admissions: result.admissions ? {
      requirements: result.admissions.requirements || undefined,
      english_proficiency: result.admissions.english_proficiency || undefined,
      intake_dates: result.admissions.intake_dates || undefined,
    } : undefined,
    rankings: Array.isArray(result.rankings) ? result.rankings.map(r => ({
      source: r.source || 'Unknown',
      rank: typeof r.rank === 'number' ? r.rank : undefined,
      year: r.year || new Date().getFullYear(),
    })) : [],
    scholarships: Array.isArray(result.scholarships) ? result.scholarships.map(s => ({
      name: s.name || 'Unknown',
      description: s.description || undefined,
    })) : [],
    tuition: result.tuition ? {
      international_students: result.tuition.international_students || undefined,
      domestic_students: result.tuition.domestic_students || undefined,
    } : undefined,
  };
};

/**
 * Проверить валидность URL
 */
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Поиск университета по имени
 * Сначала ищет в БД, затем через ИИ
 * @param name - название для поиска
 * @returns результат поиска
 */
export const searchUniversityByName = async (name: string): Promise<SearchResult> => {
  // Валидация
  if (!name || name.trim().length < 2) {
    return { inDb: false, error: 'Name must be at least 2 characters' };
  }

  const normalizedName = normalizeSearchQuery(name);
  logger.info('Searching university by name', { name, normalized: normalizedName });

  try {
    // 1. Поиск в БД (fuzzy match)
    const dbResult = await searchInDatabase(name);
    
    if (dbResult) {
      logger.info('University found in database', { id: dbResult.id, name: dbResult.name });
      return { inDb: true, data: dbResult };
    }

    // 2. Проверка через ИИ
    logger.debug('Not found in DB, checking via AI');
    const aiResult = await checkUniversityExists(name);

    if (aiResult.found && aiResult.confidence >= 70) {
      logger.info('University confirmed by AI', {
        official_name: aiResult.official_name,
        confidence: aiResult.confidence,
      });
      return { inDb: false, aiResult };
    }

    // Не найден
    logger.info('University not found', { 
      name,
      aiFound: aiResult.found,
      confidence: aiResult.confidence,
      alternatives: aiResult.alternatives,
    });

    return {
      inDb: false,
      aiResult,
      error: aiResult.found 
        ? `Low confidence (${aiResult.confidence}%): ${aiResult.reasoning}`
        : `University not found: ${aiResult.reasoning}`,
    };

  } catch (err) {
    logger.error('University search failed', { name, error: err });
    return { 
      inDb: false, 
      error: `Search failed: ${err instanceof Error ? err.message : String(err)}` 
    };
  }
};

/**
 * Поиск в базе данных с fuzzy matching
 */
const searchInDatabase = async (name: string): Promise<University | null> => {
  // Точное совпадение
  let result = await queryOne<{ profile_json: University }>(
    `SELECT up.profile_json 
     FROM university_profiles up
     JOIN universities u ON u.id = up.university_id
     WHERE LOWER(u.name) = LOWER($1) 
        OR LOWER(u.name_en) = LOWER($1)
     ORDER BY up.version DESC
     LIMIT 1`,
    [name]
  );

  if (result?.profile_json) {
    return result.profile_json;
  }

  // Fuzzy match с ILIKE
  result = await queryOne<{ profile_json: University }>(
    `SELECT up.profile_json 
     FROM university_profiles up
     JOIN universities u ON u.id = up.university_id
     WHERE u.name ILIKE $1 
        OR u.name_en ILIKE $1
        OR u.name ILIKE $2
        OR u.name_en ILIKE $2
     ORDER BY up.version DESC
     LIMIT 1`,
    [`%${name}%`, `${name}%`]
  );

  if (result?.profile_json) {
    return result.profile_json;
  }

  // Поиск с trigram similarity (если расширение включено)
  try {
    result = await queryOne<{ profile_json: University }>(
      `SELECT up.profile_json 
       FROM university_profiles up
       JOIN universities u ON u.id = up.university_id
       WHERE similarity(u.name, $1) > 0.3
          OR similarity(COALESCE(u.name_en, ''), $1) > 0.3
       ORDER BY GREATEST(similarity(u.name, $1), similarity(COALESCE(u.name_en, ''), $1)) DESC
       LIMIT 1`,
      [name]
    );

    if (result?.profile_json) {
      return result.profile_json;
    }
  } catch {
    // pg_trgm extension may not be installed
    logger.debug('Trigram search not available');
  }

  return null;
};

/**
 * Создать университет из результата поиска ИИ
 * @param searchResult - результат поиска от ИИ
 * @returns созданный университет
 */
export const createUniversityFromSearch = async (
  searchResult: UniversitySearchResult
): Promise<University> => {
  if (!searchResult.found || !searchResult.official_name) {
    throw new Error('Cannot create university: search result is invalid');
  }

  if (searchResult.confidence < 70) {
    throw new Error(`Cannot create university: confidence too low (${searchResult.confidence}%)`);
  }

  logger.info('Creating university from AI search result', {
    name: searchResult.official_name,
    country: searchResult.country,
    city: searchResult.city,
    hasExtendedInfo: !!(searchResult.description || searchResult.programs?.length),
  });

  const now = new Date().toISOString();
  const websiteUrl = searchResult.website || '';
  
  // Подготовить программы из расширенных данных
  const programs = (searchResult.programs || []).map((p, index) => ({
    id: `prog-${index + 1}`,
    name: p.name,
    degree_level: p.degree_level,
    duration_years: p.duration_years,
    language: p.language,
  }));
  
  // Подготовить рейтинги
  const rankings = (searchResult.rankings || []).map(r => ({
    source: r.source,
    rank: r.rank,
    year: r.year,
    category: 'Overall',
  }));
  
  // Подготовить стипендии
  const scholarships = (searchResult.scholarships || []).map(s => ({
    name: s.name,
    description: s.description || NO_INFO,
  }));
  
  // Подсчитать заполненность
  const missingFields: string[] = [];
  const checkField = (value: unknown, name: string) => {
    if (!value || value === NO_INFO || value === 'Нет информации') {
      missingFields.push(name);
    }
  };
  
  checkField(searchResult.description, 'description');
  checkField(searchResult.mission, 'mission');
  checkField(programs.length > 0 ? programs : null, 'programs');
  checkField(searchResult.contacts?.phone, 'contacts.phone');
  checkField(searchResult.contacts?.address, 'contacts.address');
  checkField(scholarships.length > 0 ? scholarships : null, 'scholarships');
  checkField(rankings.length > 0 ? rankings : null, 'rankings');
  
  // Рассчитать completeness score
  const totalFields = 10;
  const filledFields = totalFields - missingFields.length;
  const completenessScore = Math.round((filledFields / totalFields) * 100);
  
  const profile: Omit<University, 'id'> = {
    name: searchResult.official_name,
    name_en: searchResult.official_name_en || undefined,
    country: searchResult.country || NO_INFO,
    city: searchResult.city || NO_INFO,
    website_url: websiteUrl || NO_INFO,
    description: searchResult.description || NO_INFO,
    mission: searchResult.mission || NO_INFO,
    founded_year: searchResult.founded_year || undefined,
    student_count: searchResult.student_count || undefined,
    programs,
    rankings,
    scholarships,
    tuition_general: searchResult.tuition ? {
      international_students: searchResult.tuition.international_students || NO_INFO,
      domestic_students: searchResult.tuition.domestic_students || NO_INFO,
    } : undefined,
    admissions: {
      requirements: searchResult.admissions?.requirements || NO_INFO,
      english_proficiency: searchResult.admissions?.english_proficiency || NO_INFO,
      intake_dates: searchResult.admissions?.intake_dates || NO_INFO,
    },
    contacts: {
      main_email: searchResult.contacts?.email || NO_INFO,
      phone: searchResult.contacts?.phone || NO_INFO,
      address: searchResult.contacts?.address || NO_INFO,
    },
    metadata: {
      parsed_at: now,
      source_url: searchResult.website || 'AI generated',
      completeness_score: completenessScore,
      missing_fields: missingFields,
      notes: `Created from AI search (confidence: ${searchResult.confidence}%). ${searchResult.reasoning}`,
    },
    updated_at: now,
    created_at: now,
  };

  // Сохранить в БД
  const universityId = await transaction(async (client: PoolClient) => {
    // Создать запись университета
    // Используем NULL для website_url если сайт не указан (избегаем конфликта уникальности)
    const dbWebsiteUrl = websiteUrl || null;
    
    const uniResult = await client.queryObject<{ id: string }>(
      `INSERT INTO universities (name, name_en, country, city, website_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        profile.name,
        profile.name_en ?? null,
        profile.country,
        profile.city,
        dbWebsiteUrl,
      ]
    );

    const id = uniResult.rows[0].id;

    // Создать профиль
    const fullProfile: University = { ...profile, id };
    
    await client.queryObject(
      `INSERT INTO university_profiles (university_id, profile_json, language, version)
       VALUES ($1, $2, 'ru', 1)`,
      [id, JSON.stringify(fullProfile)]
    );

    // Создать источник если есть website
    if (searchResult.website) {
      await client.queryObject(
        `INSERT INTO university_sources (university_id, url, source_type, is_active)
         VALUES ($1, $2, 'website', true)`,
        [id, searchResult.website]
      );
    }

    return id;
  });

  logger.info('University created from AI search', { 
    id: universityId, 
    name: profile.name 
  });

  return { ...profile, id: universityId };
};

/**
 * Полный поиск и опциональное создание
 */
export const findOrCreateUniversity = async (
  name: string,
  createIfNotInDb: boolean = false
): Promise<{ university: University | null; created: boolean; error?: string }> => {
  const searchResult = await searchUniversityByName(name);

  // Найден в БД
  if (searchResult.inDb && searchResult.data) {
    return { university: searchResult.data, created: false };
  }

  // Не найден и создание не требуется
  if (!createIfNotInDb) {
    return { 
      university: null, 
      created: false, 
      error: searchResult.error || 'University not found in database' 
    };
  }

  // Попробовать создать из AI результата
  if (searchResult.aiResult?.found && searchResult.aiResult.confidence >= 70) {
    try {
      const university = await createUniversityFromSearch(searchResult.aiResult);
      return { university, created: true };
    } catch (err) {
      return { 
        university: null, 
        created: false, 
        error: `Failed to create: ${err instanceof Error ? err.message : String(err)}` 
      };
    }
  }

  return { 
    university: null, 
    created: false, 
    error: searchResult.error || 'Cannot create university: not confirmed by AI' 
  };
};

/**
 * Проверить rate limit для IP
 * @param ip - IP адрес клиента
 * @returns true если лимит не превышен
 */
export const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
};

/**
 * Поиск университетов в БД для autocomplete
 * @param searchQuery - строка поиска
 * @returns массив результатов из БД
 */
const searchDatabaseForAutocomplete = async (
  searchQuery: string
): Promise<AutocompleteResult[]> => {
  const startTime = Date.now();
  
  try {
    const results = await query<{ id: string; name: string; country: string }>(
      `SELECT id, name, country
       FROM universities
       WHERE name ILIKE '%' || $1 || '%'
          OR name_en ILIKE '%' || $1 || '%'
       ORDER BY 
         CASE WHEN name ILIKE $1 || '%' THEN 0 ELSE 1 END,
         name
       LIMIT 10`,
      [searchQuery]
    );

    const duration = Date.now() - startTime;
    if (duration > 500) {
      logger.warn('Slow autocomplete DB query', { query: searchQuery, duration });
    }

    return results.map((row) => ({
      id: row.id,
      name: row.name,
      country: row.country,
      found_in_db: true,
      source: 'db' as const,
    }));
  } catch (err) {
    logger.error('Autocomplete DB search failed', { error: err });
    return [];
  }
};

/**
 * Результат поиска через Ollama для autocomplete
 */
interface OllamaAutocompleteResult {
  name: string;
  country: string;
  exists_in_our_db: boolean;
}

/**
 * Поиск университетов через Ollama для autocomplete
 * @param searchQuery - строка поиска
 * @param existingNames - имена уже найденных университетов (для дедупликации)
 * @returns массив результатов от AI
 */
const searchOllamaForAutocomplete = async (
  searchQuery: string,
  existingNames: Set<string>
): Promise<AutocompleteResult[]> => {
  const startTime = Date.now();
  
  const prompt = `You are a university database assistant.
Search for universities where name contains: "${searchQuery}"
Return top 5 real universities with: name, country, exists_in_our_db (always false for new universities)
Return ONLY a valid JSON array, no explanations.
Example: [{"name": "Harvard University", "country": "USA", "exists_in_our_db": false}]`;

  try {
    const results = await callOllamaForJson<OllamaAutocompleteResult[]>(prompt);

    const duration = Date.now() - startTime;
    if (duration > 500) {
      logger.warn('Slow autocomplete Ollama query', { query: searchQuery, duration });
    }

    if (!Array.isArray(results)) {
      return [];
    }

    // Фильтруем дубликаты и форматируем результаты
    return results
      .filter((r) => r.name && !existingNames.has(r.name.toLowerCase()))
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        country: r.country || 'Unknown',
        found_in_db: false,
        source: 'ollama' as const,
      }));
  } catch (err) {
    logger.error('Autocomplete Ollama search failed', { error: err });
    return [];
  }
};

/**
 * Поиск университетов с автодополнением
 * Параллельно ищет в БД и через Ollama
 * @param searchQuery - строка поиска (минимум 2 символа)
 * @param ip - IP для rate limiting (опционально)
 * @returns результаты autocomplete
 */
export const searchUniversitiesAutocomplete = async (
  searchQuery: string,
  ip?: string
): Promise<AutocompleteResponse> => {
  const startTime = Date.now();
  const normalizedQuery = normalizeSearchQuery(searchQuery);

  // Валидация
  if (normalizedQuery.length < 2) {
    return { results: [], query: searchQuery, total: 0, cache_hit: false };
  }

  // Проверить rate limit
  if (ip && !checkRateLimit(ip)) {
    logger.warn('Autocomplete rate limit exceeded', { ip });
    throw new Error('Rate limit exceeded. Please wait before making more requests.');
  }

  // Проверить кэш
  const cached = autocompleteCache.get(normalizedQuery);
  if (cached && Date.now() - cached.timestamp < AUTOCOMPLETE_CACHE_TTL) {
    logger.debug('Autocomplete cache hit', { query: normalizedQuery });
    return {
      results: cached.results,
      query: searchQuery,
      total: cached.results.length,
      cache_hit: true,
    };
  }

  logger.info('Autocomplete search', { query: searchQuery });

  // Параллельный поиск в БД и Ollama
  const dbPromise = searchDatabaseForAutocomplete(normalizedQuery);
  
  // Запускаем Ollama поиск параллельно, но с таймаутом
  const ollamaPromise = Promise.race([
    (async () => {
      const dbResults = await dbPromise;
      const existingNames = new Set(dbResults.map((r) => r.name.toLowerCase()));
      return searchOllamaForAutocomplete(normalizedQuery, existingNames);
    })(),
    new Promise<AutocompleteResult[]>((resolve) => 
      setTimeout(() => resolve([]), 2000) // 2 секунды таймаут для Ollama
    ),
  ]);

  const [dbResults, ollamaResults] = await Promise.all([dbPromise, ollamaPromise]);

  // Объединить и дедуплицировать результаты
  const seenNames = new Set<string>();
  const allResults: AutocompleteResult[] = [];

  // Сначала результаты из БД (приоритет)
  for (const result of dbResults) {
    const key = result.name.toLowerCase();
    if (!seenNames.has(key)) {
      seenNames.add(key);
      allResults.push(result);
    }
  }

  // Затем результаты от Ollama
  for (const result of ollamaResults) {
    const key = result.name.toLowerCase();
    if (!seenNames.has(key) && allResults.length < 10) {
      seenNames.add(key);
      allResults.push(result);
    }
  }

  // Ограничить до 10 результатов
  const finalResults = allResults.slice(0, 10);

  // Сохранить в кэш
  autocompleteCache.set(normalizedQuery, {
    results: finalResults,
    timestamp: Date.now(),
  });

  const duration = Date.now() - startTime;
  logger.info('Autocomplete completed', {
    query: searchQuery,
    dbCount: dbResults.length,
    ollamaCount: ollamaResults.length,
    totalCount: finalResults.length,
    duration,
  });

  if (duration > 500) {
    logger.warn('Slow autocomplete response', { query: searchQuery, duration });
  }

  return {
    results: finalResults,
    query: searchQuery,
    total: finalResults.length,
    cache_hit: false,
  };
};

/**
 * Очистить кэш autocomplete
 */
export const clearAutocompleteCache = (): void => {
  autocompleteCache.clear();
  logger.debug('Autocomplete cache cleared');
};
