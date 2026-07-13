"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/area-da-nic/actions";

const initial: LoginState = { error: null };

const fieldLabel = "block text-[11px] tracking-[0.16em] uppercase text-muted-soft mb-[7px]";
const field =
  "w-full bg-sand border border-line-input rounded-[12px] px-[15px] py-[13px] font-sans text-[15px] text-ink outline-none focus:border-sage";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, initial);

  return (
    <form
      action={action}
      className="bg-white border border-line-card rounded-[20px] px-[28px] py-[30px] flex flex-col gap-4 shadow-[0_24px_60px_-36px_rgba(80,82,50,.35)]"
    >
      <label className="block">
        <span className={fieldLabel}>Usuário</span>
        <input name="username" placeholder="nic" autoComplete="username" className={field} />
      </label>
      <label className="block">
        <span className={fieldLabel}>Senha</span>
        <input
          name="password"
          type="password"
          placeholder="••••••"
          autoComplete="current-password"
          className={field}
        />
      </label>

      {state?.error && <div className="text-[13px] text-[#C06A4A]">{state.error}</div>}

      <button
        type="submit"
        disabled={pending}
        className="btn-pill mt-1 bg-ink text-cream py-[15px] hover:bg-sage disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
