"use server";

import { prisma } from "@/lib/prisma";
import {
  validateCustomOrder,
  type CustomOrderInput,
} from "@/lib/custom-order";

export type SubmitResult = {
  ok: boolean;
  /** Whether the request was written to the DB. When false the WhatsApp handoff
   *  still delivers the request to Nic, so the customer flow succeeds anyway. */
  persisted: boolean;
  error?: string;
};

export async function submitCustomOrder(input: CustomOrderInput): Promise<SubmitResult> {
  const error = validateCustomOrder(input);
  if (error) return { ok: false, persisted: false, error };

  try {
    await prisma.customOrderRequest.create({
      data: {
        pieceType: input.pieceType.trim(),
        size: input.size.trim(),
        colors: input.colors.trim(),
        deadline: input.deadline.trim(),
        details: input.details.trim(),
        name: input.name.trim(),
        contact: input.contact.trim(),
      },
    });
    return { ok: true, persisted: true };
  } catch (err) {
    // DB unavailable (e.g. before Supabase is wired). Don't block the customer —
    // the WhatsApp message carries the full request to Nic. Log for follow-up.
    console.error("[custom-order] persist failed, relying on WhatsApp handoff:", err);
    return { ok: true, persisted: false };
  }
}
