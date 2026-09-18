import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getSectionFlags } from "@/lib/settings";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { updateSiteSections } from "@/app/actions/settings";

export default async function PaginasPage() {
  await requireAdmin();
  const flags = await getSectionFlags();

  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <h1>Habilitación de páginas</h1>
        <Link href="/" className="btn btn-ghost">
          ← Volver al inicio
        </Link>
      </header>

      <section className="card">
        <h2>Secciones visibles para los invitados</h2>
        <p>Desactiva una sección para ocultarla del sitio temporalmente.</p>
        <form action={updateSiteSections}>
          <div className="toggle-list">
            {SITE_SECTIONS.map((section) => (
              <label key={section.key} className="toggle-item">
                <input
                  type="checkbox"
                  name={section.key}
                  defaultChecked={flags[section.key]}
                />
                {section.label}
              </label>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: "1.2rem" }}>
            Guardar cambios
          </button>
        </form>
      </section>
    </main>
  );
}
