import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Maximize2, Minimize2 } from "lucide-react";
import { findStudent } from "../data/students";
import "./StudentProjectPage.css";

export default function StudentProjectPage() {
  const { id = "" } = useParams();
  const student = findStudent(id);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === viewerRef.current) {
        await document.exitFullscreen();
      } else if (viewerRef.current?.requestFullscreen) {
        await viewerRef.current.requestFullscreen();
      }
    } catch {
      // Browsers may block fullscreen (for instance inside an embedded preview).
    }
  };

  useEffect(() => { window.scrollTo({ top: 0, behavior: "auto" }); }, [id]);

  if (!student) {
    return (
      <main className="project-view project-view--missing">
        <Link to="/#estudiantes" className="project-view__back"><ArrowLeft size={17}/> Volver a la galería</Link>
        <h1>No encontramos ese proyecto.</h1>
      </main>
    );
  }

  return (
    <main className="project-view">
      <nav className="project-view__nav">
        <Link to="/#estudiantes" className="project-view__back"><ArrowLeft size={17}/> Volver a la galería</Link>
        <span>PF. / 2026</span>
      </nav>

      <section className="project-view__intro">
        <div className="project-view__topline"><span>PROYECTO FINAL</span><span>9.º {student.group.slice(-1)} / CIENCIAS DE LA COMPUTACIÓN</span></div>
        <h1>{student.firstName}<br/><span>{student.lastName}</span></h1>
        <div className="project-view__separator"/>
      </section>

      <section className="project-view__showcase">
        {student.published ? (
          <div className="project-view__viewer" ref={viewerRef}>
            <div className="project-view__viewer-heading">
              <span>SITIO DEL ESTUDIANTE</span>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="project-view__fullscreen"
                aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver el proyecto en pantalla completa"}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                <span>{isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}</span>
              </button>
            </div>
            <iframe
              className="project-view__iframe"
              src={`/estudiantes/${student.id}/index.html`}
              title={`Proyecto de ${student.firstName} ${student.lastName}`}
              loading="lazy"
              sandbox="allow-scripts allow-forms"
              allowFullScreen
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="project-view__placeholder">
            <span className="project-view__placeholder-orbit" aria-hidden="true"/>
            <div className="project-view__placeholder-content">
              <span>PRÓXIMAMENTE / PROYECTO FINAL</span>
              <strong>CREANDO<br/>ALGO NUEVO<span>.</span></strong>
              <p>Este espacio estará disponible cuando se publique el trabajo.</p>
            </div>
          </div>
        )}
      </section>
      <Link to="/#estudiantes" className="project-view__end-link">Explorar otros proyectos <ArrowUpRight size={21}/></Link>
    </main>
  );
}
