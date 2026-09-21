// Genera el código de 8 caracteres que recibe cada invitado por correo para
// poder crear su cuenta. Lo usa `app/actions/invitations.ts` al crear una
// invitación nueva; el invitado lo escribe en `app/registro/SignupForm.tsx`,
// y `signup()` (en app/actions/auth.ts) lo valida contra la tabla Invitation.
import "server-only";
import { randomInt } from "node:crypto";

// Sin caracteres ambiguos (0/O, 1/I/L) para que sea fácil de transcribir
// a mano si alguien lo recibe por WhatsApp o lo lee en voz alta.
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

export function generateInvitationCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return code;
}
