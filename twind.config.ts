import type { Options } from '$fresh/plugins/twind.ts';

/**
 * Twind (Tailwind-in-JS) конфигурация для Fresh
 * Тёмная технологическая тема
 * @see https://twind.dev/
 */
export default {
  selfURL: import.meta.url,
  theme: {
    extend: {
      // Тёмная технологическая палитра
      colors: {
        // Основной фон и поверхности
        dark: {
          950: '#030712',
          900: '#0a0f1a',
          800: '#111827',
          700: '#1a2332',
          600: '#243044',
          500: '#374151',
        },
        // Циановый акцент (tech feel)
        cyber: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Фиолетовый акцент
        neon: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Зелёный для успеха
        matrix: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
        },
        // Legacy primary (для совместимости)
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
      
      // Тени для тёмной темы
      boxShadow: {
        'glow-sm': '0 0 10px rgba(6, 182, 212, 0.15)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.2)',
        'glow-lg': '0 0 40px rgba(6, 182, 212, 0.25)',
        'glow-neon': '0 0 20px rgba(168, 85, 247, 0.3)',
        'card-dark': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'elevated-dark': '0 10px 40px rgba(0, 0, 0, 0.5)',
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 0 0 1px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 10px 40px -10px rgba(0, 0, 0, 0.15)',
      },
      
      // Шрифты
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
} satisfies Options;
