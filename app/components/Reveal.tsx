"use client";

// Wrapper genérico: envuelve cualquier sección de app/page.tsx y le agrega
// la animación de "aparecer al hacer scroll" (clase .reveal / .reveal-visible
// definida en app/globals.css) usando un IntersectionObserver del navegador.
import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      // threshold 0 (en vez de una fracción del área) para que también
      // funcione en secciones muy largas, como la galería de fotos, donde
      // el visor nunca llega a cubrir un 15% de su altura total.
      // rootMargin positivo: dispara la animación un poco ANTES de que la
      // sección sea visible del todo, así no queda un tramo de scroll
      // "muerto" donde ya se salió del hero pero la siguiente sección
      // todavía no aparece.
      { threshold: 0, rootMargin: "0px 0px 150px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal${visible ? " reveal-visible" : ""}${className ? ` ${className}` : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
