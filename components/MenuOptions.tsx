"use client";
import Link from "next/link";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useMonthlyMenu } from "@/hooks/useMonthlyMenu";
import { categoryService } from "@/services";
import { Category, Product } from "@/types/domain";
import ProductImage from "./ProductImage";
import FavoriteButton from "./FavoriteButton";

const money = (value: number) => "$" + value.toLocaleString("es-AR");

const catalogSections = [
  { title: "Tartas frescas", matches: (value: string) => /tarta/.test(value) && !/congelad/.test(value) },
  { title: "Tu bowl", matches: (value: string) => /bowl|ensalada/.test(value) },
  { title: "Pastas", matches: (value: string) => /pasta/.test(value) },
  { title: "Postres", matches: (value: string) => /postre/.test(value) },
  { title: "Tus desayunos y meriendas", matches: (value: string) => /desayuno|merienda/.test(value) },
  { title: "Tartas congeladas", matches: (value: string) => /tarta/.test(value) && /congelad/.test(value) },
  { title: "Otros productos", matches: (value: string) => /\botro|\botros/.test(value) },
];

type CatalogSection = { title: string; products: Product[] };

const dailyMenuTypes = [
  { label: "GENERAL", matches: (value: string) => /\bgeneral\b/.test(value) },
  { label: "KETO", matches: (value: string) => /\bketo\b/.test(value) },
  { label: "VEGGIE", matches: (value: string) => /veggie|vegetari/.test(value) },
  { label: "PROTEICA", matches: (value: string) => /proteic/.test(value) },
];

export default function MenuOptions() {
  const cart = useCart();
  const { notify } = useNotification();
  const { data: weeks, loading, error, retry } = useMonthlyMenu();
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);
  // Cantidad elegida por fecha y producto: permite armar varios días en una sola pasada.
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<Map<string, Category>>(new Map());

  useEffect(() => {
    categoryService.getAll()
      .then((response) => {
        const categoryMap = new Map(response.data.map((category) => [category.id, category]));
        setCategories(categoryMap);
      })
      .catch(() => setCategories(new Map()));
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
  const dailyProducts = dailyMenuByType(day.products, categories);
  const sections = groupCatalog(day.products, categories);
  const dailyProductIds = new Set(dailyProducts.map(({ product }) => product.id));
  const dailyProductSlugs = new Set(dailyProducts.map(({ product }) => product.slug));
  const dailyProductNames = new Set(dailyProducts.map(({ product }) => normalizedProductName(product)));
  const visibleSections = sections
    .map((section) => ({
      ...section,
      products: section.products.filter(
        (product) =>
          !dailyProductIds.has(product.id) &&
          !dailyProductSlugs.has(product.slug) &&
          !dailyProductNames.has(normalizedProductName(product)),
      ),
    }));

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

  const changeCatalogQuantity = (product: Product, amount: number) => {
    if (!cart.ready) return;
    const cartItem = cart.cart.items.find((item) => item.productId === product.id);
    const quantity = cartItem?.quantity ?? 0;

    try {
      if (amount > 0) {
        cart.add(product);
        notify(`${product.name} agregado al carrito.`);
      } else if (quantity > 0) {
        cart.updateQuantity(product.id, quantity - 1);
      }
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "No se pudo actualizar el carrito.", "error");
    }
  };

  return (
    <section id="menu" className="grain px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">Menús Vital</p>
          <h2 className="mt-3 rounded-2xl bg-forest/10 px-5 py-4 font-display text-5xl font-bold leading-tight text-forest sm:px-6 sm:text-6xl">
            Tu vianda del día
          </h2>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Elegí el día y encontrá tu opción general, keto, veggie o proteica.
          </p>
        </div>

        <div className="mt-8 rounded-[1.75rem] bg-white p-5 shadow-soft sm:p-6">
          <div className="flex gap-2 overflow-x-auto pb-1">
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

        {!dailyProducts.length && (
          <p className="mt-10 rounded-2xl bg-white p-6 text-sm text-ink/60 shadow-soft">
            No hay platos publicados para {day.label.toLowerCase()}.
          </p>
        )}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {dailyProducts.map(({ label, product }) => {
            const quantity = selections[keyOf(day.date, product.id)] ?? 0;
            const price = product.promotionalPrice ?? product.price;
            const soldOut = !product.available || product.stock < 1;
            const orderingClosed = !product.available && Boolean(product.orderDeadline);
            return (
              <article
                key={`${label}-${product.id}`}
                className={`relative overflow-hidden rounded-[1.75rem] border bg-white p-6 text-left shadow-soft transition ${quantity ? "border-orange ring-2 ring-orange/20" : "border-forest/10"}`}
              >
                <FavoriteButton productId={product.id} className="absolute right-9 top-9 z-10 h-11 w-11" />
                <ProductImage src={product.imageUrl} alt={product.name} className="mb-4 aspect-square w-full rounded-2xl" sizes="(max-width: 768px) 100vw, 25vw" />
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">
                      {label}
                    </p>
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
                        : product.stockManaged
                          ? `Quedan ${product.stock} vianda${product.stock === 1 ? "" : "s"}`
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

        {visibleSections.map((section) => (
          <div key={section.title} className="mt-14">
            <h3 className="rounded-2xl bg-forest/10 px-5 py-3 font-display text-4xl font-bold leading-tight text-forest sm:px-6 sm:text-5xl">
              {section.title}
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {section.products.map((product) => {
                const quantity = cart.cart.items.find((item) => item.productId === product.id)?.quantity ?? 0;
                const soldOut = !product.available || product.stock < 1;
                return (
                <article key={product.id} className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-soft transition ${quantity ? "border-orange ring-2 ring-orange/20" : "border-transparent"}`}>
                  <FavoriteButton productId={product.id} className="absolute right-8 top-8 z-10 h-10 w-10" />
                  <ProductImage
                    src={product.imageUrl}
                    alt={product.name}
                    className="mb-4 aspect-square w-full rounded-xl"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                  <h4 className="text-lg font-extrabold uppercase text-forest">{product.name}</h4>
                  <p className="mt-2 text-sm font-extrabold text-orange">{money(product.promotionalPrice ?? product.price)}</p>
                  <p className="mt-3 text-xs leading-5 text-ink/65">{product.shortDescription}</p>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-forest/10 pt-4">
                    <Link href={`/producto/${product.slug}`} className="text-xs font-extrabold text-orange">Ver detalle</Link>
                    <div className="flex items-center gap-3 rounded-full bg-cream/70 p-1">
                      <button disabled={quantity === 0} onClick={() => changeCatalogQuantity(product, -1)} aria-label={`Quitar ${product.name}`} className="grid h-8 w-8 place-items-center rounded-full text-lg font-extrabold text-forest disabled:opacity-25">−</button>
                      <b className="min-w-5 text-center text-sm text-forest">{quantity}</b>
                      <button disabled={soldOut || quantity >= product.stock} onClick={() => changeCatalogQuantity(product, 1)} aria-label={`Agregar ${product.name}`} className="grid h-8 w-8 place-items-center rounded-full bg-orange text-lg font-extrabold text-white disabled:opacity-25">+</button>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </div>
        ))}
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

function normalizedCategory(category?: Category) {
  return `${category?.slug ?? ""} ${category?.name ?? ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizedProduct(product: Product, category?: Category) {
  return `${product.badge ?? ""} ${product.name} ${normalizedCategory(category)} ${product.dietaryTags.join(" ")}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizedProductName(product: Product) {
  return product.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isDailyMenuProduct(product: Product, category?: Category) {
  const name = normalizedProductName(product);
  const categoryName = normalizedCategory(category);
  return /^menu\b/.test(name) || /\bmenu\b|\bmenus\b|\bvianda\b|\bviandas\b/.test(categoryName);
}

function dailyMenuByType(products: Product[], categories: Map<string, Category>) {
  const uniqueProducts = products.filter(
    (product, index, list) =>
      list.findIndex(
        (item) =>
          item.id === product.id ||
          item.slug === product.slug ||
          normalizedProductName(item) === normalizedProductName(product),
      ) === index,
  ).filter((product) => isDailyMenuProduct(product, categories.get(product.categoryId)));
  const selected = new Set<string>();
  const byLabel = new Map<string, Product>();

  for (const { label, matches } of dailyMenuTypes) {
    const product = [...uniqueProducts].reverse().find(
      (item) =>
        !selected.has(item.id) &&
        matches(normalizedProduct(item, categories.get(item.categoryId))),
    );
    if (!product) continue;
    selected.add(product.id);
    byLabel.set(label, product);
  }

  return dailyMenuTypes.flatMap(({ label }) => {
    const product = byLabel.get(label);
    return product ? [{ label, product }] : [];
  });
}

function groupCatalog(products: Product[], categories: Map<string, Category>): CatalogSection[] {
  const grouped = catalogSections.map(({ title }) => ({ title, products: [] as Product[] }));
  const seenIds = new Set<string>();

  for (const product of products) {
    if (seenIds.has(product.id)) continue;
    const sectionIndex = catalogSections.findIndex((section) =>
      section.matches(normalizedCategory(categories.get(product.categoryId))),
    );
    if (sectionIndex < 0) continue;
    grouped[sectionIndex].products.push(product);
    seenIds.add(product.id);
  }

  return grouped;
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <section id="menu" className="grain px-5 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-extrabold uppercase tracking-[.22em] text-orange">Menús Vital</p>
        <h2 className="mt-3 rounded-2xl bg-forest/10 px-5 py-4 font-display text-5xl font-bold leading-tight text-forest sm:px-6 sm:text-6xl">
          Elegí tu menú del mes
        </h2>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}
