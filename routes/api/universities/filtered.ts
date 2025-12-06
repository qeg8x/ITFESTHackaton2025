/**
 * API endpoint для фильтрации университетов
 * GET /api/universities/filtered
 */

import { FreshContext, Handlers } from '$fresh/server.ts';
import { query } from '../../../src/config/database.ts';
import { logger } from '../../../src/utils/logger.ts';

/**
 * Параметры фильтрации
 */
interface FilterParams {
  country: string | null;
  specializations: string[];
  languages: string[];
  degree_levels: string[];
  min_tuition: number | null;
  max_tuition: number | null;
  accepts_international: boolean | null;
  size_category: string | null;
  limit: number;
  offset: number;
}

/**
 * Результат фильтрации
 */
interface FilteredUniversity {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  city: string;
  specializations: string[];
  languages: string[];
  degree_levels: string[];
  min_tuition: number | null;
  max_tuition: number | null;
  size_category: string | null;
  accepts_international: boolean;
  founded_year: number | null;
  student_count: number | null;
}

/**
 * Кэш результатов фильтрации
 */
const filterCache = new Map<string, { results: FilteredUniversity[]; total: number; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 минут

/**
 * Парсинг параметров запроса
 */
const parseFilterParams = (url: URL): FilterParams => {
  const params = url.searchParams;

  // Парсинг массивов (разделены запятой)
  const parseArray = (key: string): string[] => {
    const value = params.get(key);
    if (!value) return [];
    return value.split(',').map((s) => s.trim()).filter(Boolean);
  };

  // Парсинг числа
  const parseNumber = (key: string): number | null => {
    const value = params.get(key);
    if (!value) return null;
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  };

  // Парсинг boolean
  const parseBoolean = (key: string): boolean | null => {
    const value = params.get(key);
    if (!value) return null;
    return value.toLowerCase() === 'true';
  };

  return {
    country: params.get('country') || null,
    specializations: parseArray('specialization'),
    languages: parseArray('language'),
    degree_levels: parseArray('degree_level'),
    min_tuition: parseNumber('min_tuition'),
    max_tuition: parseNumber('max_tuition'),
    accepts_international: parseBoolean('accepts_international'),
    size_category: params.get('size') || null,
    limit: Math.min(parseNumber('limit') || 50, 100),
    offset: parseNumber('offset') || 0,
  };
};

/**
 * Генерация ключа кэша
 */
const getCacheKey = (params: FilterParams): string => {
  return JSON.stringify(params);
};

/**
 * Построение SQL запроса с фильтрами
 */
const buildFilterQuery = (params: FilterParams): { sql: string; values: unknown[] } => {
  const conditions: string[] = ['is_active = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  // Country filter
  if (params.country) {
    conditions.push(`country = $${paramIndex}`);
    values.push(params.country);
    paramIndex++;
  }

  // Specializations filter (JSONB contains)
  if (params.specializations.length > 0) {
    conditions.push(`specializations @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.specializations));
    paramIndex++;
  }

  // Languages filter
  if (params.languages.length > 0) {
    conditions.push(`languages @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.languages));
    paramIndex++;
  }

  // Degree levels filter
  if (params.degree_levels.length > 0) {
    conditions.push(`degree_levels @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.degree_levels));
    paramIndex++;
  }

  // Tuition range
  if (params.min_tuition !== null) {
    conditions.push(`(min_tuition >= $${paramIndex} OR min_tuition IS NULL)`);
    values.push(params.min_tuition);
    paramIndex++;
  }

  if (params.max_tuition !== null) {
    conditions.push(`(max_tuition <= $${paramIndex} OR max_tuition IS NULL)`);
    values.push(params.max_tuition);
    paramIndex++;
  }

  // Accepts international
  if (params.accepts_international !== null) {
    conditions.push(`accepts_international = $${paramIndex}`);
    values.push(params.accepts_international);
    paramIndex++;
  }

  // Size category
  if (params.size_category) {
    conditions.push(`size_category = $${paramIndex}`);
    values.push(params.size_category);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  // Main query
  const sql = `
    SELECT 
      id, name, name_en, country, city,
      COALESCE(specializations, '[]'::jsonb) as specializations,
      COALESCE(languages, '[]'::jsonb) as languages,
      COALESCE(degree_levels, '[]'::jsonb) as degree_levels,
      min_tuition, max_tuition, size_category,
      COALESCE(accepts_international, true) as accepts_international,
      founded_year, student_count
    FROM universities
    WHERE ${whereClause}
    ORDER BY name
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  values.push(params.limit, params.offset);

  return { sql, values };
};

/**
 * Подсчёт общего количества результатов
 */
const buildCountQuery = (params: FilterParams): { sql: string; values: unknown[] } => {
  const conditions: string[] = ['is_active = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (params.country) {
    conditions.push(`country = $${paramIndex}`);
    values.push(params.country);
    paramIndex++;
  }

  if (params.specializations.length > 0) {
    conditions.push(`specializations @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.specializations));
    paramIndex++;
  }

  if (params.languages.length > 0) {
    conditions.push(`languages @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.languages));
    paramIndex++;
  }

  if (params.degree_levels.length > 0) {
    conditions.push(`degree_levels @> $${paramIndex}::jsonb`);
    values.push(JSON.stringify(params.degree_levels));
    paramIndex++;
  }

  if (params.min_tuition !== null) {
    conditions.push(`(min_tuition >= $${paramIndex} OR min_tuition IS NULL)`);
    values.push(params.min_tuition);
    paramIndex++;
  }

  if (params.max_tuition !== null) {
    conditions.push(`(max_tuition <= $${paramIndex} OR max_tuition IS NULL)`);
    values.push(params.max_tuition);
    paramIndex++;
  }

  if (params.accepts_international !== null) {
    conditions.push(`accepts_international = $${paramIndex}`);
    values.push(params.accepts_international);
    paramIndex++;
  }

  if (params.size_category) {
    conditions.push(`size_category = $${paramIndex}`);
    values.push(params.size_category);
    paramIndex++;
  }

  const sql = `SELECT COUNT(*) as total FROM universities WHERE ${conditions.join(' AND ')}`;

  return { sql, values };
};

export const handler: Handlers = {
  async GET(req: Request, _ctx: FreshContext) {
    const startTime = Date.now();
    const url = new URL(req.url);

    try {
      const params = parseFilterParams(url);

      logger.info('Filtered universities request', {
        country: params.country,
        specializations: params.specializations,
        languages: params.languages,
        limit: params.limit,
        offset: params.offset,
      });

      // Проверить кэш
      const cacheKey = getCacheKey(params);
      const cached = filterCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        const duration = Date.now() - startTime;
        logger.debug('Filter cache hit', { duration });

        return new Response(
          JSON.stringify({
            results: cached.results,
            total: cached.total,
            filters_applied: {
              country: params.country,
              specializations: params.specializations,
              languages: params.languages,
              degree_levels: params.degree_levels,
              min_tuition: params.min_tuition,
              max_tuition: params.max_tuition,
              accepts_international: params.accepts_international,
              size: params.size_category,
            },
            pagination: {
              limit: params.limit,
              offset: params.offset,
            },
            cache_hit: true,
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=300',
              'X-Response-Time': `${duration}ms`,
            },
          }
        );
      }

      // Выполнить запросы параллельно
      const { sql: dataSql, values: dataValues } = buildFilterQuery(params);
      const { sql: countSql, values: countValues } = buildCountQuery(params);

      const [results, countResult] = await Promise.all([
        query<FilteredUniversity>(dataSql, dataValues),
        query<{ total: string }>(countSql, countValues),
      ]);

      const total = parseInt(countResult[0]?.total || '0', 10);

      // Сохранить в кэш
      filterCache.set(cacheKey, {
        results,
        total,
        timestamp: Date.now(),
      });

      const duration = Date.now() - startTime;
      logger.info('Filtered universities response', {
        count: results.length,
        total,
        duration,
      });

      if (duration > 500) {
        logger.warn('Slow filter query', { duration, params });
      }

      return new Response(
        JSON.stringify({
          results,
          total,
          filters_applied: {
            country: params.country,
            specializations: params.specializations,
            languages: params.languages,
            degree_levels: params.degree_levels,
            min_tuition: params.min_tuition,
            max_tuition: params.max_tuition,
            accepts_international: params.accepts_international,
            size: params.size_category,
          },
          pagination: {
            limit: params.limit,
            offset: params.offset,
          },
          cache_hit: false,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300',
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      logger.error('Filter query failed', { error: errorMessage, duration });

      return new Response(
        JSON.stringify({
          error: 'Failed to filter universities',
          message: errorMessage,
          results: [],
          total: 0,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
