import { ComponentChildren } from 'preact';

/**
 * Варианты кнопки
 */
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';

/**
 * Размеры кнопки
 */
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Props для компонента Button
 */
interface ButtonProps {
  /** Вариант стиля */
  variant?: ButtonVariant;
  /** Размер */
  size?: ButtonSize;
  /** Состояние загрузки */
  loading?: boolean;
  /** Иконка слева */
  leftIcon?: ComponentChildren;
  /** Иконка справа */
  rightIcon?: ComponentChildren;
  /** Кнопка на всю ширину */
  fullWidth?: boolean;
  /** Отключена */
  disabled?: boolean;
  /** Контент */
  children?: ComponentChildren;
  /** CSS классы */
  class?: string;
  /** Обработчик клика */
  onClick?: () => void;
}

/**
 * Стили вариантов
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-cyber-500 text-dark-900 hover:bg-cyber-400 active:bg-cyber-600 focus:ring-cyber-500',
  secondary:
    'bg-dark-700 text-gray-200 hover:bg-dark-600 active:bg-dark-500 focus:ring-dark-500',
  outline:
    'border-2 border-dark-600 text-gray-300 hover:border-dark-500 hover:bg-dark-700 focus:ring-dark-500',
  ghost:
    'text-gray-400 hover:bg-dark-700 hover:text-white focus:ring-dark-500',
  danger:
    'bg-red-600 text-white hover:bg-red-500 active:bg-red-700 focus:ring-red-500',
};

/**
 * Стили размеров
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2.5',
};

/**
 * Компонент спиннера
 */
const Spinner = ({ size }: { size: ButtonSize }) => {
  const spinnerSizes: Record<ButtonSize, string> = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <svg
      class={`${spinnerSizes[size]} animate-spin`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Переиспользуемый компонент кнопки
 * @example
 * <Button variant="primary" size="md">Нажми меня</Button>
 * <Button variant="outline" loading>Загрузка...</Button>
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  class: className = '',
  onClick,
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      class={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size={size} />
      ) : (
        leftIcon && <span class="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!loading && rightIcon && <span class="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};

/**
 * Кнопка-ссылка
 */
interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ComponentChildren;
  rightIcon?: ComponentChildren;
  fullWidth?: boolean;
  children?: ComponentChildren;
  class?: string;
  target?: string;
  rel?: string;
}

export const ButtonLink = ({
  href,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  class: className = '',
  target,
  rel,
}: ButtonLinkProps) => {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      class={`
        inline-flex items-center justify-center font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {leftIcon && <span class="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span class="flex-shrink-0">{rightIcon}</span>}
    </a>
  );
};

export default Button;
