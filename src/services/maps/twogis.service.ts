/**
 * Сервис для работы с 2GIS Картами
 */

/**
 * Результат поиска
 */
interface SearchResult {
  url: string;
  lat: number;
  lng: number;
  address: string;
  name: string;
}

/**
 * Сервис 2GIS
 */
export class TwoGisService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('TWOGIS_API_KEY') || '';
  }

  /**
   * Сформировать URL карты по координатам
   */
  getMapUrl(lat: number, lng: number, zoom: number = 17): string {
    return `https://2gis.kz/geo/${lng},${lat}?m=${lng},${lat}/${zoom}`;
  }

  /**
   * Сформировать embed URL для iframe
   */
  getEmbedUrl(lat: number, lng: number): string {
    return `https://widgets.2gis.com/widget?type=firmsonmap&options=%7B%22pos%22%3A%7B%22lat%22%3A${lat}%2C%22lon%22%3A${lng}%2C%22zoom%22%3A17%7D%7D`;
  }

  /**
   * Проверить доступность карты для координат
   */
  async checkAvailability(lat: number, lng: number): Promise<boolean> {
    try {
      const url = this.getMapUrl(lat, lng);
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok || response.status === 403;
    } catch {
      return false;
    }
  }

  /**
   * Поиск по адресу/названию через 2GIS API
   */
  async searchAddress(query: string): Promise<SearchResult | null> {
    if (!this.apiKey) {
      console.warn('2GIS API key not set, search unavailable');
      return null;
    }

    try {
      const url = `https://catalog.api.2gis.com/3.0/items?q=${encodeURIComponent(query)}&key=${this.apiKey}&fields=items.point,items.full_name&page_size=1`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.result?.items && data.result.items.length > 0) {
        const item = data.result.items[0];
        const lat = item.point?.lat;
        const lng = item.point?.lon;

        if (lat && lng) {
          return {
            url: this.getMapUrl(lat, lng),
            lat,
            lng,
            address: item.full_name || item.name,
            name: item.name,
          };
        }
      }
      return null;
    } catch (error) {
      console.error('2GIS search error:', error);
      return null;
    }
  }

  /**
   * Извлечь координаты из 2GIS URL
   */
  extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    try {
      // Формат: https://2gis.kz/geo/76.945669,43.238949
      const geoMatch = url.match(/\/geo\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (geoMatch) {
        return {
          lng: parseFloat(geoMatch[1]),
          lat: parseFloat(geoMatch[2]),
        };
      }

      // Формат: m=lng,lat/zoom
      const mMatch = url.match(/m=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (mMatch) {
        return {
          lng: parseFloat(mMatch[1]),
          lat: parseFloat(mMatch[2]),
        };
      }

      // Формат center
      const centerMatch = url.match(/center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (centerMatch) {
        return {
          lng: parseFloat(centerMatch[1]),
          lat: parseFloat(centerMatch[2]),
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let twoGisInstance: TwoGisService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getTwoGisService = (): TwoGisService => {
  if (!twoGisInstance) {
    twoGisInstance = new TwoGisService();
  }
  return twoGisInstance;
};
