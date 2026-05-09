import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!(session as { user?: unknown } | null)?.user) {
      return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
    }

    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "").trim();

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint обязателен." }, { status: 400 });
    }

    await prisma.pushSubscription.deleteMany({ where: { endpoint } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Push unsubscribe error:", error);
    return NextResponse.json({ error: "Не удалось удалить push-подписку." }, { status: 500 });
  }
}
