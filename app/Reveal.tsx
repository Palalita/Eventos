"use client";

// Envuelve contenido (pensado para las fotos de la landing, app/page.tsx)
// y lo hace aparecer con un fade+slide cuando entra en el viewport, en vez
// de estar ahí desde el primer render. Sin JS (o antes de que hidrate),
// se renderiza visible tal cual — nunca depende de JS para poder verse,
// solo para la animación de entrada.
import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // null = todavía no corrió el efecto (SSR o justo hidratando): se
  // renderiza visible. Solo "false" oculta, y nada más lo pone así.
  const [visible, setVisible] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Si ya está a la vista al cargar (viewports altos, o esta sección
    // quedó arriba de todo), no tiene sentido esconderla para luego
    // mostrarla de inmediato.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      setVisible(true);
      return;
    }

    setVisible(false);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible === false ? "" : "reveal--visible"} ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
}
