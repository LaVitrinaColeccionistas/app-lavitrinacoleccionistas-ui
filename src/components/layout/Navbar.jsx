import { Link, useLocation } from "react-router-dom";

export default function Navbar({
  user,
  links = [],
  onNotifications,
}) {
  const location = useLocation();

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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-[18px] w-[18px]"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.7 21a2 2 0 0 1-3.4 0"
              />
            </svg>
          </button>

          {/* AVATAR */}
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={`Perfil de ${user?.name || "usuario"}`}
              className="
                h-9
                w-9
                rounded-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-[#EEECFF]
                text-sm
                font-semibold
                text-[#5146E5]
              "
            >
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}

          {/* NOMBRE */}
          {user?.name && (
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
              {user.name}
            </span>
          )}
        </div>
      </nav>
    </header>
  );
}