import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function roleOf(session: any) { return String(session?.user?.role ?? "").toLowerCase(); }
function isOwnerAdmin(session: any) { const r = roleOf(session); return r === "owner" || r === "admin"; }

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  if (!isOwnerAdmin(session)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });

  const { id } = await context.params;
  const body = await request.json();
  const row = await prisma.recurringExpenseTemplate.update({
    where: { id: Number(id) },
    data: {
      title: body.title,
      amount: body.amount == null ? undefined : Number(body.amount),
      category: body.category,
      store: body.store === "" ? null : body.store,
      comment: body.comment === "" ? null : body.comment,
      isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      dayOfMonth: body.dayOfMonth == null ? undefined : Number(body.dayOfMonth),
    },
  });
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Не авторизован." }, { status: 401 });
  if (!isOwnerAdmin(session)) return NextResponse.json({ error: "Недостаточно прав." }, { status: 403 });

  const { id } = await context.params;
  await prisma.recurringExpenseTemplate.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
