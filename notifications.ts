import messaging from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';

export async function registerForPushNotifications() {
  if (Platform.OS !== 'android') return null;

  // Android 13+ runtime permission.
  if (Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (result !== PermissionsAndroid.RESULTS.GRANTED) return null;
  }

  const status = await messaging().requestPermission();
  const enabled =
    status === messaging.AuthorizationStatus.AUTHORIZED ||
    status === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) return null;

  await messaging().registerDeviceForRemoteMessages();
  return await messaging().getToken();
}

export function listenForForegroundMessages(onMessage: (title: string, body: string) => void) {
  return messaging().onMessage(async remoteMessage => {
    onMessage(
      remoteMessage.notification?.title ?? 'DROPZONE',
      remoteMessage.notification?.body ?? 'You have a new update.'
    );
  });
}

// Background handler must be registered at the app entry point in a production build.
messaging().setBackgroundMessageHandler(async remoteMessage => {
  // Android notification payloads are displayed by the system when app is backgrounded.
  // Data-only payloads need a native/local-notification presentation implementation.
  console.log('Background message received', remoteMessage.messageId);
});