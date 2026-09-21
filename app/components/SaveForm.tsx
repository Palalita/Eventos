"use client";

// Wrapper genérico para formularios de "guardar cambios" que no necesitan
// redirigir a ningún lado (a diferencia de login/signup): solo muestra un
// "✓ Datos guardados" cuando la Server Action que se le pasa como `action`
// termina. Lo usan app/admin/contenido/page.tsx y app/admin/paginas/page.tsx.
import { useActionState } from "react";

export default function SaveForm({
  action,
  children,
  className,
  successMessage = "Datos guardados correctamente.",
}: {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { saved: boolean }, formData: FormData) => {
      await action(formData);
      return { saved: true };
    },
    { saved: false }
  );

  return (
    <form action={formAction} className={className}>
      {children}
      {state.saved && !isPending && (
        <p className="form-success" role="status" style={{ marginTop: "0.8rem" }}>
          ✓ {successMessage}
        </p>
      )}
    </form>
  );
}
