import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function roleOf(session: any) { return String(session?.user?.role ?? "").toLowerCase(); }
function isOwnerAdmin(session: any) { const r = roleOf(session); return r === "owner" || r === "admin"; }

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  if (!isOwnerAdmin(session)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });

  const rows = await prisma.recurringExpenseTemplate.findMany({ orderBy: [{ id: "desc" }] });
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  if (!isOwnerAdmin(session)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });

  const body = await request.json();
  const row = await prisma.recurringExpenseTemplate.create({
    data: {
      title: String(body.title ?? "").trim(),
      amount: Number(body.amount ?? 0),
      category: String(body.category ?? "Прочее").trim() || "Прочее",
      store: String(body.store ?? "").trim() || null,
      comment: String(body.comment ?? "").trim() || null,
      dayOfMonth: Number(body.dayOfMonth ?? 1),
      isActive: Boolean(body.isActive ?? true),
    },
  });

  return NextResponse.json({ ok: true, row });
}
