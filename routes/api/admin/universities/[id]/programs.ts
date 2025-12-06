import { Handlers } from '$fresh/server.ts';
import { logger } from '../../../../../src/utils/logger.ts';
import {
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from '../../../../../src/services/admin.service.ts';
import type { Program } from '../../../../../src/types/university.ts';

/**
 * Проверить admin key
 */
const validateAdminKey = (req: Request): boolean => {
  const adminKey = req.headers.get('X-Admin-Key') ?? req.headers.get('admin-key');
  const expectedKey = Deno.env.get('ADMIN_KEY') ?? 'dev-admin-key';
  return adminKey === expectedKey;
};

/**
 * Admin Programs CRUD
 * GET    /api/admin/universities/[id]/programs - список программ
 * POST   /api/admin/universities/[id]/programs - создать программу
 * PUT    /api/admin/universities/[id]/programs?program_id=X - обновить
 * DELETE /api/admin/universities/[id]/programs?program_id=X - удалить
 */
export const handler: Handlers = {
  /**
   * GET - Список программ университета
   */
  async GET(req, ctx) {
    const { id } = ctx.params;
    logger.info('API: GET /api/admin/universities/[id]/programs', { id });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const programs = await getPrograms(id);

      return new Response(JSON.stringify({
        success: true,
        university_id: id,
        programs,
        count: programs.length,
      }, null, 2), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      logger.error('Failed to get programs', err);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },

  /**
   * POST - Создать программу
   */
  async POST(req, ctx) {
    const { id } = ctx.params;
    logger.info('API: POST /api/admin/universities/[id]/programs', { id });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: { program: Partial<Program> };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body.program) {
      return new Response(JSON.stringify({ 
        error: 'Missing program object',
        expected: '{ "program": { "name": "...", "degree_level": "Bachelor", ... } }',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await createProgram(id, body.program);

    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 201 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * PUT - Обновить программу
   */
  async PUT(req, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const programId = url.searchParams.get('program_id');

    logger.info('API: PUT /api/admin/universities/[id]/programs', { id, programId });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!programId) {
      return new Response(JSON.stringify({ error: 'program_id query param is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let body: { program: Partial<Program> };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!body.program) {
      return new Response(JSON.stringify({ 
        error: 'Missing program object',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await updateProgram(id, programId, body.program);

    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    });
  },

  /**
   * DELETE - Удалить программу
   */
  async DELETE(req, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const programId = url.searchParams.get('program_id');

    logger.info('API: DELETE /api/admin/universities/[id]/programs', { id, programId });

    if (!validateAdminKey(req)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!programId) {
      return new Response(JSON.stringify({ error: 'program_id query param is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await deleteProgram(id, programId);

    return new Response(JSON.stringify(result, null, 2), {
      status: result.success ? 200 : 404,
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
