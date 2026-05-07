import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type AppRole = "owner" | "admin" | "cashier";

function normalizeRole(value: unknown): AppRole {
  const raw = String(value ?? "").trim().toUpperCase();

  if (raw === "OWNER") return "owner";
  if (raw === "ADMIN") return "admin";
  if (raw === "CASHIER") return "cashier";

  return "cashier";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
        remember: { label: "Запомнить меня", type: "checkbox" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "").trim();
        const rememberRaw = String(credentials?.remember ?? "").toLowerCase();
        const remember =
          rememberRaw === "true" || rememberRaw === "1" || rememberRaw === "on";

        if (!username || !password) {
          return null;
        }

        const user = await (prisma as any).user.findUnique({
          where: { username },
        });

        if (!user || !user.isActive) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: String(user.id),
          name: user.displayName,
          username: user.username,
          role: normalizeRole(user.role),
          store: user.store ?? "",
          remember,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const remember = Boolean((user as { remember?: boolean }).remember);

        token.role = normalizeRole((user as { role?: unknown }).role);
        token.username = String(
          (user as { username?: string }).username ?? ""
        );
        token.store = String((user as { store?: string }).store ?? "");
        token.remember = remember;

        const now = Math.floor(Date.now() / 1000);
        token.exp = remember ? now + 30 * 24 * 60 * 60 : now + 24 * 60 * 60;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (
          session.user as {
            role?: string;
            username?: string;
            store?: string;
          }
        ).role = normalizeRole(token.role);

        (
          session.user as {
            role?: string;
            username?: string;
            store?: string;
          }
        ).username = String(token.username ?? "");

        (
          session.user as {
            role?: string;
            username?: string;
            store?: string;
          }
        ).store = String(token.store ?? "");
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  debug: true,
});