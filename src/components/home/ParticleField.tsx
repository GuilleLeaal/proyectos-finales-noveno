
import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  originX: number;
  originY: number;
  vx: number;
  vy: number;
};

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const pointer = { x: -10000, y: -10000, active: false };
    let particles: Particle[] = [];
    let frame = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let running = false;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      width = rect.width;
      height = rect.height;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const gap = width < 700 ? 25 : 29;
      particles = [];

      for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
          particles.push({
            x, y,
            originX: x,
            originY: y,
            vx: 0,
            vy: 0,
          });
        }
      }

      if (reducedMotion) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        if (!reducedMotion) {
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            const radius = 175;

            if (distance < radius && distance > 0.01) {
              const force = Math.pow(1 - distance / radius, 2);
              p.vx += (dx / distance) * force * 3.6;
              p.vy += (dy / distance) * force * 3.6;
            }
          }

          // Spring physics
          p.vx += (p.originX - p.x) * 0.032;
          p.vy += (p.originY - p.y) * 0.032;

          p.vx *= 0.87;
          p.vy *= 0.87;

          p.x += p.vx;
          p.y += p.vy;
        }

        const distanceToPointer = pointer.active
          ? Math.hypot(p.x - pointer.x, p.y - pointer.y)
          : Infinity;

        const interaction = Math.max(
          0,
          1 - distanceToPointer / 190
        );

        const wave = reducedMotion
          ? 0
          : Math.sin(
              p.originX * 0.012 +
              p.originY * 0.019 -
              frame * 0.014
            ) * 0.5 + 0.5;

        const intensity = Math.max(interaction, wave * 0.18);
        const radius = 0.75 + interaction * 1.8;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);

        if (interaction > 0.12) {
          ctx.fillStyle = `rgba(199,255,61,${
            0.25 + interaction * 0.7
          })`;
        } else {
          ctx.fillStyle = `rgba(210,216,205,${
            0.13 + intensity * 0.3
          })`;
        }

        ctx.fill();
      }
    };

    const tick = () => {
      if (!running) return;
      frame++;
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reducedMotion || !visible) return;
      running = true;
      tick();
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const movePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 &&
        pointer.x <= width &&
        pointer.y >= 0 &&
        pointer.y <= height;
    };

    const leavePointer = () => {
      pointer.active = false;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    observer.observe(canvas);

    window.addEventListener("pointermove", movePointer);
    window.addEventListener("blur", leavePointer);
    document.addEventListener("visibilitychange", onVisibilityChange);

    resize();
    draw();

    return () => {
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", movePointer);
      window.removeEventListener("blur", leavePointer);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none"
    />
  );
}
