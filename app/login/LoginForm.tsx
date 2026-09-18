"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="email">Correo electrónico</label>
      <input id="email" name="email" type="email" required />
      {state?.errors?.email && <p className="field-error">{state.errors.email}</p>}

      <label htmlFor="password">Contraseña</label>
      <input id="password" name="password" type="password" required />
      {state?.errors?.password && (
        <p className="field-error">{state.errors.password}</p>
      )}

      {state?.message && <p className="form-error">{state.message}</p>}

      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="auth-switch">
        ¿No tienes invitación registrada?{" "}
        <Link href="/registro">Regístrate aquí</Link>
      </p>
    </form>
  );
}
