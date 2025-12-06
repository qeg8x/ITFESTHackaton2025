#!/bin/bash

# =============================================================================
# Performance Check Script
# Тестирует производительность API
# =============================================================================

set -e

# Конфигурация
BASE_URL="${BASE_URL:-http://localhost:8000}"
ADMIN_KEY="${ADMIN_KEY:-dev-admin-key}"
PARALLEL_REQUESTS="${PARALLEL_REQUESTS:-20}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-100}"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Performance Check - Digital University${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "Base URL: ${YELLOW}$BASE_URL${NC}"
echo -e "Admin Key: ${YELLOW}${ADMIN_KEY:0:8}...${NC}"
echo ""

# Проверить доступность сервера
echo -e "${BLUE}[1/6] Checking server availability...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" | grep -q "200\|404"; then
    # Пробуем просто главную страницу
    if ! curl -s -o /dev/null "$BASE_URL"; then
        echo -e "${RED}❌ Server not available at $BASE_URL${NC}"
        exit 1
    fi
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Функция для измерения времени запроса
measure_request() {
    local url=$1
    local method=${2:-GET}
    local data=$3
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        curl -s -o /dev/null -w "%{time_total}" \
            -X POST \
            -H "Content-Type: application/json" \
            -H "X-Admin-Key: $ADMIN_KEY" \
            -d "$data" \
            "$url"
    else
        curl -s -o /dev/null -w "%{time_total}" \
            -H "X-Admin-Key: $ADMIN_KEY" \
            "$url"
    fi
}

# Тест 1: API Universities List
echo -e "${BLUE}[2/6] Testing Universities List API...${NC}"
times=()
for i in $(seq 1 10); do
    time=$(measure_request "$BASE_URL/api/universities?limit=10")
    times+=($time)
done

avg=$(echo "${times[@]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.3f", sum/NR}')
max=$(echo "${times[@]}" | tr ' ' '\n' | sort -rn | head -1)
min=$(echo "${times[@]}" | tr ' ' '\n' | sort -n | head -1)

echo -e "  Average: ${GREEN}${avg}s${NC}"
echo -e "  Min: ${GREEN}${min}s${NC}, Max: ${YELLOW}${max}s${NC}"
echo ""

# Тест 2: Search API
echo -e "${BLUE}[3/6] Testing Search API...${NC}"
times=()
queries=("university" "harvard" "moscow" "астана" "MIT")

for query in "${queries[@]}"; do
    time=$(measure_request "$BASE_URL/api/search/universities?name=$query")
    times+=($time)
    echo -e "  Search '$query': ${GREEN}${time}s${NC}"
done

avg=$(echo "${times[@]}" | tr ' ' '\n' | awk '{sum+=$1} END {printf "%.3f", sum/NR}')
echo -e "  Average: ${GREEN}${avg}s${NC}"
echo ""

# Тест 3: Admin API
echo -e "${BLUE}[4/6] Testing Admin API...${NC}"
time=$(measure_request "$BASE_URL/api/admin/universities?limit=5")
echo -e "  Admin list: ${GREEN}${time}s${NC}"
echo ""

# Тест 4: Параллельные запросы
echo -e "${BLUE}[5/6] Running parallel load test ($PARALLEL_REQUESTS concurrent, $TOTAL_REQUESTS total)...${NC}"

# Создаем временный файл для результатов
RESULTS_FILE=$(mktemp)

# Запускаем параллельные запросы
start_time=$(date +%s.%N)

for i in $(seq 1 $TOTAL_REQUESTS); do
    (
        time=$(measure_request "$BASE_URL/api/search/universities?name=test$i")
        echo "$time" >> "$RESULTS_FILE"
    ) &
    
    # Ограничиваем количество параллельных запросов
    if [ $(jobs -r | wc -l) -ge $PARALLEL_REQUESTS ]; then
        wait -n 2>/dev/null || true
    fi
done

# Ждем завершения всех запросов
wait

end_time=$(date +%s.%N)
total_time=$(echo "$end_time - $start_time" | bc)

# Анализируем результаты
if [ -f "$RESULTS_FILE" ]; then
    count=$(wc -l < "$RESULTS_FILE")
    avg=$(awk '{sum+=$1} END {printf "%.3f", sum/NR}' "$RESULTS_FILE")
    max=$(sort -rn "$RESULTS_FILE" | head -1)
    min=$(sort -n "$RESULTS_FILE" | head -1)
    p95=$(sort -n "$RESULTS_FILE" | awk "NR==int($count*0.95)")
    
    echo -e "  Completed: ${GREEN}$count requests${NC}"
    echo -e "  Total time: ${GREEN}${total_time}s${NC}"
    echo -e "  Requests/sec: ${GREEN}$(echo "scale=2; $count / $total_time" | bc)${NC}"
    echo -e "  Average: ${GREEN}${avg}s${NC}"
    echo -e "  Min: ${GREEN}${min}s${NC}, Max: ${YELLOW}${max}s${NC}"
    echo -e "  P95: ${YELLOW}${p95}s${NC}"
    
    rm "$RESULTS_FILE"
else
    echo -e "${RED}No results collected${NC}"
fi
echo ""

# Тест 5: Feature Tests
echo -e "${BLUE}[6/6] Running feature tests...${NC}"
result=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "X-Admin-Key: $ADMIN_KEY" \
    -d '{"test_type": "all"}' \
    "$BASE_URL/api/test/features")

if echo "$result" | grep -q '"success":true'; then
    passed=$(echo "$result" | grep -o '"passed":[0-9]*' | head -1 | cut -d: -f2)
    total=$(echo "$result" | grep -o '"total_tests":[0-9]*' | cut -d: -f2)
    echo -e "${GREEN}✓ Feature tests passed: $passed/$total${NC}"
else
    echo -e "${YELLOW}⚠ Feature tests: check response manually${NC}"
    echo "$result" | head -c 200
fi
echo ""

# Итоги
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Проверяем пороговые значения
if (( $(echo "$avg < 0.5" | bc -l) )); then
    echo -e "${GREEN}✓ API Response Time: GOOD (<500ms avg)${NC}"
else
    echo -e "${YELLOW}⚠ API Response Time: SLOW (>500ms avg)${NC}"
fi

if (( $(echo "$max < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓ Max Response Time: GOOD (<2s)${NC}"
else
    echo -e "${RED}❌ Max Response Time: TOO SLOW (>2s)${NC}"
fi

echo ""
echo -e "${GREEN}Performance check completed!${NC}"
