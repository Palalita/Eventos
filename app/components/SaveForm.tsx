"use client";

// Wrapper genérico para formularios de "guardar cambios" que no necesitan
// redirigir a ningún lado (a diferencia de login/signup): solo muestra un
// "✓ Datos guardados" cuando la Server Action que se le pasa como `action`
// termina. Lo usan app/admin/contenido/page.tsx y app/admin/paginas/page.tsx.
// La action puede devolver `{ error }` (ej. updateEventSettings rechazando
// una foto que no sirve para el layout elegido) en vez de guardar — acá se
// muestra ese mensaje en vez del de éxito.
import { useActionState } from "react";

export default function SaveForm({
  action,
  children,
  className,
  successMessage = "Datos guardados correctamente.",
}: {
  action: (formData: FormData) => Promise<void | { error?: string }>;
  children: React.ReactNode;
  className?: string;
  successMessage?: string;
}) {
  const [state, formAction, isPending] = useActionState(
    async (_prevState: { saved: boolean; error?: string }, formData: FormData) => {
      const result = await action(formData);
      if (result?.error) {
        return { saved: false, error: result.error };
      }
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
      {state.error && !isPending && (
        <p className="form-error" role="alert" style={{ marginTop: "0.8rem" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
