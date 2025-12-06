/**
 * Сервис для работы с Яндекс Картами и Панорамами
 */

/**
 * Результат геокодирования
 */
interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

/**
 * Сервис Яндекс Карт
 */
export class YandexMapsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('YANDEX_MAPS_API_KEY') || '';
  }

  /**
   * Сформировать URL для Яндекс Панорам по координатам
   * ВАЖНО: Яндекс использует порядок lng,lat (долгота, широта)
   */
  getPanoramaUrl(lat: number, lng: number, zoom: number = 17): string {
    return `https://yandex.com/maps/?ll=${lng},${lat}&z=${zoom}&l=pano`;
  }

  /**
   * Сформировать embed URL для iframe
   */
  getEmbedUrl(lat: number, lng: number): string {
    return `https://yandex.com/map-widget/v1/?ll=${lng},${lat}&z=17&l=sat,skl,stv`;
  }

  /**
   * Проверить доступность панорамы для координат
   */
  async checkPanoramaAvailability(lat: number, lng: number): Promise<boolean> {
    try {
      const url = this.getPanoramaUrl(lat, lng);
      const response = await fetch(url, { method: 'HEAD' });
      // 403 OK для CORS protection
      return response.ok || response.status === 403;
    } catch {
      return false;
    }
  }

  /**
   * Геокодировать адрес через Яндекс Геокодер
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('Yandex Maps API key not set, using fallback');
      return null;
    }

    try {
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${this.apiKey}&geocode=${encodeURIComponent(address)}&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      const features = data.response?.GeoObjectCollection?.featureMember;
      if (features && features.length > 0) {
        const feature = features[0];
        const coords = feature.GeoObject.Point.pos.split(' ');
        return {
          lng: parseFloat(coords[0]),
          lat: parseFloat(coords[1]),
          address: feature.GeoObject.metaDataProperty.GeocoderMetaData.text,
        };
      }
      return null;
    } catch (error) {
      console.error('Yandex geocoding error:', error);
      return null;
    }
  }

  /**
   * Извлечь координаты из Yandex URL
   */
  extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    try {
      // Формат: https://yandex.com/maps/?ll=76.945669,43.238949&z=17
      const match = url.match(/ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2]),
        };
      }

      // Формат с точкой: pt=lng,lat
      const ptMatch = url.match(/pt=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (ptMatch) {
        return {
          lng: parseFloat(ptMatch[1]),
          lat: parseFloat(ptMatch[2]),
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let yandexMapsInstance: YandexMapsService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getYandexMapsService = (): YandexMapsService => {
  if (!yandexMapsInstance) {
    yandexMapsInstance = new YandexMapsService();
  }
  return yandexMapsInstance;
};
