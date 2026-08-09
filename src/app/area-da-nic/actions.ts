"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSession, destroySession } from "@/lib/auth";
import {
  checkLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
} from "@/lib/login-throttle";

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuário e senha." };
  }

  // Refuse before touching the password: there is one account to guess, so
  // unlimited tries is the whole attack.
  const gate = await checkLoginAllowed();
  if (!gate.allowed) {
    return {
      error: `Muitas tentativas. Tente novamente em ${gate.retryAfterMin} minuto(s).`,
    };
  }

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    await recordLoginFailure();
    // Deliberately vague: don't reveal which half was wrong.
    return { error: "Usuário ou senha incorretos." };
  }

  await clearLoginFailures();
  await createSession();
  redirect("/area-da-nic/painel");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/area-da-nic");
}
