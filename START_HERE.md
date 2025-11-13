# 🎯 IMMEDIATE ACTION REQUIRED

Run these commands in your terminal NOW to fix the Expo preview:

## Step 1: Make Scripts Executable
```bash
chmod +x quick-start.sh fix-tunnel-error.sh start-expo.sh test-connections.sh
```

## Step 2: Choose ONE Method Below

### Method A: Emergency Fix (Recommended if currently broken)
```bash
./fix-tunnel-error.sh
```
This will:
- Kill ngrok processes
- Clean all cache
- Start with LAN connection

### Method B: Quick Start (For daily use)
```bash
./quick-start.sh
```
This starts Expo with LAN (fastest and most reliable).

### Method C: Test First (Diagnostic)
```bash
./test-connections.sh
```
This tests all connection methods and recommends the best one.

## Step 3: Scan QR Code

1. Open **Expo Go** app on your phone
2. Make sure phone and computer are on **same WiFi network**
3. Scan the QR code that appears
4. App should load within 10-30 seconds

---

## If You Still Get Errors

### Error: ERR_NGROK_3200
```bash
./fix-tunnel-error.sh
```

### Error: Port 8081 already in use
```bash
lsof -ti:8081 | xargs kill -9
./quick-start.sh
```

### Error: Network timeout
```bash
# Check WiFi, then:
./quick-start.sh
```

---

## Alternative: Manual Commands

If scripts don't work, use these commands:

### Clean Everything
```bash
rm -rf .expo node_modules/.cache ~/.ngrok2
pkill -9 ngrok
```

### Start with LAN
```bash
npx expo start --lan --clear
```

### Start with Tunnel (if LAN fails)
```bash
npx expo start --tunnel --clear
```

---

## ✅ Success Indicators

You should see:
```
✅ Using LAN connection (recommended)
✅ Metro waiting on exp://192.168.x.x:8081
```

And a QR code in your terminal.

---

## 📱 On Your Phone

1. Open Expo Go app
2. Tap "Scan QR code"
3. Point camera at QR code in terminal
4. Wait for app to load

---

## 🔍 Check Logs

When app loads, check console for:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Expo Connection Status
Method: LAN
Connected: ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This confirms connection monitoring is active.

---

## 🎬 TL;DR - Do This Now

```bash
# One command to rule them all
chmod +x *.sh && ./fix-tunnel-error.sh
```

Then scan the QR code with Expo Go on your phone.

**Done!** 🎉

---

For detailed documentation, see:
- **SUMMARY.md** - Quick reference guide
- **EXPO_PREVIEW_FIX.md** - Complete documentation
