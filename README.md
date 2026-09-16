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
| `lucide-react` | Iconos reutilizables de la interfaz |

## Componentes genéricos

### Creados

**`common/`**

- **Button** — botón reutilizable con variantes para diferentes tipos de acciones.
- **Input** — campo de texto genérico con soporte para validaciones y mensajes.
- **Textarea** — campo de texto multilínea reutilizable.
- **Select** — selector genérico con opciones configurables.
- **Card** — contenedor reutilizable para agrupar contenido.
- **Badge** — etiqueta reutilizable para representar estados, categorías u otra información mediante variantes de color ("Pendiente", "Aceptada", "Rechazada", etc.).
- **Alert** — mensajes reutilizables de información, éxito, advertencia o error.
- **Pagination** — paginado reutilizable para listados.
- **Table** — tabla genérica con columnas configurables vía props (`columns`, `data`, `renderRow`).
- **FilterSidebar** — filtros avanzados reutilizables para categoría, estado, rango de precio y fecha.
- **ItemCompareCard** — bloque reutilizable para representar y comparar artículos en intercambios.

**`layout/`**

- **Navbar** — logo, links de navegación configurables, notificaciones, avatar y usuario.
- **Footer** — pie de página común para las diferentes vistas.
- **PageLayout** — estructura base reutilizable que integra Navbar, contenido y Footer.
- **Breadcrumb** — ruta de navegación reutilizable para indicar la ubicación dentro de la aplicación.

**`product/`**

- **ProductCard** — tarjeta reutilizable para representar artículos del catálogo.

**`ui/`**

- **Modal** — contenedor genérico reutilizable para confirmaciones, formularios y otras ventanas modales.
- **Avatar** — representación reutilizable de la imagen o inicial de un usuario.

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

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [typescript-eslint](https://typescript-eslint.io) in your project.