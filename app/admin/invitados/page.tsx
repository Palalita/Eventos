// Página de admin: check-in de invitados (escaneando su QR o a mano, ver
// ./QrScanner.tsx) y la lista completa de invitados con su estado de
// asistencia.
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { deleteGuest } from "@/app/actions/invitados";
import ConfirmSubmitButton from "@/app/components/ConfirmSubmitButton";
import QrScanner from "./QrScanner";

export default async function InvitadosPage() {
  const session = await requireAdmin();

  const invitados = await db.user.findMany({
    where: { organizationId: session.organizationId, role: "GUEST" },
    orderBy: { name: "asc" },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Invitados y asistencia</h1>
        <Link href="/panel" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <QrScanner />

      <section className="card">
        <h2>Lista de invitados</h2>
        <div className="table-scroll">
        <table className="guest-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Asistió</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invitados.map((invitado) => (
              <tr key={invitado.id}>
                <td>{invitado.name}</td>
                <td>{invitado.email}</td>
                <td>
                  {invitado.attended ? (
                    <span className="status-badge status-approved">Sí</span>
                  ) : (
                    <span className="status-badge status-pending">No</span>
                  )}
                </td>
                <td>
                  <form action={deleteGuest}>
                    <input type="hidden" name="id" value={invitado.id} />
                    <ConfirmSubmitButton
                      className="btn btn-danger"
                      confirmMessage={`¿Eliminar a ${invitado.name} (${invitado.email})? Ya no podrá entrar al sitio, sus fotos subidas también se borrarán, y desaparecerá del historial de invitaciones. Esta acción no se puede deshacer.`}
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </main>
  );
}
