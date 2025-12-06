/**
 * API для поиска университетов в БД
 * GET /api/search/universities?name=...
 */

import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import { searchUniversitiesInDb } from '../../../src/services/search.service.ts';

export const handler: Handlers = {
  async GET(req) {
    const startTime = Date.now();
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '5', 10), 20);

    logger.debug('API: GET /api/search/universities', { name, limit });

    // Валидация
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({
        results: [],
        exact_match: false,
        took_ms: Date.now() - startTime,
        message: 'Query too short (min 2 characters)',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (name.length > 100) {
      return new Response(JSON.stringify({
        error: 'Query too long (max 100 characters)',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const { results, exactMatch } = await searchUniversitiesInDb(name.trim(), limit);

      return new Response(JSON.stringify({
        results,
        exact_match: exactMatch,
        took_ms: Date.now() - startTime,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (err) {
      logger.error('Search failed', { name, error: err });
      return new Response(JSON.stringify({ 
        error: 'Search failed',
        took_ms: Date.now() - startTime,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
