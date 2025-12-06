/**
 * API Endpoint: GET /api/universities/:id/3d-tour
 * Получить данные 3D-тура университета
 */

import { Handlers } from '$fresh/server.ts';
import { getTourService } from '../../../../src/services/tour.service.ts';

export const handler: Handlers = {
  /**
   * GET /api/universities/:id/3d-tour
   * Получить 3D-тур университета
   */
  async GET(_req, ctx) {
    const universityId = ctx.params.id;

    if (!universityId) {
      return new Response(
        JSON.stringify({ error: 'University ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    try {
      const tourService = getTourService();
      const tour = await tourService.getTourById(universityId);

      if (!tour) {
        return new Response(
          JSON.stringify({ error: 'University not found', id: universityId }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Проверить есть ли доступные источники
      if (!tour.available_sources || tour.available_sources.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No 3D tour available for this university',
            id: universityId,
            name: tour.name,
          }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(tour),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=3600', // 1 час
          } 
        }
      );
    } catch (error) {
      console.error('Error fetching 3D tour:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};
