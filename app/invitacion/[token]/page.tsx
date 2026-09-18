import Image from "next/image";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { eventConfig } from "@/lib/event-config";
import { checkInGuest } from "@/app/actions/photos";

const fechaFormateada = new Intl.DateTimeFormat("es-GT", {
  dateStyle: "full",
  timeStyle: "short",
}).format(eventConfig.fechaEvento);

export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await db.user.findUnique({ where: { qrToken: token } });
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";
  const isOwner = session?.userId === user?.id;

  if (!user) {
    return (
      <main className="invite-page">
        <div className="invite-card">
          <h1>Invitación no válida</h1>
          <p>Este código no corresponde a ninguna invitación registrada.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="invite-page">
      <div className="invite-card">
        <p className="invite-eyebrow">{eventConfig.lema}</p>
        <h1>{eventConfig.quinceaneraNombre}</h1>
        <p className="invite-guest">Invitación de {user.name}</p>

        <div className="invite-details">
          <p>{fechaFormateada}</p>
          <p>{eventConfig.lugar}</p>
        </div>

        {user.attended ? (
          <p className="invite-status invite-status--ok">
            ✓ Asistencia confirmada
            {user.checkedInAt &&
              ` · ${new Intl.DateTimeFormat("es-GT", { timeStyle: "short" }).format(user.checkedInAt)}`}
          </p>
        ) : (
          <p className="invite-status">Aún no ha registrado su llegada</p>
        )}

        {isAdmin && !user.attended && (
          <form action={checkInGuest}>
            <input type="hidden" name="qrToken" value={token} />
            <button type="submit" className="btn btn-primary">
              Confirmar asistencia
            </button>
          </form>
        )}

        {isOwner && (
          <div className="invite-qr">
            <Image
              src={`/api/qr/${token}`}
              alt="Código QR de la invitación"
              width={200}
              height={200}
              unoptimized
            />
          </div>
        )}
      </div>
    </main>
  );
}
