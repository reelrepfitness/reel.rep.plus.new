#!/bin/bash

# Expo Preview Connection Helper Script
# Handles tunnel failures and provides fallback options

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🚀 Expo Preview Connection Helper"
echo "=================================="
echo ""

show_menu() {
    echo "Select connection method:"
    echo ""
    echo "  1) 🌐 Tunnel    - Works anywhere (may fail with ERR_NGROK_3200)"
    echo "  2) 📡 LAN       - Local WiFi (RECOMMENDED)"
    echo "  3) 💻 Localhost - Web only"
    echo "  4) 🧹 Clean & Start - Clear cache and start"
    echo "  5) 🔧 Deep Clean - Nuclear option (removes all cache)"
    echo "  6) ❌ Exit"
    echo ""
    read -p "Choose (1-6): " choice
    echo ""
}

kill_metro() {
    echo "🔪 Killing existing Metro bundler..."
    lsof -ti:8081 | xargs kill -9 2>/dev/null || true
    sleep 1
}

clean_cache() {
    echo "🧹 Cleaning Expo cache..."
    rm -rf .expo 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    echo "✅ Cache cleaned"
}

deep_clean() {
    echo "💣 Deep cleaning everything..."
    rm -rf .expo 2>/dev/null || true
    rm -rf node_modules/.cache 2>/dev/null || true
    rm -rf ~/.expo 2>/dev/null || true
    rm -rf /tmp/metro-* 2>/dev/null || true
    rm -rf /tmp/haste-map-* 2>/dev/null || true
    pkill -9 ngrok 2>/dev/null || true
    rm -rf ~/.ngrok2 2>/dev/null || true
    echo "✅ Deep clean complete"
    echo "📦 Reinstalling dependencies..."
    bun install
}

start_tunnel() {
    echo "${YELLOW}🌐 Starting with TUNNEL...${NC}"
    kill_metro
    npx expo start --tunnel --clear
}

start_lan() {
    echo "${GREEN}📡 Starting with LAN...${NC}"
    kill_metro
    npx expo start --lan --clear
}

start_localhost() {
    echo "${GREEN}💻 Starting with LOCALHOST...${NC}"
    kill_metro
    npx expo start --localhost --clear
}

start_clean() {
    clean_cache
    echo "${GREEN}🚀 Starting with clean cache...${NC}"
    kill_metro
    npx expo start --lan --clear
}

# Main logic
show_menu

case $choice in
    1)
        start_tunnel
        ;;
    2)
        start_lan
        ;;
    3)
        start_localhost
        ;;
    4)
        start_clean
        ;;
    5)
        deep_clean
        echo ""
        echo "Now choose how to start:"
        show_menu
        case $choice in
            1) start_tunnel ;;
            2) start_lan ;;
            3) start_localhost ;;
            *) start_lan ;;
        esac
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "${RED}Invalid choice. Defaulting to LAN...${NC}"
        start_lan
        ;;
esac
