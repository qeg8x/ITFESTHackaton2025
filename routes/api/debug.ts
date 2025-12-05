import { Handlers } from '$fresh/server.ts';
import { testConnection, query } from '../../src/config/database.ts';
import { logger } from '../../src/utils/logger.ts';

/**
 * Debug API endpoints
 * GET /api/debug?action=health|universities|stats
 */
export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') ?? 'health';
    const startTime = Date.now();

    logger.debug('API: GET /api/debug', { action });

    try {
      switch (action) {
        case 'health':
          return await handleHealth(startTime);

        case 'universities':
          return await handleUniversities(startTime);

        case 'stats':
          return await handleStats(startTime);

        default:
          return new Response(
            JSON.stringify({
              error: 'Bad Request',
              message: `Unknown action: ${action}. Available: health, universities, stats`,
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
      }
    } catch (err) {
      logger.error('API: Debug endpoint failed', { action, error: err });

      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: String(err),
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

/**
 * Health check
 */
const handleHealth = async (startTime: number): Promise<Response> => {
  const dbConnected = await testConnection();
  const duration = Date.now() - startTime;

  const status = {
    status: dbConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(performance.now() / 1000),
    database: dbConnected ? 'connected' : 'disconnected',
    environment: Deno.env.get('DENO_ENV') ?? 'development',
    response_time_ms: duration,
  };

  logger.info('API: Health check', status);

  return new Response(JSON.stringify(status), {
    status: dbConnected ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'X-Response-Time': `${duration}ms`,
    },
  });
};

/**
 * Список всех университетов (debug)
 */
const handleUniversities = async (startTime: number): Promise<Response> => {
  const universities = await query<{
    id: string;
    name: string;
    country: string;
    city: string;
    website_url: string;
    is_active: boolean;
  }>(
    `SELECT id, name, country, city, website_url, is_active 
     FROM universities 
     ORDER BY name 
     LIMIT 50`
  );

  const duration = Date.now() - startTime;

  logger.debug('API: Debug universities', { count: universities.length });

  return new Response(
    JSON.stringify({
      count: universities.length,
      universities,
      response_time_ms: duration,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${duration}ms`,
      },
    }
  );
};

/**
 * Статистика БД
 */
const handleStats = async (startTime: number): Promise<Response> => {
  // Подсчет записей в таблицах
  const [universities, profiles, sources, logs] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*) as count FROM universities'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM university_profiles'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM university_sources'),
    query<{ count: string }>('SELECT COUNT(*) as count FROM update_logs'),
  ]);

  const duration = Date.now() - startTime;

  const stats = {
    tables: {
      universities: parseInt(universities[0]?.count ?? '0', 10),
      profiles: parseInt(profiles[0]?.count ?? '0', 10),
      sources: parseInt(sources[0]?.count ?? '0', 10),
      update_logs: parseInt(logs[0]?.count ?? '0', 10),
    },
    response_time_ms: duration,
    timestamp: new Date().toISOString(),
  };

  logger.debug('API: Debug stats', stats);

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Response-Time': `${duration}ms`,
    },
  });
};
