import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-[#ECEEF2] bg-white">
      {/* CONTENIDO PRINCIPAL */}

      <div className="mx-auto max-w-7xl px-6 py-7">
        <div className="grid gap-8 md:grid-cols-[1fr_auto_auto] md:gap-16">
          {/* LA VITRINA */}

          <div className="max-w-sm">
            <p className="text-sm font-semibold text-[#1F2937]">
              La Vitrina
            </p>

            <p className="mt-2 text-xs leading-5 text-[#6B7280]">
              El punto de encuentro para coleccionistas.
              <br />
              Coordiná el pago y envío directamente con el
              vendedor, sin comisiones ocultas.
            </p>
          </div>

          {/* MERCADO */}

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Mercado
            </p>

            <div className="flex flex-col gap-2">
              <Link
                to="/catalogo"
                className="text-xs text-[#5F6673] transition-colors hover:text-[#5146E5]"
              >
                Catálogo Completo
              </Link>

              <Link
                to="/publicaciones/nueva"
                className="text-xs text-[#5F6673] transition-colors hover:text-[#5146E5]"
              >
                Nuevos Ingresos
              </Link>
            </div>
          </div>

          {/* SOPORTE */}

          <div>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-[#9CA3AF]">
              Soporte
            </p>

            <div className="flex flex-col gap-2">
              <Link
                to="/soporte"
                className="text-xs text-[#5F6673] transition-colors hover:text-[#5146E5]"
              >
                Contacto
              </Link>

              <Link
                to="/guia-compra"
                className="text-xs text-[#5F6673] transition-colors hover:text-[#5146E5]"
              >
                Guía de Compra
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* PARTE INFERIOR */}

      <div className="border-t border-[#F0F1F3]">
        <div
          className="
            mx-auto
            flex
            max-w-7xl
            flex-col
            gap-2
            px-6
            py-4
            text-[10px]
            text-[#A0A5AE]
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            © 2025 La Vitrina Coleccionistas. Pagos
            acordados externamente.
          </p>

          <div className="flex items-center gap-1">
            <Link
              to="/terminos"
              className="transition-colors hover:text-[#5146E5]"
            >
              Términos y Condiciones
            </Link>

            <span>•</span>

            <Link
              to="/privacidad"
              className="transition-colors hover:text-[#5146E5]"
            >
              Privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}