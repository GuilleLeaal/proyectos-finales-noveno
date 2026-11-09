import { useMemo, useState } from "react";
import { ArrowDown, Search, X } from "lucide-react";
import { searchKey, students, type StudentGroup } from "../../data/students";
import { StudentPoster } from "./StudentPoster";
import "./StudentGallery.css";

type GroupFilter = "todos" | StudentGroup;
const BATCH = 12;

export default function StudentGallery() {
  const [group, setGroup] = useState<GroupFilter>("todos");
  const [search, setSearch] = useState("");
  const isExhibition = new URLSearchParams(window.location.search).get("muestra") === "1";
  const initialVisible = isExhibition ? students.length : BATCH;
  const [visible, setVisible] = useState(initialVisible);

  const filtered = useMemo(() => {
    const normalized = searchKey(search);
    return students.filter((student) => {
      if (group !== "todos" && student.group !== group) return false;
      return searchKey(`${student.firstName} ${student.lastName} ${student.lastName} ${student.firstName}`).includes(normalized);
    });
  }, [group, search]);

  const shown = filtered.slice(0, visible);
  const remaining = Math.max(0, filtered.length - visible);

  const switchGroup = (next: GroupFilter) => {
    setGroup(next);
    setVisible(initialVisible);
  };

  const updateSearch = (next: string) => {
    setSearch(next);
    setVisible(initialVisible);
  };

  return (
    <section id="estudiantes" className="students-gallery">
      <div className="students-gallery__shell">
        <div className="students-gallery__heading">
          <div className="students-gallery__intro">
            <span className="students-gallery__eyebrow"><span className="students-gallery__eyedot"/> EDICIÓN 2026 / 9.º EBI</span>
            <h2>ELLOS LO<br/><em>HICIERON.</em></h2>
            <p>48 estudiantes. 48 espacios para crear.</p>
          </div>
          <div className="students-gallery__count" aria-label="48 estudiantes">
            <span className="students-gallery__count-number">48<span>.</span></span>
            <span>VOCES CREATIVAS<br/>UNA EXPOSICIÓN</span>
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
                onClick={() => switchGroup(item)}
              >
                {item === "todos" ? "Todos" : `9.º ${item.slice(-1)}`}
                <span>{item === "todos" ? 48 : item === "9A" ? 25 : 23}</span>
              </button>
            ))}
          </div>
          <label className="students-gallery__search">
            <Search size={17} strokeWidth={1.8} aria-hidden="true"/>
            <input
              value={search}
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Buscar estudiante"
              aria-label="Buscar estudiante"
            />
            {search && <button type="button" onClick={() => updateSearch("")} aria-label="Limpiar búsqueda"><X size={16}/></button>}
          </label>
        </div>

        <div className="students-gallery__result" aria-live="polite">
          Mostrando {shown.length} de {filtered.length} estudiantes
        </div>

        <div className="students-gallery__grid">
          {shown.map((student, index) => (
            <StudentPoster
              student={student}
              featured={(index % 9) === 0 && !search}
              key={student.id}
            />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="students-gallery__empty">No encontramos estudiantes con esa búsqueda.</div>
        )}
        {remaining > 0 && (
          <button type="button" className="students-gallery__more" onClick={() => setVisible((previous) => previous + BATCH)}>
            <span>Mostrar más estudiantes</span>
            <span className="students-gallery__more-icon"><ArrowDown size={20}/></span>
          </button>
        )}
      </div>
    </section>
  );
}
