import PageLayout from "./components/layout/PageLayout";
import ProductCard from "./components/product/ProductCard";

function App() {
  const usuario = {
    id: 1,
    name: "Cliente Nombre",
    avatarUrl: "",
  };

  const links = [
    {
      label: "Catálogo",
      to: "/catalogo",
    },
    {
      label: "Mis Ofertas",
      to: "/ofertas",
    },
    {
      label: "Carrito",
      to: "/carrito",
    },
    {
      label: "Mis Compras",
      to: "/compras",
    },
    {
      label: "Mis Intercambios",
      to: "/intercambios",
    },
  ];

  const productos = [
    {
      id: 1,
      nombre: "Chrono Trigger Original SNES",
      categoria: "Videojuegos",
      estado: "Muy bueno",
      precio: 98000,
      imagen: "",
    },
    {
      id: 2,
      nombre: "Reloj de Bolsillo Waltham Oro",
      categoria: "Antigüedades",
      estado: "Excelente",
      precio: 300000,
      imagen: "",
    },
    {
      id: 3,
      nombre: "Black Lotus Proxy MTG",
      categoria: "Cartas",
      estado: "Bueno",
      precio: 35000,
      imagen: "",
    },
  ];

  const handleVerProducto = (producto) => {
    console.log("Ver producto:", producto);
  };

  const handleHacerOferta = (producto) => {
    console.log("Hacer oferta:", producto);
  };

  return (
    <PageLayout
      user={usuario}
      links={links}
    >
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Catálogo
          </h1>

          <p className="mt-1 text-sm text-[#6B7280]">
            Explora artículos publicados por otros
            coleccionistas.
          </p>
        </div>

        <div
          className="
            grid
            grid-cols-1
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
          "
        >
          {productos.map((producto) => (
            <ProductCard
              key={producto.id}
              product={producto}
              onView={handleVerProducto}
              onOffer={handleHacerOferta}
            />
          ))}
        </div>
      </div>
    </PageLayout>
  );
}

export default App;