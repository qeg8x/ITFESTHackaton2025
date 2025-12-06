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
  gray: 'bg-gray-500/20 text-gray-300',
  blue: 'bg-blue-500/20 text-blue-400',
  green: 'bg-green-500/20 text-green-400',
  yellow: 'bg-yellow-500/20 text-yellow-400',
  red: 'bg-red-500/20 text-red-400',
  purple: 'bg-purple-500/20 text-purple-400',
  pink: 'bg-pink-500/20 text-pink-400',
  indigo: 'bg-indigo-500/20 text-indigo-400',
  cyan: 'bg-cyan-500/20 text-cyan-400',
};

/**
 * Стили цветов (outline)
 */
const colorStylesOutline: Record<BadgeColor, string> = {
  gray: 'border-gray-500 text-gray-400',
  blue: 'border-blue-500 text-blue-400',
  green: 'border-green-500 text-green-400',
  yellow: 'border-yellow-500 text-yellow-400',
  red: 'border-red-500 text-red-400',
  purple: 'border-purple-500 text-purple-400',
  pink: 'border-pink-500 text-pink-400',
  indigo: 'border-indigo-500 text-indigo-400',
  cyan: 'border-cyan-500 text-cyan-400',
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
