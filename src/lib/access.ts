import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type AppRole = "owner" | "admin" | "cashier";

export async function requireUser() {
  const session = await auth();

  const role = (session?.user as { role?: AppRole } | undefined)?.role;
  const username = (session?.user as { username?: string } | undefined)?.username;
  const store = (session?.user as { store?: string } | undefined)?.store ?? "";

  if (!session?.user || !role || !username) {
    redirect("/login");
  }

  return {
    session,
    role,
    username,
    store,
  };
}

export async function requireOwnerOrAdmin() {
  const user = await requireUser();

  if (user.role !== "owner" && user.role !== "admin") {
    redirect("/sales");
  }

  return user;
}