# 📚 API Документация

## Базовый URL

```
http://localhost:8000/api
```

---

## Эндпоинты

### 📋 Университеты

#### Получить список университетов

```http
GET /api/universities
```

**Query параметры:**

| Параметр | Тип | Описание | По умолчанию |
|----------|-----|----------|--------------|
| `limit` | number | Количество записей | 20 |
| `offset` | number | Смещение | 0 |
| `search` | string | Поиск по названию | - |
| `country` | string | Фильтр по стране | - |
| `city` | string | Фильтр по городу | - |

**Пример запроса:**

```bash
curl "http://localhost:8000/api/universities?limit=10&search=Назарбаев"
```

**Ответ:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Назарбаев Университет",
      "name_en": "Nazarbayev University",
      "country": "Казахстан",
      "city": "Астана",
      "website_url": "https://nu.edu.kz",
      "is_active": true
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 5
  }
}
```

---

#### Получить университет по ID

```http
GET /api/universities/:id
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/universities/uuid-here"
```

**Ответ:**

```json
{
  "id": "uuid",
  "name": "Назарбаев Университет",
  "profile": {
    "description": "...",
    "programs": [...],
    "admissions": {...},
    "contacts": {...}
  }
}
```

---

#### Получить профиль университета

```http
GET /api/universities/:id/profile
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/universities/uuid-here/profile"
```

---

#### Обновить профиль (Admin)

```http
POST /api/universities/:id/profile
```

**Headers:**

```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body:**

```json
{
  "description": "Новое описание",
  "programs": [...]
}
```

**Пример запроса:**

```bash
curl -X POST "http://localhost:8000/api/universities/uuid-here/profile" \
  -H "X-Admin-Key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"description": "Обновленное описание"}'
```

---

### 🔍 Фильтры

#### Получить списки для фильтров

```http
GET /api/filters
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/filters"
```

**Ответ:**

```json
{
  "countries": ["Казахстан", "Россия"],
  "cities": ["Астана", "Алматы", "Москва"]
}
```

---

### 🤖 Парсер

#### Статус парсера

```http
GET /api/parser
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/parser"
```

**Ответ:**

```json
{
  "status": "ok",
  "ollama": "connected",
  "sources": {
    "total": 5,
    "checked_today": 2,
    "never_checked": 1
  }
}
```

---

#### Запустить парсинг (Admin)

```http
POST /api/parser
```

**Headers:**

```
X-Admin-Key: your-admin-key
Content-Type: application/json
```

**Body (варианты):**

```json
// Проверить хэш сайта
{"action": "check", "url": "https://nu.edu.kz"}

// Превью парсинга
{"action": "preview", "url": "https://nu.edu.kz"}

// Обновить конкретный источник
{"action": "update", "universityId": "uuid", "sourceId": "uuid", "url": "https://nu.edu.kz"}

// Обновить все
{"action": "update-all"}
```

---

### 🔧 Debug

#### Health Check

```http
GET /api/debug?action=health
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/debug?action=health"
```

**Ответ:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

---

#### Статистика БД

```http
GET /api/debug?action=stats
```

**Пример запроса:**

```bash
curl "http://localhost:8000/api/debug?action=stats"
```

---

### 👑 Admin

#### Ручное обновление университета

```http
POST /api/admin/update-now?university_id=uuid
```

**Headers:**

```
X-Admin-Key: your-admin-key
```

**Пример запроса:**

```bash
curl -X POST "http://localhost:8000/api/admin/update-now?university_id=uuid" \
  -H "X-Admin-Key: dev-admin-key"
```

---

#### Обновить все университеты

```http
POST /api/admin/update-now?all
```

**Headers:**

```
X-Admin-Key: your-admin-key
```

---

## Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 400 | Неверный запрос (bad request) |
| 401 | Не авторизован (нужен X-Admin-Key) |
| 404 | Ресурс не найден |
| 500 | Внутренняя ошибка сервера |

**Формат ошибки:**

```json
{
  "error": "Error Type",
  "message": "Описание ошибки"
}
```

---

## Rate Limiting

В текущей версии rate limiting не реализован.
Рекомендуется использовать внешний rate limiter (nginx, cloudflare).

---

## Аутентификация

Admin эндпоинты требуют заголовок `X-Admin-Key`:

```bash
curl -H "X-Admin-Key: your-admin-key" ...
```

Ключ задаётся в переменной окружения `ADMIN_KEY`.
