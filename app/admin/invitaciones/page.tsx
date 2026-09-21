// Página de admin: invitar gente por correo (formulario en
// ./InvitationsForm.tsx) y ver/gestionar las invitaciones ya mandadas.
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { resendInvitation, revokeInvitation } from "@/app/actions/invitations";
import InvitationsForm from "./InvitationsForm";

const fechaFormatter = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" });

export default async function InvitacionesPage() {
  await requireAdmin();

  const invitations = await db.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Invitaciones</h1>
        <Link href="/" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <section className="card">
        <h2>Invitar por correo</h2>
        <p>
          Cada correo recibe un código único. Solo con ese código pueden
          crear su cuenta y entrar al sitio.
        </p>
        <InvitationsForm />
      </section>

      <section className="card">
        <h2>Invitaciones enviadas</h2>
        {invitations.length === 0 ? (
          <p>Aún no has invitado a nadie.</p>
        ) : (
          <div className="table-scroll">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Código</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => (
                  <tr key={invitation.id}>
                    <td>{invitation.email}</td>
                    <td>{invitation.code}</td>
                    <td>
                      {invitation.status === "USED" ? (
                        <span className="status-badge status-approved">Usado</span>
                      ) : (
                        <span className="status-badge status-pending">Pendiente</span>
                      )}
                    </td>
                    <td>{fechaFormatter.format(invitation.createdAt)}</td>
                    <td>
                      {invitation.status === "PENDING" && (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <form action={resendInvitation}>
                            <input type="hidden" name="id" value={invitation.id} />
                            <button type="submit" className="btn btn-secondary">
                              Reenviar
                            </button>
                          </form>
                          <form action={revokeInvitation}>
                            <input type="hidden" name="id" value={invitation.id} />
                            <button type="submit" className="btn btn-danger">
                              Revocar
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
