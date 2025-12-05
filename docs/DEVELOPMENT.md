# 💻 Руководство разработчика

## Настройка окружения

### Требования

- **Deno** >= 1.38 ([установка](https://deno.land/manual/getting_started/installation))
- **PostgreSQL** >= 14
- **Ollama** (опционально, для AI парсинга)
- **VS Code** с Deno extension (рекомендуется)

### Установка Deno

```bash
# macOS / Linux
curl -fsSL https://deno.land/install.sh | sh

# Windows (PowerShell)
irm https://deno.land/install.ps1 | iex

# Проверка
deno --version
```

### Установка PostgreSQL

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Установка Ollama (опционально)

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Загрузить модель
ollama pull llama3
```

---

## Локальный запуск

### 1. Клонирование

```bash
git clone https://github.com/your-repo/digital-university.git
cd digital-university
```

### 2. Настройка переменных окружения

```bash
cp .env.example .env
```

Отредактировать `.env`:

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/digital_university
DENO_ENV=development
OLLAMA_URL=http://localhost:11434
PORT=8000
ADMIN_KEY=dev-admin-key
UPDATE_WORKER_ENABLED=false  # отключить для разработки
```

### 3. Создание базы данных

```bash
# Создать БД
createdb digital_university

# Или через psql
psql -c "CREATE DATABASE digital_university;"
```

### 4. Запуск

```bash
# Development (с hot reload)
deno task dev

# Открыть http://localhost:8000
```

### 5. Инициализация БД (автоматически при первом запуске)

При старте приложение:
1. Проверяет подключение к БД
2. Запускает миграции
3. Заполняет тестовыми данными (если база пустая)

---

## Команды

```bash
# Development (hot reload)
deno task dev

# Production
deno task start

# Build (Fresh)
deno task build

# Lint & Format
deno task check

# База данных
deno task db:setup    # Миграции + seed
deno task db:migrate  # Только миграции
deno task db:seed     # Только seed
```

---

## Структура кода

### Соглашения

1. **Файлы**: `kebab-case.ts` или `PascalCase.tsx` для компонентов
2. **Функции**: `camelCase`
3. **Типы/Интерфейсы**: `PascalCase`
4. **Константы**: `UPPER_SNAKE_CASE`

### Импорты

```typescript
// 1. Deno/Fresh импорты
import { Handlers } from '$fresh/server.ts';

// 2. Внешние зависимости
import { Pool } from 'postgres';

// 3. Внутренние модули
import { logger } from '../utils/logger.ts';
import type { University } from '../types/university.ts';
```

### Компоненты

```typescript
// Статический компонент (components/)
export const Button = ({ children, onClick }: ButtonProps) => {
  return <button onClick={onClick}>{children}</button>;
};

// Island компонент (islands/)
export default function InteractiveComponent() {
  const state = useSignal(0);
  return <div>{state.value}</div>;
}
```

### API Routes

```typescript
// routes/api/example.ts
import { Handlers } from '$fresh/server.ts';

export const handler: Handlers = {
  async GET(req, ctx) {
    // ...
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
  
  async POST(req, ctx) {
    const body = await req.json();
    // ...
  },
};
```

---

## Добавление новых фич

### Новый API эндпоинт

1. Создать файл в `routes/api/`:

```typescript
// routes/api/my-endpoint.ts
import { Handlers } from '$fresh/server.ts';
import { logger } from '../../src/utils/logger.ts';

export const handler: Handlers = {
  async GET(req) {
    logger.info('API: GET /api/my-endpoint');
    
    try {
      // Логика
      return new Response(JSON.stringify({ data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      logger.error('Error:', err);
      return new Response(JSON.stringify({ error: 'Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  },
};
```

### Новый сервис

1. Создать файл в `src/services/`:

```typescript
// src/services/my.service.ts
import { query } from '../config/database.ts';
import { logger } from '../utils/logger.ts';

export const myFunction = async (): Promise<Result> => {
  logger.debug('myFunction called');
  
  const result = await query<Row>('SELECT ...');
  return result;
};
```

2. Экспортировать в `src/services/index.ts`

### Новая страница

1. Создать файл в `routes/`:

```typescript
// routes/my-page.tsx
import { Head } from '$fresh/runtime.ts';

export default function MyPage() {
  return (
    <>
      <Head>
        <title>My Page</title>
      </Head>
      <div>Content</div>
    </>
  );
}
```

### Новый Island

1. Создать файл в `islands/`:

```typescript
// islands/MyIsland.tsx
import { useSignal } from '@preact/signals';

export default function MyIsland() {
  const count = useSignal(0);
  
  return (
    <button onClick={() => count.value++}>
      Count: {count.value}
    </button>
  );
}
```

2. Использовать в странице:

```typescript
import MyIsland from '../islands/MyIsland.tsx';

export default function Page() {
  return <MyIsland />;
}
```

---

## Отладка

### Логирование

```typescript
import { logger } from '../utils/logger.ts';

logger.debug('Debug info', { data });
logger.info('Info message');
logger.warn('Warning');
logger.error('Error', err);
```

### VS Code Debug

1. Установить Deno extension
2. Создать `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Deno",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "deno",
      "runtimeArgs": ["run", "-A", "dev.ts"],
      "attachSimplePort": 9229
    }
  ]
}
```

---

## Типичные проблемы

### "Module not found"

```bash
# Перекешировать зависимости
deno cache --reload main.ts dev.ts
```

### "Database connection failed"

1. Проверить что PostgreSQL запущен
2. Проверить DATABASE_URL в .env
3. Проверить существование БД

### "Ollama not responding"

1. Проверить что Ollama запущен: `ollama list`
2. Проверить OLLAMA_URL в .env
3. Загрузить модель: `ollama pull llama3`
