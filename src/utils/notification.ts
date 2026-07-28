export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === "undefined" || !("Notification" in window)) return null;

  const { getMessaging, getToken, isSupported } = await import(
    "firebase/messaging"
  );
  const { firebaseApp } = await import("../lib/firebase");

  const supported = await isSupported();
  if (!supported) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey:
      "BMUrdJe582ghlwOHRQAEF9aPRKkb6Fv-e3e6wBDhpB5MQ8_NMMbJBuL6Ps55Pv5WyVLqZr0JPqJ31YC8PIMtsNM",
  });

  return token;
}
