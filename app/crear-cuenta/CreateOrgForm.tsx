"use client";

// Formulario de /crear-cuenta, armado como wizard de 3 pasos (datos →
// colores → tipografía) para darle más espacio a cada decisión de diseño
// en vez de amontonar todo en un solo formulario largo. Sigue siendo UN
// solo <form> con una sola Server Action (createOrganization,
// app/actions/organizations.ts): los 3 pasos solo controlan qué se
// muestra, no dividen el envío. Por eso cada campo es controlado (useState)
// en vez de dejar que el DOM guarde el valor — así, al cambiar de paso
// (que remonta el contenido para poder animarlo con @keyframes en
// app/globals.css), ningún valor se pierde. Cada paso vive en su propio
// componente acá abajo para que este archivo no sea una sola función con
// tres bloques de JSX condicional adentro.
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createOrganization } from "@/app/actions/organizations";
import { CreateOrganizationFormState } from "@/lib/definitions";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { FONTS, DEFAULT_FONT } from "@/lib/fonts";

const STEP_LABELS = ["Datos", "Colores", "Tipografía"];

function WizardProgress({ step }: { step: number }) {
  return (
    <ol className="wizard-progress">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        return (
          <li key={label} className="wizard-progress-item">
            <span className="wizard-progress-step" data-active={step === stepNumber}>
              <span className="wizard-progress-dot" aria-hidden="true">
                {step > stepNumber ? "✓" : stepNumber}
              </span>
              <span className="wizard-progress-label">{label}</span>
            </span>
            {index < STEP_LABELS.length - 1 && (
              <span className="wizard-progress-connector" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// Mini vista previa en vivo: aplica la paleta/tipografía elegidas como
// clases .theme-*/.font-* sobre este div nada más (el mismo mecanismo que
// usa <html> en app/layout.tsx para una organización real), así se ve
// exactamente el resultado final sin reimplementar los colores en JS.
function WizardPreview({
  eventName,
  theme,
  font,
}: {
  eventName: string;
  theme: string;
  font: string;
}) {
  return (
    <div className={`wizard-preview theme-${theme} font-${font}`}>
      <p className="wizard-preview-eyebrow">Vista previa</p>
      <p className="wizard-preview-title">{eventName.trim() || "El nombre de tu evento"}</p>
      <span className="wizard-preview-action">Ver invitación</span>
    </div>
  );
}

function StepData({
  state,
  eventName,
  setEventName,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onNext,
}: {
  state: CreateOrganizationFormState;
  eventName: string;
  setEventName: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div className="wizard-step" key="step-1" data-step-content="1">
      <p className="wizard-step-hint">Contanos sobre tu evento y tu cuenta.</p>

      <label htmlFor="eventName">Nombre de tu evento</label>
      <input
        id="eventName"
        name="eventName"
        type="text"
        placeholder="Ej: XV años de Valentina"
        value={eventName}
        onChange={(e) => setEventName(e.target.value)}
        required
      />
      {state?.errors?.eventName && <p className="field-error">{state.errors.eventName}</p>}

      <label htmlFor="name">Tu nombre completo</label>
      <input
        id="name"
        name="name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      {state?.errors?.name && <p className="field-error">{state.errors.name}</p>}

      <label htmlFor="email">Tu correo electrónico</label>
      <input
        id="email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      {state?.errors?.email && <p className="field-error">{state.errors.email}</p>}

      <label htmlFor="password">Contraseña</label>
      <input
        id="password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={6}
        required
      />
      {state?.errors?.password && (
        <ul className="field-error">
          {state.errors.password.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      {state?.message && <p className="form-error">{state.message}</p>}

      <div className="wizard-nav">
        <span className="wizard-nav-spacer" />
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

function StepColors({
  state,
  eventName,
  theme,
  setTheme,
  font,
  onBack,
  onNext,
}: {
  state: CreateOrganizationFormState;
  eventName: string;
  theme: string;
  setTheme: (v: string) => void;
  font: string;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="wizard-step" key="step-2" data-step-content="2">
      <p className="wizard-step-hint">
        Elegí la paleta de color de tu sitio — la tipografía la elegís en el próximo paso.
      </p>

      <fieldset className="theme-picker">
        <legend>Elegí una paleta de color</legend>
        <div className="theme-picker-grid wizard-palette-grid">
          {THEMES.map((option) => (
            <div key={option.id} className="theme-option">
              <input
                type="radio"
                id={`theme-${option.id}`}
                name="theme"
                value={option.id}
                checked={theme === option.id}
                onChange={() => setTheme(option.id)}
                className="theme-option-input"
              />
              <label htmlFor={`theme-${option.id}`} className="theme-option-label">
                <span className="theme-option-preview wizard-palette-swatch" aria-hidden="true">
                  {option.preview.map((color, i) => (
                    <span key={i} style={{ background: color }} />
                  ))}
                </span>
                <span className="theme-option-name">{option.label}</span>
                <span className="theme-option-description">{option.description}</span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      {state?.errors?.theme && <p className="field-error">{state.errors.theme}</p>}

      <WizardPreview eventName={eventName} theme={theme} font={font} />

      <div className="wizard-nav">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Atrás
        </button>
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

function StepFonts({
  state,
  pending,
  eventName,
  theme,
  font,
  setFont,
  onBack,
}: {
  state: CreateOrganizationFormState;
  pending: boolean;
  eventName: string;
  theme: string;
  font: string;
  setFont: (v: string) => void;
  onBack: () => void;
}) {
  return (
    <div className="wizard-step" key="step-3" data-step-content="3">
      <p className="wizard-step-hint">Elegí la tipografía de tu sitio.</p>

      <fieldset className="theme-picker">
        <legend>Elegí una tipografía</legend>
        <div className="wizard-font-grid">
          {FONTS.map((option) => (
            <div key={option.id} className="theme-option">
              <input
                type="radio"
                id={`font-${option.id}`}
                name="font"
                value={option.id}
                checked={font === option.id}
                onChange={() => setFont(option.id)}
                className="theme-option-input"
              />
              <label htmlFor={`font-${option.id}`} className="theme-option-label">
                <span className={`wizard-font-sample font-${option.id}`} aria-hidden="true">
                  Aa
                </span>
                <span className="theme-option-name">{option.label}</span>
                <span className="theme-option-description">{option.description}</span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      {state?.errors?.font && <p className="field-error">{state.errors.font}</p>}

      <WizardPreview eventName={eventName} theme={theme} font={font} />

      <div className="wizard-nav">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          Atrás
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Creando tu evento..." : "Crear mi evento"}
        </button>
      </div>
    </div>
  );
}

export default function CreateOrgForm() {
  const [state, action, pending] = useActionState(createOrganization, undefined);
  const [step, setStep] = useState(1);

  const [eventName, setEventName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [font, setFont] = useState(DEFAULT_FONT);

  const formRef = useRef<HTMLFormElement>(null);

  // Si el envío final falla (p. ej. correo ya usado, contraseña corta),
  // el usuario puede estar parado en el paso 3 sin ver el error del paso
  // 1 — lo mandamos de vuelta al paso donde está el campo con el error.
  useEffect(() => {
    if (!state) return;
    const step1HasError =
      state.message ||
      state.errors?.eventName ||
      state.errors?.name ||
      state.errors?.email ||
      state.errors?.password;
    if (step1HasError) {
      setStep(1);
    } else if (state.errors?.theme) {
      setStep(2);
    } else if (state.errors?.font) {
      setStep(3);
    }
  }, [state]);

  function handleNextFromStep1() {
    const container = formRef.current?.querySelector('[data-step-content="1"]');
    if (!container) {
      setStep(2);
      return;
    }
    const fields = container.querySelectorAll<HTMLInputElement>("input[required]");
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return;
      }
    }
    setStep(2);
  }

  return (
    <form ref={formRef} action={action} className="auth-form">
      <WizardProgress step={step} />

      {/* Cada paso solo monta sus propios campos — mientras uno no está
          visible, estos inputs ocultos mantienen su valor (ya vive en
          estado de React) presente en el <form> para que el envío final,
          que siempre dispara desde el paso 3, incluya TODOS los campos y
          no solo los del paso donde se hizo click en "Crear mi evento". */}
      {step !== 1 && (
        <>
          <input type="hidden" name="eventName" value={eventName} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
        </>
      )}
      {step !== 2 && <input type="hidden" name="theme" value={theme} />}
      {step !== 3 && <input type="hidden" name="font" value={font} />}

      {step === 1 && (
        <StepData
          state={state}
          eventName={eventName}
          setEventName={setEventName}
          name={name}
          setName={setName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onNext={handleNextFromStep1}
        />
      )}

      {step === 2 && (
        <StepColors
          state={state}
          eventName={eventName}
          theme={theme}
          setTheme={setTheme}
          font={font}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepFonts
          state={state}
          pending={pending}
          eventName={eventName}
          theme={theme}
          font={font}
          setFont={setFont}
          onBack={() => setStep(2)}
        />
      )}

      {step === 1 && (
        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link href="/login">Inicia sesión</Link>
        </p>
      )}
    </form>
  );
}
