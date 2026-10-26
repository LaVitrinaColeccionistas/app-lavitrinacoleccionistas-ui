import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex shrink-0 items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5146E5] text-base font-bold text-white">
        V
      </div>
      <div>
        <p className="text-base font-bold leading-none text-[#1F2937]">La Vitrina</p>
        <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8B909A]">
          Coleccionistas
        </p>
      </div>
    </Link>
  );
}