import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import { findStudent } from "../data/students";
import "./StudentProjectPage.css";

export default function StudentProjectPage() {
  const { id = "" } = useParams();
  const student = findStudent(id);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");

  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    setFullscreenError("");
    const previousTitle = document.title;
    if (student) document.title = `${student.firstName} ${student.lastName} | Proyectos Finales 2026`;
    return () => { document.title = previousTitle; };
  }, [id, student]);

  const toggleFullscreen = async () => {
    setFullscreenError("");
    try {
      if (document.fullscreenElement === viewerRef.current) await document.exitFullscreen();
      else if (viewerRef.current?.requestFullscreen) await viewerRef.current.requestFullscreen();
      else setFullscreenError("Tu navegador no permite ampliar el visor a pantalla completa.");
    } catch {
      setFullscreenError("No se pudo abrir la pantalla completa en este navegador.");
    }
  };

  if (!student) {
    return (
      <main className="student-project student-project--missing">
        <h1>Proyecto no disponible.</h1>
        <Link to="/#estudiantes" className="student-project__back"><ArrowLeft size={16} /> Volver</Link>
      </main>
    );
  }

  return (
    <main className="student-project">
      <div className="student-project__viewer" ref={viewerRef}>
        <header className="student-project__header">
          <Link to="/#estudiantes" className="student-project__back"><ArrowLeft size={16} /><span>Volver</span></Link>
          <h1>{student.firstName} {student.lastName}</h1>
          <button type="button" className="student-project__expand" onClick={toggleFullscreen} aria-label={isFullscreen ? "Salir de pantalla completa" : "Ver el proyecto en pantalla completa"}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}<span>{isFullscreen ? "Reducir" : "Ampliar"}</span>
          </button>
        </header>
        {fullscreenError && <p className="student-project__notice" role="status">{fullscreenError}</p>}
        <iframe key={student.projectPath} className="student-project__iframe" src={student.projectPath} title={`Proyecto de ${student.firstName} ${student.lastName}`} sandbox="allow-scripts allow-forms" allowFullScreen referrerPolicy="no-referrer" />
      </div>
    </main>
  );
}
