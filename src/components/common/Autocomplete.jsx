import { useId, useState } from "react";
import { Search } from "lucide-react";

export default function Autocomplete({
  label,
  value,
  onChange,
  onSelect,
  options = [],
  loading = false,
  placeholder = "Buscar...",
  emptyMessage = "Sin resultados",
  helperText = "",
  error = "",
  className = "",
}) {
  const listaId = useId();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);

  const elegir = (opcion) => {
    onSelect?.(opcion);
    setAbierto(false);
    setActivo(-1);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && abierto && options[activo]) {
      e.preventDefault();
      elegir(options[activo]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {label && (
        <label htmlFor={listaId} className="mb-1.5 block text-sm font-semibold text-[#374151]">
          {label}
        </label>
      )}

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
        />
        <input
          id={listaId}
          type="text"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={`${listaId}-lista`}
          aria-autocomplete="list"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(e) => {
            onChange(e.target.value);
            setAbierto(true);
            setActivo(-1);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={handleKeyDown}
          className={`w-full rounded-lg border bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#E0DEFF] ${
            error ? "border-[#EF4444]" : "border-[#E5E7EB]"
          }`}
        />
      </div>

      {abierto && (
        <ul
          id={`${listaId}-lista`}
          role="listbox"
          className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#E5E7EB] bg-white py-1 shadow-lg"
        >
          {loading && <li className="px-3.5 py-2.5 text-sm text-[#6B7280]">Buscando...</li>}

          {!loading && options.length === 0 && (
            <li className="px-3.5 py-2.5 text-sm text-[#6B7280]">{emptyMessage}</li>
          )}

          {!loading &&
            options.map((opcion, indice) => (
              <li
                key={opcion.value}
                role="option"
                aria-selected={indice === activo}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(opcion);
                }}
                onMouseEnter={() => setActivo(indice)}
                className={`cursor-pointer px-3.5 py-2 ${indice === activo ? "bg-[#F5F3FF]" : ""}`}
              >
                <p className="text-sm font-semibold text-[#1F2937]">{opcion.label}</p>
                {opcion.detalle && <p className="text-xs text-[#6B7280]">{opcion.detalle}</p>}
              </li>
            ))}
        </ul>
      )}

      {error && <p className="mt-1.5 text-xs font-medium text-[#DC2626]">{error}</p>}
      {!error && helperText && <p className="mt-1.5 text-xs text-[#6B7280]">{helperText}</p>}
    </div>
  );
}
