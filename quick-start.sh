#!/bin/bash

# Quick Start - LAN (Recommended)
echo "🚀 Starting Expo with LAN..."
echo "Make sure your phone and computer are on the same WiFi network"
echo ""

# Kill existing metro
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Start with LAN
npx expo start --lan --clear
