"use client";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useMonthlyMenu } from "@/hooks/useMonthlyMenu";
import { recommendationService } from "@/services";
import { Product } from "@/types/domain";
import ProductImage from "./ProductImage";

const money = (value: number) => "$" + value.toLocaleString("es-AR");

export default function MenuOptions() {
  const cart = useCart();
  const { notify } = useNotification();
  const { data: weeks, loading, error, retry } = useMonthlyMenu();
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  // Cantidad elegida por fecha y producto: permite armar varios días en una sola pasada.
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<Product[]>([]);

  useEffect(() => {
    recommendationService
      .getSides()
      .then((response) => setExtras(response.data))
      .catch(() => setExtras([]));
  }, []);

  useEffect(() => {
    const selectedWeek = weeks?.[weekIndex];
    if (!selectedWeek) return;

    const today = currentDayKey();
    const todayWithMenu = selectedWeek.days.findIndex(
      (item) => item.date === today && item.products.length > 0,
    );
    const nextMenu = selectedWeek.days.findIndex(
      (item) => item.date >= today && item.products.length > 0,
    );
    const firstMenu = selectedWeek.days.findIndex((item) => item.products.length > 0);
    setDayIndex(todayWithMenu >= 0 ? todayWithMenu : nextMenu >= 0 ? nextMenu : Math.max(firstMenu, 0));
  }, [weekIndex, weeks]);

  useEffect(() => {
    if (!weeks?.length) return;
    const today = currentDayKey();
    const currentWeek = weeks.findIndex(
      (item) => today >= item.start && today <= addCalendarDays(item.start, 6),
    );
    setWeekIndex(currentWeek >= 0 ? currentWeek : 0);
  }, [weeks]);

  if (loading)
    return <Frame><p className="text-sm text-ink/60">Cargando el menú...</p></Frame>;
  if (error)
    return (
      <Frame>
        <p className="text-sm text-ink/60">No pudimos cargar el menú: {error}</p>
        <button onClick={retry} className="mt-4 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white">
          Reintentar
        </button>
      </Frame>
    );
  if (!weeks?.length)
    return <Frame><p className="text-sm text-ink/60">Todavía no hay menús publicados. Volvé a mirar en un rato.</p></Frame>;

  const week = weeks[Math.min(weekIndex, weeks.length - 1)];
  const day = week.days[Math.min(dayIndex, week.days.length - 1)];
  const monthLabel = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${week.start}T00:00:00Z`))
    .replace(/^\w/, (letter) => letter.toUpperCase());

  const keyOf = (date: string, productId: string) => `${date}|${productId}`;

  /** Nota con todas las fechas elegidas para ese producto, para que el pedido las conserve. */
  const notesFor = (productId: string, source: Record<string, number>) =>
    Object.entries(source)
      .filter(([key, quantity]) => key.endsWith(`|${productId}`) && quantity > 0)
      .map(([key, quantity]) => {
        const date = key.split("|")[0];
        const label = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "numeric", timeZone: "UTC" })
          .format(new Date(`${date}T00:00:00Z`));
        return `${label} × ${quantity}`;
      })
      .join("; ");

  const changeQuantity = (product: Product, amount: number) => {
    if (!cart.ready) return;
    const key = keyOf(day.date, product.id);
    const next = Math.max(0, (selections[key] ?? 0) + amount);
    const nextSelections = { ...selections };
    if (next) nextSelections[key] = next;
    else delete nextSelections[key];

    const notes = notesFor(product.id, nextSelections);
    try {
      if (amount > 0) {
        cart.add(product, 1, notes);
        notify(`${product.name} para ${day.label.toLowerCase()} agregado al carrito.`);
      } else {
        const cartItem = cart.cart.items.find((item) => item.productId === product.id);
        if (cartItem) {
          cart.updateQuantity(product.id, cartItem.quantity - 1);
          if (notes) cart.setItemNotes(product.id, notes);
        }
      }
      setSelections(nextSelections);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "No se pudo actualizar el carrito.", "error");
    }
  };

  return (
    <section id="menu" className="grain px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">Menús Vital</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-forest sm:text-5xl">Elegí tu menú del mes</h2>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Seleccioná una semana y el día que quieras resolver. Avanzá para conocer las propuestas publicadas.
          </p>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
                <CalendarDaysIcon className="h-6" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">{monthLabel}</p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-forest">
                  Semana {weekIndex + 1} · {week.label}
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={weekIndex === 0}
                onClick={() => setWeekIndex(weekIndex - 1)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-forest/10 px-4 py-3 text-sm font-extrabold text-forest disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
              >
                <ChevronLeftIcon className="h-4" /> Anterior
              </button>
              <button
                disabled={weekIndex >= weeks.length - 1}
                onClick={() => setWeekIndex(weekIndex + 1)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
              >
                Siguiente <ChevronRightIcon className="h-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {weeks.map((item, index) => (
              <button
                key={item.start}
                onClick={() => setWeekIndex(index)}
                aria-label={`Ver semana del ${item.label}`}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  index === weekIndex
                    ? "border-orange bg-orange text-white"
                    : "border-forest/10 bg-cream text-forest hover:border-orange/40"
                }`}
              >
                <span className="block text-xs font-extrabold">
                  {isCurrentWeek(item.start) ? "Semana actual" : `Semana ${index + 1}`}
                </span>
                <span className={`mt-1 block text-xs ${index === weekIndex ? "text-white/75" : "text-ink/55"}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {week.days.map((item, index) => (
              <button
                key={item.date}
                onClick={() => setDayIndex(index)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold ${dayIndex === index ? "bg-forest text-white" : "bg-cream text-forest hover:bg-forest/10"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {!day.products.length && (
          <p className="mt-10 rounded-2xl bg-white p-6 text-sm text-ink/60 shadow-soft">
            No hay platos publicados para {day.label.toLowerCase()}.
          </p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {day.products.map((product) => {
            const quantity = selections[keyOf(day.date, product.id)] ?? 0;
            const price = product.promotionalPrice ?? product.price;
            const soldOut = !product.available || product.stock < 1;
            const orderingClosed = !product.available && Boolean(product.orderDeadline);
            return (
              <article
                key={product.id}
                className={`relative overflow-hidden rounded-[1.75rem] border bg-white p-6 text-left shadow-soft transition ${quantity ? "border-orange ring-2 ring-orange/20" : "border-forest/10"}`}
              >
                <ProductImage src={product.imageUrl} alt={product.name} className="mb-4 aspect-square w-full rounded-2xl" sizes="(max-width: 768px) 100vw, 25vw" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">Menú</p>
                    <h3 className="mt-2 text-xl font-extrabold uppercase text-forest">{product.name}</h3>
                  </div>
                  {quantity > 0 && (
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-orange text-white">{quantity}</span>
                  )}
                </div>
                {price > 0 && (
                  <p className="mt-2 text-xl font-extrabold text-orange">
                    {money(price)}
                    {product.promotionalPrice !== undefined && product.price > 0 && (
                      <span className="ml-2 text-xs font-bold text-ink/40 line-through">{money(product.price)}</span>
                    )}
                  </p>
                )}
                <p className="mt-4 min-h-10 text-xs leading-5 text-ink/65">{product.shortDescription}</p>
                {product.ingredients.length > 0 && (
                  <div className="mt-5 space-y-3 border-t border-forest/10 pt-5">
                    {product.ingredients.slice(0, 3).map((ingredient, index) => (
                      <p key={ingredient} className="flex gap-2 text-xs leading-5 text-forest">
                        <b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest text-[9px] text-white">{index + 1}</b>
                        {ingredient}
                      </p>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-5">
                  <span className="text-xs font-extrabold text-forest">
                    {orderingClosed
                      ? `Pedidos cerrados · límite ${product.orderDeadline} hs`
                      : soldOut
                        ? "Agotado"
                        : `Para ${day.label.toLowerCase()}`}
                  </span>
                  <div className="flex items-center gap-3 rounded-full bg-cream/70 p-1">
                    <button
                      disabled={quantity === 0}
                      onClick={() => changeQuantity(product, -1)}
                      aria-label={`Quitar ${product.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-lg font-extrabold text-forest disabled:opacity-25"
                    >
                      −
                    </button>
                    <b className="min-w-5 text-center text-sm text-forest">{quantity}</b>
                    <button
                      disabled={soldOut || quantity >= product.stock}
                      onClick={() => changeQuantity(product, 1)}
                      aria-label={`Agregar ${product.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full bg-orange text-lg font-extrabold text-white disabled:opacity-25"
                    >
                      +
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-[1.75rem] bg-forest p-6 text-cream sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-orange">
              <SparklesIcon className="h-6" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-orange">Tu elección</p>
              <h3 className="mt-1 text-xl font-extrabold">
                {cart.count} {cart.count === 1 ? "menú" : "menús"} · {money(cart.subtotal)}
              </h3>
              <p className="mt-1 text-xs text-cream/65">Cada toque en + se agrega automáticamente al carrito.</p>
            </div>
          </div>
          <Link
            href="/carrito"
            className="rounded-full bg-orange px-6 py-3 text-sm font-extrabold text-white hover:bg-cream hover:text-forest"
          >
            Ver carrito{cart.count > 0 ? ` (${cart.count})` : ""}
          </Link>
        </div>

        {extras.length > 0 && (
          <div className="mt-14">
            <h3 className="font-display text-3xl text-forest">También podés sumar</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {extras.map((product) => (
                <article key={product.id} className="rounded-2xl bg-white p-5 shadow-soft">
                  <h4 className="text-lg font-extrabold uppercase text-forest">{product.name}</h4>
                  <p className="mt-2 text-sm font-extrabold text-orange">{money(product.promotionalPrice ?? product.price)}</p>
                  <p className="mt-3 text-xs leading-5 text-ink/65">{product.shortDescription}</p>
                  <Link href={`/producto/${product.slug}`} className="mt-4 inline-block text-xs font-extrabold text-orange">
                    Ver detalle
                  </Link>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function currentDayKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function addCalendarDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function isCurrentWeek(start: string) {
  const today = currentDayKey();
  return today >= start && today <= addCalendarDays(start, 6);
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section id="menu" className="grain px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">Menús Vital</p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-forest sm:text-5xl">Elegí tu menú del mes</h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
