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

    const rect = el.getBoundingClientRect();
    setVisible(rect.top < window.innerHeight * 0.9);

    if (reducedMotion) return;

    // El listener de scroll (y su getBoundingClientRect en cada frame) solo
    // se conecta mientras esta imagen está CERCA del viewport (margen
    // generoso de 300px) — sin esto, cada RevealImage de la página (hasta
    // 9 a la vez entre galería y vitrina) recalculaba su posición en TODOS
    // los scroll aunque estuviera a miles de píxeles de la pantalla. El
    // IntersectionObserver decide "cerca o no" de forma nativa/asíncrona,
    // sin que nosotros forcemos layout en cada frame para saberlo.
    let raf = 0;
    let listening = false;

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

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!listening) {
            window.addEventListener("scroll", onScroll, { passive: true });
            listening = true;
          }
          updateOffset();
        } else if (listening) {
          window.removeEventListener("scroll", onScroll);
          listening = false;
          if (raf) {
            cancelAnimationFrame(raf);
            raf = 0;
          }
        }
      },
      { rootMargin: "300px 0px 300px 0px", threshold: 0 }
    );
    nearObserver.observe(el);

    return () => {
      nearObserver.disconnect();
      if (listening) window.removeEventListener("scroll", onScroll);
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
