"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { DietaryTag, Product, WeekDay } from "@/types/domain";
import ProductImage from "./ProductImage";
import FavoriteButton from "./FavoriteButton";

/** Fecha comercial `YYYY-MM-DD` en formato legible, ej. `Martes 14 de julio`. */
function longDate(date: string) {
  const label = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  return label.replace(/^\w/, (letter) => letter.toUpperCase());
}

type Mode = "all" | "today" | "weekly" | "promotions";
type Sort =
  "featured" | "best" | "price-asc" | "price-desc" | "name" | "recent";
/** Días con menú: la semana comercial es de lunes a sábado. */
const days: WeekDay[] = [
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];
const money = (value: number) => "$" + value.toLocaleString("es-AR");
export default function CatalogBrowser({
  mode = "all",
  categorySlug,
  title,
  eyebrow,
  description,
}: {
  mode?: Mode;
  categorySlug?: string;
  title: string;
  /** Si se omite, se arma con la fecha y el horario límite del menú publicado. */
  eyebrow?: string;
  description?: string;
}) {
  const { data, loading, error, retry } = useCatalogData();
  const { data: storeConfig } = useStoreConfig();
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [maxPrice, setMaxPrice] = useState(12000),
    [onlyAvailable, setOnlyAvailable] = useState(false),
    [onlyPromo, setOnlyPromo] = useState(false),
    [day, setDay] = useState<"all" | WeekDay>("all"),
    [tags, setTags] = useState<DietaryTag[]>([]),
    [sort, setSort] = useState<Sort>("featured"),
    [filtersOpen, setFiltersOpen] = useState(false),
    [weekIndex, setWeekIndex] = useState(0);
  const presetCategory = data?.categories.find(
    (item) => item.slug === categorySlug,
  );
  const monthWeeks = useMemo(
    () => buildMonthWeeks(data?.dailyMenus.map((menu) => menu.date) ?? []),
    [data?.dailyMenus],
  );
  useEffect(() => {
    const activeDate = data?.dailyMenus.find((menu) => menu.active)?.date;
    if (!activeDate) return;
    const activeWeek = monthWeeks.findIndex(
      (week) => activeDate >= week.startKey && activeDate <= week.endKey,
    );
    if (activeWeek >= 0) setWeekIndex(activeWeek);
  }, [data?.dailyMenus, monthWeeks]);
  const selectedWeek = monthWeeks[Math.min(weekIndex, monthWeeks.length - 1)];
  const products = useMemo(() => {
    if (!data) return [];
    let list = [...data.products];
    if (mode === "today") {
      const ids = new Set(
        data.dailyMenus
          .find((menu) => menu.active)
          ?.items.map((item) => item.productId) ?? [],
      );
      list = list.filter((item) => ids.has(item.id));
    }
    if (mode === "weekly" && selectedWeek) {
      const weeklyMenus = data.dailyMenus.filter(
        (menu) =>
          menu.date >= selectedWeek.startKey &&
          menu.date <= selectedWeek.endKey,
      );
      if (weeklyMenus.length) {
        const ids = new Set(
          weeklyMenus.flatMap((menu) =>
            menu.items.map((item) => item.productId),
          ),
        );
        list = list.filter((item) => ids.has(item.id));
      }
    }
    if (mode === "promotions")
      list = list.filter((item) => item.promotionalPrice !== undefined);
    const categoryId = presetCategory?.id ?? category;
    if (categoryId !== "all")
      list = list.filter((item) => item.categoryId === categoryId);
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter((item) =>
        `${item.name} ${item.shortDescription} ${item.ingredients.join(" ")}`
          .toLowerCase()
          .includes(term),
      );
    }
    list = list.filter(
      (item) => (item.promotionalPrice ?? item.price) <= maxPrice,
    );
    if (onlyAvailable)
      list = list.filter((item) => item.available && item.stock > 0);
    if (onlyPromo)
      list = list.filter((item) => item.promotionalPrice !== undefined);
    if (day !== "all")
      list = list.filter((item) => item.availableDays.includes(day));
    if (tags.length)
      list = list.filter((item) =>
        tags.every((tag) => item.dietaryTags.includes(tag)),
      );
    return list.sort((a, b) => sortProducts(a, b, sort));
  }, [
    data,
    mode,
    selectedWeek,
    presetCategory?.id,
    category,
    search,
    maxPrice,
    onlyAvailable,
    onlyPromo,
    day,
    tags,
    sort,
  ]);
  const toggleTag = (tag: DietaryTag) =>
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  const activeMenu = data?.dailyMenus.find((menu) => menu.active);
  const deadline = activeMenu?.orderDeadline ?? storeConfig?.orderDeadline;
  const resolvedEyebrow =
    eyebrow ?? (mode === "today" && activeMenu ? longDate(activeMenu.date) : "");
  const resolvedDescription =
    description ??
    (mode === "today"
      ? `Opciones cocinadas en el día.${deadline ? ` Pedí antes de las ${deadline} para recibir al mediodía.` : ""}`
      : "");

  return (
    <>
      <section className="bg-forest px-5 py-16 text-cream lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-orange">
            {resolvedEyebrow}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-cream/65">
            {resolvedDescription}
          </p>
        </div>
      </section>
      <section className="grain min-h-[600px] px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {mode === "weekly" && selectedWeek && (
            <WeekNavigator
              weeks={monthWeeks}
              activeIndex={weekIndex}
              onChange={setWeekIndex}
            />
          )}
          <div
            className={`flex flex-col gap-3 sm:flex-row ${mode === "weekly" ? "mt-6" : ""}`}
          >
            <label className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 h-5 -translate-y-1/2 text-forest/40" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar platos, ingredientes..."
                className="w-full rounded-full border border-forest/10 bg-white py-4 pl-12 pr-5 text-sm outline-none focus:border-orange"
              />
            </label>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center justify-center gap-2 rounded-full border border-forest/10 bg-white px-6 py-4 text-sm font-bold text-forest"
            >
              <AdjustmentsHorizontalIcon className="h-5" /> Filtros
            </button>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as Sort)}
              className="rounded-full border border-forest/10 bg-white px-5 py-4 text-sm font-bold text-forest"
            >
              <option value="featured">Destacados</option>
              <option value="best">Más vendidos</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre</option>
              <option value="recent">Más recientes</option>
            </select>
          </div>
          {filtersOpen && (
            <div className="mt-4 grid gap-5 rounded-[1.5rem] bg-white p-5 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-xs font-bold text-forest">
                Categoría
                <select
                  disabled={!!categorySlug}
                  value={presetCategory?.id ?? category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                >
                  <option value="all">Todas</option>
                  {data?.categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-bold text-forest">
                Precio hasta {money(maxPrice)}
                <input
                  type="range"
                  min="2000"
                  max="12000"
                  step="500"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="mt-4 w-full accent-orange"
                />
              </label>
              <label className="text-xs font-bold text-forest">
                Día
                <select
                  value={day}
                  onChange={(event) =>
                    setDay(event.target.value as "all" | WeekDay)
                  }
                  className="mt-2 w-full rounded-xl border p-3 font-normal"
                >
                  <option value="all">Cualquier día</option>
                  {days.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <div className="space-y-2 text-xs">
                <Check
                  label="Sólo disponibles"
                  checked={onlyAvailable}
                  onChange={setOnlyAvailable}
                />
                <Check
                  label="En promoción"
                  checked={onlyPromo}
                  onChange={setOnlyPromo}
                />
                {(["vegetariano", "vegano", "sin-tacc"] as DietaryTag[]).map(
                  (tag) => (
                    <Check
                      key={tag}
                      label={tag === "sin-tacc" ? "Sin TACC" : capitalize(tag)}
                      checked={tags.includes(tag)}
                      onChange={() => toggleTag(tag)}
                    />
                  ),
                )}
              </div>
            </div>
          )}
          {loading ? (
            <Status title="Cargando catálogo..." />
          ) : error ? (
            <Status
              title="No pudimos cargar los productos"
              text={error}
              action={retry}
            />
          ) : products.length === 0 ? (
            <Status
              title="No encontramos resultados"
              text="Probá cambiando o quitando alguno de los filtros."
            />
          ) : (
            <>
              <p className="mt-8 text-xs font-bold text-forest/50">
                {products.length} opciones
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    category={
                      data?.categories.find(
                        (item) => item.id === product.categoryId,
                      )?.name ?? "Producto"
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

type MonthWeek = {
  start: Date;
  end: Date;
  startKey: string;
  endKey: string;
  label: string;
};

function WeekNavigator({
  weeks,
  activeIndex,
  onChange,
}: {
  weeks: MonthWeek[];
  activeIndex: number;
  onChange: (index: number) => void;
}) {
  const week = weeks[activeIndex];
  return (
    <div className="rounded-[1.75rem] bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
            <CalendarDaysIcon className="h-6" />
          </span>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.18em] text-orange">
              {formatMonth(week.start)}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-forest">
              Semana {activeIndex + 1} · {week.label}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            disabled={activeIndex === 0}
            onClick={() => onChange(activeIndex - 1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-forest/10 px-4 py-3 text-sm font-extrabold text-forest disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
          >
            <ChevronLeftIcon className="h-4" /> Anterior
          </button>
          <button
            disabled={activeIndex === weeks.length - 1}
            onClick={() => onChange(activeIndex + 1)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-orange px-5 py-3 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-35 sm:flex-none"
          >
            Siguiente <ChevronRightIcon className="h-4" />
          </button>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-5">
        {weeks.map((item, index) => (
          <button
            key={item.startKey}
            onClick={() => onChange(index)}
            aria-label={`Ver semana ${index + 1}`}
            className={`h-2 rounded-full transition ${index === activeIndex ? "bg-orange" : "bg-forest/10 hover:bg-forest/25"}`}
          />
        ))}
      </div>
    </div>
  );
}

function buildMonthWeeks(dates: string[]): MonthWeek[] {
  const anchor = dates[0] ? parseDate(dates[0]) : new Date();
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const cursor = startOfWeek(first);
  const weeks: MonthWeek[] = [];
  while (cursor <= last) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    // Lunes + 5 = sábado: el domingo no entra en la semana comercial.
    end.setDate(end.getDate() + 5);
    weeks.push({
      start,
      end,
      startKey: dateKey(start),
      endKey: dateKey(end),
      label: `${start.getDate()} al ${end.getDate()} de ${formatMonth(end, false)}`,
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonth(date: Date, includeYear = true) {
  return new Intl.DateTimeFormat("es-AR", {
    month: "long",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

function ProductCard({
  product,
  category,
}: {
  product: Product;
  category: string;
}) {
  const state = getAvailability(product);
  return (
    <article className="group relative overflow-hidden rounded-[1.75rem] bg-white shadow-soft hover:-translate-y-1">
      <FavoriteButton productId={product.id} className="absolute right-3 top-3 z-20 h-11 w-11" />
      <Link href={`/producto/${product.slug}`} className="block">
      <div className="relative">
        <ProductImage
          src={product.imageUrl}
          alt={product.name}
          className="aspect-[4/3]"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {product.promotionalPrice && <Badge label="Promoción" orange />}
          <Badge label={state.label} />
        </div>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-orange">
          {category}
        </p>
        <h2 className="mt-2 text-lg font-extrabold leading-tight text-forest">
          {product.name}
        </h2>
        <p className="mt-2 line-clamp-2 h-10 text-xs leading-5 text-ink/60">
          {product.shortDescription}
        </p>
        <div className="mt-4 flex items-end gap-2">
          {product.promotionalPrice ? (
            <>
              <b className="text-lg text-orange">
                {money(product.promotionalPrice)}
              </b>
              <del className="pb-0.5 text-xs text-ink/40">
                {money(product.price)}
              </del>
            </>
          ) : (
            <b className="text-lg text-forest">{money(product.price)}</b>
          )}
        </div>
      </div>
      </Link>
    </article>
  );
}
function getAvailability(product: Product) {
  if (!product.available)
    return { label: product.availableDate ? "Próximo menú" : "No disponible" };
  if (product.stock === 0) return { label: "Agotado" };
  // Los platos de otra fecha se pueden pedir igual: se aclara de qué día son en
  // vez de marcarlos como no disponibles.
  if (product.availableDate && product.availableDate !== todayKey())
    return { label: `Menú del ${dayLabel(product.availableDate)}` };
  // Sin fecha propia (catálogo de demostración) vale la restricción por día de
  // la semana; vacía significa que el backoffice no restringe el plato.
  if (
    !product.availableDate &&
    product.availableDays.length > 0 &&
    !product.availableDays.includes(currentWeekDay())
  )
    return { label: "No disponible hoy" };
  if (product.stock <= 5) return { label: "Pocas unidades" };
  return { label: "Disponible" };
}

/** Día comercial de hoy en Argentina, en formato `YYYY-MM-DD`. */
function todayKey() {
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

/** Día de la semana de hoy en Argentina, como lo nombra el backoffice. */
function currentWeekDay(): WeekDay {
  const [year, month, day] = todayKey().split("-").map(Number);
  const index = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return days[(index + 6) % 7] ?? "domingo";
}

/** `jueves 21` para el cartel de los platos de otro día. */
function dayLabel(date: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
function Badge({ label, orange = false }: { label: string; orange?: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[9px] font-extrabold uppercase tracking-wide ${orange ? "bg-orange text-white" : "bg-cream/95 text-forest"}`}
    >
      {label}
    </span>
  );
}
function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-orange"
      />
      {label}
    </label>
  );
}
function Status({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: () => void;
}) {
  return (
    <div className="mt-10 rounded-[1.75rem] bg-white p-12 text-center shadow-soft">
      <h2 className="font-display text-2xl text-forest">{title}</h2>
      {text && <p className="mt-2 text-sm text-ink/60">{text}</p>}
      {action && (
        <button
          onClick={action}
          className="mt-5 rounded-full bg-orange px-5 py-3 text-sm font-bold text-white"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
function sortProducts(a: Product, b: Product, sort: Sort) {
  if (sort === "best") return Number(b.bestSeller) - Number(a.bestSeller);
  if (sort === "price-asc")
    return (a.promotionalPrice ?? a.price) - (b.promotionalPrice ?? b.price);
  if (sort === "price-desc")
    return (b.promotionalPrice ?? b.price) - (a.promotionalPrice ?? a.price);
  if (sort === "name") return a.name.localeCompare(b.name);
  if (sort === "recent") return b.createdAt.localeCompare(a.createdAt);
  return (
    Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder
  );
}
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
