"use client";

import { useEffect, useState } from "react";

const SAVED_LOGIN_KEY = "bac_erp_saved_login";
const SESSION_MODE_KEY = "bac_erp_session_mode";

export function LoginForm({
  hasError,
  loginAction,
}: {
  hasError: boolean;
  loginAction: (formData: FormData) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem(SAVED_LOGIN_KEY);

    if (savedUsername) {
      setUsername(savedUsername);
      setRemember(true);
    }
  }, []);

  const onRememberChange = (checked: boolean) => {
    setRemember(checked);

    if (!checked) {
      localStorage.removeItem(SAVED_LOGIN_KEY);
    } else if (username.trim()) {
      localStorage.setItem(SAVED_LOGIN_KEY, username.trim());
    }
  };

  const onUsernameChange = (value: string) => {
    setUsername(value);

    if (remember) {
      const trimmed = value.trim();
      if (trimmed) {
        localStorage.setItem(SAVED_LOGIN_KEY, trimmed);
      } else {
        localStorage.removeItem(SAVED_LOGIN_KEY);
      }
    }
  };

  return (
    <form
      autoComplete="off"
      action={loginAction}
      className="mt-6 space-y-4"
      onSubmit={() => {
        const mode = remember ? "persistent" : "session";
        if (remember) {
          localStorage.setItem(SESSION_MODE_KEY, mode);
          sessionStorage.removeItem(SESSION_MODE_KEY);
        } else {
          sessionStorage.setItem(SESSION_MODE_KEY, mode);
          localStorage.removeItem(SESSION_MODE_KEY);
        }
      }}
    >
      <div>
        <div className="mb-2 text-sm text-zinc-400">Логин</div>
        <input
          name="username"
          type="text"
          placeholder="Введите логин"
          autoComplete="username"
          spellCheck={false}
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 text-white outline-none placeholder:text-zinc-500"
        />
      </div>

      <div>
        <div className="mb-2 text-sm text-zinc-400">Пароль</div>
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Введите пароль"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-white/10 bg-[#090909] px-4 py-4 pr-14 text-white outline-none placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-lg leading-none text-zinc-300 transition hover:bg-white/10"
          >
            {showPassword ? "🙈" : "👁"}
          </button>
        </div>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => onRememberChange(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-[#090909] text-emerald-400 accent-emerald-400"
        />
        <span>Запомнить меня</span>
      </label>

      <input type="hidden" name="remember" value={remember ? "1" : "0"} />

      {hasError && (
        <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
          Неверный логин или пароль
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
      >
        Войти
      </button>
    </form>
  );
}
