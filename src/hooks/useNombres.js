import { useEffect, useState } from "react";
import { obtenerNombresUsuarios } from "../services/authService";

const cache = new Map(); 

export default function useNombres(ids) {
  const clave = [...new Set(ids.filter((id) => id != null))]
    .sort((a, b) => a - b)
    .join(",");
  const [, forzar] = useState(0);

  useEffect(() => {
    if (!clave) return;
    const faltan = clave.split(",").map(Number).filter((id) => !cache.has(id));
    if (!faltan.length) return;

    let cancelado = false;
    obtenerNombresUsuarios(faltan)
      .then((perfiles) => {
        perfiles.forEach((p) =>
          cache.set(Number(p.idUsuario), [p.nombre, p.apellido].filter(Boolean).join(" "))
        );
        if (!cancelado) forzar((n) => n + 1);
      })
      .catch((err) => console.error("No fue posible obtener los nombres:", err));

    return () => { cancelado = true; };
  }, [clave]);

  return (id, respaldo = "No disponible") => cache.get(Number(id)) || respaldo;
}