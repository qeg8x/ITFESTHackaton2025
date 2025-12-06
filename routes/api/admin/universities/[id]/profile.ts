import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../../../src/utils/logger.ts';
import {
  getProfileForEdit,
  updateUniversityProfile,
  patchUniversityProfile,
} from '../../../../../src/services/admin.service.ts';

/**
 * Проверить admin key
 */
const validateAdminKey = (req: Request): boolean => {
  const adminKey = req.headers.get('X-Admin-Key') ?? req.headers.get('admin-key');
  const expectedKey = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';
  return adminKey === expectedKey;
};

/**
 * Admin University Profile
 * GET   /api/admin/universities/[id]/profile - получить профиль
 * PUT   /api/admin/universities/[id]/profile - обновить целиком
 * PATCH /api/admin/universities/[id]/profile - обновить часть
 */
export const handler: Handlers = {
  /**
   * GET - Получить полный профиль
   */
  async GET(req, ctx) {
    const { id } = ctx.params;
    logger.info('API: GET /api/admin/universities/[id]/profile', { id });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const profile = await getProfileForEdit(id);

      if (!profile) {
        return new Response(JSON.stringify({ error: 'University not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        profile,
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      logger.error('Failed to get profile', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * PUT - Обновить профиль целиком
   */
  async PUT(req, ctx) {
    const { id } = ctx.params;
    logger.info('API: PUT /api/admin/universities/[id]/profile', { id });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: { university: Record<string, unknown> };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body.university) {
      return new Response(JSON.stringify({ 
        error: 'Missing university object',
        expected: '{ "university": { ... } }',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await updateUniversityProfile(id, body.university);

    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * PATCH - Обновить часть профиля по пути
   */
  async PATCH(req, ctx) {
    const { id } = ctx.params;
    logger.info('API: PATCH /api/admin/universities/[id]/profile', { id });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: { path: string; value: unknown };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body.path) {
      return new Response(JSON.stringify({ 
        error: 'Missing path',
        expected: '{ "path": "programs[0].tuition.amount", "value": 5000 }',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await patchUniversityProfile(id, body.path, body.value);

    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
