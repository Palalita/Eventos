"use client";

// La flechita animada "Desliza" que se ve al entrar a app/page.tsx (cuando
// el usuario es GUEST), invitando a bajar por el resto de la página.
import { useEffect, useState } from "react";

// Fijo a la ventana (no al hero): el borde inferior del hero siempre queda
// un poco por debajo de lo visible en pantalla (por la altura del header),
// así que anclarlo ahí lo dejaba invisible sin scrollear. Se oculta solo
// una vez que el usuario ya empezó a bajar.
export default function ScrollHint() {
  const [scrolled, setScrolled] = useState(false);
  const [fits, setFits] = useState(false);

  useEffect(() => {
    function checkFit() {
      const countdown = document.querySelector(".countdown");
      const bar = document.querySelector(".floating-bar");
      if (!countdown || !bar) return;
      const gap = bar.getBoundingClientRect().top - countdown.getBoundingClientRect().bottom;
      // Necesita sitio entre el contador y la barra flotante para no
      // encimarse con ninguno de los dos; si no alcanza (pantallas de
      // alto medio, como una laptop), mejor no mostrarlo.
      setFits(gap > 60);
    }
    function onScroll() {
      setScrolled(window.scrollY >= 80);
    }
    // Espera a que termine la animación de aparición del contador antes
    // de medir su posición real.
    const timer = setTimeout(checkFit, 1100);
    onScroll();
    window.addEventListener("resize", checkFit);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkFit);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const visible = fits && !scrolled;

  return (
    <div
      className={`hero-scroll-hint${visible ? "" : " hero-scroll-hint--hidden"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>Desliza</span>
    </div>
  );
}
