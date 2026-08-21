"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ShoppingBagIcon,
  XMarkIcon,
  MinusIcon,
  PlusIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Logo from "./Logo";
import ProductImage from "./ProductImage";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import MenuOptions from "./MenuOptions";
const money = (n: number) => "$" + n.toLocaleString("es-AR");
export default function Storefront() {
  const { session } = useAuth();
  const cart = useCart();
  const { data: storeConfig } = useStoreConfig();
  const deadline = storeConfig?.orderDeadline;
  const [open, setOpen] = useState(false);
  const count = cart.count;
  const total = cart.subtotal;
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="absolute left-3 right-3 top-3 z-40 flex items-center justify-end gap-1.5 sm:left-auto sm:right-8 sm:top-5 sm:flex-col sm:gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href={session ? "/mi-cuenta" : "/login"}
            className="whitespace-nowrap rounded-full border border-forest/15 bg-white/95 px-3 py-2 text-[11px] font-bold text-forest shadow-soft backdrop-blur hover:bg-cream sm:px-4 sm:py-3 sm:text-sm"
          >
            {session ? `Hola, ${session.user.firstName}` : "Ingresar"}
          </Link>
          {!session && (
            <Link
              href="/registro"
              className="whitespace-nowrap rounded-full bg-orange px-3 py-2 text-[11px] font-bold text-white shadow-soft hover:bg-forest sm:px-4 sm:py-3 sm:text-sm"
            >
              Crear cuenta
            </Link>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir mis pedidos"
          className="relative flex items-center gap-1.5 whitespace-nowrap rounded-full bg-forest px-3 py-2 text-[11px] font-bold text-white shadow-soft hover:bg-orange sm:gap-2 sm:px-5 sm:py-3 sm:text-sm"
        >
          <ShoppingBagIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>Mis pedidos</span>
          {count > 0 && (
            <b className="grid h-4 min-w-4 place-items-center rounded-full bg-orange px-1 text-[9px] sm:h-5 sm:min-w-5 sm:text-[10px]">
              {count}
            </b>
          )}
        </button>
      </div>
      <header className="absolute left-0 top-0 z-30 w-full">
        <div className="hidden w-full items-center px-5 py-5 sm:flex lg:px-8">
          <Logo />
        </div>
      </header>
      <section className="relative min-h-[700px] bg-[#eee3d5] sm:min-h-[760px]">
        <Image
          src="/vital-hero.png"
          alt="Selección de viandas saludables"
          fill
          priority
          className="object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f1e9] via-[#f7f1e9]/90 to-transparent lg:via-[#f7f1e9]/40" />
        <div className="relative mx-auto flex min-h-[700px] max-w-7xl items-start px-5 pb-24 pt-28 sm:min-h-[760px] sm:items-center sm:pt-24 lg:px-8">
          <div className="max-w-2xl">
            <h1 className="font-display text-[44px] font-semibold leading-[.98] tracking-tight text-forest sm:text-7xl lg:text-[86px]">
              La solución a
              <br />
              <i className="font-normal text-orange">tus comidas.</i>
            </h1>
            <p className="mt-6 max-w-lg text-sm leading-6 text-ink/75 sm:mt-7 sm:text-lg sm:leading-7">
              Diseñamos tu menú equilibrado y cocinamos cada día para vos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 sm:mt-9">
              <a
                href="#menu"
                className="flex items-center gap-3 rounded-full bg-orange px-7 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange/20 hover:-translate-y-1 sm:px-9 sm:py-5 sm:text-base"
              >
                Ver menú de hoy <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-8 flex flex-col gap-2 text-[11px] font-bold text-forest/70 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-5 sm:text-xs">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 text-orange" />{" "}
                Sugerimos hacer tu pedido antes de las 11:00 hs. para viandas del día
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-1 left-0 h-12 w-full rounded-[50%_50%_0_0/100%_100%_0_0] bg-cream" />
      </section>
      <MenuOptions />
      <section id="como" className="bg-forest px-5 py-24 text-cream lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-xl">
            <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange">
              Así de simple
            </p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl">
              Tu almuerzo resuelto en tres pasos.
            </h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              ["01", "Elegí", "Explorá el menú del día y armá tu combinación."],
              [
                "02",
                "Pedí",
                deadline
                  ? `Confirmá antes de las ${deadline} y elegí entrega o retiro.`
                  : "Confirmá tu pedido y elegí entrega o retiro.",
              ],
              [
                "03",
                "Disfrutá",
                "Recibí comida casera, fresca y lista para comer.",
              ],
            ].map((x) => (
              <div key={x[0]} className="border-t border-cream/20 pt-6">
                <span className="font-display text-5xl text-orange">
                  {x[0]}
                </span>
                <h3 className="mt-6 text-xl font-extrabold">{x[1]}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-cream/65">
                  {x[2]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="nosotros" className="px-5 py-20 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12">
          <Link
            href="/promociones"
            className="inline-flex rounded-full bg-orange px-12 py-5 text-lg font-extrabold text-white shadow-xl shadow-orange/25 hover:bg-forest sm:px-16 sm:py-6 sm:text-xl"
          >
            ¡Quiero mi promo!
          </Link>
          <div className="flex w-full flex-col items-center justify-between gap-8 rounded-[2.5rem] bg-[#e7dccb] p-8 md:flex-row md:p-12">
            <div>
              <h2 className="font-display text-3xl text-forest sm:text-4xl">
                Comida creada por nutricionistas.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink/70">
                Cocinamos en el día con ingredientes frescos, recetas simples y
                ese toque casero que no se negocia.
              </p>
            </div>
            <a
              href="#menu"
              className="whitespace-nowrap rounded-full bg-orange px-6 py-4 text-sm font-extrabold text-white"
            >
              Armar mi pedido
            </a>
          </div>
        </div>
      </section>
      <footer className="bg-[#102b20] px-5 py-10 text-cream lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Logo light />
          <div className="flex flex-col items-center gap-2 text-xs text-cream/65 sm:items-end">
            <p className="text-cream/50">
              © 2026 Vital Food Viandas · Hecho con sabor
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Neyra+144%2C+Gualeguaychu%2C+Entre+Rios"
              target="_blank"
              rel="noreferrer"
              className="hover:text-orange"
            >
              Ubicación: Neyra 144, Gualeguaychú
            </a>
            <a
              href="https://wa.me/5493446205554"
              target="_blank"
              rel="noreferrer"
              className="hover:text-orange"
            >
              WhatsApp: 3446205554
            </a>
          </div>
        </div>
      </footer>
      {open && (
        <>
          <button
            aria-label="Cerrar carrito"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-forest/45 backdrop-blur-sm"
          />
          <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-forest/10 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-orange">
                  Tu selección
                </p>
                <h2 className="font-display text-3xl text-forest">Mi pedido</h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full bg-white p-3"
              >
                <XMarkIcon className="h-5" />
              </button>
            </div>
            <div className="flex-1 space-y-3 overflow-auto py-6">
              {count === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <span className="text-5xl">🥗</span>
                    <h3 className="mt-4 font-display text-2xl text-forest">
                      Tu bolsa está vacía
                    </h3>
                    <p className="mt-2 text-sm text-ink/60">
                      Sumá algo rico del menú de hoy.
                    </p>
                    <button
                      onClick={() => setOpen(false)}
                      className="mt-6 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white"
                    >
                      Explorar menú
                    </button>
                  </div>
                </div>
              ) : (
                cart.cart.items.map((item) => {
                  const product = cart.products.find(
                    (value) => value.id === item.productId,
                  );
                  if (!product) return null;
                  return (
                    <div key={product.id} className="rounded-2xl bg-white p-3">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-14 w-14 shrink-0 rounded-xl"
                          sizes="56px"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-extrabold text-forest">
                            {product.name}
                          </h3>
                          <p className="text-sm font-bold text-orange">
                            {money(product.promotionalPrice ?? product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              cart.updateQuantity(product.id, item.quantity - 1)
                            }
                            className="rounded-full border p-1"
                          >
                            <MinusIcon className="h-3" />
                          </button>
                          <b className="text-sm">{item.quantity}</b>
                          <button
                            disabled={item.quantity >= product.stock}
                            onClick={() =>
                              cart.updateQuantity(product.id, item.quantity + 1)
                            }
                            className="rounded-full border p-1 disabled:opacity-30"
                          >
                            <PlusIcon className="h-3" />
                          </button>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="mt-2 border-t border-forest/10 pt-2 text-[10px] leading-4 text-ink/50">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            {count > 0 && (
              <div className="border-t border-forest/10 pt-5">
                <div className="mb-5 flex justify-between">
                  <span className="font-bold">Total</span>
                  <b className="text-xl text-forest">{money(total)}</b>
                </div>
                <Link
                  href="/carrito"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-orange py-4 text-sm font-extrabold text-white hover:bg-forest"
                >
                  Revisar y confirmar pedido <ArrowRightIcon className="h-4" />
                </Link>
              </div>
            )}
          </aside>
        </>
      )}
    </main>
  );
}
