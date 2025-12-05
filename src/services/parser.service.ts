import { logger } from '../utils/logger.ts';
import { htmlToMarkdown, computeHash, normalizeText, stripHtmlTags } from '../utils/markdown.converter.ts';
import { callOllamaForJson, OllamaError } from '../utils/ollama.client.ts';
import { query, queryOne, transaction } from '../config/database.ts';
import type { University } from '../types/university.ts';
import type { UniversitySourceRow, UpdateStatus } from '../types/database.ts';
import type { PoolClient } from 'postgres';

/**
 * Конфигурация парсера
 */
const PARSER_CONFIG = {
  fetchTimeout: 10000, // 10 секунд
  userAgent: 'DigitalUniversity/1.0 (Educational Parser)',
  maxRetries: 2,
};

/**
 * Результат загрузки сайта
 */
interface FetchResult {
  html: string;
  hash: string;
  contentLength: number;
}

/**
 * Результат обновления
 */
interface UpdateResult {
  updated: boolean;
  message: string;
  newHash?: string;
  error?: string;
}

/**
 * Ошибка парсера
 */
export class ParserError extends Error {
  constructor(
    message: string,
    public code: 'FETCH_ERROR' | 'PARSE_ERROR' | 'LLM_ERROR' | 'DB_ERROR',
    public details?: unknown
  ) {
    super(message);
    this.name = 'ParserError';
  }
}

/**
 * Загрузить HTML с сайта и вычислить хэш
 * @param url - URL сайта
 * @returns HTML и хэш
 */
export const fetchAndHashWebsite = async (url: string): Promise<FetchResult> => {
  logger.info('Fetching website', { url });
  const startTime = Date.now();

  for (let attempt = 1; attempt <= PARSER_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        PARSER_CONFIG.fetchTimeout
      );

      const response = await fetch(url, {
        headers: {
          'User-Agent': PARSER_CONFIG.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ParserError(
          `HTTP ${response.status}: ${response.statusText}`,
          'FETCH_ERROR',
          { status: response.status }
        );
      }

      const html = await response.text();
      
      // Нормализуем текст для хэширования (убираем динамический контент)
      const normalizedForHash = normalizeText(stripHtmlTags(html));
      const hash = await computeHash(normalizedForHash);

      const duration = Date.now() - startTime;
      logger.info('Website fetched successfully', {
        url,
        contentLength: html.length,
        hash: hash.substring(0, 16) + '...',
        duration_ms: duration,
      });

      return {
        html,
        hash,
        contentLength: html.length,
      };
    } catch (err) {
      const isLastAttempt = attempt === PARSER_CONFIG.maxRetries;

      if (err instanceof Error && err.name === 'AbortError') {
        logger.error('Fetch timeout', { url, attempt, timeout: PARSER_CONFIG.fetchTimeout });
        
        if (isLastAttempt) {
          throw new ParserError('Request timed out', 'FETCH_ERROR', { url });
        }
      } else if (err instanceof ParserError) {
        throw err;
      } else {
        logger.error('Fetch failed', { url, attempt, error: err });
        
        if (isLastAttempt) {
          throw new ParserError(
            `Failed to fetch: ${err instanceof Error ? err.message : String(err)}`,
            'FETCH_ERROR',
            { url }
          );
        }
      }

      // Ждем перед retry
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  throw new ParserError('Failed to fetch after all retries', 'FETCH_ERROR', { url });
};

/**
 * JSON схема для University Profile (для LLM)
 */
const UNIVERSITY_PROFILE_SCHEMA = `{
  "name": "string (название университета на русском)",
  "name_en": "string | null (название на английском)",
  "country": "string (страна)",
  "city": "string (город)",
  "website_url": "string (URL сайта)",
  "description": "string (описание университета, 2-3 предложения)",
  "mission": "string | null (миссия университета)",
  "programs": [
    {
      "id": "string (уникальный ID программы)",
      "name": "string (название программы)",
      "degree_level": "Bachelor | Master | PhD",
      "duration_years": "number (длительность в годах)",
      "language": "string (язык обучения)"
    }
  ],
  "tuition": {
    "amount": "number (стоимость)",
    "currency": "string (валюта: KZT, RUB, USD)",
    "per_year": "boolean"
  } | null,
  "admissions": {
    "requirements": "string (требования для поступления)",
    "start_date": "string | null (дата начала приема)"
  },
  "contacts": {
    "email": "string | null",
    "phone": "string | null",
    "address": "string | null"
  },
  "ratings": [
    {
      "source": "string (источник рейтинга: QS, THE, etc)",
      "rank": "number (позиция)",
      "year": "number (год)"
    }
  ] | null
}`;

/**
 * Преобразовать Markdown в профиль университета через LLM
 * @param markdown - текст в формате Markdown
 * @param existingData - существующие данные для контекста
 * @returns профиль университета
 */
export const markdownToUniversityProfile = async (
  markdown: string,
  existingData?: Partial<University>
): Promise<Partial<University>> => {
  logger.info('Converting Markdown to University profile via LLM', {
    markdownLength: markdown.length,
    hasExistingData: !!existingData,
  });

  const prompt = `Analyze the following university website content and extract structured information.

${existingData ? `Known information about this university:
- Name: ${existingData.name}
- Country: ${existingData.country}
- City: ${existingData.city}
- Website: ${existingData.website_url}

` : ''}Website content (Markdown):
---
${markdown}
---

Extract and return a JSON object with the university profile. Include:
- Basic info (name, description, mission)
- Educational programs (at least main ones)
- Tuition fees if mentioned
- Admission requirements
- Contact information
- Rankings if mentioned

If some information is not available in the text, use null or empty arrays.
Return ONLY valid JSON matching the schema.`;

  try {
    const result = await callOllamaForJson<Partial<University>>(
      prompt,
      UNIVERSITY_PROFILE_SCHEMA
    );

    // Валидация и нормализация результата
    const validated = validateAndNormalizeProfile(result, existingData);

    logger.info('Profile extracted successfully', {
      name: validated.name,
      programsCount: validated.programs?.length ?? 0,
    });

    return validated;
  } catch (err) {
    if (err instanceof OllamaError) {
      throw new ParserError('LLM parsing failed', 'LLM_ERROR', err);
    }
    throw err;
  }
};

/**
 * Валидировать и нормализовать профиль
 */
const validateAndNormalizeProfile = (
  profile: Partial<University>,
  existingData?: Partial<University>
): Partial<University> => {
  // Объединить с существующими данными
  const merged: Partial<University> = {
    ...existingData,
    ...profile,
  };

  // Убедиться что обязательные поля заполнены
  if (!merged.name) {
    merged.name = existingData?.name ?? 'Unknown University';
  }

  if (!merged.country) {
    merged.country = existingData?.country ?? 'Unknown';
  }

  if (!merged.city) {
    merged.city = existingData?.city ?? 'Unknown';
  }

  if (!merged.website_url) {
    merged.website_url = existingData?.website_url ?? '';
  }

  if (!merged.description) {
    merged.description = '';
  }

  // Нормализовать programs
  if (merged.programs && Array.isArray(merged.programs)) {
    merged.programs = merged.programs.map((p, index) => ({
      id: p.id || `prog-${index}`,
      name: p.name || 'Unknown Program',
      degree_level: validateDegreeLevel(p.degree_level),
      duration_years: p.duration_years || 4,
      language: p.language || 'Unknown',
      tuition: p.tuition,
      admission_requirements: p.admission_requirements,
    }));
  } else {
    merged.programs = [];
  }

  // Нормализовать admissions
  if (!merged.admissions) {
    merged.admissions = { requirements: '' };
  }

  // Нормализовать contacts
  if (!merged.contacts) {
    merged.contacts = {};
  }

  return merged;
};

/**
 * Валидировать уровень образования
 */
const validateDegreeLevel = (level?: string): 'Bachelor' | 'Master' | 'PhD' => {
  const normalized = level?.toLowerCase();
  
  if (normalized?.includes('bachelor') || normalized?.includes('бакалавр')) {
    return 'Bachelor';
  }
  if (normalized?.includes('master') || normalized?.includes('магистр')) {
    return 'Master';
  }
  if (normalized?.includes('phd') || normalized?.includes('доктор') || normalized?.includes('аспирант')) {
    return 'PhD';
  }
  
  return 'Bachelor';
};

/**
 * Проверить и обновить данные сайта университета
 * @param universityId - ID университета
 * @param sourceId - ID источника
 * @param url - URL сайта
 * @returns результат обновления
 */
export const checkAndUpdateWebsite = async (
  universityId: string,
  sourceId: string,
  url: string
): Promise<UpdateResult> => {
  logger.info('Checking website for updates', { universityId, sourceId, url });
  const startTime = Date.now();

  try {
    // 1. Получить текущий хэш из БД
    const source = await queryOne<UniversitySourceRow>(
      `SELECT current_hash, last_checked_at FROM university_sources WHERE id = $1`,
      [sourceId]
    );

    if (!source) {
      throw new ParserError('Source not found', 'DB_ERROR', { sourceId });
    }

    // 2. Загрузить и хэшировать сайт
    const { html, hash } = await fetchAndHashWebsite(url);

    // 3. Проверить изменился ли хэш
    const hasChanges = source.current_hash !== hash;

    if (!hasChanges) {
      // Обновить только last_checked_at
      await query(
        `UPDATE university_sources SET last_checked_at = NOW() WHERE id = $1`,
        [sourceId]
      );

      await logUpdate(sourceId, 'skipped', false);

      const duration = Date.now() - startTime;
      logger.info('No changes detected', { universityId, duration_ms: duration });

      return {
        updated: false,
        message: 'No changes detected',
      };
    }

    // 4. Изменения обнаружены - парсим новый контент
    logger.info('Changes detected, parsing new content', { universityId });

    // Получить существующие данные
    const existingProfile = await queryOne<{ profile_json: University }>(
      `SELECT profile_json FROM university_profiles 
       WHERE university_id = $1 
       ORDER BY version DESC LIMIT 1`,
      [universityId]
    );

    // Конвертировать HTML в Markdown
    const markdown = htmlToMarkdown(html);

    // Извлечь профиль через LLM
    const newProfile = await markdownToUniversityProfile(
      markdown,
      existingProfile?.profile_json
    );

    // 5. Сохранить в БД
    await transaction(async (client: PoolClient) => {
      // Получить текущую версию
      const versionResult = await client.queryObject<{ version: number }>(
        `SELECT COALESCE(MAX(version), 0) as version 
         FROM university_profiles WHERE university_id = $1`,
        [universityId]
      );
      const newVersion = (versionResult.rows[0]?.version ?? 0) + 1;

      // Создать полный профиль
      const fullProfile: University = {
        id: universityId,
        name: newProfile.name!,
        name_en: newProfile.name_en,
        country: newProfile.country!,
        city: newProfile.city!,
        website_url: newProfile.website_url!,
        logo_url: newProfile.logo_url,
        description: newProfile.description!,
        mission: newProfile.mission,
        programs: newProfile.programs ?? [],
        tuition: newProfile.tuition,
        admissions: newProfile.admissions!,
        scholarships: newProfile.scholarships,
        contacts: newProfile.contacts!,
        ratings: newProfile.ratings,
        updated_at: new Date().toISOString(),
      };

      // Вставить новую версию профиля
      await client.queryObject(
        `INSERT INTO university_profiles (university_id, profile_json, language, version)
         VALUES ($1, $2, 'ru', $3)`,
        [universityId, JSON.stringify(fullProfile), newVersion]
      );

      // Обновить source
      await client.queryObject(
        `UPDATE university_sources 
         SET current_hash = $1, last_checked_at = NOW(), last_parsed_at = NOW()
         WHERE id = $2`,
        [hash, sourceId]
      );

      // Обновить университет
      await client.queryObject(
        `UPDATE universities SET updated_at = NOW() WHERE id = $1`,
        [universityId]
      );
    });

    // 6. Записать лог
    const processingTime = Date.now() - startTime;
    await logUpdate(sourceId, 'success', true, undefined, processingTime);

    logger.info('Website updated successfully', {
      universityId,
      newHash: hash.substring(0, 16) + '...',
      duration_ms: processingTime,
    });

    return {
      updated: true,
      message: 'Profile updated successfully',
      newHash: hash,
    };
  } catch (err) {
    const processingTime = Date.now() - startTime;
    const errorMessage = err instanceof Error ? err.message : String(err);

    await logUpdate(sourceId, 'failed', false, errorMessage, processingTime);

    logger.error('Website update failed', {
      universityId,
      error: errorMessage,
      duration_ms: processingTime,
    });

    return {
      updated: false,
      message: 'Update failed',
      error: errorMessage,
    };
  }
};

/**
 * Записать лог обновления
 */
const logUpdate = async (
  sourceId: string,
  status: UpdateStatus,
  changesDetected: boolean,
  errorMessage?: string,
  processingTimeMs?: number
): Promise<void> => {
  try {
    await query(
      `INSERT INTO update_logs (source_id, status, changes_detected, error_message, processing_time_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [sourceId, status, changesDetected, errorMessage ?? null, processingTimeMs ?? null]
    );
  } catch (err) {
    logger.error('Failed to log update', err);
  }
};

/**
 * Обновить все активные источники
 * @returns статистика обновления
 */
export const updateAllSources = async (): Promise<{
  total: number;
  updated: number;
  failed: number;
  skipped: number;
}> => {
  logger.info('Starting bulk update of all sources');

  const sources = await query<{
    id: string;
    university_id: string;
    url: string;
  }>(
    `SELECT id, university_id, url 
     FROM university_sources 
     WHERE is_active = true 
     ORDER BY last_checked_at ASC NULLS FIRST`
  );

  const stats = {
    total: sources.length,
    updated: 0,
    failed: 0,
    skipped: 0,
  };

  for (const source of sources) {
    try {
      const result = await checkAndUpdateWebsite(
        source.university_id,
        source.id,
        source.url
      );

      if (result.updated) {
        stats.updated++;
      } else if (result.error) {
        stats.failed++;
      } else {
        stats.skipped++;
      }

      // Пауза между запросами
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      logger.error('Failed to update source', { sourceId: source.id, error: err });
      stats.failed++;
    }
  }

  logger.info('Bulk update completed', stats);

  return stats;
};
