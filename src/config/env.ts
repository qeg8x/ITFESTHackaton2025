import { logger } from '../utils/logger.ts';

/**
 * Конфигурация окружения
 */
export interface EnvConfig {
  DATABASE_URL: string;
  DENO_ENV: 'development' | 'production' | 'test';
  OLLAMA_URL: string;
  PORT: number;
}

/**
 * Обязательные переменные окружения
 */
const REQUIRED_VARS = ['DATABASE_URL'] as const;

/**
 * Значения по умолчанию
 */
const DEFAULTS: Partial<Record<keyof EnvConfig, string>> = {
  DENO_ENV: 'development',
  OLLAMA_URL: 'http://localhost:11434',
  PORT: '8000',
};

/**
 * Получить переменную окружения или значение по умолчанию
 * @param key - имя переменной
 * @param defaultValue - значение по умолчанию
 * @returns значение переменной
 */
const getEnvVar = (key: string, defaultValue?: string): string | undefined => {
  return Deno.env.get(key) ?? defaultValue;
};

/**
 * Проверить наличие обязательных переменных
 * @throws Error если переменная отсутствует
 */
const validateRequiredVars = (): void => {
  const missing: string[] = [];
  
  for (const varName of REQUIRED_VARS) {
    if (!getEnvVar(varName)) {
      missing.push(varName);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or environment settings.'
    );
  }
};

/**
 * Загрузить и валидировать переменные окружения
 * @returns конфигурация окружения
 */
export const loadEnv = (): EnvConfig => {
  logger.info('Loading environment configuration...');
  
  try {
    validateRequiredVars();
    
    const config: EnvConfig = {
      DATABASE_URL: getEnvVar('DATABASE_URL')!,
      DENO_ENV: (getEnvVar('DENO_ENV', DEFAULTS.DENO_ENV) as EnvConfig['DENO_ENV']),
      OLLAMA_URL: getEnvVar('OLLAMA_URL', DEFAULTS.OLLAMA_URL)!,
      PORT: parseInt(getEnvVar('PORT', DEFAULTS.PORT)!, 10),
    };
    
    logger.info('Environment configuration loaded', {
      DENO_ENV: config.DENO_ENV,
      PORT: config.PORT,
      OLLAMA_URL: config.OLLAMA_URL,
      DATABASE_URL: maskConnectionString(config.DATABASE_URL),
    });
    
    return config;
  } catch (err) {
    logger.error('Failed to load environment configuration', err);
    throw err;
  }
};

/**
 * Маскировать пароль в connection string
 * @param url - connection string
 * @returns замаскированная строка
 */
const maskConnectionString = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return url.replace(/:[^:@]+@/, ':****@');
  }
};

/**
 * Проверить является ли окружение development
 */
export const isDevelopment = (): boolean => {
  return getEnvVar('DENO_ENV', 'development') === 'development';
};

/**
 * Проверить является ли окружение production
 */
export const isProduction = (): boolean => {
  return getEnvVar('DENO_ENV') === 'production';
};

/**
 * Получить DATABASE_URL напрямую
 */
export const getDatabaseUrl = (): string => {
  const url = getEnvVar('DATABASE_URL');
  if (!url) {
    throw new Error('DATABASE_URL is not set');
  }
  return url;
};
