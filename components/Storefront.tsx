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
  MapPinIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import Logo from "./Logo";
import ProductImage from "./ProductImage";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import MenuOptions from "./MenuOptions";
const money = (n: number) => "$" + n.toLocaleString("es-AR");
export default function Storefront() {
  const { session } = useAuth();
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const count = cart.count;
  const total = cart.subtotal;
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="fixed bottom-5 right-5 z-30 flex flex-col items-center gap-2 sm:bottom-auto sm:right-8 sm:top-5">
        <div className="flex items-center gap-2">
          <Link
            href={session ? "/mi-cuenta" : "/login"}
            className="rounded-full border border-forest/15 bg-white/95 px-4 py-3 text-sm font-bold text-forest shadow-soft backdrop-blur hover:bg-cream"
          >
            {session ? `Hola, ${session.user.firstName}` : "Ingresar"}
          </Link>
          {!session && (
            <Link
              href="/registro"
              className="rounded-full bg-orange px-4 py-3 text-sm font-bold text-white shadow-soft hover:bg-forest"
            >
              Crear cuenta
            </Link>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir mis pedidos"
          className="relative flex items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-bold text-white shadow-soft hover:bg-orange"
        >
          <ShoppingBagIcon className="h-5 w-5" />
          <span>Mis pedidos</span>
          {count > 0 && (
            <b className="grid h-5 min-w-5 place-items-center rounded-full bg-orange px-1 text-[10px]">
              {count}
            </b>
          )}
        </button>
      </div>
      <header className="absolute left-0 top-0 z-30 w-full">
        <div className="flex w-full items-center px-5 py-5 lg:px-8">
          <Logo />
        </div>
      </header>
      <section className="relative min-h-[760px] bg-[#eee3d5]">
        <Image
          src="/vital-hero.png"
          alt="Selección de viandas saludables"
          fill
          priority
          className="object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#f7f1e9] via-[#f7f1e9]/90 to-transparent lg:via-[#f7f1e9]/40" />
        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-center px-5 pt-24 lg:px-8">
          <div className="max-w-2xl">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-extrabold uppercase tracking-[.16em] text-orange backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-orange" /> Menú semanal
              disponible
            </span>
            <h1 className="font-display text-5xl font-semibold leading-[.98] tracking-tight text-forest sm:text-7xl lg:text-[86px]">
              Comé rico.
              <br />
              <i className="font-normal text-orange">Viví liviano.</i>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-7 text-ink/75 sm:text-lg">
              Viandas caseras, frescas y equilibradas. Nosotros cocinamos; vos
              elegís cómo disfrutar tu día.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a
                href="#menu"
                className="flex items-center gap-3 rounded-full bg-orange px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-orange/20 hover:-translate-y-1"
              >
                Ver menú de hoy <ArrowRightIcon className="h-4 w-4" />
              </a>
              <a
                href="#como"
                className="rounded-full border border-forest/20 bg-white/60 px-6 py-4 text-sm font-extrabold text-forest backdrop-blur hover:bg-white"
              >
                ¿Cómo funciona?
              </a>
            </div>
            <div className="mt-10 flex flex-wrap gap-5 text-xs font-bold text-forest/70">
              <span className="flex items-center gap-2">
                <ClockIcon className="h-4 text-orange" /> Pedí hasta las 10:30
              </span>
              <span className="flex items-center gap-2">
                <MapPinIcon className="h-4 text-orange" /> Envíos en la zona
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
                "Confirmá antes de las 10:30 y elegí entrega o retiro.",
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 rounded-[2.5rem] bg-[#e7dccb] p-8 md:flex-row md:p-12">
          <div>
            <h2 className="font-display text-3xl text-forest sm:text-4xl">
              Comida de verdad, todos los días.
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
      </section>
      <footer className="bg-[#102b20] px-5 py-10 text-cream lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Logo light />
          <p className="text-xs text-cream/50">
            © 2026 Vital Food Viandas · Hecho con sabor
          </p>
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
