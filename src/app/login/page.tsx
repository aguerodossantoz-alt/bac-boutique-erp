import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect("/catalog");
  }

  const params = await searchParams;
  const hasError =
    params.error === "CredentialsSignin" || params.error === "credentials";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
          BAC Boutique ERP
        </div>

        <h1 className="mt-3 text-3xl font-semibold">Вход</h1>

        <p className="mt-3 text-sm text-zinc-400">
          Вход по логину и паролю.
        </p>

        <LoginForm
          hasError={hasError}
          loginAction={async (formData) => {
            "use server";

            const username = String(formData.get("username") ?? "").trim();
            const password = String(formData.get("password") ?? "").trim();
            const remember = String(formData.get("remember") ?? "") === "1";

            try {
              await signIn("credentials", {
                username,
                password,
                remember,
                redirectTo: "/",
              });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect("/login?error=CredentialsSignin");
              }
              throw error;
            }
          }}
        />
      </div>
    </div>
  );
}
