#!/bin/bash
# Fitness AI - Firebase Setup Verification Script
# Run this after placing your google-services.json and service-account.json

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🔍 Fitness AI - Firebase Setup Check"
echo "====================================="
echo ""

ERRORS=0

# Check 1: service-account.json in server/
echo -n "1. server/service-account.json: "
if [ -f "../server/service-account.json" ]; then
    # Validate it's valid JSON with required fields
    if python3 -c "import json; d=json.load(open('../server/service-account.json')); assert 'project_id' in d and 'private_key' in d and 'client_email' in d" 2>/dev/null; then
        PROJECT_ID=$(python3 -c "import json; print(json.load(open('../server/service-account.json'))['project_id'])")
        echo -e "${GREEN}✅ Found (project: $PROJECT_ID)${NC}"
    else
        echo -e "${RED}❌ Invalid JSON or missing required fields${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Not found (server runs in simulated mode)${NC}"
    echo ""
    echo "   To fix:"
    echo "   1. Go to https://console.firebase.google.com"
    echo "   2. Select your project → ⚙️ Project Settings → Service Accounts"
    echo "   3. Click 'Generate new private key'"
    echo "   4. Save as: server/service-account.json"
fi

# Check 2: google-services.json in android/app/
echo -n "2. android/app/google-services.json: "
if [ -f "../android/app/google-services.json" ]; then
    if python3 -c "import json; d=json.load(open('../android/app/google-services.json')); assert 'project_info' in d" 2>/dev/null; then
        echo -e "${GREEN}✅ Found${NC}"
    else
        echo -e "${RED}❌ Invalid JSON${NC}"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Not found (Android push won't work)${NC}"
    echo ""
    echo "   To fix:"
    echo "   1. Go to https://console.firebase.google.com"
    echo "   2. Select your project → ⚙️ Project Settings → General"
    echo "   3. Under 'Your apps', click Android app (com.fitnessai.coach)"
    echo "   4. Click 'Download google-services.json'"
    echo "   5. Place in: android/app/google-services.json"
fi

# Check 3: Firebase dependencies in build.gradle
echo -n "3. Android Google Services plugin: "
if grep -q "com.google.gms.google-services" ../android/build.gradle 2>/dev/null; then
    echo -e "${GREEN}✅ Configured${NC}"
else
    echo -e "${RED}❌ Missing in android/build.gradle${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 4: Push notification dependencies
echo -n "4. Capacitor Push Notifications plugin: "
if grep -q "capacitor-push-notifications" ../android/capacitor.settings.gradle 2>/dev/null; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${RED}❌ Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check 5: Server can start
echo -n "5. Server dependencies: "
if [ -d "../server/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules installed${NC}"
else
    echo -e "${YELLOW}⚠️  Run 'cd server && npm install' first${NC}"
fi

echo ""
echo "====================================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! Firebase is configured.${NC}"
    echo ""
    echo "To start the server:"
    echo "  cd server && npm run dev"
else
    echo -e "${YELLOW}⚠️  $ERRORS issue(s) found. See instructions above.${NC}"
    echo ""
    echo "The app works without Firebase (simulated mode),"
    echo "but background push notifications won't be delivered."
fi

echo ""
