#!/bin/bash

# P1 Features Quick Smoke Test Script
# Run this to quickly verify all P1 features are working

echo "🧪 Starting P1 Features Smoke Tests..."
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=$3

    echo -n "Testing $name... "

    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status)"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAILED++))
    fi
}

# Test 1: Terms of Service Page
echo "📄 Test 1: Legal Pages"
test_endpoint "Terms of Service" "$BASE_URL/terms" "200"
test_endpoint "Privacy Policy" "$BASE_URL/privacy" "200"
echo ""

# Test 2: Service CRUD Removed
echo "🗑️  Test 2: Admin Service CRUD Removed"
test_endpoint "Admin Services (should be 404)" "$BASE_URL/admin/services" "404"
test_endpoint "Admin Services API (should be 404)" "$BASE_URL/api/admin/services" "404"
echo ""

# Test 3: Pricing Calculator Page
echo "💰 Test 3: Pricing Calculator"
test_endpoint "CS2 Pricing Page" "$BASE_URL/games/cs2/pricing" "200"
echo ""

# Test 4: Rate Limiting (Login)
echo "🚦 Test 4: Rate Limiting"
echo "Testing login rate limit (5 attempts)..."

for i in {1..6}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"wrong"}')

    if [ $i -le 5 ]; then
        if [ "$status" == "401" ]; then
            echo -e "  Attempt $i: ${GREEN}✓${NC} (401 - Expected)"
        else
            echo -e "  Attempt $i: ${RED}✗${NC} (Got $status, expected 401)"
        fi
    else
        if [ "$status" == "429" ]; then
            echo -e "  Attempt $i: ${GREEN}✓ Rate Limited!${NC} (429)"
            ((PASSED++))
        else
            echo -e "  Attempt $i: ${RED}✗ Not Rate Limited${NC} (Got $status, expected 429)"
            ((FAILED++))
        fi
    fi

    sleep 0.5
done
echo ""

# Test 5: API Error Messages (Portuguese)
echo "🇧🇷 Test 5: Portuguese Error Messages"
echo "Testing pricing API with invalid data..."

response=$(curl -s -X POST "$BASE_URL/api/pricing/calculate" \
    -H "Content-Type: application/json" \
    -d '{"game":"CS2","gameMode":"PREMIER","current":15000,"target":10000}')

if echo "$response" | grep -q "pontuação atual deve ser menor"; then
    echo -e "${GREEN}✓ PASS${NC} - Error message is in Portuguese"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC} - Error message not in Portuguese"
    echo "Response: $response"
    ((FAILED++))
fi
echo ""

# Summary
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All smoke tests passed!${NC}"
    echo "Next steps:"
    echo "1. Open browser and test UI features manually"
    echo "2. Check TEST_PLAN.md for detailed test cases"
    echo "3. Test complete user journey"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi
