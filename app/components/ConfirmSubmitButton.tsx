"use client";

// Botón de submit que pide confirmación antes de disparar la acción del
// <form> que lo contiene — para acciones irreversibles como borrar un
// administrador y sus invitados (deleteOrganizationAdmin en
// app/actions/master.ts) o borrar a un invitado (deleteGuest en
// app/actions/invitados.ts).
export default function ConfirmSubmitButton({
  confirmMessage,
  className,
  children,
}: {
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
