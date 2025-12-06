/**
 * Сервис кэширования для 3D-туров и других данных
 * In-memory кэш с TTL
 */

interface CacheItem<T> {
  data: T;
  expires: number;
}

/**
 * In-memory кэш менеджер с TTL
 */
export class CacheManager {
  private cache = new Map<string, CacheItem<unknown>>();
  private cleanupInterval: number | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Периодическая очистка устаревших записей
    if (typeof Deno !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
    }
  }

  /**
   * Получить значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Установить значение в кэш
   * @param key - ключ
   * @param data - данные
   * @param ttlSeconds - время жизни в секундах (по умолчанию 24 часа)
   */
  async set<T>(key: string, data: T, ttlSeconds: number = 86400): Promise<void> {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Инвалидировать ключ
   */
  async invalidate(key: string): Promise<void> {
    this.cache.delete(key);
  }

  /**
   * Инвалидировать по паттерну
   */
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    let count = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }

    return count;
  }

  /**
   * Очистить весь кэш
   */
  async clear(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Получить статистику кэша
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Очистить устаревшие записи
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Уничтожить менеджер
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Singleton instance
let cacheInstance: CacheManager | null = null;

/**
 * Получить экземпляр кэш менеджера
 */
export const getCacheManager = (): CacheManager => {
  if (!cacheInstance) {
    cacheInstance = new CacheManager();
  }
  return cacheInstance;
};
