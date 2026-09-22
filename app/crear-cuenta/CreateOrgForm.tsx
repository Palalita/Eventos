"use client";

// Formulario de /crear-cuenta. Igual patrón que SignupForm/LoginForm: usa
// useActionState para conectarse a la Server Action `createOrganization`
// (app/actions/organizations.ts).
import { useActionState } from "react";
import Link from "next/link";
import { createOrganization } from "@/app/actions/organizations";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";

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

      <fieldset className="theme-picker">
        <legend>Elegí un diseño para tu sitio</legend>
        <div className="theme-picker-grid">
          {THEMES.map((theme) => (
            <div key={theme.id} className="theme-option">
              <input
                type="radio"
                id={`theme-${theme.id}`}
                name="theme"
                value={theme.id}
                defaultChecked={theme.id === DEFAULT_THEME}
                className="theme-option-input"
              />
              <label htmlFor={`theme-${theme.id}`} className="theme-option-label">
                <span className="theme-option-preview" aria-hidden="true">
                  {theme.preview.map((color, i) => (
                    <span key={i} style={{ background: color }} />
                  ))}
                </span>
                <span className="theme-option-name">{theme.label}</span>
                <span className="theme-option-description">{theme.description}</span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      {state?.errors?.theme && <p className="field-error">{state.errors.theme}</p>}

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
