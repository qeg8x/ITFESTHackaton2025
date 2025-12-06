import { Handlers } from '$fresh/server.ts';

/**
 * Редирект /universities на главную страницу
 */
export const handler: Handlers = {
  GET() {
    return new Response(null, {
      status: 307,
      headers: { Location: '/' },
    });
  },
};
