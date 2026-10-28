import { useState } from "react";
import {
  ArrowLeftRight,
  Plus,
  Trash2,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import Alert from "../../components/common/Alert";
import Button from "../../components/common/Button";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import ItemCompareCard from "../../components/common/ItemCompareCard";

import { crearIntercambio } from "../../services/intercambiosService";

export default function ProponerIntercambioPage({
  usuarioId,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  /*
   * Este producto debe venir desde Catálogo.
   *
   * navigate("/intercambios/nuevo", {
   *   state: {
   *     producto: {
   *       id: ...,
   *       nombre: ...,
   *       idVendedor: ...
   *     }
   *   }
   * })
   */
  const productoSolicitado =
    location.state?.producto ?? null;

  const [ofrecidos, setOfrecidos] =
    useState([
      {
        idProducto: "",
        cantidad: 1,
      },
    ]);

  const [
    diferenciaDinero,
    setDiferenciaDinero,
  ] = useState("");

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  function agregarOfrecido() {
    setOfrecidos((actuales) => [
      ...actuales,
      {
        idProducto: "",
        cantidad: 1,
      },
    ]);
  }

  function eliminarOfrecido(index) {
    setOfrecidos((actuales) =>
      actuales.filter(
        (_, posicion) =>
          posicion !== index
      )
    );
  }

  function actualizarOfrecido(
    index,
    campo,
    valor
  ) {
    setOfrecidos((actuales) =>
      actuales.map(
        (producto, posicion) =>
          posicion === index
            ? {
                ...producto,
                [campo]: valor,
              }
            : producto
      )
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMensaje("");

    if (!usuarioId) {
      setError("No se pudo identificar tu usuario en la sesión. Inicia sesión nuevamente.");
      return;
    }

    if (!productoSolicitado) {
      setError(
        "Debes ingresar a esta pantalla desde un producto del catálogo."
      );
      return;
    }

    const productosValidos =
      ofrecidos.filter(
        (producto) =>
          producto.idProducto
      );

    if (productosValidos.length === 0) {
      setError(
        "Debes agregar al menos un artículo ofrecido."
      );
      return;
    }

    const diferencia =
      Number(diferenciaDinero || 0);

    /*
     * IntercambioCreateDTO
     */
    const intercambio = {
      idUsuarioProponente:
        Number(usuarioId),

      idUsuarioReceptor:
        Number(
          productoSolicitado.idVendedor
        ),

      diferenciaDinero:
        diferencia,

      usuarioPagaDiferencia:
        diferencia > 0
          ? Number(usuarioId)
          : null,

      detalles: [
        {
          idProducto: Number(
            productoSolicitado.id
          ),
          cantidad: 1,
          tipoMovimiento:
            "SOLICITADO",
        },

        ...productosValidos.map(
          (producto) => ({
            idProducto: Number(
              producto.idProducto
            ),
            cantidad: Number(
              producto.cantidad
            ),
            tipoMovimiento:
              "OFRECIDO",
          })
        ),
      ],
    };

    try {
      setGuardando(true);

      await crearIntercambio(
        intercambio
      );

      setMensaje(
        "La propuesta fue creada correctamente."
      );

      setTimeout(() => {
        navigate("/intercambios");
      }, 800);
    } catch (err) {
      console.error(err);

      setError(
        "No fue posible crear la propuesta."
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">

      {/* TÍTULO */}

      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F0EFFF]">
          <ArrowLeftRight
            size={20}
            className="text-[#5146E5]"
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-[#1F2937]">
            Proponer Nuevo Intercambio
          </h1>

          <p className="mt-1 text-sm text-[#6B7280]">
            Define los artículos de tu propuesta.
          </p>
        </div>
      </div>

      {/* MENSAJES */}

      {error && (
        <Alert
          variant="danger"
          className="mb-5"
          onClose={() =>
            setError("")
          }
        >
          {error}
        </Alert>
      )}

      {mensaje && (
        <Alert
          variant="success"
          className="mb-5"
        >
          {mensaje}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">

          {/* PRODUCTO QUE QUIERE */}

          <Card
            title="Artículos solicitados"
          >
            {productoSolicitado ? (
              <ItemCompareCard
                title="Quiero recibir"
                item={{
                  nombre:
                    productoSolicitado.nombre,
                  imagen:
                    productoSolicitado.imagen,
                  estado:
                    productoSolicitado.estado,
                }}
              />
            ) : (
              <Alert variant="warning">
                No se recibió un artículo
                desde el catálogo.
              </Alert>
            )}
          </Card>

          {/* PRODUCTOS OFRECIDOS */}

          <Card
            title="Tus artículos ofrecidos"
            subtitle="Puedes incluir uno o varios artículos."
            headerAction={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={
                  agregarOfrecido
                }
              >
                <Plus size={16} />
                Agregar
              </Button>
            }
          >
            <div className="space-y-4">
              {ofrecidos.map(
                (producto, index) => (
                  <div
                    key={index}
                    className="
                      flex
                      flex-col
                      gap-4
                      rounded-lg
                      border
                      border-[#E5E7EB]
                      p-4
                      sm:flex-row
                      sm:items-end
                    "
                  >
                    <Input
                      label="Producto"
                      name={`producto-${index}`}
                      type="number"
                      min="1"
                      value={
                        producto.idProducto
                      }
                      onChange={(event) =>
                        actualizarOfrecido(
                          index,
                          "idProducto",
                          event.target.value
                        )
                      }
                      helperText="Temporal para probar nuestro MS de forma independiente."
                      required
                    />

                    <div className="w-full sm:w-32">
                      <Input
                        label="Cantidad"
                        name={`cantidad-${index}`}
                        type="number"
                        min="1"
                        value={
                          producto.cantidad
                        }
                        onChange={(event) =>
                          actualizarOfrecido(
                            index,
                            "cantidad",
                            event.target.value
                          )
                        }
                        required
                      />
                    </div>

                    {ofrecidos.length >
                      1 && (
                      <Button
                        type="button"
                        variant="outlineDanger"
                        onClick={() =>
                          eliminarOfrecido(
                            index
                          )
                        }
                        aria-label="Eliminar artículo"
                      >
                        <Trash2
                          size={17}
                        />
                      </Button>
                    )}
                  </div>
                )
              )}
            </div>
          </Card>

          {/* DIFERENCIA */}

          <Card
            title="Compensación económica"
            subtitle="Indica una diferencia solamente si corresponde."
          >
            <Input
              label="Diferencia en guaraníes"
              name="diferenciaDinero"
              type="number"
              min="0"
              value={diferenciaDinero}
              onChange={(event) =>
                setDiferenciaDinero(
                  event.target.value
                )
              }
              placeholder="0"
            />
          </Card>

          {/* ACCIONES */}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  "/intercambios"
                )
              }
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              loading={guardando}
              disabled={
                !productoSolicitado
              }
            >
              Proponer intercambio
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}