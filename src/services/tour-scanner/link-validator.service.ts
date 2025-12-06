/**
 * Сервис валидации ссылок на 3D-туры
 */

import type { ThreeDTourProvider } from '../../types/university.ts';
import { TourValidator } from '../../validators/tour.validator.ts';

/**
 * Результат валидации ссылки
 */
export interface LinkValidationResult {
  valid: boolean;
  url: string;
  source: ThreeDTourProvider | 'other';
  latitude?: number;
  longitude?: number;
  error?: string;
}

/**
 * Сервис для валидации ссылок
 */
export class LinkValidatorService {
  /**
   * Валидировать одну ссылку
   */
  async validateLink(link: {
    url: string;
    source: ThreeDTourProvider | 'other';
    latitude?: number;
    longitude?: number;
  }): Promise<LinkValidationResult> {
    const result: LinkValidationResult = {
      valid: false,
      url: link.url,
      source: link.source,
      latitude: link.latitude,
      longitude: link.longitude,
    };

    // Валидация URL формата
    if (!TourValidator.validateUrl(link.url)) {
      result.error = 'Invalid URL format';
      return result;
    }

    // Валидация координат если есть
    if (link.latitude !== undefined && link.longitude !== undefined) {
      if (!TourValidator.validateCoordinates(link.latitude, link.longitude)) {
        result.error = 'Invalid coordinates';
        return result;
      }
    }

    // Проверка доступности URL
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(link.url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; TourBot/1.0)',
        },
      });

      clearTimeout(timeoutId);

      // 403 OK для CORS protection на картах
      result.valid = response.ok || response.status === 403 || response.status === 302;
      
      if (!result.valid) {
        result.error = `HTTP ${response.status}`;
      }
    } catch (error) {
      result.error = error instanceof Error ? error.message : 'URL check failed';
    }

    return result;
  }

  /**
   * Валидировать массив ссылок
   */
  async validateLinks(links: Array<{
    url: string;
    source: ThreeDTourProvider | 'other';
    latitude?: number;
    longitude?: number;
  }>): Promise<LinkValidationResult[]> {
    const results: LinkValidationResult[] = [];

    for (const link of links) {
      const result = await this.validateLink(link);
      results.push(result);

      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    return results;
  }

  /**
   * Получить только валидные ссылки
   */
  async filterValidLinks(links: Array<{
    url: string;
    source: ThreeDTourProvider | 'other';
    latitude?: number;
    longitude?: number;
  }>): Promise<LinkValidationResult[]> {
    const results = await this.validateLinks(links);
    return results.filter(r => r.valid);
  }
}

// Singleton instance
let validatorInstance: LinkValidatorService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getLinkValidatorService = (): LinkValidatorService => {
  if (!validatorInstance) {
    validatorInstance = new LinkValidatorService();
  }
  return validatorInstance;
};
