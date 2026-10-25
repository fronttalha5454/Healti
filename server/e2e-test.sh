#!/bin/bash
# Fitness AI - Push Notification E2E Test
# Tests the full flow: register token → send notification → verify delivery

set +e  # Don't exit on error, we handle errors ourselves

API="http://localhost:3001"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0

test_pass() { echo -e "  ${GREEN}✅ PASS${NC}: $1"; PASS=$((PASS + 1)); }
test_fail() { echo -e "  ${RED}❌ FAIL${NC}: $1"; FAIL=$((FAIL + 1)); }

echo ""
echo "🧪 Fitness AI - Push Notification E2E Test"
echo "==========================================="
echo ""

# ─── Test 1: Health Check ───
echo -e "${BLUE}1. Health Check${NC}"
HEALTH=$(curl -s "$API/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    test_pass "Server is running"
else
    test_fail "Server health check failed"
    echo "   Response: $HEALTH"
fi

# ─── Test 2: Register Token ───
echo -e "\n${BLUE}2. Token Registration${NC}"
REGISTER=$(curl -s -X POST "$API/api/tokens/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "token": "fake-fcm-token-abc123def456",
    "platform": "android"
  }')

if echo "$REGISTER" | grep -q '"success":true'; then
    TOKEN_ID=$(echo "$REGISTER" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    test_pass "Token registered (id: ${TOKEN_ID:0:8}...)"
else
    test_fail "Token registration failed"
    echo "   Response: $REGISTER"
fi

# ─── Test 3: Register Second Token (same user, different device) ───
echo -e "\n${BLUE}3. Register Second Token${NC}"
REGISTER2=$(curl -s -X POST "$API/api/tokens/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "token": "fake-fcm-token-xyz789ghi012",
    "platform": "web"
  }')

if echo "$REGISTER2" | grep -q '"success":true'; then
    test_pass "Second token registered"
else
    test_fail "Second token registration failed"
fi

# ─── Test 4: Duplicate Token Update ───
echo -e "\n${BLUE}4. Duplicate Token Handling${NC}"
DUP=$(curl -s -X POST "$API/api/tokens/register" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "token": "fake-fcm-token-abc123def456",
    "platform": "android"
  }')

if echo "$DUP" | grep -q '"message":"Token updated"'; then
    test_pass "Duplicate token handled (updated, not duplicated)"
else
    test_fail "Duplicate token not handled correctly"
    echo "   Response: $DUP"
fi

# ─── Test 5: List User Tokens ───
echo -e "\n${BLUE}5. List User Tokens${NC}"
TOKENS=$(curl -s "$API/api/tokens/test-user-123")
TOKEN_COUNT=$(echo "$TOKENS" | grep -o '"count":[0-9]*' | cut -d: -f2)

if [ "$TOKEN_COUNT" = "2" ]; then
    test_pass "User has 2 active tokens"
else
    test_fail "Expected 2 tokens, got: $TOKEN_COUNT"
    echo "   Response: $TOKENS"
fi

# ─── Test 6: Send Direct Notification ───
echo -e "\n${BLUE}6. Send Direct Notification${NC}"
SEND=$(curl -s -X POST "$API/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "💧 Test Notification",
    "body": "This is a test push notification from E2E test",
    "channelId": "water"
  }')

if echo "$SEND" | grep -q '"success":true'; then
    SENT_COUNT=$(echo "$SEND" | grep -o '"sent":[0-9]*' | cut -d: -f2)
    SIMULATED=$(echo "$SEND" | grep -o '"simulated":true' || true)
    if [ -n "$SIMULATED" ]; then
        test_pass "Notification sent to $SENT_COUNT device(s) [SIMULATED - no Firebase]"
    else
        test_pass "Notification sent to $SENT_COUNT device(s) [REAL FCM]"
    fi
else
    test_fail "Send notification failed"
    echo "   Response: $SEND"
fi

# ─── Test 7: Send with Missing Fields ───
echo -e "\n${BLUE}7. Validation - Missing Fields${NC}"
VALIDATION=$(curl -s -w "\n%{http_code}" -X POST "$API/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{"userId": "test"}')
HTTP_CODE=$(echo "$VALIDATION" | tail -1)

if [ "$HTTP_CODE" = "400" ]; then
    test_pass "Missing fields returns 400"
else
    test_fail "Expected 400, got: $HTTP_CODE"
fi

# ─── Test 8: Send to Nonexistent User ───
echo -e "\n${BLUE}8. Send to Nonexistent User${NC}"
NO_USER=$(curl -s -X POST "$API/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "nonexistent-user",
    "title": "Test",
    "body": "Should not send"
  }')

if echo "$NO_USER" | grep -q '"sent":0'; then
    test_pass "Nonexistent user returns sent:0"
else
    test_fail "Nonexistent user should return sent:0"
    echo "   Response: $NO_USER"
fi

# ─── Test 9: Evaluate & Send ───
echo -e "\n${BLUE}9. Evaluate & Send (Server-Side Logic)${NC}"
EVAL=$(curl -s -X POST "$API/api/notifications/evaluate" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "waterToday": 500,
    "waterGoal": 2500,
    "caloriesToday": 800,
    "proteinToday": 40,
    "calorieGoal": 2000,
    "proteinGoal": 150,
    "mealEntriesToday": 1,
    "hasWorkoutToday": true,
    "hasWorkedOutToday": false,
    "hasSleepEntryToday": false,
    "activeHabitCount": 4,
    "completedHabitCount": 2,
    "hasRecentCheckin": false,
    "daysSinceLastWeight": 10,
    "currentHour": 14,
    "currentDayOfWeek": 3
  }')

if echo "$EVAL" | grep -q '"success":true'; then
    EVALUATED=$(echo "$EVAL" | grep -o '"evaluated":[0-9]*' | cut -d: -f2)
    MATCHED=$(echo "$EVAL" | grep -o '"matched":[0-9]*' | cut -d: -f2)
    SENT=$(echo "$EVAL" | grep -o '"sent":[0-9]*' | cut -d: -f2)
    test_pass "Evaluated $EVALUATED templates, matched $MATCHED, sent $SENT"
else
    test_fail "Evaluate & send failed"
    echo "   Response: $EVAL"
fi

# ─── Test 10: Unregister Token ───
echo -e "\n${BLUE}10. Unregister Token${NC}"
UNREG=$(curl -s -X POST "$API/api/tokens/unregister" \
  -H "Content-Type: application/json" \
  -d '{"token": "fake-fcm-token-abc123def456"}')

if echo "$UNREG" | grep -q '"removed":true'; then
    test_pass "Token unregistered"
else
    test_fail "Token unregister failed"
fi

# ─── Test 11: Verify Token Deactivated ───
echo -e "\n${BLUE}11. Verify Token Deactivated${NC}"
TOKENS_AFTER=$(curl -s "$API/api/tokens/test-user-123")
COUNT_AFTER=$(echo "$TOKENS_AFTER" | grep -o '"count":[0-9]*' | cut -d: -f2)

if [ "$COUNT_AFTER" = "1" ]; then
    test_pass "User now has 1 active token (deactivated one removed)"
else
    test_fail "Expected 1 token after deactivation, got: $COUNT_AFTER"
fi

# ─── Test 12: Send After Deactivation ───
echo -e "\n${BLUE}12. Send After Token Deactivation${NC}"
SEND_AFTER=$(curl -s -X POST "$API/api/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "Test",
    "body": "Should send to 1 device"
  }')

SENT_AFTER=$(echo "$SEND_AFTER" | grep -o '"sent":[0-9]*' | cut -d: -f2)
if [ "$SENT_AFTER" = "1" ]; then
    test_pass "Notification sent to 1 device (deactivated token skipped)"
else
    test_fail "Expected 1 sent, got: $SENT_AFTER"
fi

# ─── Summary ───
echo ""
echo "==========================================="
TOTAL=$((PASS + FAIL))
echo -e "Results: ${GREEN}$PASS passed${NC} / ${RED}$FAIL failed${NC} / $TOTAL total"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo -e "${RED}⚠️  Some tests failed.${NC}"
fi

echo ""
