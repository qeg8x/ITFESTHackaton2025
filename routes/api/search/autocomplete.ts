/**
 * API endpoint для autocomplete поиска университетов
 * GET /api/search/autocomplete?q=query
 */

import { FreshContext, Handlers } from '$fresh/server.ts';
import { searchUniversitiesAutocomplete } from '../../../src/services/university-search.service.ts';
import { logger } from '../../../src/utils/logger.ts';

/**
 * Получить IP адрес клиента
 */
const getClientIp = (req: Request, ctx: FreshContext): string => {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  return ctx.remoteAddr?.hostname || 'unknown';
};

export const handler: Handlers = {
  /**
   * GET /api/search/autocomplete?q=query
   * Возвращает результаты автодополнения для поиска
   */
  async GET(req: Request, ctx: FreshContext) {
    const startTime = Date.now();
    const url = new URL(req.url);
    const query = url.searchParams.get('q') || '';
    const ip = getClientIp(req, ctx);

    logger.info('Autocomplete request', { query, ip });

    try {
      // Валидация query
      if (!query || query.trim().length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Query parameter "q" is required',
            results: [],
            query: '',
            total: 0,
            cache_hit: false,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Проверка длины
      if (query.length > 100) {
        return new Response(
          JSON.stringify({
            error: 'Query too long. Maximum 100 characters.',
            results: [],
            query: query.slice(0, 100),
            total: 0,
            cache_hit: false,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Выполнить поиск
      const result = await searchUniversitiesAutocomplete(query, ip);

      const duration = Date.now() - startTime;
      logger.info('Autocomplete response', {
        query,
        total: result.total,
        cache_hit: result.cache_hit,
        duration,
      });

      // Установить заголовки кэширования
      const cacheControl = result.cache_hit
        ? 'public, max-age=3600'
        : 'public, max-age=300';

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': cacheControl,
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';

      logger.error('Autocomplete error', { query, error: errorMessage, duration });

      // Проверить тип ошибки
      if (errorMessage.includes('Rate limit')) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please wait before making more requests.',
            results: [],
            query,
            total: 0,
            cache_hit: false,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          results: [],
          query,
          total: 0,
          cache_hit: false,
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  },
};
