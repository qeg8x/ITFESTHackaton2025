#!/bin/bash

# ============================================
# Скрипт тестирования API
# Цифровой университет MVP
# ============================================

set -e

BASE_URL="${BASE_URL:-http://localhost:8000}"
ADMIN_KEY="${ADMIN_KEY:-dev-admin-key}"

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Счётчики
PASSED=0
FAILED=0

# Функция для теста
test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local expected_status="$4"
  local headers="$5"
  local data="$6"
  
  echo -n "  Testing: $name... "
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
      -H "Content-Type: application/json" \
      $headers \
      -d "$data")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" $headers)
  fi
  
  status_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$status_code" == "$expected_status" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $status_code)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected_status, got $status_code)"
    echo "    Response: $body"
    ((FAILED++))
    return 1
  fi
}

# Функция для проверки JSON поля
check_json_field() {
  local name="$1"
  local url="$2"
  local field="$3"
  local expected="$4"
  
  echo -n "  Checking: $name... "
  
  response=$(curl -s "$url")
  value=$(echo "$response" | jq -r "$field" 2>/dev/null)
  
  if [ "$value" == "$expected" ]; then
    echo -e "${GREEN}✓ PASSED${NC} ($field = $value)"
    ((PASSED++))
    return 0
  else
    echo -e "${RED}✗ FAILED${NC} (Expected $expected, got $value)"
    ((FAILED++))
    return 1
  fi
}

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Тестирование API - Цифровой университет   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo "Base URL: $BASE_URL"
echo ""

# ============================================
# 1. Health Check
# ============================================
echo -e "${YELLOW}📋 1. Health Check${NC}"
test_endpoint "Health endpoint" "GET" "$BASE_URL/api/debug?action=health" "200"
check_json_field "Status healthy" "$BASE_URL/api/debug?action=health" ".status" "healthy"
check_json_field "DB connected" "$BASE_URL/api/debug?action=health" ".database" "connected"
echo ""

# ============================================
# 2. Universities API
# ============================================
echo -e "${YELLOW}📚 2. Universities API${NC}"
test_endpoint "List universities" "GET" "$BASE_URL/api/universities" "200"
test_endpoint "List with limit" "GET" "$BASE_URL/api/universities?limit=2" "200"
test_endpoint "List with search" "GET" "$BASE_URL/api/universities?search=test" "200"
test_endpoint "List with country filter" "GET" "$BASE_URL/api/universities?country=Казахстан" "200"

# Получить ID первого университета
FIRST_ID=$(curl -s "$BASE_URL/api/universities?limit=1" | jq -r '.data[0].id' 2>/dev/null)

if [ "$FIRST_ID" != "null" ] && [ -n "$FIRST_ID" ]; then
  echo "  Found university ID: $FIRST_ID"
  test_endpoint "Get university by ID" "GET" "$BASE_URL/api/universities/$FIRST_ID" "200"
  test_endpoint "Get university profile" "GET" "$BASE_URL/api/universities/$FIRST_ID/profile" "200"
else
  echo -e "  ${YELLOW}⚠ No universities found, skipping ID tests${NC}"
fi

test_endpoint "Invalid UUID" "GET" "$BASE_URL/api/universities/invalid-uuid" "400"
echo ""

# ============================================
# 3. Filters API
# ============================================
echo -e "${YELLOW}🔍 3. Filters API${NC}"
test_endpoint "Get filters" "GET" "$BASE_URL/api/filters" "200"
echo ""

# ============================================
# 4. Parser API
# ============================================
echo -e "${YELLOW}🤖 4. Parser API${NC}"
test_endpoint "Parser status" "GET" "$BASE_URL/api/parser" "200"
test_endpoint "Parser without auth" "POST" "$BASE_URL/api/parser" "401" "" '{"action":"check"}'
test_endpoint "Parser with auth" "POST" "$BASE_URL/api/parser" "400" "-H \"X-Admin-Key: $ADMIN_KEY\"" '{"action":"invalid"}'
echo ""

# ============================================
# 5. Admin API
# ============================================
echo -e "${YELLOW}👑 5. Admin API${NC}"
test_endpoint "Admin without auth" "POST" "$BASE_URL/api/admin/update-now" "401"
test_endpoint "Admin status" "GET" "$BASE_URL/api/admin/update-now" "200" "-H \"X-Admin-Key: $ADMIN_KEY\""
echo ""

# ============================================
# 6. Error Pages
# ============================================
echo -e "${YELLOW}🚫 6. Error Handling${NC}"
test_endpoint "404 page" "GET" "$BASE_URL/non-existent-page-12345" "404"
echo ""

# ============================================
# Results
# ============================================
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Результаты                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}✓ Passed: $PASSED${NC}"
echo -e "  ${RED}✗ Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Все тесты пройдены!${NC}"
  exit 0
else
  echo -e "${RED}❌ Некоторые тесты не пройдены${NC}"
  exit 1
fi
