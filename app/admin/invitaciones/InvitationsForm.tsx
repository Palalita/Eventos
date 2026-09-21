"use client";

// Textarea del panel de admin para pegar una lista de correos e invitarlos
// todos de una — llama a la Server Action sendInvitations (app/actions/
// invitations.ts), que parsea el texto, crea un código por correo nuevo y
// manda el mail de invitación.
import { useActionState, useRef, useEffect } from "react";
import { sendInvitations } from "@/app/actions/invitations";

export default function InvitationsForm() {
  const [state, action, pending] = useActionState(sendInvitations, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // Solo limpia el textarea si se creó al menos una invitación nueva; si
  // todo lo pegado ya estaba invitado (o no había correos válidos), lo deja
  // como está para que el admin pueda corregirlo sin volver a escribir todo.
  useEffect(() => {
    if (state && state.created > 0) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="settings-form">
      <label htmlFor="emails">Correos a invitar</label>
      <textarea
        id="emails"
        name="emails"
        placeholder={"Uno por línea o separados por coma:\nmaria@ejemplo.com\njuan@ejemplo.com"}
        rows={5}
        required
      />
      <button type="submit" className="btn btn-primary" style={{ marginTop: "1.2rem" }} disabled={pending}>
        {pending ? "Enviando..." : "Enviar invitaciones"}
      </button>

      {state && (
        <div className="form-success" style={{ marginTop: "1rem" }}>
          {state.created > 0 && <p>✓ {state.created} invitación(es) creada(s) y enviada(s).</p>}
          {state.skipped.length > 0 && (
            <p className="form-error">
              Ya invitados antes (se omitieron): {state.skipped.join(", ")}
            </p>
          )}
          {state.failedToSend.length > 0 && (
            <p className="form-error">
              El código se creó pero el correo no se pudo enviar (compártelo manualmente):{" "}
              {state.failedToSend.join(", ")}
            </p>
          )}
          {state.created === 0 && state.skipped.length === 0 && state.failedToSend.length === 0 && (
            <p className="form-error">No se encontró ningún correo válido.</p>
          )}
        </div>
      )}
    </form>
  );
}
