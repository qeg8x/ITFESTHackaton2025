/**
 * Сервис для работы с Google Maps Street View
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
 * Сервис Google Maps
 */
export class GoogleMapsService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || Deno.env.get('GOOGLE_MAPS_API_KEY') || '';
  }

  /**
   * Сформировать URL для Street View по координатам
   */
  getStreetViewUrl(
    lat: number,
    lng: number,
    heading: number = 0,
    pitch: number = 0
  ): string {
    return `https://www.google.com/maps/@${lat},${lng},3a,75y,${heading}h,${pitch}t/data=!3m6!1e1!3m4!1s0x0!2e0!7i13312!8i6656`;
  }

  /**
   * Сформировать embed URL для iframe
   */
  getEmbedUrl(lat: number, lng: number): string {
    if (this.apiKey) {
      return `https://www.google.com/maps/embed/v1/streetview?key=${this.apiKey}&location=${lat},${lng}&heading=0&pitch=0&fov=90`;
    }
    // Fallback без API ключа
    return `https://maps.google.com/maps?q=${lat},${lng}&t=&z=17&ie=UTF8&iwloc=&output=embed&layer=c`;
  }

  /**
   * Проверить доступность Street View для координат
   */
  async checkStreetViewAvailability(lat: number, lng: number): Promise<boolean> {
    if (!this.apiKey) {
      // Без API ключа просто проверяем доступность URL
      try {
        const url = this.getStreetViewUrl(lat, lng);
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok || response.status === 403;
      } catch {
        return false;
      }
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.status === 'OK';
    } catch {
      return false;
    }
  }

  /**
   * Геокодировать адрес
   */
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      console.warn('Google Maps API key not set, geocoding unavailable');
      return null;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          address: data.results[0].formatted_address,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Извлечь координаты из Google Maps URL
   */
  extractCoordsFromUrl(url: string): { lat: number; lng: number } | null {
    try {
      // Формат: https://www.google.com/maps/@43.238949,76.945669,3a,...
      const match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
        };
      }

      // Формат: ?q=lat,lng
      const qMatch = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (qMatch) {
        return {
          lat: parseFloat(qMatch[1]),
          lng: parseFloat(qMatch[2]),
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
let googleMapsInstance: GoogleMapsService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getGoogleMapsService = (): GoogleMapsService => {
  if (!googleMapsInstance) {
    googleMapsInstance = new GoogleMapsService();
  }
  return googleMapsInstance;
};
