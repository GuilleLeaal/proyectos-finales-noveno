import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Autoscroll por defecto en la portada, con pausa al interactuar.
// Velocidades en píxeles por segundo. Ajustables sin tocar otros componentes.
const SCROLL_DOWN_SPEED = 300;
const SCROLL_UP_SPEED = 300;
const START_DELAY_MS = 5000;
const EDGE_DELAY_MS = 2600;
const IDLE_AFTER_INTERACTION_MS = 30000;
const POINTER_MOVEMENT_THRESHOLD = 6;

/**
 * Recorre la página en ambas direcciones mientras nadie interactúa.
 * No renderiza UI ni crea una escena adicional: solamente controla el scroll.
 */
export default function ExhibitionAutoScroll() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/") return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    // Impide que la regla global `scroll-behavior: smooth` produzca
    // animaciones en cola al desplazar la página cada fotograma.
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    let disposed = false;
    let frameId = 0;
    let resumeTimeout = 0;
    let previousFrame = 0;
    let direction: 1 | -1 = 1;
    let previousPointer: { x: number; y: number } | null = null;

    const cancelPlayback = () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(resumeTimeout);
      frameId = 0;
      resumeTimeout = 0;
      previousFrame = 0;
    };

    const isTyping = () => {
      const focused = document.activeElement;
      return (
        focused instanceof HTMLElement &&
        (focused.matches("input, textarea, select") || focused.isContentEditable)
      );
    };

    function play() {
      if (disposed || document.hidden || reducedMotion.matches) return;
      if (isTyping()) {
        scheduleResume(3000);
        return;
      }
      previousFrame = 0;
      frameId = window.requestAnimationFrame(tick);
    }

    // Mientras está pausado no corre un requestAnimationFrame permanente.
    function scheduleResume(delay: number) {
      cancelPlayback();
      if (disposed || document.hidden) return;
      resumeTimeout = window.setTimeout(play, delay);
    }

    function tick(now: number) {
      if (disposed || document.hidden || reducedMotion.matches) {
        cancelPlayback();
        return;
      }

      if (isTyping()) {
        scheduleResume(3000);
        return;
      }

      const delta = previousFrame ? Math.min((now - previousFrame) / 1000, 0.05) : 0;
      previousFrame = now;
      const maxScroll = Math.max(0, html.scrollHeight - window.innerHeight);

      if (maxScroll < 1) {
        scheduleResume(2000);
        return;
      }

      const next = Math.max(
        0,
        Math.min(maxScroll, window.scrollY + direction * (direction === 1 ? SCROLL_DOWN_SPEED : SCROLL_UP_SPEED) * delta)
      );
      window.scrollTo({ top: next, behavior: "instant" });

      if (direction === 1 && next >= maxScroll - 1) {
        direction = -1;
        scheduleResume(EDGE_DELAY_MS);
      } else if (direction === -1 && next <= 1) {
        direction = 1;
        scheduleResume(START_DELAY_MS);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    const pauseForVisitor = () => scheduleResume(IDLE_AFTER_INTERACTION_MS);

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const position = { x: event.clientX, y: event.clientY };
      if (previousPointer) {
        const distance = Math.hypot(
          position.x - previousPointer.x,
          position.y - previousPointer.y
        );
        if (distance >= POINTER_MOVEMENT_THRESHOLD) {
          pauseForVisitor();
          previousPointer = position;
        }
      } else {
        previousPointer = position;
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) cancelPlayback();
      else scheduleResume(START_DELAY_MS);
    };

    const onWindowBlur = () => cancelPlayback();
    const onWindowFocus = () => scheduleResume(START_DELAY_MS);

    const onReducedMotionChange = () => {
      if (reducedMotion.matches) cancelPlayback();
      else scheduleResume(START_DELAY_MS);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", pauseForVisitor, { passive: true });
    window.addEventListener("wheel", pauseForVisitor, { passive: true });
    window.addEventListener("touchstart", pauseForVisitor, { passive: true });
    window.addEventListener("keydown", pauseForVisitor);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    window.addEventListener("focusin", pauseForVisitor);
    document.addEventListener("visibilitychange", onVisibilityChange);
    reducedMotion.addEventListener("change", onReducedMotionChange);

    scheduleResume(START_DELAY_MS);

    return () => {
      disposed = true;
      cancelPlayback();
      html.style.scrollBehavior = previousScrollBehavior;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", pauseForVisitor);
      window.removeEventListener("wheel", pauseForVisitor);
      window.removeEventListener("touchstart", pauseForVisitor);
      window.removeEventListener("keydown", pauseForVisitor);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      window.removeEventListener("focusin", pauseForVisitor);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotion.removeEventListener("change", onReducedMotionChange);
    };
  }, [location.pathname]);

  return null;
}
