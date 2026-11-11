import { useEffect, useRef } from "react";
import "./KineticBridge.css";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const ramp = (value: number, from: number, to: number) =>
  clamp01((value - from) / (to - from));
const ease = (value: number) => 1 - Math.pow(1 - value, 3);
// A slower start and finish keeps the aperture visibly circular for longer.
const smooth = (value: number) => value * value * (3 - 2 * value);

/**
 * A scroll-driven typographic interlude: no canvas, no animation loop.
 * CSS transforms are updated only on scroll/resize via a single rAF.
 */
export default function KineticBridge() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (prefersReducedMotion.matches) {
      section.classList.add("kinetic-bridge--reduced");
      return;
    }

    let frame = 0;

    const paint = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const distance = Math.max(1, rect.height - window.innerHeight);
      const p = clamp01(-rect.top / distance);

      // Stage 1: first message enters from the left.
      const firstIn = ease(ramp(p, -0.17, 0.10));
      const firstOut = ease(ramp(p, 0.49, 0.62));
      section.style.setProperty("--first-x", `${-130 * (1 - firstIn) - 45 * firstOut}px`);
      section.style.setProperty("--first-opacity", `${firstIn * (1 - firstOut)}`);

      // Stage 2: second message arrives from the opposite direction.
      const secondIn = ease(ramp(p, 0.24, 0.44));
      const secondOut = ease(ramp(p, 0.51, 0.64));
      section.style.setProperty("--second-x", `${150 * (1 - secondIn) + 65 * secondOut}px`);
      section.style.setProperty("--second-opacity", `${secondIn * (1 - secondOut)}`);

      // Graphic forms stay behind the words, and disappear before the reveal.
      section.style.setProperty("--disc-turn", `${p * 75}deg`);
      section.style.setProperty("--disc-scale", `${0.78 + p * 0.65}`);
      section.style.setProperty("--symbol-turn", `${p * 155}deg`);
      section.style.setProperty("--graphic-opacity", `${1 - ease(ramp(p, 0.61, 0.76))}`);

      // Fill the viewport only at the handoff, avoiding a long solid-blue hold.
      const open = smooth(ramp(p, 0.65, 1));
      const apertureSize = Math.min(220, Math.max(100, Math.min(window.innerWidth, window.innerHeight) * 0.14));
      const coverScale = Math.hypot(window.innerWidth, window.innerHeight) / apertureSize * 1.05;
      section.style.setProperty("--portal-scale", `${0.06 + open * coverScale}`);
      section.style.setProperty("--portal-opacity", `${smooth(ramp(p, 0.64, 0.70))}`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="kinetic-bridge"
      id="explorar"
      aria-label="Del aula a la web"
    >
      <div className="kinetic-bridge__sticky">
        <div className="kinetic-bridge__grain" aria-hidden="true" />
        <div className="kinetic-bridge__rule" aria-hidden="true" />
        <div className="kinetic-bridge__disc" aria-hidden="true" />
        <div className="kinetic-bridge__asterisk" aria-hidden="true">✳</div>

        <div className="kinetic-bridge__headline">
          <div className="kinetic-bridge__line kinetic-bridge__line--first">
            <span>DEL AULA</span>
          </div>
          <div className="kinetic-bridge__line kinetic-bridge__line--second">
            <span>A LA WEB<span className="kinetic-bridge__dot">.</span></span>
          </div>
        </div>

        <div className="kinetic-bridge__aperture" aria-hidden="true" />
      </div>
    </section>
  );
}
