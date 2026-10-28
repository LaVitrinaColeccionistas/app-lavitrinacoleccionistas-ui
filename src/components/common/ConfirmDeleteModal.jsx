import Modal from "../ui/Modal";
import Button from "./Button";

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  elemento = "este elemento",
  loading = false,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar eliminación"
    >
      <p className="mb-6 text-sm text-[#6B7280]">
        ¿Estás seguro de que deseas eliminar {elemento}?
      </p>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          disabled={loading}
          onClick={onClose}
        >
          Cancelar
        </Button>

        <Button
          variant="outlineDanger"
          loading={loading}
          onClick={onConfirm}
        >
          Eliminar
        </Button>
      </div>
    </Modal>
  );
}