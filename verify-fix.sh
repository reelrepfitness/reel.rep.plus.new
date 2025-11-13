#!/bin/bash

# Verification Script - Confirms all fixes are in place

echo "🔍 Verifying Expo Preview Fix Installation"
echo "============================================"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        PASS=$((PASS+1))
    else
        echo -e "${RED}❌ $2${NC}"
        FAIL=$((FAIL+1))
    fi
}

echo "📦 Checking Dependencies..."
echo ""

# Check @expo/ngrok
bun list | grep -q "@expo/ngrok"
check $? "expo/ngrok installed"

# Check expo-constants
bun list | grep -q "expo-constants"
check $? "expo-constants installed"

echo ""
echo "📄 Checking Files..."
echo ""

# Check helper files
test -f lib/connectionHelper.ts
check $? "lib/connectionHelper.ts exists"

test -f quick-start.sh
check $? "quick-start.sh exists"

test -f fix-tunnel-error.sh
check $? "fix-tunnel-error.sh exists"

test -f start-expo.sh
check $? "start-expo.sh exists"

test -f test-connections.sh
check $? "test-connections.sh exists"

test -f SUMMARY.md
check $? "SUMMARY.md exists"

test -f START_HERE.md
check $? "START_HERE.md exists"

test -f EXPO_PREVIEW_FIX.md
check $? "EXPO_PREVIEW_FIX.md exists"

echo ""
echo "🔧 Checking Script Permissions..."
echo ""

# Check executability
test -x quick-start.sh
check $? "quick-start.sh is executable"

test -x fix-tunnel-error.sh
check $? "fix-tunnel-error.sh is executable"

test -x start-expo.sh
check $? "start-expo.sh is executable"

test -x test-connections.sh
check $? "test-connections.sh is executable"

echo ""
echo "📱 Checking App Integration..."
echo ""

# Check if connectionHelper is imported in _layout
grep -q "connectionHelper" app/_layout.tsx
check $? "Connection monitoring integrated in app/_layout.tsx"

# Check if push notifications are intact
grep -q "initializeNotifications" app/_layout.tsx
check $? "Push notifications initialization intact"

# Check if cleanup is present
grep -q "cleanupNotifications" app/_layout.tsx
check $? "Push notifications cleanup intact"

echo ""
echo "🗂️ Checking Configuration..."
echo ""

# Check app.json for project ID
grep -q "b22ezxscydzxy6y59xv7e" app.json
check $? "Project ID present in app.json"

# Check for push notification plugin
grep -q "expo-notifications" app.json
check $? "expo-notifications plugin configured"

echo ""
echo "============================================"
echo "📊 VERIFICATION RESULTS"
echo "============================================"
echo ""
echo -e "Passed: ${GREEN}${PASS}${NC}"
echo -e "Failed: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo "You're ready to go! Run:"
    echo "  ./quick-start.sh"
    echo ""
    echo "Or if experiencing errors:"
    echo "  ./fix-tunnel-error.sh"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  SOME CHECKS FAILED${NC}"
    echo ""
    echo "If scripts are not executable, run:"
    echo "  chmod +x *.sh"
    echo ""
    echo "If files are missing, check the installation."
    echo ""
    exit 1
fi
