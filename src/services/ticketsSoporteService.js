import { request } from "./api";
export const crearTicketSoporte = (datos) => request("/api/tickets-soporte", { method: "POST", body: datos });
