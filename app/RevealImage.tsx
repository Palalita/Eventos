"use client";

// Imagen que entra con un crecimiento suave (escala + blur + fade) al
// llegar al viewport, y mientras está a la vista se mueve un poco a
// contra-scroll (parallax) — usado tanto para las fotos chicas de la
// galería como para las fotos grandes de "tipos de evento" en
// app/page.tsx (el tamaño real lo define el CSS de cada sección, esto
// solo pone la animación). Sin JS o con prefers-reduced-motion, se
// muestra fija y quieta, nunca depende de JS para poder verse.
import { useEffect, useRef, useState } from "react";

export default function RevealImage({
  src,
  alt = "",
  width = 500,
  height = 500,
  delayMs = 0,
  parallaxSpeed = 1,
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  delayMs?: number;
  // >0 = se mueve en sentido contrario al scroll (efecto clásico de
  // parallax); valores más grandes = se mueve más.
  parallaxSpeed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // null = todavía no corrió el efecto (SSR o hidratando): se muestra
  // visible. Solo "false" la oculta antes de revelarla.
  const [visible, setVisible] = useState<boolean | null>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Se declara acá afuera (no adentro del if) para poder desconectarlo
    // en el cleanup pase lo que pase — si el componente se desmonta
    // antes de que la imagen entre al viewport, si no se hace así el
    // observer queda vivo para siempre.
    let observer: IntersectionObserver | null = null;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) {
      setVisible(true);
    } else {
      setVisible(false);
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer?.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(el);
    }

    if (reducedMotion) {
      return () => observer?.disconnect();
    }

    let raf = 0;
    function updateOffset() {
      raf = 0;
      const r = el!.getBoundingClientRect();
      // -1 cuando el centro de la imagen está en el borde inferior del
      // viewport, 0 en el centro, 1 en el borde superior.
      const progress = (window.innerHeight / 2 - (r.top + r.height / 2)) / window.innerHeight;
      setOffset(progress * 32 * parallaxSpeed);
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(updateOffset);
    }
    updateOffset();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [parallaxSpeed]);

  return (
    <div ref={ref} className="landing-image-reveal-item" style={{ transform: `translateY(${offset}px)` }}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        className={`landing-image-reveal ${visible === false ? "" : "landing-image-reveal--visible"}`}
        style={{ transitionDelay: `${delayMs}ms` }}
      />
    </div>
  );
}
