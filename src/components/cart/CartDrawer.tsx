"use client";

import Link from "next/link";
import {
  useCart,
  selectCount,
  selectTotalCents,
  useShippingSelection,
} from "@/components/cart/cart-store";
import { brl } from "@/lib/format";
import { colorNames } from "@/lib/custom-order";
import { resolveYarnColors } from "@/lib/yarn-colors";
import ProductMedia from "@/components/product/ProductMedia";
import ShippingBox from "@/components/cart/ShippingBox";

export default function CartDrawer() {
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const count = useCart(selectCount);
  const totalCents = useCart(selectTotalCents);
  const increment = useCart((s) => s.increment);
  const decrement = useCart((s) => s.decrement);
  const remove = useCart((s) => s.remove);
  const { valid: shippingValid, selectedOption } = useShippingSelection();

  if (!isOpen) return null;

  const empty = items.length === 0;
  const canCheckout = shippingValid && !!selectedOption;
  const grandTotalCents = totalCents + (selectedOption?.priceCents ?? 0);

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        onClick={close}
        className="absolute inset-0 bg-[rgba(40,42,28,.42)] backdrop-blur-[3px] animate-fadeUp"
      />
      <aside className="absolute top-0 right-0 h-full w-[min(420px,92vw)] bg-cream shadow-[-30px_0_80px_-30px_rgba(0,0,0,.4)] flex flex-col animate-drawerIn">
        <div className="flex items-center justify-between px-[26px] py-6 border-b border-line-divider">
          <div>
            <div className="font-serif text-[26px] text-ink">Sua sacola</div>
            <div className="text-[12px] tracking-[0.14em] uppercase text-muted-soft">
              {count} item(ns)
            </div>
          </div>
          <button
            onClick={close}
            aria-label="Fechar sacola"
            className="w-[38px] h-[38px] rounded-full border border-line-input bg-transparent text-muted text-[18px] hover:bg-ink hover:text-cream hover:border-ink transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-[26px] py-[18px]">
          {empty ? (
            <div className="text-center px-4 py-[70px]">
              <div
                className="w-20 h-20 mx-auto mb-[22px] rounded-full animate-floaty-slow"
                style={{
                  background:
                    "repeating-radial-gradient(circle at 40% 38%, #C49A6C 0 5px, #B98C58 5px 10px)",
                }}
              />
              <div className="font-serif italic text-[22px] text-muted">Sua sacola está vazia</div>
              <p className="text-[14px] text-muted-soft mt-2">
                Que tal escolher uma peça feita à mão?
              </p>
              <Link
                href="/colecao"
                onClick={close}
                className="inline-block mt-[22px] bg-sage text-cream rounded-pill px-[26px] py-[13px] text-[12px] tracking-[0.12em] uppercase"
              >
                Ver coleção
              </Link>
            </div>
          ) : (
            items.map((i) => (
              <div key={i.lineId} className="flex gap-[14px] py-4 border-b border-line-divider">
                <div className="relative flex-none w-[70px] h-[84px] rounded-[12px] overflow-hidden">
                  <ProductMedia
                    name={i.name}
                    photo={i.photo}
                    colorPrimary={i.colorPrimary}
                    colorSecondary={i.colorSecondary}
                    variant="thumb"
                    sizes="70px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-[10px]">
                    <span className="font-serif text-[19px] text-ink">{i.name}</span>
                    <button
                      onClick={() => remove(i.lineId)}
                      className="bg-none border-none text-[#B7AE96] text-[13px] hover:text-[#C06A4A] transition-colors"
                    >
                      remover
                    </button>
                  </div>
                  {(i.selectedColors.length > 0 || i.selectedSize) && (
                    <div className="flex items-center gap-[6px] mt-1 flex-wrap">
                      {resolveYarnColors(i.selectedColors).map((c) => (
                        <span
                          key={c.id}
                          title={c.name}
                          className="w-[14px] h-[14px] rounded-full border border-black/10"
                          style={{ background: c.hex }}
                        />
                      ))}
                      <span className="text-[12px] text-muted-soft">
                        {[colorNames(i.selectedColors), i.selectedSize ? `tam. ${i.selectedSize}` : ""]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-[2px] border border-line-input rounded-[30px] overflow-hidden">
                      <button
                        onClick={() => decrement(i.lineId)}
                        aria-label="Diminuir"
                        className="w-[30px] h-[30px] bg-transparent text-muted text-[16px] hover:bg-[#F0EAD9]"
                      >
                        −
                      </button>
                      <span className="min-w-[24px] text-center text-[14px] font-semibold text-ink">
                        {i.qty}
                      </span>
                      <button
                        onClick={() => increment(i.lineId)}
                        aria-label="Aumentar"
                        className="w-[30px] h-[30px] bg-transparent text-muted text-[16px] hover:bg-[#F0EAD9]"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-semibold text-sage-deep">{brl(i.priceCents * i.qty)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {!empty && (
          <div className="px-[26px] py-[22px] border-t border-line-divider bg-sand">
            {/* Only the freight block scrolls: the total and the checkout button
                below stay pinned, however many carriers come back. */}
            <div className="max-h-[42vh] overflow-y-auto">
              <ShippingBox />
            </div>

            <div className="border-t border-line-divider pt-3 mb-[14px]">
              <div className="flex justify-between items-baseline text-[13px] text-muted-soft">
                <span>Subtotal</span>
                <span className="text-ink font-semibold">{brl(totalCents)}</span>
              </div>
              <div className="flex justify-between items-baseline text-[13px] text-muted-soft mt-[6px]">
                <span>Frete</span>
                <span className="text-ink font-semibold">
                  {selectedOption ? brl(selectedOption.priceCents) : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline mt-[10px]">
                <span className="text-[13px] tracking-[0.1em] uppercase text-muted-soft">Total</span>
                <span className="font-serif text-[30px] text-ink">{brl(grandTotalCents)}</span>
              </div>
            </div>

            {canCheckout ? (
              <Link
                href="/checkout"
                onClick={close}
                className="block w-full text-center bg-ink text-cream rounded-pill py-4 text-[13px] tracking-[0.14em] uppercase hover:bg-sage hover:-translate-y-[2px] transition-[background-color,transform] duration-300"
              >
                Finalizar compra
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="block w-full text-center bg-ink/40 text-cream rounded-pill py-4 text-[13px] tracking-[0.14em] uppercase cursor-not-allowed"
                >
                  Finalizar compra
                </button>
                <p className="text-[12px] text-muted-soft mt-[10px] text-center">
                  Escolha a entrega acima para finalizar o pedido.
                </p>
              </>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
