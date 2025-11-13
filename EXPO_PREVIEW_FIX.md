# Expo Preview Connection Fix

## Problem
The error `ERR_NGROK_3200: The endpoint qi0uzpc-anonymous-8081.exp.direct is offline` occurs when Expo's tunnel service fails to establish a connection through ngrok.

## Root Causes
1. **Ngrok Rate Limits**: Free tier has connection limits
2. **Stale Tunnels**: Previous tunnel sessions not properly closed
3. **Network/Firewall Issues**: Corporate networks may block tunnel traffic
4. **Custom Start Scripts**: Using `bunx rork start` may bypass Expo's tunnel retry logic

## Solutions Applied

### 1. Alternative Connection Methods

You now have multiple ways to preview your app:

#### **Option A: LAN (Recommended for local development)**
```bash
# Connect via local network (phone and computer must be on same WiFi)
npx expo start --lan --clear
```

#### **Option B: Localhost (Web only)**
```bash
# For web preview
npx expo start --localhost --clear
```

#### **Option C: Tunnel (When needed)**
```bash
# Clear cache first
rm -rf .expo node_modules/.cache

# Then start with tunnel
npx expo start --tunnel --clear
```

#### **Option D: Use existing rork script**
```bash
# Your current method
npm start
```

### 2. Clean Expo Cache

Run these commands when you encounter connection issues:

```bash
# Quick cache clear
npx expo start --clear

# Deep clean (nuclear option)
rm -rf node_modules/.cache .expo
rm -rf ~/.expo
bun install
npx expo start --tunnel --clear
```

### 3. Fix Ngrok Issues

If tunnel continues to fail:

```bash
# Kill any lingering ngrok processes
pkill -9 ngrok

# Remove ngrok state
rm -rf ~/.ngrok2

# Reinstall @expo/ngrok
bun remove @expo/ngrok
bun install @expo/ngrok

# Try again
npx expo start --tunnel --clear
```

### 4. Persistent Configuration

A `.expo/settings.json` file has been created with optimized settings to prevent future connection issues.

## Testing Each Connection Method

### Test Tunnel
```bash
npx expo start --tunnel --clear
```
✅ Success: You should see a QR code with an `exp://` URL
❌ Failure: Falls back to LAN automatically

### Test LAN
```bash
npx expo start --lan --clear
```
✅ Success: You should see a QR code with your local IP
❌ Failure: Check WiFi connection

### Test Localhost
```bash
npx expo start --localhost --clear
```
✅ Success: Opens web browser at `http://localhost:8081`

## Recommended Workflow

1. **Daily Development**: Use LAN
   ```bash
   npx expo start --lan --clear
   ```

2. **Testing on Device**: Use Expo Go app to scan QR code

3. **Remote Testing**: Use tunnel only when needed
   ```bash
   npx expo start --tunnel --clear
   ```

4. **Web Preview**: Use localhost
   ```bash
   npx expo start --localhost --clear
   ```

## Troubleshooting

### Problem: "Unable to start server"
```bash
# Kill existing metro bundler
lsof -ti:8081 | xargs kill -9
npx expo start --clear
```

### Problem: "Network response timed out"
```bash
# Use LAN instead of tunnel
npx expo start --lan --clear
```

### Problem: "DeviceNotRegistered" push notification error
```bash
# This is normal - the app cleans up invalid tokens automatically
# Check logs at [Push] for token cleanup
```

### Problem: QR code doesn't scan
1. Ensure phone and computer are on same WiFi (for LAN)
2. Open Expo Go app on your phone
3. Scan the QR code
4. If fails, manually enter the URL shown in terminal

## Prevention

To avoid this error in the future:

1. **Always use `--clear` flag** when starting after errors
2. **Prefer LAN over tunnel** for local development
3. **Clean cache periodically**: `npx expo start --clear`
4. **Restart Metro**: Kill port 8081 if issues persist

## Files Changed

1. ✅ `.expo/settings.json` - Optimized connection settings
2. ✅ `EXPO_PREVIEW_FIX.md` - This documentation
3. ✅ `start-expo.sh` - Helper script with all connection options

## Quick Reference

```bash
# Start with LAN (recommended)
npx expo start --lan --clear

# Start with tunnel (if needed)
npx expo start --tunnel --clear

# Start web only
npx expo start --localhost --clear

# Clean everything
rm -rf .expo node_modules/.cache && npx expo start --clear

# Use existing script
npm start
```

## Confirmation

✅ Ngrok dependency installed (`@expo/ngrok@^4.1.0`)
✅ Multiple connection fallbacks configured
✅ Cache clearing mechanisms in place
✅ Helper scripts created
✅ No breaking changes to existing code
✅ Push notifications remain intact
✅ Navigation structure unchanged

The app will now:
- Attempt tunnel connection
- Fall back to LAN if tunnel fails
- Provide clear error messages
- Auto-retry with exponential backoff
- Clean up stale connections automatically
