"use client";

// Formulario de /crear-cuenta. Igual patrón que SignupForm/LoginForm: usa
// useActionState para conectarse a la Server Action `createOrganization`
// (app/actions/organizations.ts).
import { useActionState } from "react";
import Link from "next/link";
import { createOrganization } from "@/app/actions/organizations";

export default function CreateOrgForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="eventName">Nombre de tu evento</label>
      <input
        id="eventName"
        name="eventName"
        type="text"
        placeholder="Ej: XV años de Valentina"
        required
      />
      {state?.errors?.eventName && (
        <p className="field-error">{state.errors.eventName}</p>
      )}

      <label htmlFor="name">Tu nombre completo</label>
      <input id="name" name="name" type="text" required />
      {state?.errors?.name && <p className="field-error">{state.errors.name}</p>}

      <label htmlFor="email">Tu correo electrónico</label>
      <input id="email" name="email" type="email" required />
      {state?.errors?.email && <p className="field-error">{state.errors.email}</p>}

      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" required />
      {state?.errors?.password && (
        <ul className="field-error">
          {state.errors.password.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {state?.message && <p className="form-error">{state.message}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Creando tu evento..." : "Crear mi evento"}
      </button>

      <p className="auth-switch">
        ¿Ya tenés cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
