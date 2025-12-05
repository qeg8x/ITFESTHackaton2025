import { ComponentChildren } from 'preact';

/**
 * Варианты цветов Badge
 */
type BadgeColor =
  | 'gray'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'red'
  | 'purple'
  | 'pink'
  | 'indigo'
  | 'cyan';

/**
 * Размеры Badge
 */
type BadgeSize = 'sm' | 'md' | 'lg';

/**
 * Props для Badge
 */
interface BadgeProps {
  /** Цвет */
  color?: BadgeColor;
  /** Размер */
  size?: BadgeSize;
  /** Вариант (filled или outline) */
  variant?: 'filled' | 'outline' | 'soft';
  /** Иконка слева */
  icon?: ComponentChildren;
  /** Точка-индикатор */
  dot?: boolean;
  /** Контент */
  children: ComponentChildren;
  /** CSS классы */
  class?: string;
}

/**
 * Стили цветов (filled)
 */
const colorStylesFilled: Record<BadgeColor, string> = {
  gray: 'bg-gray-500 text-white',
  blue: 'bg-blue-500 text-white',
  green: 'bg-green-500 text-white',
  yellow: 'bg-yellow-500 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
  pink: 'bg-pink-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  cyan: 'bg-cyan-500 text-white',
};

/**
 * Стили цветов (soft)
 */
const colorStylesSoft: Record<BadgeColor, string> = {
  gray: 'bg-gray-100 text-gray-700',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  pink: 'bg-pink-100 text-pink-700',
  indigo: 'bg-indigo-100 text-indigo-700',
  cyan: 'bg-cyan-100 text-cyan-700',
};

/**
 * Стили цветов (outline)
 */
const colorStylesOutline: Record<BadgeColor, string> = {
  gray: 'border-gray-300 text-gray-600',
  blue: 'border-blue-300 text-blue-600',
  green: 'border-green-300 text-green-600',
  yellow: 'border-yellow-300 text-yellow-600',
  red: 'border-red-300 text-red-600',
  purple: 'border-purple-300 text-purple-600',
  pink: 'border-pink-300 text-pink-600',
  indigo: 'border-indigo-300 text-indigo-600',
  cyan: 'border-cyan-300 text-cyan-600',
};

/**
 * Стили dot (точка)
 */
const dotColors: Record<BadgeColor, string> = {
  gray: 'bg-gray-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  cyan: 'bg-cyan-500',
};

/**
 * Стили размеров
 */
const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

/**
 * Компонент Badge для тегов и статусов
 * @example
 * <Badge color="blue">Бакалавриат</Badge>
 * <Badge color="green" variant="soft">Активный</Badge>
 * <Badge color="red" dot>Срочно</Badge>
 */
export const Badge = ({
  color = 'gray',
  size = 'md',
  variant = 'soft',
  icon,
  dot = false,
  children,
  class: className = '',
}: BadgeProps) => {
  const getColorStyles = () => {
    switch (variant) {
      case 'filled':
        return colorStylesFilled[color];
      case 'outline':
        return `border ${colorStylesOutline[color]} bg-transparent`;
      case 'soft':
      default:
        return colorStylesSoft[color];
    }
  };

  return (
    <span
      class={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${sizeStyles[size]}
        ${getColorStyles()}
        ${className}
      `}
    >
      {dot && (
        <span class={`w-1.5 h-1.5 rounded-full ${dotColors[color]}`} />
      )}
      {icon && <span class="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

/**
 * Preset badges для уровней образования
 */
export const DegreeBadge = ({ level }: { level: string }) => {
  const config: Record<string, { color: BadgeColor; label: string }> = {
    Bachelor: { color: 'blue', label: 'Бакалавриат' },
    Master: { color: 'purple', label: 'Магистратура' },
    PhD: { color: 'indigo', label: 'Докторантура' },
  };

  const { color, label } = config[level] ?? { color: 'gray', label: level };

  return <Badge color={color}>{label}</Badge>;
};

/**
 * Status badge
 */
export const StatusBadge = ({ status }: { status: 'active' | 'inactive' | 'pending' }) => {
  const config: Record<string, { color: BadgeColor; label: string }> = {
    active: { color: 'green', label: 'Активен' },
    inactive: { color: 'gray', label: 'Неактивен' },
    pending: { color: 'yellow', label: 'Ожидание' },
  };

  const { color, label } = config[status];

  return <Badge color={color} dot>{label}</Badge>;
};

export default Badge;
