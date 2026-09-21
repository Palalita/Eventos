import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/device";
import { confirmDeviceVerification } from "@/app/actions/auth";

// Solo lectura: valida el token pero no confirma nada todavía. La
// confirmación real (crear el dispositivo de confianza, abrir la sesión)
// requiere que el admin haga clic en el botón de abajo, que dispara un POST
// (confirmDeviceVerification). Así un GET -por ejemplo un escáner de
// seguridad de correo que "visita" los links antes de que el usuario haga
// clic- no puede quemar el token ni loguear a nadie por sí solo.
export default async function VerificarDispositivoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    redirect("/login?device=invalido");
  }

  const verification = await db.deviceVerification.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!verification || verification.expiresAt < new Date()) {
    redirect("/login?device=expirado");
  }

  const user = await db.user.findUnique({ where: { id: verification.userId } });
  if (!user) {
    redirect("/login?device=invalido");
  }

  return (
    <main className="invite-page">
      <div className="invite-card">
        <h1>Confirmar dispositivo</h1>
        <p>
          Detectamos un inicio de sesión de administrador ({user.email}) desde
          un dispositivo que no reconocíamos.
        </p>
        <form action={confirmDeviceVerification}>
          <input type="hidden" name="token" value={token} />
          <button type="submit" className="btn btn-primary">
            Confirmar que soy yo e iniciar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
