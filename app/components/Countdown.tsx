"use client";

// Contador regresivo hasta la fecha del evento; lo usa app/page.tsx pasándole
// settings.fechaEvento como string ISO. Tiene que ser "use client" porque
// usa setInterval para actualizarse cada segundo en el navegador — algo que
// no se puede hacer en un Server Component (que solo renderiza una vez).
import { useEffect, useState } from "react";

// Función pura (sin estado): dada una fecha objetivo, calcula cuánto falta
// en días/horas/minutos/segundos. Se recalcula cada segundo desde el efecto.
function getTimeLeft(target: Date) {
  const diff = Math.max(0, target.getTime() - Date.now());
  return {
    dias: Math.floor(diff / (1000 * 60 * 60 * 24)),
    horas: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutos: Math.floor((diff / (1000 * 60)) % 60),
    segundos: Math.floor((diff / 1000) % 60),
  };
}

export default function Countdown({ target }: { target: string }) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(
    null
  );

  useEffect(() => {
    // targetDate se recalcula acá adentro (no en el cuerpo del componente)
    // para que la única dependencia real del efecto sea `target` (el string
    // que llega por props): un objeto Date nuevo en cada render rompería el
    // setInterval de abajo, reiniciándolo constantemente.
    const targetDate = new Date(target);
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval); // limpieza al desmontar o si cambia `target`
  }, [target]);

  if (!timeLeft) return null;

  return (
    <div className="countdown">
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.dias}</span>
        <span className="countdown-label">Días</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.horas}</span>
        <span className="countdown-label">Horas</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.minutos}</span>
        <span className="countdown-label">Min</span>
      </div>
      <div className="countdown-item">
        <span className="countdown-value">{timeLeft.segundos}</span>
        <span className="countdown-label">Seg</span>
      </div>
    </div>
  );
}
