
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export default function MultiSelect({
  items = [],
  selectedIds = [],
  onToggle,
  search = "",
  onSearchChange,
  placeholder = "Buscar mis productos...",
  loading = false,
  footer,
}) {
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef(null);

  useEffect(() => {
    function cerrar(event) {
      if (!contenedor.current?.contains(event.target)) {
        setAbierto(false);
      }
    }

    document.addEventListener("mousedown", cerrar);

    return () => {
      document.removeEventListener("mousedown", cerrar);
    };
  }, []);

  return (
    <div ref={contenedor} className="relative">
      {/* BUSCADOR PRINCIPAL */}
      <div
        className={`flex items-center gap-2 rounded-lg border bg-white px-3 ${
          abierto
            ? "border-[#5146E5] ring-1 ring-[#5146E5]"
            : "border-[#D1D5DB]"
        }`}
      >
        <Search size={17} className="shrink-0 text-[#9CA3AF]" />

        <input
          type="search"
          value={search}
          onFocus={() => setAbierto(true)}
          onChange={(event) => {
            onSearchChange(event.target.value);
            setAbierto(true);
          }}
          placeholder={placeholder}
          aria-label="Buscar mis productos"
          aria-expanded={abierto}
          aria-controls="lista-mis-productos"
          className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-[#374151] outline-none"
        />


        <button
          type="button"
          aria-label={abierto ? "Cerrar opciones" : "Mostrar opciones"}
          onClick={() => setAbierto((actual) => !actual)}
          className="p-1 text-[#6B7280]"
        >
          <ChevronDown
            size={17}
            className={`transition-transform ${
              abierto ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* LISTA DESPLEGABLE */}
      {abierto && (
        <div
          id="lista-mis-productos"
          className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-[#E5E7EB] bg-white shadow-lg"
        >
          <div className="max-h-56 overflow-y-auto p-1">
            {loading ? (
              <p className="p-3 text-sm text-[#6B7280]">
                Buscando productos...
              </p>
            ) : items.length === 0 ? (
              <p className="p-3 text-sm text-[#6B7280]">
                No se encontraron productos.
              </p>
            ) : (
              items.map((item) => {
                const seleccionado = selectedIds.includes(item.id);
                const deshabilitado =
                  !seleccionado && Number(item.stock) < 1;

                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={deshabilitado}
                    onClick={() => onToggle(item)}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left hover:bg-[#F5F3FF] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        seleccionado
                          ? "border-[#5146E5] bg-[#5146E5] text-white"
                          : "border-[#D1D5DB]"
                      }`}
                    >
                      {seleccionado && <Check size={12} />}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#1F2937]">
                        {item.nombre}
                      </p>

                      <p className="text-xs text-[#6B7280]">
                        {item.descripcion}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {footer && (
            <div className="border-t border-[#E5E7EB] p-2">
              {footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}