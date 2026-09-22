// Esquemas de validación (con Zod) y tipos de estado para los formularios de
// login y registro. `app/actions/auth.ts` usa los *Schema para validar los
// datos que llegan del formulario antes de tocar la base de datos; los
// componentes de cliente `app/login/LoginForm.tsx` y
// `app/registro/SignupForm.tsx` usan los tipos *State para tipar lo que
// useActionState() les devuelve (los mensajes de error a mostrar).
import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).trim(),
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z
    .string()
    .min(6, { error: "La contraseña debe tener al menos 6 caracteres." }),
  // El código de invitación que se manda por correo (ver lib/invitation-code.ts);
  // sin uno válido no se puede crear una cuenta.
  code: z
    .string()
    .min(4, { error: "Ingresa el código de invitación que recibiste por correo." })
    .trim(),
});

// Forma del segundo valor que devuelve useActionState(signup, ...) en
// SignupForm.tsx: errores por campo (para mostrar debajo de cada input) y/o
// un mensaje general.
export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        code?: string[];
      };
      message?: string;
    }
  | undefined;

// /crear-cuenta: un cliente nuevo da de alta su propia organización (evento)
// y su cuenta de admin en un solo formulario. Usado por
// app/actions/organizations.ts#createOrganization.
export const CreateOrganizationFormSchema = z.object({
  eventName: z
    .string()
    .min(2, { error: "Ponele un nombre a tu evento (mínimo 2 caracteres)." })
    .trim(),
  name: z.string().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).trim(),
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z
    .string()
    .min(6, { error: "La contraseña debe tener al menos 6 caracteres." }),
});

export type CreateOrganizationFormState =
  | {
      errors?: {
        eventName?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const LoginFormSchema = z.object({
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z.string().min(1, { error: "La contraseña es requerida." }),
});

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      // true cuando el login fue correcto pero el dispositivo no es de
      // confianza: login() ya mandó el correo de verificación y LoginForm.tsx
      // muestra un aviso de "revisá tu correo" en vez de redirigir.
      pendingDeviceVerification?: boolean;
    }
  | undefined;
