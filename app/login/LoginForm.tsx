"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login } from "@/app/actions/auth";

const deviceErrorLabel: Record<string, string> = {
  expirado: "El enlace de confirmación ya expiró. Inicia sesión de nuevo.",
  invalido: "El enlace de confirmación no es válido.",
};

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const deviceError = searchParams.get("device");

  if (state?.pendingDeviceVerification) {
    return (
      <div className="form-success" style={{ marginTop: "1.2rem" }}>
        <p>
          Detectamos que entras desde un dispositivo nuevo. Te enviamos un
          correo con un enlace para confirmar que eres tú — ábrelo desde este
          mismo dispositivo para completar el inicio de sesión.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="auth-form">
      {deviceError && !state && (
        <p className="form-error">
          {deviceErrorLabel[deviceError] ?? "No se pudo confirmar el dispositivo."}
        </p>
      )}

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
