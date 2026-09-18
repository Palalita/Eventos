"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

export default function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="name">Nombre completo</label>
      <input id="name" name="name" type="text" required />
      {state?.errors?.name && <p className="field-error">{state.errors.name}</p>}

      <label htmlFor="email">Correo electrónico</label>
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
        {pending ? "Creando cuenta..." : "Crear mi invitación"}
      </button>

      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </form>
  );
}
