import type { Options } from '$fresh/plugins/twind.ts';

/**
 * Twind (Tailwind-in-JS) конфигурация для Fresh
 * @see https://twind.dev/
 */
export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      // Кастомные цвета
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      
      // Тени
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
      },
      
      // Шрифты
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
} satisfies Options;
