import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function normalizeRole(value: unknown) {
  const role = String(value ?? "").trim().toLowerCase();
  if (role === "owner" || role === "admin" || role === "cashier") return role;
  return "";
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!(session as { user?: unknown } | null)?.user) {
      return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
    }

    const body = await request.json();
    const subscription = body?.subscription;

    const endpoint = String(subscription?.endpoint ?? "").trim();
    const p256dh = String(subscription?.keys?.p256dh ?? "").trim();
    const authKey = String(subscription?.keys?.auth ?? "").trim();

    if (!endpoint || !p256dh || !authKey) {
      return NextResponse.json({ error: "Некорректная push-подписка." }, { status: 400 });
    }

    const sessionUser = (session as { user?: { role?: unknown; store?: unknown } }).user;

    const role = normalizeRole(body?.role) || normalizeRole(sessionUser?.role);
    const store = String(body?.store ?? sessionUser?.store ?? "").trim();
    const userAgent = String(request.headers.get("user-agent") ?? "").trim();

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        endpoint,
        p256dh,
        auth: authKey,
        role: role || null,
        store: store || null,
        userAgent: userAgent || null,
      },
      update: {
        p256dh,
        auth: authKey,
        role: role || null,
        store: store || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push subscribe error:", error);
    return NextResponse.json({ error: "Не удалось сохранить push-подписку." }, { status: 500 });
  }
}
