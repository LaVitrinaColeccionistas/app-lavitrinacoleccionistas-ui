import { Link, useLocation } from 'react-router-dom';

const links = [
  { label: 'Catálogo', to: '/catalogo' },
  { label: 'Carrito', to: '/carrito' },
  { label: 'Mis Compras', to: '/compras' },
  { label: 'Mis Intercambios', to: '/intercambios' },
];

export default function Navbar({ user }) {
  const location = useLocation();

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white shadow-sm">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-600 text-white font-bold w-8 h-8 flex items-center justify-center rounded">
          V
        </div>
        <div>
          <p className="font-semibold leading-none">La Vitrina</p>
          <p className="text-xs text-gray-400">COLECCIONABLES</p>
        </div>
      </div>

      <div className="flex gap-6 text-sm font-medium">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={
              location.pathname === link.to
                ? 'text-indigo-600'
                : 'text-gray-600 hover:text-indigo-600'
            }
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <img
          src={user?.avatarUrl || '/default-avatar.png'}
          alt="avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      </div>
    </nav>
  );
}