/**
 * Уровни логирования
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Цвета для уровней логирования (ANSI коды)
 */
const COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
};

const RESET = '\x1b[0m';

/**
 * Форматирование timestamp
 * @returns отформатированная строка времени
 */
const formatTimestamp = (): string => {
  const now = new Date();
  return now.toISOString();
};

/**
 * Форматирование данных для вывода
 * @param data - дополнительные данные
 * @returns отформатированная строка
 */
const formatData = (data?: unknown): string => {
  if (data === undefined) return '';
  
  try {
    if (typeof data === 'object') {
      return '\n' + JSON.stringify(data, null, 2);
    }
    return String(data);
  } catch {
    return String(data);
  }
};

/**
 * Логирование сообщения
 * @param level - уровень логирования
 * @param message - сообщение
 * @param data - дополнительные данные (опционально)
 */
export const log = (level: LogLevel, message: string, data?: unknown): void => {
  const timestamp = formatTimestamp();
  const color = COLORS[level];
  const levelStr = level.toUpperCase().padEnd(5);
  const dataStr = formatData(data);
  
  console.log(`${color}[${timestamp}] ${levelStr}${RESET} ${message}${dataStr}`);
};

/**
 * Логирование debug
 */
export const debug = (message: string, data?: unknown): void => {
  log('debug', message, data);
};

/**
 * Логирование info
 */
export const info = (message: string, data?: unknown): void => {
  log('info', message, data);
};

/**
 * Логирование warn
 */
export const warn = (message: string, data?: unknown): void => {
  log('warn', message, data);
};

/**
 * Логирование error
 */
export const error = (message: string, data?: unknown): void => {
  log('error', message, data);
};

/**
 * Логгер как объект для удобства импорта
 */
export const logger = {
  debug,
  info,
  warn,
  error,
  log,
};
