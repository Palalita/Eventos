import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import QrScanner from "./QrScanner";

export default async function InvitadosPage() {
  await requireAdmin();

  const invitados = await db.user.findMany({
    where: { role: "GUEST" },
    orderBy: { name: "asc" },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Invitados y asistencia</h1>
        <Link href="/" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <QrScanner />

      <section className="card">
        <h2>Lista de invitados</h2>
        <table className="guest-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Asistió</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
