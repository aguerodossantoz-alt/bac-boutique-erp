"use client";

import { useEffect, useMemo, useState } from "react";

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
  const [checking, setChecking] = useState(false);

  const supported = useMemo(() => {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSubscription() {
      if (role !== "owner" && role !== "admin") {
        return;
      }

      if (!supported) {
        return;
      }

      setChecking(true);

      try {
        if (Notification.permission === "denied") {
          if (!cancelled) {
            setEnabled(false);
            setMessage("Уведомления заблокированы в настройках браузера.");
          }
          return;
        }

        if (Notification.permission !== "granted") {
          if (!cancelled) {
            setEnabled(false);
            setMessage("");
          }
          return;
        }

        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          if (!cancelled) {
            setEnabled(false);
            setMessage("");
          }
          return;
        }

        const response = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            role,
            store,
          }),
        });

        if (!cancelled) {
          setEnabled(true);
          setMessage("Push-уведомления включены.");

          if (!response.ok) {
            console.error("Не удалось синхронизировать push-подписку с сервером.");
          }
        }
      } catch (error) {
        console.error("Ошибка проверки push-подписки:", error);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    }

    void checkSubscription();

    return () => {
      cancelled = true;
    };
  }, [role, store, supported]);

  if (role !== "owner" && role !== "admin") {
    return null;
  }

  async function enablePush() {
    try {
      setLoading(true);
      setMessage("");

      if (!supported) {
        setMessage(
          "На iPhone добавьте сайт на экран Домой и откройте его как приложение."
        );
        return;
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setMessage("VAPID ключ не настроен. Проверь .env и перезапусти сервер.");
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage("Разрешение на уведомления не выдано.");
        return;
      }

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          role,
          store,
        }),
      });

      if (!response.ok) {
        setMessage("Не удалось включить push-уведомления.");
        return;
      }

      setEnabled(true);
      setMessage("Push-уведомления включены.");
    } catch (error) {
      console.error("Ошибка подключения push:", error);
      setMessage("Ошибка подключения push-уведомлений.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-24 left-3 right-3 z-[99999] rounded-2xl border border-emerald-400/30 bg-[#06140f] p-4 text-sm text-white shadow-2xl shadow-emerald-950/40 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[360px]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.25em] text-emerald-300">
            PUSH
          </div>

          <div className="mt-1 font-semibold text-white">
            Уведомления о продажах
          </div>

          {message ? (
            <div className="mt-2 text-xs leading-5 text-zinc-300">
              {message}
            </div>
          ) : (
            <div className="mt-2 text-xs leading-5 text-zinc-400">
              Включи, чтобы получать системные уведомления о новых продажах.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={enablePush}
          disabled={checking || loading || enabled}
          className="shrink-0 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {checking
            ? "Проверяю..."
            : loading
            ? "Включаю..."
            : enabled
              ? "Включено"
              : "Включить"}
        </button>
      </div>
    </div>
  );
}
