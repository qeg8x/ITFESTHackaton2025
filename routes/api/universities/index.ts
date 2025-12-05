import { Handlers } from '$fresh/server.ts';
import { getAllUniversities, getCountries, getCities } from '../../../src/services/universities.service.ts';
import { logger } from '../../../src/utils/logger.ts';

/**
 * GET /api/universities
 * Получить список университетов с пагинацией и поиском
 */
export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const startTime = Date.now();

    logger.info('API: GET /api/universities', {
      query: Object.fromEntries(url.searchParams),
    });

    try {
      // Парсинг query параметров
      const limit = Math.min(
        parseInt(url.searchParams.get('limit') ?? '20', 10),
        100
      );
      const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
      const search = url.searchParams.get('search') ?? undefined;
      const country = url.searchParams.get('country') ?? undefined;
      const city = url.searchParams.get('city') ?? undefined;

      // Получить данные
      const result = await getAllUniversities({
        limit,
        offset,
        search,
        country,
        city,
      });

      const duration = Date.now() - startTime;
      logger.info('API: Universities fetched', {
        count: result.data.length,
        total: result.total,
        duration_ms: duration,
      });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (err) {
      logger.error('API: Failed to fetch universities', err);

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to fetch universities',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
};
