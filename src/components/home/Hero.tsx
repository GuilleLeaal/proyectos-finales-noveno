import { useEffect, useRef } from "react";
import { animate, createScope, stagger } from "animejs";
import { ArrowDownRight } from "lucide-react";
import "./Hero.css";
import ProjectComposition from "./ProjectComposition";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const scope = createScope({ root }).add(() => {
      animate(".atelier-art-entry", {
        opacity: [0, 1],
        y: [30, 0],
        duration: 1400,
        ease: "out(4)",
      });
      animate(".atelier-title-line", {
        y: ["115%", "0%"],
        opacity: [0, 1],
        delay: stagger(185, { start: 200 }),
        duration: 1350,
        ease: "out(4)",
      });
      animate(".atelier-fade-in", {
        y: [24, 0],
        opacity: [0, 1],
        delay: stagger(110, { start: 850 }),
        duration: 1100,
        ease: "out(3)",
      });
    });

    return () => scope.revert();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    let raf = 0;
    const onPointer = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = root.getBoundingClientRect();
        root.style.setProperty("--light-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        root.style.setProperty("--light-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      });
    };

    root.addEventListener("pointermove", onPointer, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <section className="atelier-hero" ref={rootRef}>
      <div className="atelier-ambient" aria-hidden="true" />

      <div className="atelier-art" aria-hidden="true">
        <div className="atelier-art-entry">
          <ProjectComposition />
        </div>
      </div>

      <header className="atelier-header atelier-fade-in">
        <a className="atelier-wordmark" href="/" aria-label="Volver al inicio">
          PF<span className="atelier-wordmark-dot">.</span>
        </a>
        <span className="atelier-header-label">CIENCIAS DE LA COMPUTACIÓN</span>
        <span className="atelier-header-year">2026</span>
      </header>

      <main className="atelier-main">
        <div className="atelier-content">
          <h1 className="atelier-title">
            <span className="atelier-mask">
              <span className="atelier-title-line">PROYECTOS</span>
            </span>
            <span className="atelier-mask">
              <span className="atelier-title-line">
                FINALES<span className="atelier-period">.</span>
              </span>
            </span>
          </h1>

          <div className="atelier-intro atelier-fade-in">
            <p className="atelier-description">
              Una muestra de lo que nuestros estudiantes imaginaron,
              diseñaron y construyeron.
            </p>

            <a className="atelier-cta" href="#explorar">
              <span>Explorar proyectos</span>
              <span className="atelier-cta-icon">
                <ArrowDownRight size={22} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </a>
          </div>
        </div>
      </main>
    </section>
  );
}
