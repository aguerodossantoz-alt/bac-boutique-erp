import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
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

        <form
          autoComplete="off"
          action={async (formData) => {
            "use server";

            const username = String(formData.get("username") ?? "").trim();
            const password = String(formData.get("password") ?? "").trim();

            try {
              await signIn("credentials", {
                username,
                password,
                redirectTo: "/",
              });
            } catch (error) {
              if (error instanceof AuthError) {
                redirect("/login?error=CredentialsSignin");
              }
              throw error;
            }
          }}
          className="mt-6 space-y-4"
        >
          <div>
            <div className="mb-2 text-sm text-zinc-400">Логин</div>
            <input
              name="username"
              type="text"
              placeholder="Введите логин"
              autoComplete="username"
              spellCheck={false}
              className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />
          </div>

          <div>
            <div className="mb-2 text-sm text-zinc-400">Пароль</div>
            <input
              name="password"
              type="password"
              placeholder="Введите пароль"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
            />
          </div>

          {hasError && (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
              Неверный логин или пароль.
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}