import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getEventSettings } from "@/lib/settings";
import { updateEventSettings } from "@/app/actions/settings";

function toDatetimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default async function ContenidoPage() {
  await requireAdmin();
  const settings = await getEventSettings();

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Invitación, indicaciones y Save the Date</h1>
        <Link href="/" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <section className="card">
        <h2>Editar contenido del evento</h2>
        <form action={updateEventSettings} className="settings-form">
          <label htmlFor="quinceaneraNombre">Nombre de la quinceañera</label>
          <input
            id="quinceaneraNombre"
            name="quinceaneraNombre"
            defaultValue={settings.quinceaneraNombre}
            required
          />

          <label htmlFor="lema">Lema del sitio</label>
          <input id="lema" name="lema" defaultValue={settings.lema} required />

          <label htmlFor="fechaEvento">Fecha y hora del evento</label>
          <input
            id="fechaEvento"
            name="fechaEvento"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(settings.fechaEvento)}
            required
          />

          <label htmlFor="lugar">Lugar</label>
          <input id="lugar" name="lugar" defaultValue={settings.lugar} required />

          <label htmlFor="indicaciones">Indicaciones (código de vestimenta, parqueo, etc.)</label>
          <textarea
            id="indicaciones"
            name="indicaciones"
            defaultValue={settings.indicaciones}
          />

          <label htmlFor="saveTheDateMensaje">Mensaje de Save the Date</label>
          <textarea
            id="saveTheDateMensaje"
            name="saveTheDateMensaje"
            defaultValue={settings.saveTheDateMensaje}
          />

          <button type="submit" className="btn btn-primary" style={{ marginTop: "1.2rem" }}>
            Guardar cambios
          </button>
        </form>
      </section>
    </main>
  );
}
