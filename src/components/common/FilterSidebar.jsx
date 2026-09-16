import Input from "./Input";
import Select from "./Select";

export default function FilterSidebar({
  filters,
  onChange,
  categoryOptions = [],
  conditionOptions = [],
  className = "",
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;

    onChange?.({
      ...filters,
      [name]: value,
    });
  };

  return (
    <aside
      className={`
        w-full
        rounded-lg
        border border-[#E5E7EB]
        bg-white
        p-5
        ${className}
      `}
    >
      <h2 className="mb-5 text-base font-bold text-[#1F2937]">
        Filtros Avanzados
      </h2>

      <div className="space-y-5">
        {/* CATEGORÍA */}
        <Select
          label="Categoría"
          name="categoria"
          value={filters?.categoria || ""}
          onChange={handleChange}
          options={categoryOptions}
          placeholder="Todas las categorías"
        />

        {/* ESTADO */}
        <Select
          label="Estado"
          name="estado"
          value={filters?.estado || ""}
          onChange={handleChange}
          options={conditionOptions}
          placeholder="Todos los estados"
        />

        {/* RANGO DE PRECIO */}
        <div>
          <p
            className="
              mb-2
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-[#4B5563]
            "
          >
            Rango de precio
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Input
              name="precioMin"
              type="number"
              value={filters?.precioMin || ""}
              onChange={handleChange}
              placeholder="Mín"
              min="0"
            />

            <Input
              name="precioMax"
              type="number"
              value={filters?.precioMax || ""}
              onChange={handleChange}
              placeholder="Máx"
              min="0"
            />
          </div>
        </div>

        {/* RANGO DE FECHA */}
        <div>
          <p
            className="
              mb-2
              text-xs
              font-semibold
              uppercase
              tracking-wide
              text-[#4B5563]
            "
          >
            Rango de fecha
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Input
              name="fechaMin"
              type="date"
              value={filters?.fechaMin || ""}
              onChange={handleChange}
            />

            <Input
              name="fechaMax"
              type="date"
              value={filters?.fechaMax || ""}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>
    </aside>
  );
}