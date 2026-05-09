import webpush from "web-push";
import { prisma } from "@/lib/prisma";

type SalePushPayload = {
  saleId: number;
  store: string;
  revenue: number;
  profit: number;
  discount: number;
  itemsCount: number;
  firstProductName: string;
};

let vapidConfigured = false;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const email = process.env.WEB_PUSH_EMAIL;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!email || !publicKey || !privateKey) {
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export async function sendSalePushNotification(sale: SalePushPayload) {
  if (!ensureVapidConfigured()) return;

  const subscriptions = await prisma.pushSubscription.findMany({
    where: {
      role: {
        in: ["owner", "admin"],
      },
    },
  });

  const filtered = subscriptions.filter((subscription) => {
    const subscriptionStore = (subscription.store ?? "").trim();
    return (
      !subscriptionStore ||
      subscriptionStore === "Все магазины" ||
      subscriptionStore === sale.store
    );
  });

  if (!filtered.length) return;

  const payload = JSON.stringify({
    title: `Новая продажа #${sale.saleId}`,
    body: `${sale.store || "Без магазина"} · ${formatCurrency(sale.revenue)} · прибыль ${formatCurrency(sale.profit)} · ${sale.firstProductName}`,
    url: "/sales",
    saleId: sale.saleId,
  });

  await Promise.all(
    filtered.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;

        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription.delete({
            where: { endpoint: subscription.endpoint },
          });
          return;
        }

        console.error("Push notification error:", error);
      }
    })
  );
}
