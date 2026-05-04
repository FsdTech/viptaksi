# Driver-App & Rider-App Fix Report

## Scope
- Applied critical fixes across `driver-app` and `rider-app`.
- Focused on runtime blockers, auth/token consistency, native bridge mismatches, and production build hygiene.

## Fixed Issues

### 1) iOS MethodChannel mismatch (driver)
- **Fixed:** `apps/driver-app/ios/Runner/AppDelegate.swift`
- **What changed:**
  - Unified channel names to:
    - `com.vipstar.taxidriver/floating_bubble`
    - `com.vipstar.taxidriver/ringtone`
- **Result:** Flutter <-> iOS native calls now use the same channel IDs.

### 2) Google Maps key hardcoded/placeholder handling (both apps)
- **Fixed files:**
  - `apps/driver-app/ios/Runner/AppDelegate.swift`
  - `apps/rider-app/ios/Runner/AppDelegate.swift`
  - `apps/driver-app/android/app/src/main/AndroidManifest.xml`
  - `apps/rider-app/android/app/src/main/AndroidManifest.xml`
  - `apps/driver-app/ios/Runner/Info.plist`
  - `apps/rider-app/ios/Runner/Info.plist`
  - `apps/driver-app/lib/core/services/config.dart`
  - `apps/rider-app/lib/core/services/config.dart`
- **What changed:**
  - iOS AppDelegate now reads `GMSApiKey` from `Info.plist` and logs clear warning if placeholder/missing.
  - Android manifest switched to `${MAPS_API_KEY}` placeholder.
  - iOS `Info.plist` switched `GMSApiKey` to `$(MAPS_API_KEY)`.
  - Dart config switched to `--dart-define=GOOGLE_MAPS_API_KEY=...` with validity check helper.
- **Result:** Removed hardcoded key dependency and centralized runtime config behavior.

### 3) Release signing config hardened (both apps)
- **Fixed files:**
  - `apps/driver-app/android/app/build.gradle`
  - `apps/rider-app/android/app/build.gradle`
- **What changed:**
  - Added conditional `signingConfigs.release` from `key.properties`.
  - `release` now uses release keystore if available; otherwise falls back to debug signing.
  - Added `manifestPlaceholders` support for `MAPS_API_KEY`.
- **Result:** Production signing path is now prepared without breaking local builds.

### 4) Rider duplicate Gradle source-of-truth removed
- **Fixed:** deleted `apps/rider-app/android/app/build.gradle.kts`
- **Result:** single authoritative Gradle app module config (`build.gradle`).

### 5) Native API URL safety checks (both apps)
- **Fixed files:**
  - `apps/driver-app/lib/core/viptaksi/viptaksi_config.dart`
  - `apps/rider-app/lib/core/viptaksi/viptaksi_config.dart`
  - `apps/driver-app/lib/main.dart`
  - `apps/rider-app/lib/main.dart`
- **What changed:**
  - Added localhost detection helpers.
  - Added startup warnings when `VIPTAKSI_NATIVE=true` but URL points to localhost.
- **Result:** prevents silent misconfiguration in native mode.

### 6) Refresh token rotation handling (both apps)
- **Fixed files:**
  - `apps/driver-app/lib/core/viptaksi/viptaksi_dio.dart`
  - `apps/rider-app/lib/core/viptaksi/viptaksi_dio.dart`
- **What changed:**
  - Refresh interceptor now persists `refreshToken` from refresh response when returned.
- **Result:** compatible with rotating refresh-token backends.

### 7) Auth/token source sync with native socket (both apps)
- **Fixed files (token write + socket reconnect):**
  - `apps/driver-app/lib/core/extensions/workspace.dart`
  - `apps/rider-app/lib/core/extensions/workspace.dart`
  - `apps/driver-app/lib/presentation/cubits/auth/login_cubit.dart`
  - `apps/driver-app/lib/presentation/cubits/auth/user_authenticate_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/login_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/user_authenticate_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/google_login_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/apple_login_cubit.dart`
- **What changed:**
  - After successful login/social login, access token is mirrored into `ViptaksiAuthStore`.
  - Triggered `ViptaksiSocket.reconnectWithNewToken()` after token updates.
- **Result:** native socket/auth no longer stays stale after successful login.

### 8) Logout cleanup for native auth store (both apps)
- **Fixed files:**
  - `apps/driver-app/lib/presentation/cubits/logout_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/logout_cubit.dart`
- **What changed:**
  - Added `ViptaksiAuthStore.clear()` on logout flow.
- **Result:** prevents stale native tokens after sign-out.

### 9) Country reset bug fixed (both apps)
- **Fixed files:**
  - `apps/driver-app/lib/presentation/cubits/auth/user_authenticate_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/user_authenticate_cubit.dart`
- **What changed:**
  - Implemented `SetCountryCubit.reset()` to restore default `+91 / IN`.
- **Result:** auth forms no longer retain stale country state unexpectedly.

### 10) Social login failure state handling improved (rider)
- **Fixed files:**
  - `apps/rider-app/lib/presentation/cubits/auth/google_login_cubit.dart`
  - `apps/rider-app/lib/presentation/cubits/auth/apple_login_cubit.dart`
- **What changed:**
  - Added explicit failure emits for cancellation and non-200 responses.
  - Added catch-path failure emit in Apple flow.
- **Result:** UI now receives explicit failure states instead of silent waiting.

## Validation
- IDE diagnostics check run after edits.
- **Result:** No linter errors reported for modified app scopes.

## Remaining External Inputs (Not auto-fixable in code only)
- iOS Firebase app files currently belong to old RideOn Firebase project (`rideon-1a627`) while Android uses `viptaksi-233d0`.
- To fully unify platform behavior, regenerate iOS `GoogleService-Info.plist` files from the same Firebase project you use on Android, then replace:
  - `apps/driver-app/ios/Runner/GoogleService-Info.plist`
  - `apps/rider-app/ios/Runner/GoogleService-Info.plist`

## Required Run Params
- Use these at runtime:
  - `--dart-define=VIPTAKSI_NATIVE=true`
  - `--dart-define=VIPTAKSI_API_URL=http://10.0.2.2:4000` (emulator) or LAN IP (real device)
  - `--dart-define=GOOGLE_MAPS_API_KEY=YOUR_REAL_KEY`

## Local Stack Alignment (Docker + Admin + Landing)
- Docker Postgres service is `viptaksi-postgres` on `localhost:5432` with db `viptaksi`.
- Backend environment examples were aligned for this local stack:
  - `backend/.env.example` now uses:
    - `DATABASE_URL=postgresql://postgres:1234@localhost:5432/viptaksi`
    - `CORS_ORIGIN` includes both `localhost:5173` (admin) and `localhost:3000` (landing).
- Web app env files added:
  - `apps/admin/.env.example` with `VITE_API_URL=http://localhost:4000`
  - `apps/website/.env` with `VITE_API_URL=http://localhost:4000`
  - `apps/website/.env.example` with `VITE_API_URL=http://localhost:4000`
- Mobile legacy API defaults were aligned to local backend usage:
  - `apps/driver-app/lib/core/services/config.dart`
  - `apps/rider-app/lib/core/services/config.dart`
  - Default is `http://10.0.2.2:4000` (Android emulator host loopback mapping).

