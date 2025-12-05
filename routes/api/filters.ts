import { Handlers } from '$fresh/server.ts';
import { getCountries, getCities } from '../../src/services/universities.service.ts';
import { logger } from '../../src/utils/logger.ts';

/**
 * GET /api/filters
 * Получить фильтры для поиска университетов
 * Query params: type=countries|cities, country (для фильтрации городов)
 */
export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const type = url.searchParams.get('type') ?? 'all';
    const country = url.searchParams.get('country') ?? undefined;
    const startTime = Date.now();

    logger.debug('API: GET /api/filters', { type, country });

    try {
      let result: Record<string, unknown> = {};

      switch (type) {
        case 'countries': {
          const countries = await getCountries();
          result = { countries };
          break;
        }

        case 'cities': {
          const cities = await getCities(country);
          result = { cities };
          break;
        }

        case 'all':
        default: {
          const [countries, cities] = await Promise.all([
            getCountries(),
            getCities(country),
          ]);
          result = { countries, cities };
          break;
        }
      }

      const duration = Date.now() - startTime;
      logger.debug('API: Filters fetched', { type, duration_ms: duration });

      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${duration}ms`,
        },
      });
    } catch (err) {
      logger.error('API: Failed to fetch filters', { type, error: err });

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'Failed to fetch filters',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
