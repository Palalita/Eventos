import * as z from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { error: "El nombre debe tener al menos 2 caracteres." }).trim(),
  email: z.email({ error: "Ingresa un correo válido." }).trim(),
  password: z
    .string()
    .min(6, { error: "La contraseña debe tener al menos 6 caracteres." }),
});

export type SignupFormState =
  | {
      errors?: {
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
      pendingDeviceVerification?: boolean;
    }
  | undefined;
