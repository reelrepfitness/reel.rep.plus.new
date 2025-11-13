#!/bin/bash
# Auto-setup script - Run this once to configure everything

echo "🚀 Auto-Setup: Expo Preview Fix"
echo "================================"
echo ""

echo "1️⃣  Making all scripts executable..."
chmod +x quick-start.sh
chmod +x fix-tunnel-error.sh
chmod +x start-expo.sh
chmod +x test-connections.sh
chmod +x verify-fix.sh
echo "   ✅ Scripts are now executable"
echo ""

echo "2️⃣  Verifying installation..."
./verify-fix.sh
echo ""

if [ $? -eq 0 ]; then
    echo "================================"
    echo "🎉 SETUP COMPLETE!"
    echo "================================"
    echo ""
    echo "Ready to start Expo preview. Choose one:"
    echo ""
    echo "  Quick start (LAN):      ./quick-start.sh"
    echo "  Emergency fix:          ./fix-tunnel-error.sh"
    echo "  Interactive menu:       ./start-expo.sh"
    echo "  Test connections:       ./test-connections.sh"
    echo ""
    echo "Read START_HERE.md for detailed instructions."
    echo ""
else
    echo "⚠️  Setup incomplete. Please check errors above."
fi
