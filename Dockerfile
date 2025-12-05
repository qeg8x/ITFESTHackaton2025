# ============================================
# Цифровой университет - Dockerfile
# Fresh + Deno + PostgreSQL
# ============================================

FROM denoland/deno:1.38.5

# Метаданные
LABEL maintainer="Digital University Team"
LABEL version="1.0.0"
LABEL description="Digital University MVP - Fresh монолит"

# Рабочая директория
WORKDIR /app

# Создать пользователя без root прав
RUN addgroup --system --gid 1001 deno_group && \
    adduser --system --uid 1001 --ingroup deno_group deno_user

# Копировать файлы зависимостей первыми (для кеширования слоёв)
COPY deno.json deno.lock* ./

# Копировать исходный код
COPY . .

# Кешировать зависимости
RUN deno cache main.ts dev.ts

# Сменить владельца файлов
RUN chown -R deno_user:deno_group /app

# Переключиться на непривилегированного пользователя
USER deno_user

# Порт приложения
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD deno run --allow-net --allow-env healthcheck.ts || exit 1

# Запуск приложения
CMD ["deno", "run", "--allow-all", "main.ts"]
