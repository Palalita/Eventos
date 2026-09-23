"use client";

// Formulario de /crear-cuenta, armado como wizard de 5 pasos (datos →
// diseño → colores → tipografía → detalles) para darle más espacio a cada
// decisión de diseño en vez de amontonar todo en un solo formulario largo.
// Sigue siendo UN solo <form> con una sola Server Action (createOrganization,
// app/actions/organizations.ts): los pasos solo controlan qué se muestra,
// no dividen el envío. Por eso cada campo es controlado (useState) en vez
// de dejar que el DOM guarde el valor — así, al cambiar de paso (que
// remonta el contenido para poder animarlo con @keyframes en
// app/globals.css), ningún valor se pierde. Cada paso vive en su propio
// componente acá abajo para que este archivo no sea una sola función con
// bloques de JSX condicional adentro.
import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createOrganization } from "@/app/actions/organizations";
import { CreateOrganizationFormState } from "@/lib/definitions";
import { THEMES, DEFAULT_THEME } from "@/lib/themes";
import { FONTS, DEFAULT_FONT } from "@/lib/fonts";
import { LAYOUTS, DEFAULT_LAYOUT } from "@/lib/layouts";

const STEP_LABELS = ["Datos", "Diseño", "Colores", "Tipografía", "Detalles"];

// Silueta chica de cada estructura de portada — sirve de vista previa en el
// picker sin tener que reproducir el layout real dentro de una cajita
// diminuta. Colores fijos a propósito (no el tema elegido): este paso va
// ANTES de elegir paleta, así que todavía no hay un tema que aplicarle.
function LayoutIcon({ layoutId }: { layoutId: string }) {
  if (layoutId === "cinematica") {
    return (
      <svg viewBox="0 0 72 54" width="72" height="54" aria-hidden="true">
        <rect x="0" y="0" width="72" height="54" rx="4" fill="#d86c7d" />
        <rect x="0" y="30" width="72" height="24" fill="#5c1a28" opacity="0.75" />
        <rect x="8" y="36" width="32" height="3" rx="1.5" fill="#ffffff" />
        <rect x="8" y="43" width="20" height="2" rx="1" fill="#ffffff" opacity="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 72 54" width="72" height="54" aria-hidden="true">
      <rect x="0" y="0" width="72" height="54" rx="4" fill="#fff8f5" stroke="#f0d9dd" />
      <rect x="24" y="6" width="24" height="28" rx="1" fill="#f5cbd5" stroke="#d86c7d" />
      <rect x="26" y="40" width="20" height="2.5" rx="1.25" fill="#bda672" />
      <rect x="30" y="46" width="12" height="2" rx="1" fill="#d86c7d" opacity="0.6" />
    </svg>
  );
}

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

function StepLayout({
  state,
  layout,
  setLayout,
  onBack,
  onNext,
}: {
  state: CreateOrganizationFormState;
  layout: string;
  setLayout: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="wizard-step" key="step-2" data-step-content="2">
      <p className="wizard-step-hint">
        Elegí cómo se arma la portada de tu sitio — el color y la tipografía
        se eligen en los próximos pasos.
      </p>

      <fieldset className="theme-picker">
        <legend>Elegí una estructura de portada</legend>
        <div className="theme-picker-grid wizard-layout-grid">
          {LAYOUTS.map((option) => (
            <div key={option.id} className="theme-option">
              <input
                type="radio"
                id={`layout-${option.id}`}
                name="layout"
                value={option.id}
                checked={layout === option.id}
                onChange={() => setLayout(option.id)}
                className="theme-option-input"
              />
              <label htmlFor={`layout-${option.id}`} className="theme-option-label">
                <span className="theme-option-preview wizard-layout-swatch" aria-hidden="true">
                  <LayoutIcon layoutId={option.id} />
                </span>
                <span className="theme-option-name">{option.label}</span>
                <span className="theme-option-description">{option.description}</span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      {state?.errors?.layout && <p className="field-error">{state.errors.layout}</p>}

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
    <div className="wizard-step" key="step-3" data-step-content="3">
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
  eventName,
  theme,
  font,
  setFont,
  onBack,
  onNext,
}: {
  state: CreateOrganizationFormState;
  eventName: string;
  theme: string;
  font: string;
  setFont: (v: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="wizard-step" key="step-4" data-step-content="4">
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
        <button type="button" className="btn btn-primary" onClick={onNext}>
          Siguiente
        </button>
      </div>
    </div>
  );
}

// Último paso, opcional del todo: mensaje de bienvenida y foto de portada.
// A propósito ninguno de los dos es `required` — no todos tienen ya un
// texto/foto a mano al crear la cuenta, y frenar el registro por eso
// alejaría gente que igual puede completarlo después desde
// /admin/contenido. El <input type="file"> no se puede "controlar" con
// React (el navegador no deja setear su value por seguridad), así que solo
// se guarda el nombre elegido para mostrarlo — el archivo en sí viaja tal
// cual está en el DOM al momento del submit, no por estado.
function StepDetails({
  state,
  pending,
  lema,
  setLema,
  fotoName,
  setFotoName,
  onBack,
}: {
  state: CreateOrganizationFormState;
  pending: boolean;
  lema: string;
  setLema: (v: string) => void;
  fotoName: string | null;
  setFotoName: (v: string | null) => void;
  onBack: () => void;
}) {
  return (
    <div className="wizard-step" key="step-5" data-step-content="5">
      <p className="wizard-step-hint">
        Un mensaje de bienvenida y una foto de portada para tu sitio — ambos
        opcionales, los podés completar más adelante si no los tenés a mano
        todavía.
      </p>

      <label htmlFor="lema">Mensaje de bienvenida (opcional)</label>
      <input
        id="lema"
        name="lema"
        type="text"
        placeholder='Ej: "Nos casamos y queremos celebrarlo con ustedes"'
        value={lema}
        onChange={(e) => setLema(e.target.value)}
        maxLength={140}
      />

      <label htmlFor="fotoPrincipal">Foto de portada (opcional)</label>
      <input
        id="fotoPrincipal"
        name="fotoPrincipal"
        type="file"
        accept="image/*"
        onChange={(e) => setFotoName(e.target.files?.[0]?.name ?? null)}
      />
      {fotoName && <p className="wizard-file-selected">Seleccionaste: {fotoName}</p>}

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
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [font, setFont] = useState(DEFAULT_FONT);
  const [lema, setLema] = useState("");
  const [fotoName, setFotoName] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  // Si el envío final falla (p. ej. correo ya usado, contraseña corta),
  // el usuario puede estar parado en el paso 5 sin ver el error del paso
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
    } else if (state.errors?.layout) {
      setStep(2);
    } else if (state.errors?.theme) {
      setStep(3);
    } else if (state.errors?.font) {
      setStep(4);
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
          que siempre dispara desde el paso 5, incluya TODOS los campos y
          no solo los del paso donde se hizo click en "Crear mi evento".
          `lema`/`fotoPrincipal` no necesitan este espejo: viven solo en el
          paso 5, que es justo donde se envía el form. */}
      {step !== 1 && (
        <>
          <input type="hidden" name="eventName" value={eventName} />
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="password" value={password} />
        </>
      )}
      {step !== 2 && <input type="hidden" name="layout" value={layout} />}
      {step !== 3 && <input type="hidden" name="theme" value={theme} />}
      {step !== 4 && <input type="hidden" name="font" value={font} />}

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
        <StepLayout
          state={state}
          layout={layout}
          setLayout={setLayout}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepColors
          state={state}
          eventName={eventName}
          theme={theme}
          setTheme={setTheme}
          font={font}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <StepFonts
          state={state}
          eventName={eventName}
          theme={theme}
          font={font}
          setFont={setFont}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
        />
      )}

      {step === 5 && (
        <StepDetails
          state={state}
          pending={pending}
          lema={lema}
          setLema={setLema}
          fotoName={fotoName}
          setFotoName={setFotoName}
          onBack={() => setStep(4)}
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
