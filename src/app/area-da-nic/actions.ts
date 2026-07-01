"use server";

import { redirect } from "next/navigation";
import { verifyCredentials, createSession, destroySession } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Preencha usuário e senha." };
  }

  const ok = await verifyCredentials(username, password);
  if (!ok) {
    return { error: "Usuário ou senha incorretos." };
  }

  await createSession();
  redirect("/area-da-nic/painel");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/area-da-nic");
}
