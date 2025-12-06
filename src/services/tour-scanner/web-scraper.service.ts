/**
 * Сервис для скрейпинга сайтов университетов
 */

/**
 * Извлечённая ссылка
 */
interface ExtractedLink {
  href: string;
  text: string;
  type: 'link' | 'iframe';
}

/**
 * Ключевые слова для поиска туров
 */
const TOUR_KEYWORDS = [
  'tour', 'campus', 'panorama', '3d', 'virtual', 'map', 'street',
  'тур', 'кампус', 'панорама', 'карта', 'виртуальный',
  'экскурсия', 'прогулка',
];

/**
 * Сервис для скрейпинга веб-страниц
 */
export class WebScraperService {
  private lastRequestTime = new Map<string, number>();
  private readonly minDelay = 1500; // 1.5 сек между запросами к одному домену

  /**
   * Загрузить HTML страницы
   */
  async fetchPage(url: string): Promise<string> {
    const domain = new URL(url).hostname;

    // Rate limiting
    const lastTime = this.lastRequestTime.get(domain) || 0;
    const elapsed = Date.now() - lastTime;
    if (elapsed < this.minDelay) {
      await new Promise(resolve => setTimeout(resolve, this.minDelay - elapsed));
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      this.lastRequestTime.set(domain, Date.now());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.text();
    } catch (error) {
      console.error(`Failed to fetch ${url}:`, error);
      throw error;
    }
  }

  /**
   * Извлечь все ссылки из HTML
   */
  extractLinks(html: string): ExtractedLink[] {
    const links: ExtractedLink[] = [];

    // Извлечь <a> теги
    const linkRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      links.push({
        href: match[1],
        text: match[2].trim(),
        type: 'link',
      });
    }

    // Извлечь <iframe> теги
    const iframeRegex = /<iframe\s+(?:[^>]*?\s+)?src=["']([^"']+)["'][^>]*>/gi;
    while ((match = iframeRegex.exec(html)) !== null) {
      links.push({
        href: match[1],
        text: '',
        type: 'iframe',
      });
    }

    return links;
  }

  /**
   * Найти ссылки, потенциально связанные с 3D-турами
   */
  findTourLinks(html: string): ExtractedLink[] {
    const allLinks = this.extractLinks(html);
    const tourLinks: ExtractedLink[] = [];

    for (const link of allLinks) {
      const text = link.text.toLowerCase();
      const href = link.href.toLowerCase();

      // Проверить ключевые слова
      const hasKeyword = TOUR_KEYWORDS.some(kw => 
        text.includes(kw) || href.includes(kw)
      );

      // Проверить домены карт
      const isMapDomain = 
        href.includes('google.com/maps') ||
        href.includes('maps.google') ||
        href.includes('yandex.com/maps') ||
        href.includes('yandex.kz/maps') ||
        href.includes('yandex.ru/maps') ||
        href.includes('2gis.kz') ||
        href.includes('2gis.com');

      if (hasKeyword || isMapDomain) {
        tourLinks.push(link);
      }
    }

    return tourLinks;
  }

  /**
   * Определить тип источника по URL
   */
  detectSourceType(url: string): 'google' | 'yandex' | '2gis' | 'other' {
    const lower = url.toLowerCase();

    if (lower.includes('google.com') || lower.includes('goo.gl')) {
      return 'google';
    }
    if (lower.includes('yandex.')) {
      return 'yandex';
    }
    if (lower.includes('2gis.')) {
      return '2gis';
    }

    return 'other';
  }

  /**
   * Найти все ссылки на карты в HTML
   */
  findMapUrls(html: string): Array<{ url: string; source: 'google' | 'yandex' | '2gis' | 'other' }> {
    const tourLinks = this.findTourLinks(html);
    const mapUrls: Array<{ url: string; source: 'google' | 'yandex' | '2gis' | 'other' }> = [];

    for (const link of tourLinks) {
      const source = this.detectSourceType(link.href);
      if (source !== 'other') {
        mapUrls.push({
          url: link.href,
          source,
        });
      }
    }

    return mapUrls;
  }
}

// Singleton instance
let scraperInstance: WebScraperService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getWebScraperService = (): WebScraperService => {
  if (!scraperInstance) {
    scraperInstance = new WebScraperService();
  }
  return scraperInstance;
};
