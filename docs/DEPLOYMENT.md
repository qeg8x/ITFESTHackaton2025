# 🚀 Развёртывание Цифрового университета

## Содержание

- [Требования](#требования)
- [Локальный запуск](#локальный-запуск)
- [Docker запуск](#docker-запуск)
- [Production развёртывание](#production-развёртывание)
- [Переменные окружения](#переменные-окружения)
- [Troubleshooting](#troubleshooting)

---

## Требования

### Для локального запуска:
- **Deno** >= 1.38
- **PostgreSQL** >= 14
- **Ollama** (опционально, для AI парсинга)

### Для Docker:
- **Docker** >= 20.10
- **Docker Compose** >= 2.0

---

## Локальный запуск

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-repo/digital-university.git
cd digital-university
```

### 2. Настройка окружения

```bash
# Скопировать пример конфигурации
cp .env.example .env

# Отредактировать переменные
nano .env
```

### 3. Настройка базы данных

```bash
# Создать базу данных
createdb digital_university

# Или через psql
psql -c "CREATE DATABASE digital_university;"
```

### 4. Запуск приложения

```bash
# Development режим (с hot reload)
deno task dev

# Production режим
deno task start
```

### 5. Проверка

Откройте http://localhost:8000

---

## Docker запуск

### Быстрый старт

```bash
# Запустить все сервисы
docker-compose up -d

# Посмотреть логи
docker-compose logs -f app

# Остановить
docker-compose down
```

### С пересборкой

```bash
# Пересобрать образ
docker-compose build --no-cache

# Запустить
docker-compose up -d
```

### Отдельные сервисы

```bash
# Только база данных
docker-compose up -d postgres

# Только Ollama
docker-compose up -d ollama

# Загрузить модель в Ollama
docker-compose exec ollama ollama pull llama3
```

---

## Production развёртывание

### 1. Подготовка сервера

```bash
# Установить Docker
curl -fsSL https://get.docker.com | sh

# Установить Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Настройка переменных

```bash
# Создать .env с production значениями
cat > .env << EOF
POSTGRES_PASSWORD=secure-random-password
ADMIN_KEY=secure-admin-key
DENO_ENV=production
UPDATE_WORKER_ENABLED=true
EOF
```

### 3. Запуск

```bash
docker-compose -f docker-compose.yml up -d
```

### 4. Настройка Nginx (опционально)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Переменные окружения

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `DENO_ENV` | Окружение (development/production) | `development` |
| `PORT` | Порт приложения | `8000` |
| `OLLAMA_URL` | URL Ollama API | `http://localhost:11434` |
| `ADMIN_KEY` | Ключ для admin API | `dev-admin-key` |
| `UPDATE_WORKER_ENABLED` | Включить фоновое обновление | `true` |
| `POSTGRES_PASSWORD` | Пароль PostgreSQL (Docker) | `postgres` |
| `POSTGRES_DB` | Имя базы данных | `digital_university` |

---

## Troubleshooting

### Ошибка подключения к БД

```bash
# Проверить что PostgreSQL запущен
docker-compose ps postgres

# Проверить логи
docker-compose logs postgres

# Проверить подключение
docker-compose exec postgres psql -U postgres -d digital_university -c "SELECT 1;"
```

### Приложение не запускается

```bash
# Проверить логи
docker-compose logs app

# Проверить health
curl http://localhost:8000/api/debug?action=health
```

### Ollama не отвечает

```bash
# Проверить статус
docker-compose exec ollama ollama list

# Загрузить модель
docker-compose exec ollama ollama pull llama3

# Проверить API
curl http://localhost:11434/api/tags
```

### Миграции не применяются

```bash
# Запустить вручную
docker-compose exec app deno task db:setup

# Или пересоздать БД
docker-compose down -v
docker-compose up -d
```

---

## Полезные команды

```bash
# Перезапуск приложения
docker-compose restart app

# Обновление образа
docker-compose pull
docker-compose up -d

# Очистка
docker-compose down -v --rmi all

# Бэкап БД
docker-compose exec postgres pg_dump -U postgres digital_university > backup.sql

# Восстановление БД
cat backup.sql | docker-compose exec -T postgres psql -U postgres digital_university
```
