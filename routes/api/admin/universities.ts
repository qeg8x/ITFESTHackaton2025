import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../src/utils/logger.ts';
import {
  createUniversity,
  deleteUniversity,
  listUniversitiesForAdmin,
} from '../../../src/services/admin.service.ts';
import { requireAdmin, unauthorizedResponse } from '../../../src/middleware/auth.ts';
import { createAuditLogger } from '../../../src/services/audit.service.ts';

/**
 * Admin Universities CRUD
 * GET  /api/admin/universities - список
 * POST /api/admin/universities - создать
 */
export const handler: Handlers = {
  /**
   * GET - Список университетов с полными данными
   */
  async GET(req) {
    logger.info('API: GET /api/admin/universities');

    // Аутентификация
    const auth = requireAdmin(req);
    if (!auth.valid) {
      return unauthorizedResponse(auth.error);
    }

    const audit = createAuditLogger(req, auth.adminKey, auth.adminInfo?.name);
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);
    const search = url.searchParams.get('search') ?? undefined;

    try {
      const result = await listUniversitiesForAdmin({ limit, offset, search });
      
      await audit.success('view_data', 'universities', undefined, { limit, offset, search });

      return new Response(JSON.stringify({
        data: result.data,
        pagination: { limit, offset, total: result.total },
        admin_action_logged: true,
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      logger.error('Failed to list universities', err);
      await audit.failure('view_data', 'universities', String(err));
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * POST - Создать университет
   */
  async POST(req) {
    logger.info('API: POST /api/admin/universities');

    // Аутентификация
    const auth = requireAdmin(req);
    if (!auth.valid) {
      return unauthorizedResponse(auth.error);
    }

    const audit = createAuditLogger(req, auth.adminKey, auth.adminInfo?.name);

    let body: {
      name: string;
      name_en?: string;
      country: string;
      city: string;
      website_url: string;
      description?: string;
    };

    try {
      body = await req.json();
    } catch {
      await audit.failure('create_university', 'university', 'Invalid JSON');
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Валидация обязательных полей
    if (!body.name || !body.country || !body.city || !body.website_url) {
      await audit.failure('create_university', 'university', 'Missing required fields');
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['name', 'country', 'city', 'website_url'],
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await createUniversity(body);

    if (result.success) {
      const newId = (result.data as { id?: string })?.id;
      await audit.success('create_university', 'university', newId, { name: body.name });
    } else {
      await audit.failure('create_university', 'university', result.message);
    }

    return new Response(JSON.stringify({
      ...result,
      admin_action_logged: true,
    }, null, 2), {
      status: result.success ? 201 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * DELETE - Удалить университет (по query param)
   */
  async DELETE(req) {
    logger.info('API: DELETE /api/admin/universities');

    // Аутентификация
    const auth = requireAdmin(req);
    if (!auth.valid) {
      return unauthorizedResponse(auth.error);
    }

    const audit = createAuditLogger(req, auth.adminKey, auth.adminInfo?.name);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      await audit.failure('delete_university', 'university', 'ID is required');
      return new Response(JSON.stringify({ error: 'ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await deleteUniversity(id);

    if (result.success) {
      await audit.success('delete_university', 'university', id);
    } else {
      await audit.failure('delete_university', 'university', result.message, id);
    }

    return new Response(JSON.stringify({
      ...result,
      admin_action_logged: true,
    }, null, 2), {
      status: result.success ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
