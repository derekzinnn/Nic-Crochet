/**
 * Client-safe checkout types shared by the checkout UI and the createOrder
 * server action. No server imports here so it's safe in client components.
 */
import type { DeliveryMethod } from "@/lib/shipping";

export type CheckoutLine = {
  productId: string;
  selectedColors: string[];
  selectedSize: string | null;
  qty: number;
};

export type CheckoutCustomer = {
  name: string;
  email: string;
  phone: string;
};

export type CheckoutAddress = {
  cep: string;
  city: string;
  uf: string;
  street: string; // logradouro + número + complemento
  district: string; // bairro
};

export type CreateOrderInput = {
  lines: CheckoutLine[];
  deliveryMethod: DeliveryMethod;
  // Shipping-only (ignored for pickup):
  shippingCents?: number;
  shippingLabel?: string;
  shippingDays?: number;
  address?: CheckoutAddress;
  customer: CheckoutCustomer;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; trackingToken: string }
  | { ok: false; error: string };

/**
 * E-mail shape check (client + server share it). Deliberately excludes markup
 * and quote characters: the address is echoed into order e-mails and a header
 * field, so `<`, `>` and quotes have no business being in it.
 */
export function isValidEmail(email: string): boolean {
  const value = email.trim();
  if (value.length > 254) return false;
  return /^[^@\s<>"'`\\]+@[^@\s<>"'`\\]+\.[^@\s<>"'`\\]{2,}$/.test(value);
}
