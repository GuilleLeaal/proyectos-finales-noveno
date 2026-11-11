import { useEffect, useRef } from "react";
import "./ProjectComposition.css";

/** A little web studio, built with the same materials as the gallery. */
export default function ProjectComposition() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let visible = false;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => stage.classList.toggle("is-playing", visible && !document.hidden && !motion.matches);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(stage);
    document.addEventListener("visibilitychange", update);
    motion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      motion.removeEventListener("change", update);
    };
  }, []);

  return (
    <div className="project-composition" ref={stageRef} aria-hidden="true">
      <div className="composition-grid" />
      <div className="composition-coordinate">IDEAR. DISEÑAR. CONSTRUIR.</div>
      <svg className="composition-path" viewBox="0 0 600 600" fill="none">
        <path d="M90 440H45V100H500V520H330" />
        <circle cx="90" cy="440" r="5" /><circle cx="330" cy="520" r="5" />
      </svg>

      <div className="composition-browser">
        <div className="composition-chrome">
          <span className="composition-dots"><i /><i /><i /></span>
          <span>una idea hecha web</span><span>↗</span>
        </div>
        <div className="composition-page">
          <div className="composition-page-nav"><b>PF.</b><span>IMAGINACIÓN EN LÍNEA</span><span>2026</span></div>
          <div className="composition-page-hero">
            <span className="composition-kicker">HECHO POR ESTUDIANTES</span>
            <strong>TODO EMPIEZA<br />CON UNA <em>IDEA.</em></strong>
            <div className="composition-page-rule" />
            <span className="composition-page-link">Y termina en algo para compartir <span>↗</span></span>
          </div>
          <div className="composition-tiles">
            <div className="composition-tile composition-tile--blue"><span>01 / EXPLORAR</span><div className="composition-rings" /></div>
            <div className="composition-tile composition-tile--mint"><span>02 / CREAR</span><div className="composition-checker" /></div>
          </div>
        </div>
      </div>

      <div className="composition-code">
        <div className="composition-code-heading"><span>index.html</span><span>&lt;/&gt;</span></div>
        <div className="composition-code-body">
          <span><i>01</i><b>&lt;idea&gt;</b></span>
          <span><i>02</i><span className="composition-code-indent">imaginar<span className="composition-code-cursor">_</span></span></span>
          <span><i>03</i><span className="composition-code-indent">crear</span></span>
          <span><i>04</i><span className="composition-code-indent">compartir</span></span>
          <span><i>05</i><b>&lt;/idea&gt;</b></span>
        </div>
      </div>

      <div className="composition-sticker"><span>DEL AULA</span><b>↗</b><span>A LA WEB</span></div>
      <div className="composition-caption"><span className="composition-caption-dot" /> NUESTRAS IDEAS YA TIENEN SU LUGAR.</div>
    </div>
  );
}
