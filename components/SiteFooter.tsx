import Logo from './Logo'

export default function SiteFooter() {
  return <footer className="bg-[#102b20] px-5 py-10 text-cream lg:px-8">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
      <Logo light />
      <div className="flex flex-col items-center gap-2 text-xs text-cream/65 sm:items-end">
        <p className="text-cream/50">© 2026 Vital Food Viandas · Hecho con sabor</p>
        <a href="https://www.google.com/maps/search/?api=1&query=Neyra+144%2C+Gualeguaychu%2C+Entre+Rios" target="_blank" rel="noreferrer" className="hover:text-orange">
          Ubicación: Neyra 144, Gualeguaychú
        </a>
        <a href="https://wa.me/5493446205554" target="_blank" rel="noreferrer" className="hover:text-orange">
          WhatsApp: 3446205554
        </a>
      </div>
    </div>
  </footer>
}
