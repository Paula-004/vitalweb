"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addressService, orderService, productService } from "@/services";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { Address, Order } from "@/types/domain";
type Tab = "profile" | "addresses" | "orders";
const statuses: Record<string, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  preparing: "En preparación",
  ready_for_pickup: "Listo para retirar",
  on_the_way: "En camino",
  delivered: "Entregado",
  cancelled: "Cancelado",
};
const money = (value: number) => "$" + value.toLocaleString("es-AR");
export default function AccountDashboard() {
  const { session, logout, updateProfile, setSession } = useAuth(),
    cart = useCart(),
    router = useRouter();
  const [tab, setTab] = useState<Tab>("profile"),
    [orders, setOrders] = useState<Order[]>([]),
    [selected, setSelected] = useState<Order | null>(null),
    [notice, setNotice] = useState(""),
    [showAddress, setShowAddress] = useState(false);
  useEffect(() => {
    if (session)
      orderService
        .getByUser(session.user.id)
        .then((response) => setOrders(response.data));
  }, [session]);
  if (!session)
    return (
      <div className="grid min-h-[65vh] place-items-center px-5 text-center">
        <div>
          <h1 className="font-display text-4xl text-forest">
            Ingresá a tu cuenta
          </h1>
          <p className="mt-2 text-sm text-ink/60">
            Esta sesión es sólo una demostración.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-full bg-orange px-6 py-3 text-sm font-bold text-white"
          >
            Ingresar
          </Link>
        </div>
      </div>
    );
  const profile = session.user;
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    await updateProfile({
      firstName: String(values.firstName),
      lastName: String(values.lastName),
      phone: String(values.phone),
    });
    setNotice("Perfil actualizado.");
  };
  const addAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget,
      values = Object.fromEntries(new FormData(form));
    const address = (
      await addressService.create(profile.id, {
        label: String(values.label),
        recipientName: String(values.recipientName),
        street: String(values.street),
        streetNumber: String(values.streetNumber),
        floor: String(values.floor || ""),
        apartment: String(values.apartment || ""),
        city: String(values.city),
        province: String(values.province),
        postalCode: String(values.postalCode),
        phone: String(values.phone),
        deliveryNotes: String(values.deliveryNotes || ""),
        isDefault: values.isDefault === "on",
        shippingZoneId: "zone-caba",
      })
    ).data;
    setSession((current) =>
      current
        ? {
            ...current,
            user: {
              ...current.user,
              addresses: [...current.user.addresses, address],
            },
          }
        : current,
    );
    setShowAddress(false);
    form.reset();
  };
  const removeAddress = async (id: string) => {
    await addressService.remove(profile.id, id);
    setSession((current) =>
      current
        ? {
            ...current,
            user: {
              ...current.user,
              addresses: current.user.addresses.filter(
                (item) => item.id !== id,
              ),
            },
          }
        : current,
    );
  };
  const repeat = async (order: Order) => {
    for (const detail of order.details) {
      try {
        const product = (await productService.getById(detail.productId)).data;
        cart.add(product, Math.min(detail.quantity, product.stock));
      } catch {}
    }
    router.push("/carrito");
  };
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-orange">
            Mi cuenta
          </p>
          <h1 className="mt-2 font-display text-4xl text-forest">
            Hola, {profile.firstName}
          </h1>
        </div>
        <button
          onClick={async () => {
            await logout();
            router.push("/");
          }}
          className="rounded-full border border-forest/15 px-5 py-3 text-sm font-bold text-forest"
        >
          Cerrar sesión
        </button>
      </div>
      <div className="mt-8 flex gap-2 overflow-x-auto">
        {(
          [
            ["profile", "Mis datos"],
            ["addresses", "Direcciones"],
            ["orders", "Mis pedidos"],
          ] as [Tab, string][]
        ).map((item) => (
          <button
            key={item[0]}
            onClick={() => setTab(item[0])}
            className={`whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold ${tab === item[0] ? "bg-forest text-white" : "bg-white text-forest"}`}
          >
            {item[1]}
          </button>
        ))}
      </div>
      {notice && (
        <p className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-700">
          {notice}
        </p>
      )}
      {tab === "profile" && (
        <form
          onSubmit={saveProfile}
          className="mt-6 grid max-w-2xl gap-4 rounded-[2rem] bg-white p-6 sm:grid-cols-2"
        >
          <Field name="firstName" label="Nombre" value={profile.firstName} />
          <Field name="lastName" label="Apellido" value={profile.lastName} />
          <Field name="phone" label="Teléfono" value={profile.phone} />
          <Field name="email" label="Correo" value={profile.email} disabled />
          <button className="rounded-full bg-orange px-5 py-3 text-sm font-bold text-white sm:col-span-2">
            Guardar cambios
          </button>
        </form>
      )}
      {tab === "addresses" && (
        <div className="mt-6">
          <button
            onClick={() => setShowAddress(!showAddress)}
            className="rounded-full bg-orange px-5 py-3 text-sm font-bold text-white"
          >
            + Nueva dirección
          </button>
          {showAddress && (
            <form
              onSubmit={addAddress}
              className="mt-4 grid gap-3 rounded-[2rem] bg-white p-6 sm:grid-cols-2"
            >
              <Field name="label" label="Nombre de la dirección" />
              <Field name="recipientName" label="Quien recibe" />
              <Field name="street" label="Calle" />
              <Field name="streetNumber" label="Número" />
              <Field name="floor" label="Piso" required={false} />
              <Field name="apartment" label="Departamento" required={false} />
              <Field name="city" label="Ciudad" />
              <Field name="province" label="Provincia" />
              <Field name="postalCode" label="Código postal" />
              <Field name="phone" label="Teléfono" />
              <label className="text-xs font-bold sm:col-span-2">
                Referencia
                <textarea
                  name="deliveryNotes"
                  className="mt-1 w-full rounded-xl border p-3"
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input name="isDefault" type="checkbox" /> Dirección principal
              </label>
              <button className="rounded-full bg-forest px-5 py-3 text-sm font-bold text-white">
                Guardar dirección
              </button>
            </form>
          )}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {profile.addresses.length ? (
              profile.addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  remove={() => removeAddress(address.id)}
                />
              ))
            ) : (
              <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">
                Todavía no cargaste direcciones.
              </p>
            )}
          </div>
        </div>
      )}
      {tab === "orders" && (
        <div className="mt-6 grid gap-4">
          {cart.cart.items.length > 0 && (
            <article className="rounded-2xl border-2 border-orange/30 bg-[#fff7ed] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="rounded-full bg-orange px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
                    En preparación
                  </span>
                  <h2 className="mt-3 font-extrabold text-forest">
                    Tu selección actual
                  </h2>
                  <p className="text-xs text-ink/50">
                    {cart.count} {cart.count === 1 ? "menú" : "menús"} esperando
                    confirmación
                  </p>
                </div>
                <b className="text-lg text-forest">{money(cart.subtotal)}</b>
              </div>
              <div className="mt-4 border-t border-orange/15 pt-4 text-xs">
                {cart.cart.items.map((item) => {
                  const product = cart.products.find(
                    (value) => value.id === item.productId,
                  );
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="py-2">
                      <p className="flex justify-between gap-3">
                        <span>
                          {item.quantity} × {product.name}
                        </span>
                        <b>
                          {money(
                            (product.promotionalPrice ?? product.price) *
                              item.quantity,
                          )}
                        </b>
                      </p>
                      {item.notes && (
                        <p className="mt-1 text-[10px] text-ink/50">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/carrito"
                  className="rounded-full border border-orange px-4 py-2 text-xs font-bold text-orange"
                >
                  Revisar carrito
                </Link>
                <Link
                  href="/checkout"
                  className="rounded-full bg-orange px-4 py-2 text-xs font-bold text-white"
                >
                  Confirmar pedido
                </Link>
              </div>
            </article>
          )}
          {!cart.cart.items.length && !orders.length && (
            <p className="rounded-2xl bg-white p-6 text-sm text-ink/60">
              Todavía no tenés pedidos. Elegí tus menús y confirmalos desde el
              carrito.
            </p>
          )}
          {orders.map((order) => (
            <article key={order.id} className="rounded-2xl bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b className="text-forest">Pedido {order.id}</b>
                  <p className="text-xs text-ink/50">
                    {new Date(order.createdAt).toLocaleDateString("es-AR")} ·{" "}
                    {statuses[order.status]}
                  </p>
                </div>
                <b>{money(order.total)}</b>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() =>
                    setSelected(selected?.id === order.id ? null : order)
                  }
                  className="rounded-full border px-4 py-2 text-xs font-bold"
                >
                  Ver detalle
                </button>
                <button
                  onClick={() => repeat(order)}
                  className="rounded-full bg-orange px-4 py-2 text-xs font-bold text-white"
                >
                  Repetir pedido
                </button>
              </div>
              {selected?.id === order.id && (
                <div className="mt-4 border-t pt-4 text-xs">
                  {order.details.map((item) => (
                    <p key={item.id} className="flex justify-between py-1">
                      <span>
                        {item.quantity} × {item.productName}
                      </span>
                      <b>{money(item.subtotal)}</b>
                    </p>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
function Field({
  name,
  label,
  value = "",
  disabled = false,
  required = true,
}: {
  name: string;
  label: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <label className="text-xs font-bold text-forest">
      {label}
      <input
        name={name}
        defaultValue={value}
        disabled={disabled}
        required={required}
        className="mt-1 w-full rounded-xl border border-forest/10 p-3 font-normal disabled:bg-cream"
      />
    </label>
  );
}
function AddressCard({
  address,
  remove,
}: {
  address: Address;
  remove: () => void;
}) {
  return (
    <article className="rounded-2xl bg-white p-5">
      <div className="flex justify-between">
        <b className="text-forest">{address.label}</b>
        {address.isDefault && (
          <span className="rounded-full bg-[#e5eadc] px-2 py-1 text-[9px] font-bold">
            Principal
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-ink/60">
        {address.street} {address.streetNumber}
        {address.floor && `, piso ${address.floor}`} {address.apartment}
      </p>
      <p className="text-xs text-ink/50">
        {address.city}, {address.province} · {address.postalCode}
      </p>
      <button onClick={remove} className="mt-4 text-xs font-bold text-red-700">
        Eliminar
      </button>
    </article>
  );
}
