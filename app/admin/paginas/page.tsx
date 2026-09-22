// Página de admin: prender/apagar secciones del sitio para los invitados
// (ver lib/site-sections.ts para la lista de claves y app/page.tsx —
// GuestHome— para dónde se usa cada flag).
import Link from "next/link";
import { requireAdmin } from "@/lib/dal";
import { getSectionFlags } from "@/lib/settings";
import { SITE_SECTIONS } from "@/lib/site-sections";
import { updateSiteSections } from "@/app/actions/settings";
import SaveForm from "@/app/components/SaveForm";

export default async function PaginasPage() {
  const session = await requireAdmin();
  const flags = await getSectionFlags(session.organizationId);

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
        <SaveForm action={updateSiteSections}>
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
        </SaveForm>
      </section>
    </main>
  );
}
