// Panel de master: lista todas las organizaciones de la plataforma, con
// quién es su admin, cuántos invitados tiene, y un botón para
// activarla/suspenderla (ver toggleOrganizationStatus en
// app/actions/master.ts). Nada de crear organizaciones a mano acá —eso ya
// lo cubre /crear-cuenta— ni billing todavía.
import { requireMaster } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { toggleOrganizationStatus } from "@/app/actions/master";
import { COMPANY_NAME } from "@/lib/company";

const fechaFormatter = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" });

export default async function MasterPanelPage() {
  await requireMaster();

  const organizations = await db.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      users: {
        where: { role: "ADMIN" },
        select: { name: true, email: true },
        take: 1,
      },
      _count: { select: { users: { where: { role: "GUEST" } } } },
    },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>{COMPANY_NAME} · Organizaciones</h1>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="card">
        <h2>Todas las organizaciones ({organizations.length})</h2>
        {organizations.length === 0 ? (
          <p>Todavía no hay ninguna organización creada.</p>
        ) : (
          <div className="table-scroll">
            <table className="device-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th>Admin</th>
                  <th>Invitados</th>
                  <th>Creada</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const admin = org.users[0];
                  return (
                    <tr key={org.id}>
                      <td>
                        {org.name}
                        <br />
                        <span style={{ fontSize: "0.78rem", opacity: 0.65 }}>{org.slug}</span>
                      </td>
                      <td>
                        {admin ? (
                          <>
                            {admin.name}
                            <br />
                            <span style={{ fontSize: "0.78rem", opacity: 0.65 }}>
                              {admin.email}
                            </span>
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{org._count.users}</td>
                      <td>{fechaFormatter.format(org.createdAt)}</td>
                      <td>
                        {org.status === "ACTIVE" ? (
                          <span className="status-badge status-approved">Activa</span>
                        ) : (
                          <span className="status-badge status-rejected">Suspendida</span>
                        )}
                      </td>
                      <td>
                        <form action={toggleOrganizationStatus}>
                          <input type="hidden" name="id" value={org.id} />
                          <button
                            type="submit"
                            className={org.status === "ACTIVE" ? "btn btn-danger" : "btn btn-secondary"}
                          >
                            {org.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
