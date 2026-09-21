"use client";

// Formulario de /registro. Igual que LoginForm, usa useActionState para
// conectarse a la Server Action `signup` (app/actions/auth.ts), que valida
// el código de invitación y crea la cuenta.
import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/actions/auth";

// `defaultCode` llega de app/registro/page.tsx, que lee el código de la URL
// (?code=...) que viene en el link del correo de invitación — así el
// invitado no tiene que copiarlo y pegarlo a mano.
export default function SignupForm({ defaultCode }: { defaultCode: string }) {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="code">Código de invitación</label>
      <input
        id="code"
        name="code"
        type="text"
        defaultValue={defaultCode}
        placeholder="Lo recibiste por correo"
        autoCapitalize="characters"
        required
      />
      {state?.errors?.code && <p className="field-error">{state.errors.code}</p>}

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
