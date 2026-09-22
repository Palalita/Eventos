"use client";

// Formulario de /master. Mismo patrón que app/login/LoginForm.tsx pero
// conectado a masterLogin() (app/actions/master.ts) en vez de login() — esa
// Server Action solo deja pasar cuentas con role MASTER.
import { useActionState } from "react";
import { masterLogin } from "@/app/actions/master";

export default function MasterLoginForm() {
  const [state, action, pending] = useActionState(masterLogin, undefined);

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
    </form>
  );
}
