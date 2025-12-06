/**
 * API для проверки существования университета через ИИ
 * GET /api/search/verify?name=...
 */

import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import { verifyUniversityWithAI } from '../../../src/services/search.service.ts';
import { query } from '../../../src/config/database.ts';

/**
 * Получить IP клиента
 */
const getClientIp = (req: Request): string => {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
};

export const handler: Handlers = {
  /**
   * GET - Проверить существование через ИИ
   */
  async GET(req) {
    const startTime = Date.now();
    const url = new URL(req.url);
    const name = url.searchParams.get('name');
    const clientIp = getClientIp(req);

    logger.info('API: GET /api/search/verify', { name, ip: clientIp });

    // Валидация
    if (!name || name.trim().length < 2) {
      return new Response(JSON.stringify({
        error: 'Name is required (min 2 characters)',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (name.length > 100) {
      return new Response(JSON.stringify({
        error: 'Name too long (max 100 characters)',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const { result, rateLimited, remaining, resetIn } = await verifyUniversityWithAI(
        name.trim(),
        clientIp
      );

      // Rate limited
      if (rateLimited) {
        return new Response(JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil((resetIn || 60000) / 1000)} seconds.`,
          retry_after: Math.ceil((resetIn || 60000) / 1000),
        }), {
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil((resetIn || 60000) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        });
      }

      if (!result) {
        throw new Error('No result from AI');
      }

      // Проверяем, есть ли университет с таким website в базе
      let existingUniversity = null;
      if (result.found && result.website) {
        try {
          // Нормализуем URL для сравнения
          const normalizeUrl = (url: string) => {
            try {
              const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
              return parsed.hostname.replace(/^www\./, '').toLowerCase();
            } catch {
              return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '');
            }
          };

          const websiteHost = normalizeUrl(result.website);
          
          // Ищем в базе по совпадению домена
          const dbResult = await query<{
            id: string;
            name: string;
            country: string;
            city: string;
            website_url: string;
          }>(
            `SELECT id, name, country, city, website_url 
             FROM universities 
             WHERE is_active = true 
             AND (
               website_url ILIKE $1 
               OR website_url ILIKE $2 
               OR website_url ILIKE $3
               OR website_url ILIKE $4
             )
             LIMIT 1`,
            [
              `%${websiteHost}%`,
              `%www.${websiteHost}%`,
              `https://${websiteHost}%`,
              `https://www.${websiteHost}%`,
            ]
          );

          if (dbResult.length > 0) {
            existingUniversity = dbResult[0];
            logger.info('Found existing university by website', { 
              website: result.website, 
              existingId: existingUniversity.id 
            });
          }
        } catch (dbErr) {
          logger.error('Failed to check existing university', { error: dbErr });
        }
      }

      return new Response(JSON.stringify({
        query: name,
        // Базовые поля
        found: result.found,
        confidence: result.confidence,
        official_name: result.official_name,
        official_name_en: result.official_name_en,
        country: result.country,
        city: result.city,
        website: result.website,
        reasoning: result.reasoning,
        alternatives: result.alternatives,
        // Расширенные поля
        description: result.description,
        mission: result.mission,
        founded_year: result.founded_year,
        student_count: result.student_count,
        programs: result.programs,
        contacts: result.contacts,
        admissions: result.admissions,
        rankings: result.rankings,
        scholarships: result.scholarships,
        tuition: result.tuition,
        // Существующий университет в БД
        existing_university: existingUniversity,
        took_ms: Date.now() - startTime,
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': String(remaining ?? 0),
        },
      });

    } catch (err) {
      logger.error('Verify failed', { name, error: err });
      return new Response(JSON.stringify({
        error: 'Verification failed',
        message: err instanceof Error ? err.message : 'Unknown error',
        took_ms: Date.now() - startTime,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
