# 🧪 Тестирование

## Обзор

В MVP версии автоматические тесты не реализованы. 
Этот документ описывает ручное тестирование API и функциональности.

---

## Быстрая проверка

```bash
# Запустить скрипт тестирования
./scripts/test.sh
```

---

## API Тестирование

### Health Check

```bash
# Проверка здоровья приложения
curl -s "http://localhost:8000/api/debug?action=health" | jq

# Ожидаемый результат:
{
  "status": "healthy",
  "timestamp": "2024-...",
  "database": "connected",
  "environment": "development"
}
```

### Список университетов

```bash
# Получить все
curl -s "http://localhost:8000/api/universities" | jq

# С пагинацией
curl -s "http://localhost:8000/api/universities?limit=2&offset=0" | jq

# С поиском
curl -s "http://localhost:8000/api/universities?search=Назарбаев" | jq

# С фильтром по стране
curl -s "http://localhost:8000/api/universities?country=Казахстан" | jq
```

### Конкретный университет

```bash
# Получить по ID (замените UUID)
curl -s "http://localhost:8000/api/universities/UUID" | jq

# Получить только профиль
curl -s "http://localhost:8000/api/universities/UUID/profile" | jq
```

### Фильтры

```bash
# Получить списки для фильтров
curl -s "http://localhost:8000/api/filters" | jq

# Ожидаемый результат:
{
  "countries": ["Казахстан", "Россия"],
  "cities": ["Астана", "Алматы", "Москва", ...]
}
```

### Статус парсера

```bash
curl -s "http://localhost:8000/api/parser" | jq

# Ожидаемый результат:
{
  "status": "ok",
  "ollama": "connected" | "disconnected",
  "sources": {
    "total": 5,
    "checked_today": 0,
    "never_checked": 5
  }
}
```

---

## Admin API (требует X-Admin-Key)

### Обновить профиль

```bash
# Обновить описание
curl -X POST "http://localhost:8000/api/universities/UUID/profile" \
  -H "X-Admin-Key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"description": "Новое описание"}' | jq
```

### Ручной парсинг

```bash
# Превью парсинга (без сохранения)
curl -X POST "http://localhost:8000/api/parser" \
  -H "X-Admin-Key: dev-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"action": "preview", "url": "https://nu.edu.kz"}' | jq
```

### Принудительное обновление

```bash
# Обновить конкретный университет
curl -X POST "http://localhost:8000/api/admin/update-now?university_id=UUID" \
  -H "X-Admin-Key: dev-admin-key" | jq

# Обновить все
curl -X POST "http://localhost:8000/api/admin/update-now?all" \
  -H "X-Admin-Key: dev-admin-key" | jq
```

---

## Что тестировать в первую очередь

### 1. Базовая работоспособность

- [ ] Health check возвращает `"status": "healthy"`
- [ ] БД подключена (`"database": "connected"`)
- [ ] Список университетов не пустой

### 2. CRUD операции

- [ ] GET /api/universities возвращает массив
- [ ] GET /api/universities/:id возвращает объект
- [ ] Пагинация работает (limit, offset)
- [ ] Поиск работает (search)

### 3. Фронтенд

- [ ] Главная страница загружается
- [ ] Поиск работает (автокомплит)
- [ ] Профиль университета отображается
- [ ] Программы отображаются в таблице

### 4. Парсинг (если Ollama доступен)

- [ ] Статус парсера: ollama = "connected"
- [ ] Preview парсинга возвращает данные
- [ ] Update-now обновляет профиль

---

## Чек-лист перед релизом

```bash
# 1. Health
curl -s "http://localhost:8000/api/debug?action=health" | jq '.status'
# Должно быть: "healthy"

# 2. Данные есть
curl -s "http://localhost:8000/api/universities" | jq '.data | length'
# Должно быть: > 0

# 3. Профили есть
curl -s "http://localhost:8000/api/universities" | jq '.data[0].id' -r | \
  xargs -I{} curl -s "http://localhost:8000/api/universities/{}/profile" | \
  jq '.profile != null'
# Должно быть: true

# 4. Фильтры работают
curl -s "http://localhost:8000/api/filters" | jq '.countries | length'
# Должно быть: > 0
```

---

## Нагрузочное тестирование

```bash
# Простой тест с ab (Apache Benchmark)
ab -n 100 -c 10 http://localhost:8000/api/universities

# С hey
hey -n 100 -c 10 http://localhost:8000/api/universities
```

---

## Известные ограничения

1. **Нет unit тестов** — MVP версия
2. **Нет e2e тестов** — планируется Playwright
3. **Нет rate limiting** — нужен для production
4. **Парсинг зависит от Ollama** — может быть медленным
