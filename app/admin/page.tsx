import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { logout } from "@/app/actions/auth";
import { reviewPhoto } from "@/app/actions/photos";

export default async function AdminPage() {
  await requireAdmin();

  const pendientes = await db.photoRequest.findMany({
    where: { status: "PENDING" },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });

  const totalAprobadas = await db.photoRequest.count({
    where: { status: "APPROVED" },
  });
  const totalInvitados = await db.user.count({ where: { role: "GUEST" } });
  const totalAsistieron = await db.user.count({
    where: { role: "GUEST", attended: true },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Panel de administración</h1>
        <form action={logout}>
          <button type="submit" className="btn btn-ghost">
            Cerrar sesión
          </button>
        </form>
      </header>

      <section className="stats-row">
        <div className="stat">
          <strong>{pendientes.length}</strong>
          <span>Solicitudes pendientes</span>
        </div>
        <div className="stat">
          <strong>{totalAprobadas}</strong>
          <span>Fotos aprobadas</span>
        </div>
        <div className="stat">
          <strong>
            {totalAsistieron}/{totalInvitados}
          </strong>
          <span>Invitados asistieron</span>
        </div>
      </section>

      <Link href="/admin/invitados" className="btn btn-secondary">
        Ver invitados y control de asistencia
      </Link>

      <section className="card">
        <h2>Solicitudes de fotos pendientes</h2>
        {pendientes.length === 0 && <p>No hay solicitudes pendientes.</p>}
        <ul className="review-list">
          {pendientes.map((foto) => (
            <li key={foto.id} className="review-item">
              <Image
                src={`/api/fotos/${foto.fileName}`}
                alt={foto.description ?? "Foto del evento"}
                width={220}
                height={220}
                unoptimized
              />
              <div className="review-details">
                <p>
                  <strong>{foto.user.name}</strong> ({foto.user.email})
                </p>
                {foto.description && <p>{foto.description}</p>}
                <form action={reviewPhoto} className="review-actions">
                  <input type="hidden" name="id" value={foto.id} />
                  <input
                    type="text"
                    name="comentario"
                    placeholder="Comentario (opcional)"
                  />
                  <div className="review-buttons">
                    <button
                      type="submit"
                      name="decision"
                      value="APPROVED"
                      className="btn btn-primary"
                    >
                      Aprobar
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="REJECTED"
                      className="btn btn-danger"
                    >
                      Rechazar
                    </button>
                  </div>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
