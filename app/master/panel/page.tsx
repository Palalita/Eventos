// Panel de master: lista todas las organizaciones de la plataforma, con
// quién es su admin, cuántos invitados tiene, y un botón para borrar al
// admin y sus invitados cuando termina el plazo contratado (ver
// deleteOrganizationAdmin en app/actions/master.ts). Nada de crear
// organizaciones a mano acá —eso ya lo cubre /crear-cuenta— ni billing
// todavía.
import type { Metadata } from "next";
import { requireMaster } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { deleteOrganizationAdmin } from "@/app/actions/master";
import { COMPANY_NAME } from "@/lib/company";
import ConfirmSubmitButton from "@/app/components/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: `Panel interno · ${COMPANY_NAME}`,
  robots: { index: false, follow: false },
};

const fechaFormatter = new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" });

// Nombre + un dato secundario chico debajo (slug de la organización,
// correo del admin) — se repite para las columnas "Evento" y "Admin".
function NameWithSecondary({ primary, secondary }: { primary: string; secondary: string }) {
  return (
    <>
      {primary}
      <br />
      <span className="device-table-secondary">{secondary}</span>
    </>
  );
}

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
    <main className="dashboard landing">
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const admin = org.users[0];
                  return (
                    <tr key={org.id}>
                      <td>
                        <NameWithSecondary primary={org.name} secondary={org.slug} />
                      </td>
                      <td>
                        {admin ? (
                          <NameWithSecondary primary={admin.name} secondary={admin.email} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{org._count.users}</td>
                      <td>{fechaFormatter.format(org.createdAt)}</td>
                      <td>
                        {admin && (
                          <form action={deleteOrganizationAdmin}>
                            <input type="hidden" name="organizationId" value={org.id} />
                            <ConfirmSubmitButton
                              className="btn btn-danger"
                              confirmMessage={`¿Borrar a ${admin.name} (${admin.email}) y a ${
                                org._count.users === 1
                                  ? "1 invitado"
                                  : `${org._count.users} invitados`
                              } de "${org.name}"? Esta acción no se puede deshacer.`}
                            >
                              Eliminar admin
                            </ConfirmSubmitButton>
                          </form>
                        )}
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
