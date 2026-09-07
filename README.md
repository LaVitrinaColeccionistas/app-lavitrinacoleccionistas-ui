# La Vitrina Coleccionables — Frontend
## Stack

- **React** (JavaScript) + **Vite**
- **Tailwind CSS**
- **React Router DOM** — ruteo entre páginas
- **Backend:** Java Spring Boot (API REST, consumo vía `fetch`)

## Dependencias instaladas

```bash
npm install react-router-dom
```

| Paquete | Uso |
|---|---|
| `react` / `react-dom` | Base del proyecto (creado por Vite) |
| `tailwindcss` + `@tailwindcss/vite` | Estilos |
| `react-router-dom` | Navegación entre páginas (Catálogo, Compras, Intercambios, etc.) |

## Componentes genéricos

### Creados
- **Navbar** (`layout/`) — logo, links de navegación, notificaciones, avatar.
- **Modal** (`ui/`) — contenedor genérico reutilizable (confirmaciones, rechazo de intercambio, etc.).
- **Table** (`common/`) — tabla genérica con columnas configurables vía props (`columns`, `data`, `renderRow`).

### Pendientes

**`ui/`**
- `Button` — variantes primary / secondary / danger / success.
- `Input` — campo de texto genérico (título, búsqueda, precio).
- `Textarea` — descripción de publicaciones.
- `Select` / `Dropdown` — categoría, estado, tipo de venta, motivo de rechazo.
- `Badge` / `Tag` — rareza y condición del artículo ("Ultra Raro", "Mint 10/10").
- `StatusPill` — estado de orden/intercambio con color según valor ("Pendiente", "Enviado", "Aceptada", "Rechazada").
- `Avatar` — foto de perfil reutilizable (navbar, vendedor, comprador).

**`layout/`**
- `Footer` — pie de página (se repite en todas las vistas).
- `Breadcrumb` — ruta de navegación ("Mi cuenta / Mis compras").

**`common/`**
- `ProductCard` — tarjeta de artículo del catálogo (imagen, badges, título, vendedor, precio, botón).
- `Pagination` — paginado "Anterior 1 2 3 Siguiente".
- `FilterSidebar` — filtros avanzados del catálogo (categoría, estado, rango de precio/fecha).
- `ItemCompareCard` — bloque "artículo que solicito / artículo que ofrezco" (vista de intercambios).

## Scripts

```bash
npm run dev       # levanta entorno de desarrollo
npm run build     # build de producción
npm run preview   # preview del build
```


# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
