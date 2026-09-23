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
  // Uno de los ids en lib/themes.ts / lib/fonts.ts / lib/layouts.ts; se
  // validan contra esas listas en la Server Action (no acá, para no
  // importar esos módulos en el esquema).
  theme: z.string().min(1, { error: "Elegí una paleta de color para tu evento." }),
  font: z.string().min(1, { error: "Elegí una tipografía para tu evento." }),
  layout: z.string().min(1, { error: "Elegí una estructura de portada para tu evento." }),
});

export type CreateOrganizationFormState =
  | {
      errors?: {
        eventName?: string[];
        name?: string[];
        email?: string[];
        password?: string[];
        theme?: string[];
        font?: string[];
        layout?: string[];
        // No viene de Zod (la valida createOrganization a mano, ya con el
        // archivo en memoria) — ver cinemaPhotoAspectRatioError en
        // lib/uploads.ts.
        fotoPrincipal?: string[];
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
      // Presente cuando ese correo+contraseña coinciden con MÁS de una
      // cuenta (la misma persona tiene eventos distintos con el mismo
      // correo Y la misma contraseña) — LoginForm.tsx muestra un selector
      // en vez de entrar directo a cualquiera de las dos al azar.
      multipleAccounts?: {
        userId: string;
        organizationName: string;
        role: "ADMIN" | "GUEST";
      }[];
    }
  | undefined;
