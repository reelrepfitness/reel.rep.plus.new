#!/bin/bash

# Emergency fix for ERR_NGROK_3200
echo "🚨 Emergency Fix for Tunnel Errors"
echo "==================================="
echo ""

# 1. Kill all ngrok processes
echo "1️⃣  Killing ngrok processes..."
pkill -9 ngrok 2>/dev/null || true
sleep 1

# 2. Kill metro bundler
echo "2️⃣  Killing Metro bundler..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
sleep 1

# 3. Clean Expo cache
echo "3️⃣  Cleaning Expo cache..."
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# 4. Clean ngrok state
echo "4️⃣  Cleaning ngrok state..."
rm -rf ~/.ngrok2 2>/dev/null || true

# 5. Clean temp files
echo "5️⃣  Cleaning temp files..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-map-* 2>/dev/null || true

echo ""
echo "✅ Emergency cleanup complete!"
echo ""
echo "Now starting with LAN (recommended)..."
echo ""

npx expo start --lan --clear
