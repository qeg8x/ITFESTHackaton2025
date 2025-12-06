import { ComponentChildren } from 'preact';

/**
 * Варианты Card
 */
type CardVariant = 'default' | 'elevated' | 'outline' | 'ghost';

/**
 * Props для Card
 */
interface CardProps {
  /** Вариант стиля */
  variant?: CardVariant;
  /** Добавить паддинг */
  padding?: boolean;
  /** Hover эффект */
  hoverable?: boolean;
  /** Контент */
  children: ComponentChildren;
  /** CSS классы */
  class?: string;
}

/**
 * Стили вариантов
 */
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-dark-800 rounded-2xl border border-dark-600',
  elevated: 'bg-dark-800 rounded-2xl border border-dark-600 shadow-elevated-dark',
  outline: 'bg-dark-800 rounded-2xl border-2 border-dark-600',
  ghost: 'bg-dark-700/50 rounded-2xl',
};

/**
 * Компонент Card — контейнер с закруглёнными углами
 * @example
 * <Card>
 *   <Card.Header>Заголовок</Card.Header>
 *   <Card.Body>Контент</Card.Body>
 *   <Card.Footer>Футер</Card.Footer>
 * </Card>
 */
export const Card = ({
  variant = 'default',
  padding = true,
  hoverable = false,
  children,
  class: className = '',
}: CardProps) => {
  return (
    <div
      class={`
        ${variantStyles[variant]}
        ${padding ? 'p-6' : ''}
        ${hoverable ? 'hover:shadow-elevated transition-shadow duration-200' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

/**
 * Card Header
 */
interface CardHeaderProps {
  /** Заголовок */
  title?: string;
  /** Подзаголовок */
  subtitle?: string;
  /** Действие справа */
  action?: ComponentChildren;
  children?: ComponentChildren;
  class?: string;
}

export const CardHeader = ({
  title,
  subtitle,
  action,
  children,
  class: className = '',
}: CardHeaderProps) => {
  if (children) {
    return (
      <div class={`mb-4 ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div class={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && <h3 class="text-lg font-semibold text-white">{title}</h3>}
        {subtitle && <p class="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {action && <div class="ml-4 flex-shrink-0">{action}</div>}
    </div>
  );
};

/**
 * Card Body
 */
interface CardBodyProps {
  children: ComponentChildren;
  class?: string;
}

export const CardBody = ({
  children,
  class: className = '',
}: CardBodyProps) => {
  return (
    <div class={className}>
      {children}
    </div>
  );
};

/**
 * Card Footer
 */
interface CardFooterProps {
  /** Разделитель сверху */
  divider?: boolean;
  children: ComponentChildren;
  class?: string;
}

export const CardFooter = ({
  divider = true,
  children,
  class: className = '',
}: CardFooterProps) => {
  return (
    <div
      class={`
        mt-4 pt-4
        ${divider ? 'border-t border-dark-600' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// Присваиваем подкомпоненты
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
