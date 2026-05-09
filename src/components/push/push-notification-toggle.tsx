"use client";

import { useMemo, useState } from "react";

type Props = {
  role: "owner" | "admin" | "cashier";
  store: string;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationToggle({ role, store }: Props) {
  const [message, setMessage] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  const supported = useMemo(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
    []
  );

  if (role !== "owner" && role !== "admin") return null;

  async function enablePush() {
    try {
      setLoading(true);

      if (!supported) {
        setMessage("На iPhone добавьте сайт на экран Домой и откройте его как приложение");
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setMessage("VAPID ключ не настроен");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage("Разрешение на уведомления не выдано");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON(), role, store }),
      });

      if (!response.ok) {
        setMessage("Не удалось включить push-уведомления");
        return;
      }

      setEnabled(true);
      setMessage("Push-уведомления включены");
    } catch (error) {
      console.error(error);
      setMessage("Ошибка подключения push-уведомлений");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
      <button
        type="button"
        onClick={enablePush}
        disabled={loading || enabled}
        className="rounded-xl border border-white/20 px-4 py-2 text-white disabled:opacity-60"
      >
        {enabled ? "Push-уведомления включены" : "Включить push-уведомления"}
      </button>
      {message ? <p className="mt-2 text-zinc-400">{message}</p> : null}
    </div>
  );
}
