#!/bin/bash

# Test Connection Script
# Tests all connection methods to verify which ones work

echo "🧪 Testing Expo Connection Methods"
echo "===================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test a connection method
test_connection() {
    local method=$1
    local flag=$2
    
    echo "Testing $method..."
    echo "Starting Expo with $flag..."
    
    # Kill existing metro
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 1
    
    # Start and wait for 5 seconds
    timeout 10s npx expo start $flag --clear > /tmp/expo-test-$method.log 2>&1 &
    local pid=$!
    
    sleep 5
    
    # Check if process is still running
    if kill -0 $pid 2>/dev/null; then
        echo -e "${GREEN}✅ $method: WORKING${NC}"
        kill $pid 2>/dev/null
        return 0
    else
        echo -e "${RED}❌ $method: FAILED${NC}"
        return 1
    fi
}

# Clean first
echo "🧹 Cleaning cache..."
rm -rf .expo node_modules/.cache 2>/dev/null || true
echo ""

# Test tunnel
echo "1️⃣  Testing TUNNEL..."
if test_connection "tunnel" "--tunnel"; then
    TUNNEL_WORKS=true
else
    TUNNEL_WORKS=false
fi
sleep 2
echo ""

# Test LAN
echo "2️⃣  Testing LAN..."
if test_connection "lan" "--lan"; then
    LAN_WORKS=true
else
    LAN_WORKS=false
fi
sleep 2
echo ""

# Test localhost
echo "3️⃣  Testing LOCALHOST..."
if test_connection "localhost" "--localhost"; then
    LOCALHOST_WORKS=true
else
    LOCALHOST_WORKS=false
fi
echo ""

# Summary
echo "======================================"
echo "📊 TEST RESULTS SUMMARY"
echo "======================================"
echo ""

if [ "$TUNNEL_WORKS" = true ]; then
    echo -e "🌐 Tunnel:    ${GREEN}✅ WORKING${NC}"
else
    echo -e "🌐 Tunnel:    ${RED}❌ FAILED (ERR_NGROK_3200?)${NC}"
fi

if [ "$LAN_WORKS" = true ]; then
    echo -e "📡 LAN:       ${GREEN}✅ WORKING${NC}"
else
    echo -e "📡 LAN:       ${RED}❌ FAILED${NC}"
fi

if [ "$LOCALHOST_WORKS" = true ]; then
    echo -e "💻 Localhost: ${GREEN}✅ WORKING${NC}"
else
    echo -e "💻 Localhost: ${RED}❌ FAILED${NC}"
fi

echo ""
echo "======================================"
echo "💡 RECOMMENDATION"
echo "======================================"
echo ""

if [ "$LAN_WORKS" = true ]; then
    echo -e "${GREEN}Use LAN for daily development:${NC}"
    echo "  npx expo start --lan --clear"
    echo ""
    echo "  or use the quick-start script:"
    echo "  ./quick-start.sh"
elif [ "$TUNNEL_WORKS" = true ]; then
    echo -e "${YELLOW}Use TUNNEL (LAN failed):${NC}"
    echo "  npx expo start --tunnel --clear"
else
    echo -e "${RED}Both LAN and TUNNEL failed!${NC}"
    echo "Try the emergency fix:"
    echo "  ./fix-tunnel-error.sh"
fi

echo ""
