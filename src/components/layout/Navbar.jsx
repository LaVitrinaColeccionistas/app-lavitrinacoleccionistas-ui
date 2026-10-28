import { Bell, LogOut } from "lucide-react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import Avatar from "../ui/Avatar";
import { useAuth } from "../../context/AuthContext";

const links = [
  { label: "Catálogo", to: "/catalogo" },
  { label: "Mis Ofertas", to: "/ofertas" },
  { label: "Carrito", to: "/carrito" },
  { label: "Mis Compras", to: "/compras" },
  { label: "Mis Intercambios", to: "/intercambios" },
];

export default function Navbar({ onNotifications }) {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    autenticado,
    nombreCompleto,
    cerrarSesion,
  } = useAuth();

  function handleLogout() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <header className="border-b border-[#ECEEF2] bg-white">
      <nav
        className="
          mx-auto
          flex
          h-[70px]
          max-w-7xl
          items-center
          justify-between
          gap-6
          px-6
        "
      >
        {/* LOGO */}
        <Link
          to="/catalogo"
          className="flex shrink-0 items-center gap-2.5"
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-[#5146E5]
              text-base
              font-bold
              text-white
            "
          >
            V
          </div>

          <div>
            <p className="text-base font-bold leading-none text-[#1F2937]">
              La Vitrina
            </p>

            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8B909A]">
              Coleccionistas
            </p>
          </div>
        </Link>

        {/* NAVEGACIÓN */}
        <div
          className="
            hidden
            flex-1
            items-center
            justify-center
            gap-7
            md:flex
          "
        >
          {links.map((link) => {
            const active = isActive(link.to);

            return (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  whitespace-nowrap
                  text-sm
                  font-medium
                  transition-colors
                  ${
                    active
                      ? "text-[#5146E5]"
                      : "text-[#4B5563] hover:text-[#5146E5]"
                  }
                `}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* USUARIO */}
        <div className="flex shrink-0 items-center gap-3">
          {/* NOTIFICACIONES */}
          <button
            type="button"
            onClick={onNotifications}
            aria-label="Notificaciones"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              bg-[#F8F9FC]
              text-[#667085]
              transition-colors
              hover:bg-[#F0EFFF]
              hover:text-[#5146E5]
            "
          >
            <Bell
              size={18}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </button>

          {/* AVATAR */}
          <Avatar
            name={nombreCompleto || "Usuario"}
            size="md"
          />

          {/* NOMBRE */}
          {autenticado && (
            <span
              className="
                hidden
                whitespace-nowrap
                text-sm
                font-semibold
                text-[#374151]
                sm:block
              "
            >
              {nombreCompleto || "Usuario"}
            </span>
          )}

          {/* CERRAR SESIÓN */}
          {autenticado && (
            <button
              type="button"
              onClick={handleLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
              className="
                flex
                items-center
                gap-2
                rounded-lg
                px-3
                py-2
                text-sm
                font-medium
                text-[#6B7280]
                transition-colors
                hover:bg-[#FEF2F2]
                hover:text-[#DC2626]
              "
            >
              <LogOut size={17} />
              <span className="hidden lg:inline">
                Cerrar sesión
              </span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}