import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { db } from "@/lib/db";
import { revokeTrustedDevice } from "@/app/actions/settings";

export default async function DispositivosPage() {
  const session = await requireAdmin();

  const devices = await db.trustedDevice.findMany({
    where: { userId: session.userId },
    orderBy: { lastSeenAt: "desc" },
  });

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Dispositivos aprobados</h1>
        <Link href="/" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <section className="card">
        <h2>Dispositivos que confirmaste por correo</h2>
        <p>
          Cuando inicias sesión desde un dispositivo que no está en esta
          lista, te enviamos un correo para confirmar que eres tú antes de
          dejarte entrar.
        </p>
        {devices.length === 0 ? (
          <p>Aún no hay dispositivos confirmados.</p>
        ) : (
          <table className="device-table">
            <thead>
              <tr>
                <th>Dispositivo</th>
                <th>Confirmado</th>
                <th>Último uso</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {devices.map((device) => (
                <tr key={device.id}>
                  <td>{device.label ?? "Sin nombre"}</td>
                  <td>
                    {new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(
                      device.createdAt
                    )}
                  </td>
                  <td>
                    {new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(
                      device.lastSeenAt
                    )}
                  </td>
                  <td>
                    <form action={revokeTrustedDevice}>
                      <input type="hidden" name="id" value={device.id} />
                      <button type="submit" className="btn btn-danger">
                        Revocar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
