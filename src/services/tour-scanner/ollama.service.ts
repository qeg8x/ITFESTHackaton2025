/**
 * Сервис для AI анализа через Ollama
 */

import type { ThreeDTourProvider } from '../../types/university.ts';

/**
 * Найденный тур
 */
export interface FoundTour {
  source: ThreeDTourProvider | 'other';
  url: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  confidence: number;
  reason: string;
}

/**
 * Результат AI анализа
 */
export interface TourAnalysisResult {
  found_tours: FoundTour[];
  best_candidate: {
    source: string;
    url: string;
    reason: string;
  } | null;
  analysis: string;
}

/**
 * Сервис для работы с Ollama AI
 */
export class OllamaService {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl || Deno.env.get('OLLAMA_URL') || 'http://localhost:11434';
    this.model = model || Deno.env.get('OLLAMA_MODEL') || 'llama2';
  }

  /**
   * Проверить доступность Ollama
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Анализировать HTML для поиска 3D-туров
   */
  async findTourLinks(html: string, universityName: string): Promise<TourAnalysisResult> {
    // Ограничить размер HTML для AI
    const truncatedHtml = html.slice(0, 15000);

    const prompt = `ЗАДАЧА: Найти ссылки на 3D-туры кампуса университета "${universityName}" в HTML содержимом.

HTML СОДЕРЖИМОЕ (первые 15000 символов):
${truncatedHtml}

ИЩЕШЬ СЛЕДУЮЩИЕ ТИПЫ ССЫЛОК:
1. Google Maps Street View:
   - URL содержит "google.com/maps" или "maps.google"
   - Может быть в формате iframe или обычной ссылки

2. Yandex Panoramas:
   - URL содержит "yandex.com/maps", "yandex.kz/maps", "yandex.ru/maps"
   - Параметр l=pano указывает на панораму

3. 2GIS Maps (для Казахстана):
   - URL содержит "2gis.kz" или "2gis.com"

ВАЖНО:
- Ищи ссылки в атрибутах href и src
- Обращай внимание на текст рядом с ссылками: "тур", "кампус", "панорама", "карта"
- Извлекай координаты из URL если они есть

ВЕРНИ ТОЛЬКО JSON (без markdown):
{
  "found_tours": [
    {
      "source": "google" | "yandex" | "2gis" | "other",
      "url": "полный URL",
      "latitude": число или null,
      "longitude": число или null,
      "address": "адрес если найден",
      "confidence": 100 | 90 | 75 | 50,
      "reason": "почему это тур кампуса"
    }
  ],
  "best_candidate": {
    "source": "лучший источник",
    "url": "URL лучшего тура",
    "reason": "почему это лучший вариант"
  },
  "analysis": "краткий анализ (1-2 предложения)"
}`;

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 2000,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.response;

      // Попытаться извлечь JSON из ответа
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            found_tours: parsed.found_tours || [],
            best_candidate: parsed.best_candidate || null,
            analysis: parsed.analysis || 'Анализ завершён',
          };
        } catch {
          console.warn('Failed to parse AI JSON response');
        }
      }

      return {
        found_tours: [],
        best_candidate: null,
        analysis: responseText.slice(0, 200),
      };
    } catch (error) {
      console.error('Ollama error:', error);
      return {
        found_tours: [],
        best_candidate: null,
        analysis: `Ошибка AI анализа: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Извлечь координаты из URL с помощью AI
   */
  async extractCoordinates(url: string): Promise<{ lat: number; lng: number } | null> {
    // Сначала попробуем regex
    const patterns = [
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // Google: @lat,lng
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // Yandex: ll=lng,lat
      /center=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // 2GIS: center=lng,lat
      /m=(-?\d+\.?\d*),(-?\d+\.?\d*)/,  // 2GIS: m=lng,lat
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const num1 = parseFloat(match[1]);
        const num2 = parseFloat(match[2]);

        // Определить что lat, а что lng
        if (url.includes('google')) {
          return { lat: num1, lng: num2 };
        } else {
          // Yandex и 2GIS используют lng,lat
          return { lat: num2, lng: num1 };
        }
      }
    }

    return null;
  }
}

// Singleton instance
let ollamaInstance: OllamaService | null = null;

/**
 * Получить экземпляр сервиса
 */
export const getOllamaService = (): OllamaService => {
  if (!ollamaInstance) {
    ollamaInstance = new OllamaService();
  }
  return ollamaInstance;
};
