/**
 * Tailwind CSS конфигурация для Fresh
 * Тёмная технологическая тема
 * @type {import('tailwindcss').Config}
 */
export default {
  content: [
    './routes/**/*.{tsx,ts}',
    './islands/**/*.{tsx,ts}',
    './components/**/*.{tsx,ts}',
    './src/**/*.{tsx,ts}',
  ],
  
  theme: {
    extend: {
      // Тёмная технологическая палитра
      colors: {
        // Основной фон и поверхности
        dark: {
          950: '#030712',  // Самый тёмный фон
          900: '#0a0f1a',  // Основной фон
          800: '#111827',  // Карточки
          700: '#1a2332',  // Hover состояния
          600: '#243044',  // Бордеры, разделители
          500: '#374151',  // Вторичные элементы
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
      },
      
      // Шрифты
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      
      // Тени для тёмной темы
      boxShadow: {
        'glow-sm': '0 0 10px rgba(6, 182, 212, 0.15)',
        'glow': '0 0 20px rgba(6, 182, 212, 0.2)',
        'glow-lg': '0 0 40px rgba(6, 182, 212, 0.25)',
        'glow-neon': '0 0 20px rgba(168, 85, 247, 0.3)',
        'card-dark': '0 4px 20px rgba(0, 0, 0, 0.4)',
        'elevated-dark': '0 10px 40px rgba(0, 0, 0, 0.5)',
      },
      
      // Border radius
      borderRadius: {
        '4xl': '2rem',
      },
      
      // Анимации
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(6, 182, 212, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' },
        },
      },
      
      // Spacing
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      // Градиенты для фона
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)',
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
    
    // Responsive breakpoints
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
  
  plugins: [],
};
