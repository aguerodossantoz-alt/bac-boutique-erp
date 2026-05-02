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
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const username = String(credentials?.username ?? "").trim();
        const password = String(credentials?.password ?? "").trim();

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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = normalizeRole((user as { role?: unknown }).role);
        token.username = String(
          (user as { username?: string }).username ?? ""
        );
        token.store = String((user as { store?: string }).store ?? "");
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