import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { searchKey, students, type StudentGroup } from "../../data/students";
import { StudentPoster } from "./StudentPoster";
import "./StudentGallery.css";

type GroupFilter = "todos" | StudentGroup;

export default function StudentGallery() {
  const [group, setGroup] = useState<GroupFilter>("todos");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalized = searchKey(search);
    return students.filter((student) => {
      if (group !== "todos" && student.group !== group) return false;
      return searchKey(`${student.firstName} ${student.lastName} ${student.lastName} ${student.firstName}`).includes(normalized);
    });
  }, [group, search]);

  return (
    <section id="estudiantes" className="students-gallery">
      <div className="students-gallery__shell">
        <div className="students-gallery__heading">
          <div className="students-gallery__intro">
            <span className="students-gallery__eyebrow"><span className="students-gallery__eyedot"/> EDICIÓN 2026 / 9.º EBI</span>
            <h2>ELLOS LO<br/><em>HICIERON.</em></h2>
            <p>{students.length} {students.length === 1 ? "estudiante que entregó su proyecto." : "estudiantes que entregaron sus proyectos."}</p>
          </div>
          <div className="students-gallery__count" aria-label={`${students.length} estudiantes`}>
            <span className="students-gallery__count-number">{students.length}<span>.</span></span>
            <span>VOCES CREATIVAS</span>
          </div>
        </div>

        <div className="students-gallery__tools">
          <div className="students-gallery__filters" aria-label="Filtrar estudiantes por grupo">
            {(["todos", "9A", "9C"] as GroupFilter[]).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={group === item}
                className={`students-gallery__filter${group === item ? " is-active" : ""}`}
                onClick={() => setGroup(item)}
              >
                {item === "todos" ? "Todos" : `9.º ${item.slice(-1)}`}
                <span>{item === "todos" ? students.length : students.filter((student) => student.group === item).length}</span>
              </button>
            ))}
          </div>
          <label className="students-gallery__search">
            <Search size={17} strokeWidth={1.8} aria-hidden="true"/>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar estudiante"
              aria-label="Buscar estudiante"
            />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Limpiar búsqueda"><X size={16}/></button>}
          </label>
        </div>

        <div className="students-gallery__result" aria-live="polite">
          Mostrando {filtered.length} de {filtered.length} estudiantes
        </div>

        <div className="students-gallery__grid">
          {filtered.map((student) => (
            <StudentPoster
              student={student}
              key={student.id}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="students-gallery__empty">No encontramos estudiantes con esa búsqueda.</div>
        )}
      </div>
    </section>
  );
}
