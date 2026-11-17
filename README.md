# DROPZONE native Android starter

This is a native React Native / Expo starter for a **free-entry, non-cash** esports tournament app. It is not a finished production system. Firebase credentials, Firestore security rules, admin authorization, token storage, server-side FCM sending and device testing must be configured before release.

## 1. What you need
- A computer or cloud development environment that supports Node.js and Android builds.
- A Firebase project.
- An Expo account.
- Android device for testing.

## 2. Firebase setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Add an Android app with package name `com.dropzone.esports`.
3. Download `google-services.json` and place it in the project root.
4. In Firebase project settings, create a Web App and copy its config into `src/firebase.ts`.
5. Enable Email/Password under Authentication > Sign-in method.
6. Create a Firestore database.
7. Do not use open/public Firestore rules. Restrict each user to their own profile and permit tournament reads only as intended. Admin writes must be protected by server-verified custom claims, not a hidden UI route or hardcoded password.

## 3. Install and run
```bash
npm install
npx expo install --fix
npx expo prebuild --clean
npx expo run:android
```
Native Firebase Messaging requires a native development build; Expo Go is not sufficient.

## 4. FCM backend
The app obtains an FCM device token after permission. A secure backend must store tokens against authenticated user/device records and send FCM HTTP v1 messages using a service account stored only on the server. Never put service-account credentials in the app. Tournament reminders require trusted server-side scheduling and verified tournament start times. Android notification permission alone does not create or send notifications.

## 5. Build APK
```bash
npm install -g eas-cli
eas login
eas build:configure
```
Set your real EAS project ID in `app.json`, then:
```bash
eas build --platform android --profile preview
```
Download the APK from the EAS build page and install it on your Android phone.

## Important limitations
- This starter includes basic email auth, a Firestore tournament reader, UI navigation, and native FCM permission/token registration.
- It does not yet include a production admin panel, tournament join/payment workflows, token persistence backend, notification sending service, scheduled reminder worker, or hardened Firestore rules.
- Do not publish until those pieces are implemented and tested.
