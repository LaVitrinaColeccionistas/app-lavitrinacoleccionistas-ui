import Modal from "../ui/Modal";
import Button from "./Button";

/*
 * Modal de confirmación genérico para acciones del flujo de catálogo
 * (eliminar, rechazar, aceptar, confirmar venta, liberar reservas...).
 * Para borrados simples sigue existiendo ConfirmDeleteModal.
 */
export default function ConfirmActionModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message,
  children,
  confirmLabel = "Confirmar",
  confirmVariant = "primary", // primary | success | danger | outlineDanger
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={loading ? () => {} : onClose} title={title}>
      {message && <p className="mb-2 text-sm text-[#6B7280]">{message}</p>}
      {children && <div className="mb-2 text-sm text-[#6B7280]">{children}</div>}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" disabled={loading} onClick={onClose}>
          Cancelar
        </Button>
        <Button variant={confirmVariant} loading={loading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}