/**
 * Сервис 3D-туров университетов
 */

import { query, queryOne } from '../../lib/db.ts';
import { getCacheManager } from './cache.service.ts';
import { getTourSourceSelector } from './tour-source-selector.service.ts';
import { TourValidator } from '../validators/tour.validator.ts';
import type { 
  UniversityThreeDTour, 
  ThreeDTourProvider,
  ThreeDTourSource 
} from '../types/university.ts';

/**
 * Ответ API для 3D-тура
 */
export interface TourApiResponse {
  id: string;
  name: string;
  available_sources: ThreeDTourProvider[];
  primary_source: ThreeDTourProvider | null;
  selected_source: {
    source: ThreeDTourProvider | null;
    data: ThreeDTourSource | null;
  };
  tour_data: UniversityThreeDTour | null;
  fallback_chain: ThreeDTourProvider[];
  last_updated: Date | null;
}

/**
 * Сервис для работы с 3D-турами
 */
export class TourService {
  private cache = getCacheManager();
  private selector = getTourSourceSelector();

  /**
   * Получить 3D-тур университета по ID
   */
  async getTourById(universityId: string): Promise<TourApiResponse | null> {
    // Проверить кэш
    const cacheKey = `3d_tour:${universityId}`;
    const cached = await this.cache.get<TourApiResponse>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Запрос в БД
    const uni = await queryOne<{
      id: string;
      name: string;
      '3d_tour': UniversityThreeDTour | null;
    }>(
      `SELECT id, name, "3d_tour" FROM universities WHERE id = $1`,
      [universityId]
    );

    if (!uni) {
      return null;
    }

    const tourData = uni['3d_tour'];

    // Если тура нет
    if (!tourData || !tourData.available_sources?.length) {
      return {
        id: uni.id,
        name: uni.name,
        available_sources: [],
        primary_source: null,
        selected_source: { source: null, data: null },
        tour_data: null,
        fallback_chain: [],
        last_updated: null,
      };
    }

    // Выбрать лучший источник
    const bestSource = this.selector.selectBestSource(tourData);
    const fallbackChain = this.selector.getFallbackChain(tourData);

    const response: TourApiResponse = {
      id: uni.id,
      name: uni.name,
      available_sources: tourData.available_sources,
      primary_source: tourData.primary_source || null,
      selected_source: bestSource,
      tour_data: tourData,
      fallback_chain: fallbackChain,
      last_updated: tourData.last_updated || null,
    };

    // Кэшировать на 24 часа
    await this.cache.set(cacheKey, response, 24 * 60 * 60);

    return response;
  }

  /**
   * Обновить 3D-тур университета
   */
  async updateTour(
    universityId: string, 
    tourData: Partial<UniversityThreeDTour>
  ): Promise<boolean> {
    // Валидация
    const validation = TourValidator.validate3DTour(tourData as UniversityThreeDTour);
    if (!validation.valid) {
      throw new Error(`Invalid tour data: ${validation.errors.join(', ')}`);
    }

    // Санитизация
    const sanitized = TourValidator.sanitizeTour(tourData);

    // Обновить в БД
    await query(
      `UPDATE universities SET "3d_tour" = $1, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(sanitized), universityId]
    );

    // Инвалидировать кэш
    await this.cache.invalidate(`3d_tour:${universityId}`);

    return true;
  }

  /**
   * Добавить источник тура
   */
  async addTourSource(
    universityId: string,
    source: ThreeDTourProvider,
    data: Omit<ThreeDTourSource, 'source'>
  ): Promise<boolean> {
    // Получить текущий тур
    const uni = await queryOne<{ '3d_tour': UniversityThreeDTour | null }>(
      `SELECT "3d_tour" FROM universities WHERE id = $1`,
      [universityId]
    );

    const currentTour = uni?.['3d_tour'] || { available_sources: [] };

    // Ключ для источника
    const keyMap: Record<ThreeDTourProvider, keyof UniversityThreeDTour> = {
      google: 'google_maps',
      yandex: 'yandex_panorama',
      '2gis': 'twogis',
    };

    const key = keyMap[source];

    // Добавить источник
    const sourceData: ThreeDTourSource = {
      source,
      ...data,
    };

    // Обновить тур
    const updatedTour: UniversityThreeDTour = {
      ...currentTour,
      [key]: sourceData,
      available_sources: [...new Set([...(currentTour.available_sources || []), source])],
      last_updated: new Date(),
    };

    // Установить primary_source если это первый
    if (!updatedTour.primary_source) {
      updatedTour.primary_source = source;
    }

    return this.updateTour(universityId, updatedTour);
  }

  /**
   * Проверить доступность туров для университета
   */
  async checkTourAvailability(universityId: string): Promise<{
    hasTour: boolean;
    sources: ThreeDTourProvider[];
  }> {
    const tour = await this.getTourById(universityId);
    
    return {
      hasTour: (tour?.available_sources?.length ?? 0) > 0,
      sources: tour?.available_sources || [],
    };
  }

  /**
   * Получить список университетов с турами
   */
  async getUniversitiesWithTours(limit: number = 50): Promise<Array<{
    id: string;
    name: string;
    sources: ThreeDTourProvider[];
  }>> {
    const universities = await query<{
      id: string;
      name: string;
      '3d_tour': UniversityThreeDTour | null;
    }>(
      `SELECT id, name, "3d_tour" 
       FROM universities 
       WHERE "3d_tour" IS NOT NULL 
         AND jsonb_array_length("3d_tour"->'available_sources') > 0
       ORDER BY name
       LIMIT $1`,
      [limit]
    );

    return universities.map(uni => ({
      id: uni.id,
      name: uni.name,
      sources: uni['3d_tour']?.available_sources || [],
    }));
  }
}

// Singleton instance
let tourServiceInstance: TourService | null = null;

/**
 * Получить экземпляр сервиса туров
 */
export const getTourService = (): TourService => {
  if (!tourServiceInstance) {
    tourServiceInstance = new TourService();
  }
  return tourServiceInstance;
};
