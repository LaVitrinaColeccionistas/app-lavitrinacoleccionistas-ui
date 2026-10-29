import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  ...props
}) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-3.5 text-sm text-[#1F2937] outline-none transition-all placeholder:text-[#9CA3AF] focus:border-[#5146E5] focus:ring-2 focus:ring-[#E0DEFF]"
        {...props}
      />
    </div>
  );
}
