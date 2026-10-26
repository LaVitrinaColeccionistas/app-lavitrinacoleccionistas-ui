export default function RadioGroup({ label, name, value, onChange, options = [], error = "" }) {
  return (
    <fieldset>
      {label && (
        <legend className="mb-1.5 text-sm font-semibold text-[#374151]">{label}</legend>
      )}
      <div className="flex items-center gap-5">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-2 text-sm text-[#1F2937]">
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={onChange}
              className="h-4 w-4 accent-[#5146E5]"
            />
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs font-medium text-[#DC2626]">{error}</p>}
    </fieldset>
  );
}