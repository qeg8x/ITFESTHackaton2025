import { logger } from './logger.ts';

/**
 * Конфигурация Ollama
 */
const OLLAMA_CONFIG = {
  baseUrl: Deno.env.get('OLLAMA_URL') ?? 'http://localhost:11434',
  model: Deno.env.get('OLLAMA_MODEL') ?? 'deepseek-v3.1:671b-cloud',
  timeout: 120000, // 120 секунд для генерации (cloud модели могут быть медленнее)
  maxRetries: 2,
};

/**
 * Ответ от Ollama API
 */
interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

/**
 * Ошибка Ollama
 */
export class OllamaError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'OllamaError';
  }
}

/**
 * Проверить доступность Ollama
 * @returns true если Ollama доступна
 */
export const checkOllamaHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Получить список доступных моделей
 * @returns список моделей
 */
export const getAvailableModels = async (): Promise<string[]> => {
  try {
    const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/tags`);
    
    if (!response.ok) {
      throw new OllamaError('Failed to get models', response.status);
    }

    const data = await response.json();
    return data.models?.map((m: { name: string }) => m.name) ?? [];
  } catch (err) {
    logger.error('Failed to get Ollama models', err);
    throw err;
  }
};

/**
 * Вызвать Ollama LLM для генерации текста
 * @param prompt - промпт для модели
 * @param options - дополнительные опции
 * @returns сгенерированный текст
 */
export const callOllama = async (
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    system?: string;
  } = {}
): Promise<string> => {
  const { model = OLLAMA_CONFIG.model, temperature = 0.1, system } = options;

  logger.info('Calling Ollama', {
    model,
    promptLength: prompt.length,
    hasSystem: !!system,
  });

  const startTime = Date.now();

  for (let attempt = 1; attempt <= OLLAMA_CONFIG.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        OLLAMA_CONFIG.timeout
      );

      const requestBody: Record<string, unknown> = {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
          num_predict: 4096,
        },
      };

      if (system) {
        requestBody.system = system;
      }

      const response = await fetch(`${OLLAMA_CONFIG.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new OllamaError(
          `Ollama API error: ${response.status}`,
          response.status,
          errorText
        );
      }

      const data: OllamaResponse = await response.json();

      const duration = Date.now() - startTime;
      logger.info('Ollama response received', {
        model: data.model,
        responseLength: data.response.length,
        duration_ms: duration,
        eval_count: data.eval_count,
      });

      return data.response;
    } catch (err) {
      const isLastAttempt = attempt === OLLAMA_CONFIG.maxRetries;

      if (err instanceof Error && err.name === 'AbortError') {
        logger.error('Ollama request timeout', { attempt, timeout: OLLAMA_CONFIG.timeout });
        
        if (isLastAttempt) {
          throw new OllamaError('Ollama request timed out after all retries');
        }
      } else if (err instanceof OllamaError) {
        logger.error('Ollama API error', { attempt, error: err.message });
        
        if (isLastAttempt) {
          throw err;
        }
      } else {
        logger.error('Ollama request failed', { attempt, error: err });
        
        if (isLastAttempt) {
          throw new OllamaError(
            `Failed to call Ollama: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      }

      // Ждем перед retry
      const waitTime = attempt * 2000;
      logger.info(`Retrying Ollama in ${waitTime}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new OllamaError('Failed to call Ollama after all retries');
};

/**
 * Alias для callOllama для генерации текста
 */
export const callOllamaForText = callOllama;

/**
 * Вызвать Ollama для извлечения JSON
 * @param prompt - промпт (может включать схему)
 * @param schema - описание ожидаемой JSON схемы (опционально)
 * @returns распарсенный JSON
 */
export const callOllamaForJson = async <T>(
  prompt: string,
  schema?: string
): Promise<T> => {
  const schemaHint = schema 
    ? `\n\nExpected JSON Schema:\n${schema}` 
    : '';

  const systemPrompt = `You are a data extraction assistant. Extract information from the provided text and return it as valid JSON.
Only output valid JSON, nothing else. Do not include any explanations, markdown formatting, or code blocks - just pure JSON.${schemaHint}`;

  const response = await callOllama(prompt, {
    system: systemPrompt,
    temperature: 0.1,
  });

  // Попытка извлечь JSON из ответа
  let jsonStr = response.trim();

  // Убрать markdown code blocks если есть
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  try {
    return JSON.parse(jsonStr) as T;
  } catch (parseErr) {
    logger.error('Failed to parse Ollama JSON response', {
      response: jsonStr.substring(0, 500),
      error: parseErr,
    });
    throw new OllamaError('Failed to parse JSON from Ollama response');
  }
};
