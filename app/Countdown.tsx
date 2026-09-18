"use client";

import { useEffect, useState } from "react";

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
  const targetDate = new Date(target);
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft> | null>(
    null
  );

  useEffect(() => {
    setTimeLeft(getTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
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
