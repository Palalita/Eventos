"use client";

// Formulario de /login, y también dueño del "shell" visual de la página
// (antes vivía en app/login/page.tsx): tiene que serlo porque la
// identidad visual (tema del evento del invitado vs. identidad genérica
// de la plataforma) depende de un estado que solo existe acá — ver
// `branding` abajo.
//
// `useActionState(login, undefined)` conecta el <form> con la Server
// Action `login` (app/actions/auth.ts): en cada submit, React llama a
// login() en el servidor, y lo que esa función devuelve queda disponible
// acá como `state` (errores de validación, mensaje de "correo o
// contraseña incorrectos", o el flag de que hay que revisar el correo por
// verificación de dispositivo).
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { login, getOrgBrandingForEmail } from "@/app/actions/auth";
import { COMPANY_NAME } from "@/lib/company";

// Mensajes para el ?device=... que agrega app/verificar-dispositivo/page.tsx
// cuando redirige acá por un token inválido o vencido.
const deviceErrorLabel: Record<string, string> = {
  expirado: "El enlace de confirmación ya expiró. Inicia sesión de nuevo.",
  invalido: "El enlace de confirmación no es válido.",
};

type Branding = { theme: string | null; font: string | null; lema: string | null } | null;

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  const searchParams = useSearchParams();
  const deviceError = searchParams.get("device");

  const [email, setEmail] = useState("");
  const [branding, setBranding] = useState<Branding>(null);
  const [, startTransition] = useTransition();
  // Evita pedir de nuevo el mismo correo que ya se resolvió (ej. el usuario
  // escribe la contraseña y el cursor vuelve a pasar por el campo sin
  // cambiar el valor).
  const lastLookedUp = useRef("");

  // Debounce simple: espera a que el invitado deje de escribir el correo
  // antes de preguntarle al servidor de qué organización es, en vez de
  // hacerlo en cada tecla.
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed || trimmed === lastLookedUp.current) return;

    const timeout = setTimeout(() => {
      lastLookedUp.current = trimmed;
      startTransition(async () => {
        const result = await getOrgBrandingForEmail(trimmed);
        // Si el correo ya cambió mientras esta consulta estaba en vuelo, no
        // pisa el estado con una respuesta vieja.
        if (trimmed === email.trim()) {
          setBranding(result);
        }
      });
    }, 400);

    return () => clearTimeout(timeout);
  }, [email]);

  // Sin organización resuelta: identidad genérica de la plataforma
  // (`.landing`, la misma paleta neutra de app/page.tsx). Con organización
  // resuelta: el tema/tipografía que su administrador eligió — mismo
  // mecanismo de clases que app/layout.tsx usa para páginas con sesión.
  const mainClassName = [
    "auth-page",
    branding?.theme ? `theme-${branding.theme}` : "landing",
    branding?.font ? `font-${branding.font}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (state?.pendingDeviceVerification) {
    return (
      <main className={mainClassName}>
        <div className="auth-card">
          <div className="form-success" style={{ marginTop: "1.2rem" }}>
            <p>
              Detectamos que entras desde un dispositivo nuevo. Te enviamos un
              correo con un enlace para confirmar que eres tú — ábrelo desde
              este mismo dispositivo para completar el inicio de sesión.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={mainClassName}>
      <div className="auth-card">
        <div className="auth-back-row">
          <Link href="/" className="auth-back-link">
            ← Volver
          </Link>
        </div>
        {branding?.lema ? (
          <p className="invite-eyebrow">{branding.lema}</p>
        ) : (
          <p className="platform-eyebrow">{COMPANY_NAME}</p>
        )}
        <h1>Iniciar sesión</h1>

        <form action={action} className="auth-form">
          {deviceError && !state && (
            <p className="form-error">
              {deviceErrorLabel[deviceError] ?? "No se pudo confirmar el dispositivo."}
            </p>
          )}

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
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
      </div>
    </main>
  );
}
