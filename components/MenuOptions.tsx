"use client";
import Link from "next/link";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNotification } from "@/contexts/NotificationContext";

const plans = [
  {
    name: "General",
    productId: "prod-pollo-portuguesa",
    price: 8500,
    tone: "bg-[#f0e4d5]",
    description: "Una opción equilibrada, casera y abundante.",
    examples: [
      "Guisito de lentejas, carnes y verduras con queso sardo",
      "Pollo al verdeo con calabaza y arroz",
      "Tarta caprese con ensalada fresca",
    ],
  },
  {
    name: "Keto",
    productId: "prod-bondiola-keto",
    price: 8500,
    tone: "bg-[#e5eadc]",
    description: "Menos carbohidratos, mucho sabor y saciedad.",
    examples: [
      "Cubos de pollo con salsa de verdeo y calabaza gratinada",
      "Pollo, brócoli, jamón y queso",
      "Ensalada César sin croutones",
    ],
  },
  {
    name: "Veggie",
    productId: "prod-medallones-legumbres",
    price: 8500,
    tone: "bg-[#eef0dc]",
    description: "Vegetales, legumbres y quesos en combinaciones completas.",
    examples: [
      "Guisito de lentejas y verduras con queso sardo",
      "Ravioles de verdura con salsa boloñesa veggie",
      "Tarta de acelga, calabaza, choclo y queso",
    ],
  },
  {
    name: "Proteico",
    productId: "prod-pollo-proteico",
    price: 9500,
    tone: "bg-[#eadfd3]",
    description: "Una alternativa potente con proteína extra.",
    examples: [
      "Guisito de lentejas, carnes, verduras y huevo",
      "Pollo al verdeo con huevo y vegetales",
      "Ensalada de pollo, huevo, palta y parmesano",
    ],
  },
];

const monthWeeks = [
  "29 de junio al 5 de julio",
  "6 al 12 de julio",
  "13 al 19 de julio",
  "20 al 26 de julio",
  "27 de julio al 2 de agosto",
];
const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

const extras = [
  {
    title: "Ensaladas",
    items: [
      "Pasta corta, pollo, rúcula y parmesano",
      "Quinoa, lentejas, pollo, huevo y vegetales",
      "César con pollo y huevo",
    ],
  },
  {
    title: "Pastas",
    items: [
      "Ravioles de verdura",
      "Sorrentinos de jamón y queso",
      "Tallarines con salsa boloñesa",
    ],
  },
  {
    title: "Tartas",
    items: ["Pollo, calabaza y roquefort", "Brócoli, jamón y queso", "Caprese"],
  },
  {
    title: "Postres",
    items: [
      "Ensalada de frutas · $3.500",
      "Cheesecake keto · $5.000",
      "Chocotorta saludable · $5.000",
    ],
  },
];

export default function MenuOptions() {
  const cart = useCart();
  const { notify } = useNotification();
  const [weekIndex, setWeekIndex] = useState(2),
    [dayIndex, setDayIndex] = useState(0),
    [quantities, setQuantities] = useState<Record<string, number>>({});
  const changeWeek = (index: number) => {
    setWeekIndex(index);
  };
  const selectionKey = (planName: string, week = weekIndex, day = dayIndex) =>
    `${week}-${day}-${planName}`;
  const changeQuantity = (planName: string, amount: number) => {
    const key = selectionKey(planName);
    const next = Math.max(0, (quantities[key] ?? 0) + amount);
    const nextQuantities = { ...quantities };
    if (next) nextQuantities[key] = next;
    else delete nextQuantities[key];
    const plan = plans.find((item) => item.name === planName);
    const product = cart.products.find((item) => item.id === plan?.productId);
    if (!product || !cart.ready) return;
    const notes = getPlanNotes(nextQuantities, planName);
    if (amount > 0) {
      cart.add(product, 1, notes);
      notify(`${planName} para ${weekDays[dayIndex]} agregado al carrito.`);
    } else {
      const cartItem = cart.cart.items.find(
        (item) => item.productId === product.id,
      );
      if (cartItem) {
        cart.updateQuantity(product.id, cartItem.quantity - 1);
        if (notes) cart.setItemNotes(product.id, notes);
      }
    }
    setQuantities(nextQuantities);
  };
  return (
    <section id="menu" className="grain px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">
            Menús Vital
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-forest sm:text-5xl">
            Elegí tu menú del mes
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Seleccioná una semana y el estilo que mejor te acompañe. Avanzá para
            conocer las propuestas de todo el mes.
          </p>
        </div>
        <div className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
                <CalendarDaysIcon className="h-6" />
              </span>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">
                  Julio 2026
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold text-forest">
                  Semana {weekIndex + 1} · {monthWeeks[weekIndex]}
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                disabled={weekIndex === 0}
                onClick={() => changeWeek(weekIndex - 1)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-forest/10 px-4 py-3 text-sm font-extrabold text-forest disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
              >
                <ChevronLeftIcon className="h-4" /> Anterior
              </button>
              <button
                disabled={weekIndex === monthWeeks.length - 1}
                onClick={() => changeWeek(weekIndex + 1)}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
              >
                Siguiente <ChevronRightIcon className="h-4" />
              </button>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {monthWeeks.map((week, index) => (
              <button
                key={week}
                onClick={() => changeWeek(index)}
                aria-label={`Ver semana ${index + 1}`}
                className={`h-2 rounded-full transition ${index === weekIndex ? "bg-orange" : "bg-forest/10 hover:bg-forest/25"}`}
              />
            ))}
          </div>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
            {weekDays.map((day, index) => (
              <button
                key={day}
                onClick={() => setDayIndex(index)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold ${dayIndex === index ? "bg-forest text-white" : "bg-cream text-forest hover:bg-forest/10"}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const quantity = quantities[selectionKey(plan.name)] ?? 0;
            return (
              <article
                key={plan.name}
                className={`relative overflow-hidden rounded-[1.75rem] border p-6 text-left shadow-soft transition ${quantity ? "border-orange ring-2 ring-orange/20" : "border-forest/10"} ${plan.tone}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">
                      Menú
                    </p>
                    <h3 className="mt-2 text-2xl font-extrabold uppercase text-forest">
                      {plan.name}
                    </h3>
                  </div>
                  {quantity > 0 && (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-orange text-white">
                      {quantity}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xl font-extrabold text-orange">
                  ${plan.price.toLocaleString("es-AR")}
                </p>
                <p className="mt-4 min-h-10 text-xs leading-5 text-ink/65">
                  {plan.description}
                </p>
                <div className="mt-5 space-y-3 border-t border-forest/10 pt-5">
                  {rotateExamples(plan.examples, weekIndex).map(
                    (example, index) => (
                      <p
                        key={example}
                        className="flex gap-2 text-xs leading-5 text-forest"
                      >
                        <b className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-forest text-[9px] text-white">
                          {index + 1}
                        </b>
                        {example}
                      </p>
                    ),
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-forest/10 pt-5">
                  <span className="text-xs font-extrabold text-forest">
                    Para {weekDays[dayIndex].toLowerCase()}
                  </span>
                  <div className="flex items-center gap-3 rounded-full bg-white/70 p-1">
                    <button
                      disabled={quantity === 0}
                      onClick={() => changeQuantity(plan.name, -1)}
                      aria-label={`Quitar menú ${plan.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full text-lg font-extrabold text-forest disabled:opacity-25"
                    >
                      −
                    </button>
                    <b className="min-w-5 text-center text-sm text-forest">
                      {quantity}
                    </b>
                    <button
                      onClick={() => changeQuantity(plan.name, 1)}
                      aria-label={`Agregar menú ${plan.name}`}
                      className="grid h-8 w-8 place-items-center rounded-full bg-orange text-lg font-extrabold text-white"
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
              <p className="text-xs font-bold uppercase tracking-widest text-orange">
                Tu elección
              </p>
              <h3 className="mt-1 text-xl font-extrabold">
                {cart.count} {cart.count === 1 ? "menú" : "menús"} · $
                {cart.subtotal.toLocaleString("es-AR")}
              </h3>
              <p className="mt-1 text-xs text-cream/65">
                Cada toque en + se agrega automáticamente al carrito.
              </p>
            </div>
          </div>
          <Link
            href="/carrito"
            className="rounded-full bg-orange px-6 py-3 text-sm font-extrabold text-white hover:bg-cream hover:text-forest"
          >
            Ver carrito{cart.count > 0 ? ` (${cart.count})` : ""}
          </Link>
        </div>
        <div className="mt-14">
          <h3 className="font-display text-3xl text-forest">
            También podés sumar
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {extras.map((extra) => (
              <article
                key={extra.title}
                className="rounded-2xl bg-white p-5 shadow-soft"
              >
                <h4 className="text-lg font-extrabold uppercase text-forest">
                  {extra.title}
                </h4>
                <ul className="mt-4 space-y-3 text-xs leading-5 text-ink/65">
                  {extra.items.map((item) => (
                    <li key={item} className="border-l-2 border-orange pl-3">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function rotateExamples(examples: string[], weekIndex: number) {
  const offset = weekIndex % examples.length;
  return [...examples.slice(offset), ...examples.slice(0, offset)];
}

function getPlanNotes(quantities: Record<string, number>, planName: string) {
  return Object.entries(quantities)
    .filter(([key, quantity]) => key.endsWith(`-${planName}`) && quantity > 0)
    .map(([key, quantity]) => {
      const [week, day] = key.split("-").map(Number);
      return `Semana ${week + 1}, ${weekDays[day]} × ${quantity}`;
    })
    .join("; ");
}
