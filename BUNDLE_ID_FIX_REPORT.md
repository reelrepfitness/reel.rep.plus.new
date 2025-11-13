# Bundle ID Standardization Report

## Executive Summary

**Date:** 2025-11-12
**Task:** Standardize all Bundle IDs across the entire codebase to use `com.reelrepplus.ios`
**Status:** ✅ COMPLETED
**Files Changed:** 5 files

---

## Problem Statement

The app had **critical inconsistencies** in Bundle IDs across different platforms and configuration files:

- **iOS:** Used `com.reelrepplus.ios` ✅ (Correct)
- **Android (app.json/app.config.js):** Used `com.reelrep.plus` ❌ (WRONG - missing "plus" concatenation)
- **Android (build.gradle):** Used `com.reelrepplus` ❌ (WRONG - missing .ios suffix)
- **iOS (Xcode project):** Used `org.name.reelrepplus` ❌ (WRONG - placeholder identifier)

This inconsistency would cause:
- **OAuth authentication failures** (Google/Apple Sign-In)
- **Push notification routing issues**
- **Deep linking failures**
- **App Store/Play Store conflicts**

---

## Complete List of Changes

### 1. app.json
**File:** `/home/user/reel-rep-plus-app/app.json`
**Line:** 35

**BEFORE:**
```json
"package": "com.reelrep.plus"
```

**AFTER:**
```json
"package": "com.reelrepplus.ios"
```

---

### 2. app.config.js
**File:** `/home/user/reel-rep-plus-app/app.config.js`
**Line:** 35

**BEFORE:**
```javascript
package: "com.reelrep.plus"
```

**AFTER:**
```javascript
package: "com.reelrepplus.ios"
```

---

### 3. android/app/build.gradle (namespace)
**File:** `/home/user/reel-rep-plus-app/android/app/build.gradle`
**Line:** 90

**BEFORE:**
```gradle
namespace "com.reelrepplus"
```

**AFTER:**
```gradle
namespace "com.reelrepplus.ios"
```

---

### 4. android/app/build.gradle (applicationId)
**File:** `/home/user/reel-rep-plus-app/android/app/build.gradle`
**Line:** 92

**BEFORE:**
```gradle
applicationId "com.reelrepplus"
```

**AFTER:**
```gradle
applicationId "com.reelrepplus.ios"
```

---

### 5. ios/reelrepplus.xcodeproj/project.pbxproj
**File:** `/home/user/reel-rep-plus-app/ios/reelrepplus.xcodeproj/project.pbxproj`
**Lines:** 262, 289 (Debug & Release configurations)

**BEFORE:**
```
PRODUCT_BUNDLE_IDENTIFIER = org.name.reelrepplus;
```

**AFTER:**
```
PRODUCT_BUNDLE_IDENTIFIER = com.reelrepplus.ios;
```

---

## Verification

### Files Checked (No Changes Needed)

✅ **app.json (iOS section)** - Already correct:
```json
"bundleIdentifier": "com.reelrepplus.ios"
```

✅ **eas.json** - No Bundle ID overrides found

✅ **package.json** - No Bundle ID references

✅ **android/app/src/main/AndroidManifest.xml** - Uses namespace from build.gradle (no hardcoded package)

✅ **ios/reelrepplus/Info.plist** - Uses `$(PRODUCT_BUNDLE_IDENTIFIER)` variable reference

✅ **Source code (.ts/.tsx files)** - No hardcoded Bundle ID references found

---

## Migration Concerns & Required Actions for Ivan

### 🚨 CRITICAL: OAuth Configuration Updates Required

Both **Google Sign-In** and **Apple Sign-In** configurations need to be updated with the new Bundle ID.

#### 1. Google Cloud Console
**Action Required:** Update OAuth 2.0 Client IDs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: **APIs & Services** → **Credentials**
3. Update **Android OAuth Client ID:**
   - Change package name from `com.reelrep.plus` or `com.reelrepplus` to `com.reelrepplus.ios`
   - Keep the same SHA-1 certificate fingerprint
4. Update **iOS OAuth Client ID:**
   - Change Bundle ID from `org.name.reelrepplus` to `com.reelrepplus.ios`
5. Update `.env` file with new client IDs (if they changed)

#### 2. Apple Developer Portal
**Action Required:** Update App ID and Sign In with Apple configuration

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Navigate to: **Certificates, Identifiers & Profiles** → **Identifiers**
3. Create/Update App ID:
   - Bundle ID: `com.reelrepplus.ios`
   - Enable **Sign In with Apple** capability
4. Update provisioning profiles with new Bundle ID
5. Update Service ID for Sign In with Apple (if using web authentication flow)

---

### 📱 Firebase Configuration Updates

If using Firebase Analytics (as configured in Phase 2):

1. **Firebase Console:**
   - Update Android package name: `com.reelrepplus.ios`
   - Update iOS Bundle ID: `com.reelrepplus.ios`
   - Download new `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
   - Replace existing files in:
     - `android/app/google-services.json`
     - `ios/reelrepplus/GoogleService-Info.plist`

---

### 🔗 Deep Linking Updates

#### Associated Domains (iOS)
✅ Already configured correctly in app.json:
```json
"associatedDomains": ["applinks:reelrepplus.com"]
```

**Action Required:**
1. Verify Apple App Site Association (AASA) file is hosted at:
   - `https://reelrepplus.com/.well-known/apple-app-site-association`
2. Update AASA file to reference new Bundle ID: `com.reelrepplus.ios`

Example AASA:
```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.reelrepplus.ios",
        "paths": ["*"]
      }
    ]
  }
}
```

#### App Links (Android)
✅ Already configured correctly in app.config.js:
```javascript
intentFilters: [
  {
    action: "VIEW",
    autoVerify: true,
    data: [{ scheme: "https", host: "reelrepplus.com", pathPrefix: "/" }],
    category: ["BROWSABLE", "DEFAULT"]
  }
]
```

**Action Required:**
1. Verify Digital Asset Links file is hosted at:
   - `https://reelrepplus.com/.well-known/assetlinks.json`
2. Update assetlinks.json to reference new package name: `com.reelrepplus.ios`

Example assetlinks.json:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.reelrepplus.ios",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

---

### 🔐 Keystore & Signing Certificates

#### Android Keystore
**Status:** Using debug keystore in current configuration

**Before Production Release:**
1. Generate production keystore with new package name
2. Update `android/app/build.gradle` signing config
3. Store keystore securely (NEVER commit to git)
4. Update Google Play Console with new signing key

#### iOS Certificates
**Action Required:**
1. Regenerate provisioning profiles with new Bundle ID: `com.reelrepplus.ios`
2. Update signing certificates in Xcode
3. Update EAS Build configuration if using Expo Application Services

---

### 📦 App Store Submissions

#### Google Play Store
**Impact:** Package name change = NEW app listing

**Options:**
1. **Create new app listing** with `com.reelrepplus.ios` (recommended)
   - Allows clean migration
   - No conflicts with old package name
2. **Update existing listing** (NOT POSSIBLE - package name is immutable after first upload)

**Migration Path:**
- If app is already published: You MUST create a new Play Store listing
- Existing users will need to uninstall old app and install new one
- Cannot migrate user data automatically

#### Apple App Store
**Impact:** Bundle ID change = NEW app listing

**Options:**
1. **Create new app listing** with `com.reelrepplus.ios` (recommended)
   - Requires new App Store Connect entry
   - New App ID in Developer Portal
2. **Cannot update existing** - Bundle ID is immutable

**Migration Path:**
- If app is already published: You MUST create a new App Store listing
- Existing users will need to reinstall
- Cannot migrate app data automatically (unless you implement cloud backup/restore)

---

### 🔔 Push Notifications

#### Expo Push Notifications
✅ No changes required - Expo handles this automatically

#### Firebase Cloud Messaging (FCM)
**Action Required:**
1. Update FCM configuration in Firebase Console
2. Verify `google-services.json` has correct package name
3. Test push notifications after rebuild

#### Apple Push Notification Service (APNs)
**Action Required:**
1. Generate new APNs certificates for `com.reelrepplus.ios`
2. Upload to Firebase Console (if using FCM)
3. Update provisioning profiles with Push Notifications capability

---

### ✅ Testing Checklist

Before deploying to production, test the following:

#### Authentication
- [ ] Email/password sign-in works
- [ ] Google Sign-In works on Android
- [ ] Google Sign-In works on iOS
- [ ] Apple Sign-In works on iOS
- [ ] Sign-out works properly

#### Deep Linking
- [ ] App opens from notification taps
- [ ] Universal Links work (iOS)
- [ ] App Links work (Android)
- [ ] URL scheme `reelrepplus://` works

#### Push Notifications
- [ ] Notifications received on Android
- [ ] Notifications received on iOS
- [ ] Notification tap navigation works
- [ ] Background notifications work

#### Analytics
- [ ] Firebase Analytics events tracked
- [ ] User properties set correctly
- [ ] Screen views logged

#### Build & Deploy
- [ ] Android debug build succeeds
- [ ] Android release build succeeds
- [ ] iOS debug build succeeds
- [ ] iOS release build succeeds
- [ ] EAS Build succeeds (if using)

---

## Build Commands

### Clean Rebuild Required

After these changes, you MUST perform clean rebuilds:

```bash
# Clean all build artifacts
rm -rf android/build
rm -rf android/app/build
rm -rf ios/build
rm -rf node_modules/.cache

# Reinstall dependencies
bun install

# Prebuild (regenerates native projects with new Bundle ID)
bunx expo prebuild --clean

# For local development
bunx expo run:android  # Android
bunx expo run:ios      # iOS

# For EAS Build
eas build --platform android --profile production
eas build --platform ios --profile production
```

---

## Environment Variables

### No Changes Required to .env

The `.env` file does not directly reference Bundle IDs. However, verify these values:

```env
EXPO_PUBLIC_APP_SCHEME=reelrepplus  # ✅ Correct - matches scheme in app.json

# OAuth Client IDs - UPDATE THESE AFTER GOOGLE CLOUD CONSOLE CHANGES
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your_web_client_id_here
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id_here
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id_here

# Firebase - UPDATE THESE AFTER FIREBASE CONSOLE CHANGES
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
# ... other Firebase config
```

---

## Summary

### What Changed
- ✅ Standardized ALL Bundle IDs to `com.reelrepplus.ios` across iOS and Android
- ✅ Fixed 5 configuration files
- ✅ Ensured consistency across app.json, app.config.js, build.gradle, and Xcode project

### What Ivan Needs to Do
1. **Update Google OAuth** configuration with new Bundle ID
2. **Update Apple Sign In** configuration with new Bundle ID
3. **Update Firebase** configuration (if using)
4. **Update associated domains** configuration (AASA & assetlinks.json)
5. **Regenerate signing certificates** and provisioning profiles
6. **Clean rebuild** the app (`expo prebuild --clean`)
7. **Test ALL authentication flows** thoroughly
8. **Consider migration strategy** if app is already published

### Migration Timeline Recommendation
1. **Week 1:** Update all OAuth and service configurations
2. **Week 2:** Test thoroughly in development
3. **Week 3:** Submit to App Store/Play Store as NEW app
4. **Week 4:** Coordinate migration communication to existing users (if applicable)

---

## Notes

- The `.ios` suffix in the Android package name (`com.reelrepplus.ios`) is **unusual** but valid
- This ensures 100% consistency across platforms
- No technical limitations prevent this naming convention
- All services (Google, Apple, Firebase) support arbitrary package/bundle names

---

**Report Generated:** 2025-11-12
**Prepared By:** Claude (Production Audit - Phase 3)
**Session:** claude/reel-rep-plus-production-audit-011CV41MJUxViWaURBc1w2jU
