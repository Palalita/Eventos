"use client";

// Usado por app/page.tsx para mostrar la foto principal del evento
// (settings.fotoPrincipalUrl) con un fundito de entrada.
import { useEffect, useRef, useState } from "react";

// Evita el "pop" brusco de la foto principal: la deja en opacity 0 hasta
// que termina de cargar (incluye el caso de imagen ya en caché, donde el
// evento onLoad puede no disparar tras el montaje).
export default function HeroPhoto({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      className={className}
      onLoad={() => setLoaded(true)}
      style={{ opacity: loaded ? 1 : 0, transition: "opacity 0.5s ease" }}
    />
  );
}
